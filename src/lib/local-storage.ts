export const USER_ID_KEY = "gen_ui_cua_user_id";

export function setItem(key: string, value: string) {
  if (typeof window === "undefined") {
    return;
  }
  localStorage.setItem(key, value);
}

export function getItem(key: string) {
  if (typeof window === "undefined") {
    return undefined;
  }
  return localStorage.getItem(key) ?? undefined;
}

export function removeItem(key: string) {
  if (typeof window === "undefined") {
    return;
  }
  localStorage.removeItem(key);
}
