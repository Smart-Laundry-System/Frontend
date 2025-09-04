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

      const newAT = data?.accessToken;
      const newRT = data?.refreshToken || rt;
      if (!newAT) throw new Error("Refresh failed: no accessToken returned");

      await setAuthTokens({ accessToken: newAT, refreshToken: newRT });
      api.defaults.headers.common.Authorization = `Bearer ${newAT}`;

      flushQueue(null, newAT);

      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${newAT}`;
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
   - Works on web (native EventSource)
   - Works on RN if you install `react-native-event-source`
   - Otherwise falls back to polling /api/auth/unseenCount
--------------------------------------------------------------------- */

export function connectUnseenCount({
  email,
  token,
  onUpdate,
  pollEveryMs = 15000,
}) {
  if (!API_URL || !email) {
    // nothing to do
    return { close: () => {} };
  }

  const q = encodeURIComponent(email);
  const sseURL = `${API_URL}${SSE_PATH}?email=${q}`;

  let es = null;
  let pollTimer = null;

  const parseAndSet = (data) => {
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
    } catch {}
  };

  const startPolling = async () => {
    try {
      const res = await authGet("/api/auth/unseenCount", token, {
        params: { email },
      });
      parseAndSet(res?.data);
    } catch {}
    pollTimer = setInterval(async () => {
      try {
        const res = await authGet("/api/auth/unseenCount", token, {
          params: { email },
        });
        parseAndSet(res?.data);
      } catch {}
    }, pollEveryMs);
  };

  // 1) Web: native EventSource
  if (typeof window !== "undefined" && typeof window.EventSource === "function") {
    try {
      es = new window.EventSource(sseURL, { withCredentials: false });

      const onMsg = (e) => parseAndSet(e?.data);
      es.addEventListener("notification.update", onMsg);
      es.addEventListener("unseenCount", onMsg);
      es.addEventListener("message", onMsg);
      es.addEventListener("error", () => {
        try { es.close(); } catch {}
        es = null;
        startPolling();
      });

      return {
        close: () => {
          if (es) { try { es.close(); } catch {} es = null; }
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
      try { es.close(); } catch {}
      es = null;
      startPolling();
    });

    return {
      close: () => {
        if (es) { try { es.close(); } catch {} es = null; }
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
