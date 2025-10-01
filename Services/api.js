import axios from "axios";
import Constants from "expo-constants";
import {
  getAccessToken,
  getRefreshToken,
  saveTokens,
  deleteTokens,
} from "./tokenStorage";

const extra =
  (Constants.expoConfig && Constants.expoConfig.extra) ||
  (Constants.manifest && Constants.manifest.extra) ||
  {};

export const API_URL = (extra.API_URL || "").replace(/\/$/, "");
export const IMG_URL = extra.API_URL_IMAGE || "";
const IMAGE_UPLOAD_URL = extra.IMAGE_UPLOAD_URL || "";
export const STRIPE_PUBLISHABLE_KEY = extra.STRIPE_PUBLISHABLE_KEY || "";
export const STRIPE_DEFAULT_CURRENCY = (extra.STRIPE_DEFAULT_CURRENCY || "usd").toLowerCase();

const REFRESH_PATH = extra.REFRESH_PATH || "/auth/v1/refresh";

export const SSE_PATH = extra.SSE_PATH || "/api/auth/notifications/subscribe";

/* ------------------------------ axios ------------------------------ */

export const api = axios.create({
  baseURL: API_URL,
  timeout: 15000,
  headers: { Accept: "application/json" },
});

/* -------------------------- token helpers -------------------------- */
/** Keep an in-memory access token for quick header injection */
let _accessToken = null;

/** Set default auth header on the axios instance */
const setDefaultAuthHeader = (token, tokenType = "Bearer") => {
  if (token) {
    api.defaults.headers.common.Authorization = `${tokenType} ${token}`;
  } else {
    delete api.defaults.headers.common.Authorization;
  }
};

/* --------------- request: inject bearer if missing --------------- */

