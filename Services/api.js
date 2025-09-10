// Services/api.js
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";

/* ------------------------------ config ------------------------------ */

const extra =
  (Constants.expoConfig && Constants.expoConfig.extra) ||
  (Constants.manifest && Constants.manifest.extra) ||
  {};

export const API_URL = (extra.API_URL || "").replace(/\/$/, "");
export const IMG_URL = extra.API_URL_IMAGE || "";
const IMAGE_UPLOAD_URL = extra.IMAGE_UPLOAD_URL || ""; // <-- added

// Auth refresh path (adjust in app.json -> expo.extra if needed)
const REFRESH_PATH = extra.REFRESH_PATH || "/auth/v1/refresh";

// SSE subscribe endpoint (must match your Spring @GetMapping)
export const SSE_PATH =
  (extra.SSE_PATH || "/api/auth/notifications/subscribe");

/* ------------------------------ axios ------------------------------ */

export const api = axios.create({
  baseURL: API_URL,
  timeout: 15000,
  headers: { Accept: "application/json" },
});

/* -------------------------- token helpers -------------------------- */

export const getAccessToken = async () => AsyncStorage.getItem("accessToken");
export const getRefreshToken = async () => AsyncStorage.getItem("refreshToken");

export const setAuthTokens = async ({ accessToken, refreshToken }) => {
  if (accessToken) await AsyncStorage.setItem("accessToken", accessToken);
  if (refreshToken) await AsyncStorage.setItem("refreshToken", refreshToken);
};

export const clearAuthTokens = async () =>
  AsyncStorage.multiRemove(["accessToken", "refreshToken"]);

/* --------------- request: inject bearer if missing --------------- */

api.interceptors.request.use(async (config) => {
  if (!config.headers?.Authorization) {
    const at = await getAccessToken();
    if (at) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${at}`;
    }
  }
  return config;
});

/* --------- response: one-time refresh on 401 then retry --------- */

let isRefreshing = false;
let waitQueue = []; // { resolve, reject }

const flushQueue = (error, token) => {
  waitQueue.forEach(({ resolve, reject }) =>
    error ? reject(error) : resolve(token)
  );
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

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        waitQueue.push({
          resolve: (newToken) => {
            config.headers = config.headers || {};
            if (newToken) config.headers.Authorization = `Bearer ${newToken}`;
            resolve(api(config));
          },
          reject,
        });
      });
    }

    isRefreshing = true;
    try {
      const rt = await getRefreshToken();
      if (!rt) throw error;

      const { data } = await axios.post(`${API_URL}${REFRESH_PATH}`, {
        refreshToken: rt,
      });

      const tokenType = (data?.tokenType || 'Bearer').trim();
      const newAT = data?.accessToken;
      const newRT = data?.refreshToken || rt;
      if (!newAT) throw new Error("Refresh failed: no accessToken returned");

      await setAuthTokens({ accessToken: newAT, refreshToken: newRT });
      api.defaults.headers.common.Authorization = `${tokenType} ${newAT}`;

      flushQueue(null, newAT);

      config.headers = config.headers || {};
      config.headers.Authorization = `${tokenType} ${newAT}`;
      return api(config);
    } catch (e) {
      flushQueue(e, null);
      await clearAuthTokens();
      throw e;
    } finally {
      isRefreshing = false;
    }
  }
);

/* --------------------- convenience HTTP wrappers --------------------- */

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
  token,
  onUpdate,
  pollEveryMs = 15000,
}) {
  if (!API_URL || !email) {
    // nothing to do
    return { close: () => { } };
  }

  const q = encodeURIComponent(email);
  const sseURL = `${API_URL}${SSE_PATH}?email=${q}${token ? `&access_token=${encodeURIComponent(token)}` : ''}`;

  let es = null;
  let pollTimer = null;

  const parseAndSet = (data) => {
    if (typeof onUpdate !== 'function') return;
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
      const res = await authGet("/api/auth/unseenCount", token, {
        params: { email },
      });
      parseAndSet(res?.data);
    } catch { }
    pollTimer = setInterval(async () => {
      try {
        const res = await authGet("/api/auth/unseenCount", token, {
          params: { email },
        });
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
    const softRequire = eval("require"); // avoid Metro resolving at build time
    const RNES = softRequire("react-native-event-source"); // install to use SSE on device
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

/* --------------------- IMAGE UPLOAD HELPER (added) -------------------- */
/**
 * Upload a local image file to your image server (field name "file")
 * and return the same structure as your Postman response (plus absolute url):
 * { name, url, absoluteUrl }
 */
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
  // IMPORTANT: key must be 'file' (matches your Postman screenshot)
  form.append("file", { uri: localUri, name, type: mime });

  // Let fetch set the multipart boundary; don't set Content-Type manually
  const res = await fetch(IMAGE_UPLOAD_URL, { method: "POST", body: form });

  if (!res.ok) {
    const t = await res.text().catch(() => "");
    throw new Error(`Upload failed (${res.status}): ${t}`);
  }

  // Expected: { message, file: { name, url } }
  const json = await res.json();
  const file = json?.file || {};
  const relativeUrl = file.url;      // e.g. "/files/175...-spring.png"
  const fname = file.name;           // e.g. "175...-spring.png"

  if (!relativeUrl) throw new Error("Server returned no file.url");

  const base = (IMG_URL || "").replace(/\/$/, ""); // e.g. http://172.20.10.3:3999
  const absoluteUrl = `${base}${relativeUrl}`;

  return { name: fname, url: relativeUrl, absoluteUrl };
}
