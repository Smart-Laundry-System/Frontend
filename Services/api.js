import axios from "axios";
import Constants from "expo-constants";

const extra =
  (Constants.expoConfig && Constants.expoConfig.extra) ||
  (Constants.manifest && Constants.manifest.extra) ||
  {};

export const API_URL = (extra.API_URL || "").replace(/\/$/, "");
export const IMG_URL = extra.API_URL_IMAGE || "";

export const api = axios.create({
  baseURL: API_URL,
  timeout: 15000,
  headers: { Accept: "application/json" },
});

export const authGet = (url, token, config = {}) =>
  api.get(url, {
    ...config,
    headers: { ...(config.headers || {}), Authorization: `Bearer ${token}` },
  });

export const authPost = (url, data, token, config = {}) =>
  api.post(url, data, {
    ...config,
    headers: { ...(config.headers || {}), Authorization: `Bearer ${token}` },
  });
