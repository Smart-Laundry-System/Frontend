import * as SecureStore from "expo-secure-store";

const ACCESS = "accessToken";
const REFRESH = "refreshToken";

export async function saveTokens({ accessToken, refreshToken }) {
  if (accessToken) await SecureStore.setItemAsync(ACCESS, accessToken);
  if (refreshToken) await SecureStore.setItemAsync(REFRESH, refreshToken);
}

export async function getAccessToken() {
  return SecureStore.getItemAsync(ACCESS);
}

export async function getRefreshToken() {
  return SecureStore.getItemAsync(REFRESH);
}

export async function deleteTokens() {
  await SecureStore.deleteItemAsync(ACCESS);
  await SecureStore.deleteItemAsync(REFRESH);
}

export async function replaceTokens({ accessToken, refreshToken }) {
  await deleteTokens();
  await saveTokens({ accessToken, refreshToken });
}
