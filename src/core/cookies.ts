import type { Cookie, CookieJar } from "tough-cookie";

export const applyCookieHeader = async (
  cookieJar: CookieJar,
  requestUrl: string,
  headers: Record<string, string>
): Promise<void> => {
  if (headers.cookie) {
    return;
  }

  const cookieHeader = await cookieJar.getCookieString(requestUrl);
  if (cookieHeader) {
    headers.cookie = cookieHeader;
  }
};

export const storeResponseCookies = async (
  cookieJar: CookieJar,
  requestUrl: string,
  headers: Record<string, string | string[]>
): Promise<void> => {
  const setCookie = headers["set-cookie"];
  if (!setCookie) {
    return;
  }

  const values = Array.isArray(setCookie) ? setCookie : [setCookie];
  for (const value of values) {
    await cookieJar.setCookie(value, requestUrl);
  }
};

export interface NativeCookie {
  name: string;
  value: string;
  domain: string;
  path: string;
  expires: number;
  maxAge: number;
  secure: boolean;
  httpOnly: boolean;
}

export const buildNativeCookies = async (
  cookieJar: CookieJar,
  requestUrl: string
): Promise<NativeCookie[]> => {
  const cookies = await cookieJar.getCookies(requestUrl);
  return cookies.map((cookie) => cookieToNative(cookie));
};

const cookieToNative = (cookie: Cookie): NativeCookie => ({
  name: cookie.key,
  value: cookie.value,
  domain: cookie.domain ?? "",
  path: cookie.path ?? "/",
  expires:
    cookie.expires === "Infinity" || cookie.expires === null
      ? 0
      : Math.floor(cookie.expires.getTime() / 1000),
  maxAge: typeof cookie.maxAge === "number" ? cookie.maxAge : 0,
  secure: cookie.secure,
  httpOnly: cookie.httpOnly,
});
