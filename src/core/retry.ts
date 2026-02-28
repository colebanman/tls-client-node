import { setTimeout as delay } from "node:timers/promises";
import { TimeoutError } from "./errors";
import type { NormalizedRequestOptions } from "./types";

export const isRetryAllowed = (
  options: NormalizedRequestOptions,
  retryCount: number,
  error: unknown,
  responseStatusCode?: number
): boolean => {
  if (retryCount >= options.retry.limit) {
    return false;
  }

  if (!options.retry.methods.includes(options.method)) {
    return false;
  }

  if (responseStatusCode && options.retry.statusCodes.includes(responseStatusCode)) {
    return true;
  }

  if (error && typeof error === "object" && "code" in (error as Record<string, unknown>)) {
    const code = String((error as Record<string, unknown>).code);
    return options.retry.errorCodes.includes(code);
  }

  return error instanceof TimeoutError;
};

export const waitForRetryDelay = async (
  options: NormalizedRequestOptions,
  retryCount: number
): Promise<void> => {
  const rawDelay =
    options.retry.backoffBaseMs *
    options.retry.backoffFactor ** Math.max(0, retryCount - 1);
  const jitter = Math.floor(Math.random() * 100);
  const delayMs = Math.min(rawDelay + jitter, options.retry.maxRetryAfterMs);
  await delay(delayMs);
};
