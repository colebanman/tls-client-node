import { describe, expect, it } from "vitest";
import { createDefaultState, normalizeOptions } from "../../src/core/options";
import { isRetryAllowed } from "../../src/core/retry";
import { TimeoutError } from "../../src/core/errors";

describe("retry rules", () => {
  it("retries configured methods and statuses", () => {
    const defaults = createDefaultState();
    const options = normalizeOptions(defaults, {
      url: "https://example.com",
      method: "GET",
      retry: { limit: 3 },
    });

    expect(isRetryAllowed(options, 0, new Error("server error"), 500)).toBe(true);
  });

  it("does not retry when retry limit reached", () => {
    const defaults = createDefaultState();
    const options = normalizeOptions(defaults, {
      url: "https://example.com",
      method: "GET",
      retry: { limit: 1 },
    });

    expect(isRetryAllowed(options, 1, new TimeoutError("boom"))).toBe(false);
  });
});
