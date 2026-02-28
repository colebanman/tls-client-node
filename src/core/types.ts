import type { CookieJar } from "tough-cookie";
import type { TlsClientIdentifier } from "../profiles";
import type { TlsClientResponse } from "./response";

export type HttpMethod =
  | "GET"
  | "POST"
  | "PUT"
  | "DELETE"
  | "PATCH"
  | "OPTIONS"
  | "HEAD";

export type HttpMethodAlias = Lowercase<HttpMethod>;

export type PrimitiveSearchParam = string | number | boolean;
export type SearchParamsInit =
  | string
  | URLSearchParams
  | Record<string, PrimitiveSearchParam | PrimitiveSearchParam[]>;

export interface TimeoutOptions {
  request?: number;
}

export interface RetryOptions {
  limit?: number;
  methods?: HttpMethod[];
  statusCodes?: number[];
  errorCodes?: string[];
  backoffBaseMs?: number;
  backoffFactor?: number;
  maxRetryAfterMs?: number;
}

export interface CandidateCipherSuite {
  kdfId: string;
  aeadId: string;
}

export interface PriorityParam {
  streamDep: number;
  exclusive: boolean;
  weight: number;
}

export interface PriorityFrame {
  streamID: number;
  priorityParam: PriorityParam;
}

export interface CustomTlsClient {
  ja3String: string;
  h2Settings?: Record<string, number>;
  h2SettingsOrder?: string[];
  h3Settings?: Record<string, number>;
  h3SettingsOrder?: string[];
  h3PseudoHeaderOrder?: string[];
  h3PriorityParam?: number;
  h3SendGreaseFrames?: boolean;
  pseudoHeaderOrder?: string[];
  connectionFlow?: number;
  headerPriority?: PriorityParam;
  priorityFrames?: PriorityFrame[];
  certCompressionAlgos?: string[];
  supportedSignatureAlgorithms?: string[];
  supportedDelegatedCredentialsAlgorithms?: string[];
  supportedVersions?: string[];
  keyShareCurves?: string[];
  alpnProtocols?: string[];
  alpsProtocols?: string[];
  echCandidatePayloads?: number[];
  echCandidateCipherSuites?: CandidateCipherSuite[];
  recordSizeLimit?: number;
  streamId?: number;
  allowHttp?: boolean;
}

export interface TlsFingerprintOptions {
  clientIdentifier?: TlsClientIdentifier;
  randomTlsExtensionOrder?: boolean;
  forceHttp1?: boolean;
  disableHttp3?: boolean;
  withProtocolRacing?: boolean;
  disableIpv4?: boolean;
  disableIpv6?: boolean;
  insecureSkipVerify?: boolean;
  serverNameOverwrite?: string;
}

export interface PaginationOptions<TItem = unknown> {
  transform?: (response: TlsClientResponse) => Promise<TItem[]> | TItem[];
  paginate?:
    | ((context: {
        response: TlsClientResponse;
        currentItems: TItem[];
        allItems: TItem[];
      }) => false | RequestOptions)
    | undefined;
  filter?: (context: {
    item: TItem;
    currentItems: TItem[];
    allItems: TItem[];
  }) => boolean;
  shouldContinue?: (context: {
    item: TItem;
    currentItems: TItem[];
    allItems: TItem[];
  }) => boolean;
  countLimit?: number;
  requestLimit?: number;
  backoff?: number;
  stackAllItems?: boolean;
}

export interface Hooks {
  beforeRequest?: BeforeRequestHook[];
  beforeRetry?: BeforeRetryHook[];
  afterResponse?: AfterResponseHook[];
  beforeError?: BeforeErrorHook[];
}

export type BeforeRequestHook = (
  options: NormalizedRequestOptions
) => void | Promise<void>;
export type BeforeRetryHook = (input: {
  error: unknown;
  retryCount: number;
  options: NormalizedRequestOptions;
}) => void | Promise<void>;
export type AfterResponseHook = (input: {
  response: TlsClientResponse;
  options: NormalizedRequestOptions;
}) => TlsClientResponse | Promise<TlsClientResponse>;
export type BeforeErrorHook = (input: {
  error: Error;
  options: NormalizedRequestOptions;
}) => Error | Promise<Error>;

export interface SessionOptions {
  id?: string;
  persistent?: boolean;
}

export interface RequestOptions {
  url?: string;
  method?: HttpMethod;
  headers?: Record<string, string>;
  body?: string | Buffer | Uint8Array;
  json?: unknown;
  form?: Record<string, PrimitiveSearchParam>;
  searchParams?: SearchParamsInit;
  prefixUrl?: string;
  timeout?: number | TimeoutOptions;
  retry?: RetryOptions;
  cookieJar?: CookieJar;
  throwHttpErrors?: boolean;
  followRedirect?: boolean;
  maxRedirects?: number;
  responseType?: "text" | "json" | "buffer";
  resolveBodyOnly?: boolean;
  proxyUrl?: string;
  context?: Record<string, unknown>;
  hooks?: Hooks;
  pagination?: PaginationOptions;
  tls?: TlsFingerprintOptions;
  customTlsClient?: CustomTlsClient;
  session?: SessionOptions;
}

export interface NormalizedRequestOptions {
  url: string;
  method: HttpMethod;
  headers: Record<string, string>;
  body?: string;
  isByteRequest: boolean;
  searchParams?: URLSearchParams;
  timeoutMs: number;
  retry: Required<RetryOptions>;
  cookieJar: CookieJar;
  throwHttpErrors: boolean;
  followRedirect: boolean;
  maxRedirects: number;
  responseType: "text" | "json" | "buffer";
  resolveBodyOnly: boolean;
  proxyUrl?: string;
  context: Record<string, unknown>;
  hooks: Required<Hooks>;
  pagination: Required<PaginationOptions>;
  tls: Required<Omit<TlsFingerprintOptions, "customTlsClient">>;
  customTlsClient?: CustomTlsClient;
  session: Required<SessionOptions>;
}

export interface GotDefaults {
  options: RequestOptions;
  sessionId: string;
  cookieJar: CookieJar;
}

export type GotInput = string | URL | RequestOptions;
