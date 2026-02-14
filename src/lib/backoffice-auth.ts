const BO_ACCESS_TOKEN_KEY = "bo_access_token";
const BO_REFRESH_TOKEN_KEY = "bo_refresh_token";

export function getBoAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(BO_ACCESS_TOKEN_KEY);
}

export function getBoRefreshToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(BO_REFRESH_TOKEN_KEY);
}

export function setBoTokens(accessToken: string, refreshToken: string) {
  localStorage.setItem(BO_ACCESS_TOKEN_KEY, accessToken);
  localStorage.setItem(BO_REFRESH_TOKEN_KEY, refreshToken);
}

export function clearBoTokens() {
  localStorage.removeItem(BO_ACCESS_TOKEN_KEY);
  localStorage.removeItem(BO_REFRESH_TOKEN_KEY);
}

export function isBoAuthenticated(): boolean {
  return !!getBoAccessToken();
}
