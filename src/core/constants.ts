import { CookieJar } from "tough-cookie";
import { DEFAULT_CHROME_PROFILE } from "../profiles";
import type {
  Hooks,
  PaginationOptions,
  RetryOptions,
  TlsFingerprintOptions,
} from "./types";

export const DEFAULT_TIMEOUT_MS = 30_000;

export const DEFAULT_RETRY: Required<RetryOptions> = {
  limit: 2,
  methods: ["GET", "PUT", "HEAD", "DELETE", "OPTIONS"],
  statusCodes: [408, 413, 429, 500, 502, 503, 504, 521, 522, 524],
  errorCodes: ["ECONNRESET", "ECONNREFUSED", "EPIPE", "ETIMEDOUT", "ECONNABORTED"],
  backoffBaseMs: 200,
  backoffFactor: 2,
  maxRetryAfterMs: 30_000,
};

export const DEFAULT_TLS_OPTIONS: Required<Omit<TlsFingerprintOptions, "customTlsClient">> = {
  clientIdentifier: DEFAULT_CHROME_PROFILE,
  randomTlsExtensionOrder: false,
  forceHttp1: false,
  disableHttp3: false,
  withProtocolRacing: false,
  disableIpv4: false,
  disableIpv6: false,
  insecureSkipVerify: false,
  serverNameOverwrite: "",
};

export const DEFAULT_HOOKS: Required<Hooks> = {
  beforeRequest: [],
  beforeRetry: [],
  afterResponse: [],
  beforeError: [],
};

export const DEFAULT_PAGINATION: Required<PaginationOptions<unknown>> = {
  transform: async (response) => {
    const body = await response.json<unknown>();
    return Array.isArray(body) ? body : [];
  },
  paginate: ({ response }) => {
    const link = response.headers.link;
    if (!link) {
      return false;
    }
    const resolvedLink = Array.isArray(link) ? link[0] : link;
    const next = parseNextLink(resolvedLink);
    if (!next) {
      return false;
    }

    return { url: next };
  },
  filter: () => true,
  shouldContinue: () => true,
  countLimit: Number.POSITIVE_INFINITY,
  requestLimit: 10_000,
  backoff: 0,
  stackAllItems: false,
};

export const DEFAULT_COOKIE_JAR = () => new CookieJar();

const parseNextLink = (linkHeader: string): string | undefined => {
  for (const part of linkHeader.split(",")) {
    const [urlPart, ...params] = part.trim().split(";");
    if (!params.some((param) => param.trim() === 'rel="next"')) {
      continue;
    }

    const match = urlPart.match(/^<(.+)>$/);
    if (match) {
      return match[1];
    }
  }

  return undefined;
};
