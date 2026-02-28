import { createClient } from "./create";

const got = createClient();

export default got;
export { createClient };
export { TLS_CLIENT_IDENTIFIERS, DEFAULT_CHROME_PROFILE } from "./profiles";
export type {
  RequestOptions,
  RetryOptions,
  Hooks,
  CustomTlsClient,
  TlsFingerprintOptions,
  PaginationOptions,
  HttpMethod,
  HttpMethodAlias,
  SearchParamsInit,
} from "./core/types";
export type { RequestPromise } from "./promise";
export { TlsClientResponse } from "./core/response";
export {
  TlsClientError,
  RequestError,
  HTTPError,
  TimeoutError,
  UnsupportedPlatformError,
  BinaryDownloadError,
} from "./core/errors";