api.interceptors.request.use(async (config) => {
  // If another layer already set Authorization, keep it
  if (config.headers?.Authorization) return config;

  // Prefer in-memory token, otherwise pull once from SecureStore
  if (!_accessToken) {
    const t = await getAccessToken().catch(() => null);
    if (t) _accessToken = t;
  }
  if (_accessToken) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${_accessToken}`;
  }
  return config;
});

/* --------- response: one-time refresh on 401 then retry --------- */

let isRefreshing = false;
let waitQueue = []; // { resolve, reject, cfg }

const flushQueue = (error, newToken) => {
  waitQueue.forEach(({ resolve, reject, cfg }) => {
    if (error) {
      reject(error);
    } else {
      if (newToken) {
        cfg.headers = cfg.headers || {};
        cfg.headers.Authorization = `Bearer ${newToken}`;
      }
      resolve(api(cfg));
    }
  });
  waitQueue = [];
};

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const { response, config } = error || {};
    if (!response || response.status !== 401 || config._retry) {
      throw error;
    }

    config._retry = true;

    // If a refresh is already running, queue this request
    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        waitQueue.push({ resolve, reject, cfg: config });
      });
    }

    isRefreshing = true;
    try {
      const rt = await getRefreshToken();
      if (!rt) throw error;

      const refreshUrl = `${API_URL}${REFRESH_PATH}`;
      const { data } = await axios.post(refreshUrl, { refreshToken: rt });

      const tokenType = (data?.tokenType || "Bearer").trim();
      const newAT = data?.accessToken;
      const newRT = data?.refreshToken || rt;
      if (!newAT) throw new Error("Refresh failed: no accessToken returned");

      // persist + set defaults + update in-memory
      await saveTokens({ accessToken: newAT, refreshToken: newRT });
      _accessToken = newAT;
      setDefaultAuthHeader(newAT, tokenType);

      // serve queued requests
      flushQueue(null, newAT);

      // retry original
      config.headers = config.headers || {};
      config.headers.Authorization = `${tokenType} ${newAT}`;
      return api(config);
    } catch (e) {
      flushQueue(e, null);
      _accessToken = null;
      setDefaultAuthHeader(null);
      await deleteTokens();
      throw e;
    } finally {
      isRefreshing = false;
    }
  }
);

/* --------------------- convenience HTTP wrappers --------------------- */
/** token is optional now — if omitted, the interceptor injects from SecureStore */

export const authGet = (url, token, config = {}) =>
  api.get(url, {
    ...config,
    headers: {
      ...(config.headers || {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

export const authPost = (url, data, token, config = {}) =>
  api.post(url, data, {
    ...config,
    headers: {
      ...(config.headers || {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

export const authPut = (url, data, token, config = {}) =>
  api.put(url, data, {
    ...config,
    headers: {
      ...(config.headers || {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

export const authDelete = (url, token, config = {}) =>
  api.delete(url, {
    ...config,
    headers: {
      ...(config.headers || {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

/* --------------------------------------------------------------------
   Live unseen-count subscription with SSE + safe polling fallback
--------------------------------------------------------------------- */

export function connectUnseenCount({
  email,
  token,              // optional; interceptor can inject too
  onUpdate,
  pollEveryMs = 15000,
}) {
  if (!API_URL || !email) {
    return { close: () => { } };
  }

  const q = encodeURIComponent(email);
  const sseURL = `${API_URL}${SSE_PATH}?email=${q}${token ? `&access_token=${encodeURIComponent(token)}` : ""
    }`;

  let es = null;
  let pollTimer = null;

  const parseAndSet = (data) => {
    if (typeof onUpdate !== "function") return;
    try {
      let n = Number.NaN;
      if (typeof data === "number") n = data;
      else if (typeof data === "string") {
        try {
          const j = JSON.parse(data);
          n = Number(j?.unseen ?? j?.count ?? j);
        } catch {
          n = Number(data);
        }
      } else if (data && typeof data === "object") {
        n = Number(data.unseen ?? data.count);
      }
      if (Number.isFinite(n)) onUpdate(n);
    } catch { }
  };

  const startPolling = async () => {
    if (pollTimer) clearInterval(pollTimer);
    try {
      const res = await authGet("/api/auth/unseenCount", token, { params: { email } });
      parseAndSet(res?.data);
    } catch { }
    pollTimer = setInterval(async () => {
      try {
        const res = await authGet("/api/auth/unseenCount", token, { params: { email } });
        parseAndSet(res?.data);
      } catch { }
    }, pollEveryMs);
  };

  // 1) Web: native EventSource
  if (typeof window !== "undefined" && typeof window.EventSource === "function") {
    try {
      es = new window.EventSource(sseURL, { withCredentials: true });

      const onMsg = (e) => parseAndSet(e?.data);
      es.addEventListener("notification.update", onMsg);
      es.addEventListener("unseenCount", onMsg);
      es.addEventListener("message", onMsg);
      es.addEventListener("error", () => {
        try { es.close(); } catch { }
        es = null;
        startPolling();
      });

      return {
        close: () => {
          if (es) { try { es.close(); } catch { } es = null; }
          if (pollTimer) clearInterval(pollTimer);
        },
      };
    } catch {
      // fall through
    }
  }

  // 2) React Native: soft-require polyfill (optional dependency)
  try {
    const softRequire = eval("require");
    const RNES = softRequire("react-native-event-source");
    const RNEventSource = RNES?.default || RNES;

    es = new RNEventSource(sseURL, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });

    const onMsg = (e) => parseAndSet(e?.data);
    es.addEventListener("notification.update", onMsg);
    es.addEventListener("unseenCount", onMsg);
    es.addEventListener("message", onMsg);
    es.addEventListener("error", () => {
      try { es.close(); } catch { }
      es = null;
      startPolling();
    });

    return {
      close: () => {
        if (es) { try { es.close(); } catch { } es = null; }
        if (pollTimer) clearInterval(pollTimer);
      },
    };
  } catch {
    // 3) No SSE available -> polling
    startPolling();
    return {
      close: () => {
        if (pollTimer) clearInterval(pollTimer);
      },
    };
  }
}

/* ----------------- Payments ----------------- */
export async function createPaymentIntent({
  violationId,
  amountMinor,
  currency = STRIPE_DEFAULT_CURRENCY,
  description,
  token,
}) {
  try {
    const res = await api.post(
      "/api/payments/create-intent",
      {
        violationId,
        amount: amountMinor, // backend expects "amount"
        currency,
        description,
      },
      {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      }
    );
    const d = res?.data || {};
    return {
      success: !!d.success,
      clientSecret: d.clientSecret,
      data: d.data,
      message: d.message,
    };
  } catch (err) {
    const msg = err?.response?.data?.message || err?.message || "Request failed";
    // throw (so caller can show toast and bail cleanly)
    throw new Error(msg);
  }
}

export async function updateViolationStatus({
  violationId,
  status,
  paymentStatus,
  paymentDate,
  stripePaymentaIntentId,
  token,
}) {
  const res = await api.post(
    "/api/violations/update-status",
    { headers: token ? { Authorization: `Bearer ${token}` } : undefined },
    { violationId, status, paymentStatus, paymentDate, stripePaymentIntentId }
  );
  return res?.data;
}

/* --------------------- IMAGE UPLOAD HELPER (added) -------------------- */
export async function uploadImageFile(localUri) {
  if (!localUri) throw new Error("No localUri provided");
  if (!IMAGE_UPLOAD_URL) {
    throw new Error("Missing IMAGE_UPLOAD_URL in app.json -> expo.extra");
  }
  const name = localUri.split("/").pop() || `upload-${Date.now()}.jpg`;
  const ext = (name.split(".").pop() || "jpg").toLowerCase();
  const mime =
    ext === "png" ? "image/png" :
      ext === "jpg" || ext === "jpeg" ? "image/jpeg" :
        "application/octet-stream";

  const form = new FormData();
  form.append("file", { uri: localUri, name, type: mime });

  const res = await fetch(IMAGE_UPLOAD_URL, { method: "POST", body: form });

  if (!res.ok) {
    const t = await res.text().catch(() => "");
    throw new Error(`Upload failed (${res.status}): ${t}`);
  }

  const json = await res.json();
  const file = json?.file || {};
  const relativeUrl = file.url;
  const fname = file.name;

  if (!relativeUrl) throw new Error("Server returned no file.url");

  const base = (IMG_URL || "").replace(/\/$/, "");
  const absoluteUrl = `${base}${relativeUrl}`;

  return { name: fname, url: relativeUrl, absoluteUrl };
}
