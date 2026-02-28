import type { TlsClientResponse } from "./response";

export class TlsClientError extends Error {
  public readonly code?: string;
  public readonly cause?: unknown;

  public constructor(message: string, code?: string, cause?: unknown) {
    super(message);
    this.name = "TlsClientError";
    this.code = code;
    this.cause = cause;
  }
}

export class RequestError extends TlsClientError {
  public readonly optionsUrl: string;

  public constructor(message: string, optionsUrl: string, code?: string, cause?: unknown) {
    super(message, code, cause);
    this.name = "RequestError";
    this.optionsUrl = optionsUrl;
  }
}

export class HTTPError extends TlsClientError {
  public readonly response: TlsClientResponse;

  public constructor(response: TlsClientResponse) {
    super(`Response code ${response.statusCode} (${response.statusMessage ?? "Unknown"})`);
    this.name = "HTTPError";
    this.response = response;
  }
}

export class TimeoutError extends TlsClientError {
  public constructor(message: string, cause?: unknown) {
    super(message, "ETIMEDOUT", cause);
    this.name = "TimeoutError";
  }
}

export class UnsupportedPlatformError extends TlsClientError {
  public constructor(platform: string, arch: string) {
    super(`No tls-client binary mapping for platform '${platform}' and arch '${arch}'.`);
    this.name = "UnsupportedPlatformError";
  }
}

export class BinaryDownloadError extends TlsClientError {
  public constructor(message: string, cause?: unknown) {
    super(message, "EBINARYDOWNLOAD", cause);
    this.name = "BinaryDownloadError";
  }
}
