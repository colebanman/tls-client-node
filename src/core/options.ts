import { randomUUID } from "node:crypto";
import { Buffer } from "node:buffer";
import { DEFAULT_COOKIE_JAR, DEFAULT_HOOKS, DEFAULT_PAGINATION, DEFAULT_RETRY, DEFAULT_TIMEOUT_MS, DEFAULT_TLS_OPTIONS } from "./constants";
import type { GotDefaults, GotInput, Hooks, NormalizedRequestOptions, PaginationOptions, RequestOptions, RetryOptions, SearchParamsInit, SessionOptions, TimeoutOptions, TlsFingerprintOptions } from "./types";

export const createDefaultState = (): GotDefaults => ({
  options: {},
  sessionId: randomUUID(),
  cookieJar: DEFAULT_COOKIE_JAR(),
});

export const mergeRequestOptions = (base: RequestOptions, extra: RequestOptions): RequestOptions => ({
  ...base,
  ...extra,
  headers: {
    ...(base.headers ?? {}),
    ...(extra.headers ?? {}),
  },
  hooks: mergeHooks(base.hooks, extra.hooks),
  retry: {
    ...(base.retry ?? {}),
    ...(extra.retry ?? {}),
  },
  context: {
    ...(base.context ?? {}),
    ...(extra.context ?? {}),
  },
  pagination: {
    ...(base.pagination ?? {}),
    ...(extra.pagination ?? {}),
  },
  tls: {
    ...(base.tls ?? {}),
    ...(extra.tls ?? {}),
  },
  session: {
    ...(base.session ?? {}),
    ...(extra.session ?? {}),
  },
});

const mergeHooks = (base?: Hooks, extra?: Hooks): Hooks => ({
  beforeRequest: [...(base?.beforeRequest ?? []), ...(extra?.beforeRequest ?? [])],
  beforeRetry: [...(base?.beforeRetry ?? []), ...(extra?.beforeRetry ?? [])],
  afterResponse: [...(base?.afterResponse ?? []), ...(extra?.afterResponse ?? [])],
  beforeError: [...(base?.beforeError ?? []), ...(extra?.beforeError ?? [])],
});

export const splitInput = (input?: GotInput, options?: RequestOptions): RequestOptions => {
  if (typeof input === "string" || input instanceof URL) {
    return {
      ...(options ?? {}),
      url: input.toString(),
    } as RequestOptions & { url: string };
  }

  if (input) {
    return mergeRequestOptions(input, options ?? {});
  }

  return options ?? {};
};

type RequestOptionsWithUrl = RequestOptions & { url?: string };

export const normalizeOptions = (
  defaults: GotDefaults,
  inputOptions: RequestOptionsWithUrl
): NormalizedRequestOptions => {
  const merged = mergeRequestOptions(defaults.options, inputOptions);
  const url = createRequestUrl(merged.url, merged.prefixUrl, merged.searchParams);

  const timeoutMs = normalizeTimeout(merged.timeout);
  const retry = normalizeRetry(merged.retry);
  const hooks = normalizeHooks(merged.hooks);
  const pagination = normalizePagination(merged.pagination);
  const tls = normalizeTls(merged.tls);
  const session = normalizeSession(merged.session, defaults.sessionId);
  const body = normalizeBody(merged.body, merged.json, merged.form);
  const isByteRequest = body?.isBinary ?? false;
  const headers = normalizeHeaders(merged.headers ?? {});

  if (body?.contentType && !hasHeader(headers, "content-type")) {
    headers["content-type"] = body.contentType;
  }

  return {
    url,
    method: (merged.method ?? "GET").toUpperCase() as NormalizedRequestOptions["method"],
    headers,
    body: body?.bodyAsString,
    isByteRequest,
    timeoutMs,
    retry,
    cookieJar: merged.cookieJar ?? defaults.cookieJar,
    throwHttpErrors: merged.throwHttpErrors ?? true,
    followRedirect: merged.followRedirect ?? true,
    maxRedirects: merged.maxRedirects ?? 10,
    responseType: merged.responseType ?? "text",
    resolveBodyOnly: merged.resolveBodyOnly ?? false,
    proxyUrl: merged.proxyUrl,
    context: merged.context ?? {},
    hooks,
    pagination,
    tls,
    customTlsClient: merged.customTlsClient,
    session,
  };
};

