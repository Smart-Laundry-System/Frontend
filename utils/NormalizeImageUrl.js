import { Platform, NativeModules } from "react-native";
import Constants from "expo-constants";

const API_ORIGIN =
  (Constants.expoConfig?.extra?.API_URL_IMAGE ||
    Constants.manifest?.extra?.API_URL_IMAGE ||
    ""
  ).replace(/\/$/, "");

const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "[::1]"]);

function getBundleHostname() {
  try {
    const url = NativeModules?.SourceCode?.scriptURL;
    return url ? new URL(url).hostname : null;
  } catch { return null; }
}

export function NormalizeImageUrl(raw) {
  if (!raw) return null;
  let str = String(raw).trim();

  if (str.startsWith("/")) str = `${API_ORIGIN}${str}`;

  try {
    const u = new URL(str);
    if (LOCAL_HOSTS.has(u.hostname)) {
      const host = getBundleHostname();
      u.hostname = host || (Platform.OS === "android" ? "10.0.2.2" : u.hostname);
    }
    return u.toString();
  } catch {
    return str; 
  }
}

export function ImageSource(raw) {
  const uri = NormalizeImageUrl(raw);
  return uri ? { uri } : null;
}
