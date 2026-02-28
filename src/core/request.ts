import { Buffer } from "node:buffer";
import { applyCookieHeader, buildNativeCookies, storeResponseCookies } from "./cookies";
import { HTTPError, TimeoutError } from "./errors";
import { buildNativePayload } from "./payload";
import { TlsClientResponse } from "./response";
import { isRetryAllowed, waitForRetryDelay } from "./retry";
import type { NormalizedRequestOptions } from "./types";
import type { Transport } from "./transport";

export const executeRequest = async (
  options: NormalizedRequestOptions,
  transport: Transport
): Promise<TlsClientResponse> => {
  let retryCount = 0;

  while (true) {
    try {
      const response = await executeSingleAttempt(options, retryCount, transport);
      let finalResponse = response;

      for (const hook of options.hooks.afterResponse) {
        finalResponse = await hook({ response: finalResponse, options });
      }

      if (options.throwHttpErrors && finalResponse.statusCode >= 400) {
        throw new HTTPError(finalResponse);
      }

      return finalResponse;
    } catch (error) {
      const statusCode = error instanceof HTTPError ? error.response.statusCode : undefined;
      const retryAllowed = isRetryAllowed(options, retryCount, error, statusCode);

      if (!retryAllowed) {
        throw await runBeforeErrorHooks(error, options);
      }

      retryCount += 1;
      for (const hook of options.hooks.beforeRetry) {
        await hook({ error, retryCount, options });
      }
      await waitForRetryDelay(options, retryCount);
    }
  }
};

const executeSingleAttempt = async (
  options: NormalizedRequestOptions,
  retryCount: number,
  transport: Transport
): Promise<TlsClientResponse> => {
  await applyCookieHeader(options.cookieJar, options.url, options.headers);

  for (const hook of options.hooks.beforeRequest) {
    await hook(options);
  }

  const requestCookies = await buildNativeCookies(options.cookieJar, options.url);
  const payload = buildNativePayload(options, requestCookies);
  const nativeResponse = await withRequestTimeout(
    transport.request(payload),
    options.timeoutMs,
    options.url
  );

  const bodyBuffer = payload.isByteResponse
    ? decodeByteResponse(nativeResponse.body)
    : Buffer.from(nativeResponse.body ?? "", "utf8");

  const response = new TlsClientResponse({
    statusCode: nativeResponse.status,
    statusMessage: undefined,
    url: nativeResponse.target || options.url,
    headers: nativeResponse.headers ?? {},
    rawBody: bodyBuffer,
    requestMethod: options.method,
    retryCount,
  });

  await storeResponseCookies(options.cookieJar, response.url, response.headers);
  return response;
};

const decodeByteResponse = (body: string): Buffer => {
  const marker = ";base64,";
  const index = body.indexOf(marker);
  if (index === -1) {
    return Buffer.from(body, "utf8");
  }

  return Buffer.from(body.slice(index + marker.length), "base64");
};

const withRequestTimeout = async <T>(
  promise: Promise<T>,
  timeoutMs: number,
  url: string
): Promise<T> => {
  if (timeoutMs <= 0) {
    return promise;
  }

  let timeoutHandle: NodeJS.Timeout | undefined;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutHandle = setTimeout(() => {
      reject(new TimeoutError(`Request to ${url} timed out after ${timeoutMs}ms.`));
    }, timeoutMs);
  });

  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    if (timeoutHandle) {
      clearTimeout(timeoutHandle);
    }
  }
};

const runBeforeErrorHooks = async (
  error: unknown,
  options: NormalizedRequestOptions
): Promise<Error> => {
  let current = error instanceof Error ? error : new Error(String(error));
  for (const hook of options.hooks.beforeError) {
    current = await hook({ error: current, options });
  }
  return current;
};
