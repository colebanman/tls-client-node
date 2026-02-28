import { describe, expect, it } from "vitest";
import { createDefaultState, normalizeOptions } from "../../src/core/options";
import { buildNativePayload } from "../../src/core/payload";
import { DEFAULT_CHROME_PROFILE } from "../../src/profiles";

describe("option normalization", () => {
  it("uses chrome profile defaults when no tls overrides provided", () => {
    const defaults = createDefaultState();
    const normalized = normalizeOptions(defaults, { url: "https://example.com" });

    expect(normalized.tls.clientIdentifier).toBe(DEFAULT_CHROME_PROFILE);
    expect(normalized.customTlsClient).toBeUndefined();
  });

  it("maps custom tls client payload fields", () => {
    const defaults = createDefaultState();
    const normalized = normalizeOptions(defaults, {
      url: "https://example.com",
      customTlsClient: {
        ja3String: "771,4865-4866,0-10-11,29-23,0",
        h2Settings: {
          HEADER_TABLE_SIZE: 65536,
        },
        h2SettingsOrder: ["HEADER_TABLE_SIZE"],
        supportedVersions: ["GREASE", "1.3", "1.2"],
      },
    });

    const payload = buildNativePayload(normalized, []);
    expect(payload.tlsClientIdentifier).toBeUndefined();
    expect(payload.customTlsClient?.ja3String).toBe(
      "771,4865-4866,0-10-11,29-23,0"
    );
    expect(payload.customTlsClient?.h2SettingsOrder).toEqual(["HEADER_TABLE_SIZE"]);
    expect(payload.customTlsClient?.supportedVersions).toEqual(["GREASE", "1.3", "1.2"]);
  });
});