const createRequestUrl = (
  rawUrl: string | undefined,
  prefixUrl: string | undefined,
  searchParams: SearchParamsInit | undefined
): string => {
  if (!rawUrl) {
    throw new TypeError("Request URL must be provided.");
  }

  const url = prefixUrl ? new URL(rawUrl, ensureTrailingSlash(prefixUrl)) : new URL(rawUrl);
  if (searchParams) {
    const normalized = normalizeSearchParams(searchParams);
    for (const [key, value] of normalized.entries()) {
      url.searchParams.append(key, value);
    }
  }

  return url.toString();
};

const ensureTrailingSlash = (value: string): string =>
  value.endsWith("/") ? value : `${value}/`;

const normalizeSearchParams = (input: SearchParamsInit): URLSearchParams => {
  if (typeof input === "string" || input instanceof URLSearchParams) {
    return new URLSearchParams(input);
  }

  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(input)) {
    if (Array.isArray(value)) {
      for (const nested of value) {
        params.append(key, String(nested));
      }
    } else {
      params.append(key, String(value));
    }
  }
  return params;
};

const normalizeHeaders = (input: Record<string, string>): Record<string, string> => {
  const headers: Record<string, string> = {};
  for (const [key, value] of Object.entries(input)) {
    headers[key.toLowerCase()] = value;
  }
  return headers;
};

const hasHeader = (headers: Record<string, string>, key: string): boolean => key.toLowerCase() in headers;

const normalizeTimeout = (timeout: number | TimeoutOptions | undefined): number => {
  if (typeof timeout === "number") {
    return timeout;
  }
  return timeout?.request ?? DEFAULT_TIMEOUT_MS;
};

const normalizeRetry = (retry: RetryOptions | undefined): Required<RetryOptions> => ({
  ...DEFAULT_RETRY,
  ...(retry ?? {}),
});

const normalizeTls = (
  tls: TlsFingerprintOptions | undefined
): Required<Omit<TlsFingerprintOptions, "customTlsClient">> => ({
  ...DEFAULT_TLS_OPTIONS,
  ...(tls ?? {}),
});

const normalizeHooks = (hooks: Hooks | undefined): Required<Hooks> => ({
  beforeRequest: [...DEFAULT_HOOKS.beforeRequest, ...(hooks?.beforeRequest ?? [])],
  beforeRetry: [...DEFAULT_HOOKS.beforeRetry, ...(hooks?.beforeRetry ?? [])],
  afterResponse: [...DEFAULT_HOOKS.afterResponse, ...(hooks?.afterResponse ?? [])],
  beforeError: [...DEFAULT_HOOKS.beforeError, ...(hooks?.beforeError ?? [])],
});

const normalizePagination = (
  pagination: PaginationOptions | undefined
): Required<PaginationOptions> => ({
  ...DEFAULT_PAGINATION,
  ...(pagination ?? {}),
});

const normalizeSession = (session: SessionOptions | undefined, defaultSessionId: string): Required<SessionOptions> => ({
  id: session?.id ?? defaultSessionId,
  persistent: session?.persistent ?? true,
});

const normalizeBody = (
  body: RequestOptions["body"],
  json: RequestOptions["json"],
  form: RequestOptions["form"]
):
  | {
      bodyAsString: string;
      contentType?: string;
      isBinary: boolean;
    }
  | undefined => {
  if (json !== undefined && body !== undefined) {
    throw new TypeError("`json` and `body` options cannot be used together.");
  }

  if (form !== undefined && body !== undefined) {
    throw new TypeError("`form` and `body` options cannot be used together.");
  }

  if (json !== undefined) {
    return {
      bodyAsString: JSON.stringify(json),
      contentType: "application/json",
      isBinary: false,
    };
  }

  if (form !== undefined) {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(form)) {
      params.set(key, String(value));
    }
    return {
      bodyAsString: params.toString(),
      contentType: "application/x-www-form-urlencoded",
      isBinary: false,
    };
  }

  if (body === undefined) {
    return undefined;
  }

  if (typeof body === "string") {
    return { bodyAsString: body, isBinary: false };
  }

  const asBuffer = Buffer.isBuffer(body) ? body : Buffer.from(body);
  return {
    bodyAsString: asBuffer.toString("base64"),
    isBinary: true,
  };
};
