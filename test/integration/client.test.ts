import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createClient } from "../../src/create";
import { startFixtureServer } from "../fixtures/server";
import { MockHttpTransport } from "../fixtures/mockTransport";

describe("got-like client integration", () => {
  let baseUrl: string;
  let closeServer: () => Promise<void>;

  beforeAll(async () => {
    const fixture = await startFixtureServer();
    baseUrl = fixture.baseUrl;
    closeServer = fixture.close;
  });

  afterAll(async () => {
    await closeServer();
  });

  it("supports basic request flow and response helpers", async () => {
    const client = createClient({
      transport: new MockHttpTransport(),
      defaults: { prefixUrl: baseUrl },
    });

    const response = await client("json");
    const json = await response.json<{ ok: boolean; method: string }>();

    expect(response.statusCode).toBe(200);
    expect(json.ok).toBe(true);
    expect(json.method).toBe("GET");
  });

  it("persists cookies between requests", async () => {
    const client = createClient({
      transport: new MockHttpTransport(),
      defaults: { prefixUrl: baseUrl },
    });

    await client("set-cookie");
    const response = await client("needs-cookie");
    const body = await response.json<{ authenticated: boolean }>();

    expect(response.statusCode).toBe(200);
    expect(body.authenticated).toBe(true);
  });

  it("applies retry policy and hooks", async () => {
    let retryCalls = 0;
    const client = createClient({
      transport: new MockHttpTransport(),
      defaults: {
        prefixUrl: baseUrl,
        retry: { limit: 3, backoffBaseMs: 0 },
        hooks: {
          beforeRetry: [
            () => {
              retryCalls += 1;
            },
          ],
        },
      },
    });

    const response = await client("flaky");

    expect(response.statusCode).toBe(200);
    expect(retryCalls).toBe(1);
  });

  it("supports pagination helpers", async () => {
    const client = createClient({
      transport: new MockHttpTransport(),
      defaults: { prefixUrl: baseUrl },
    });

    const items = await client.paginate.all<number>("paginate?page=1");
    expect(items).toEqual([1, 2, 3, 4]);
  });

  it("provides stream compatibility API", async () => {
    const client = createClient({
      transport: new MockHttpTransport(),
      defaults: { prefixUrl: baseUrl },
    });

    const stream = client.stream("json");
    const chunks: Buffer[] = [];

    await new Promise<void>((resolve, reject) => {
      stream.on("data", (chunk) => chunks.push(Buffer.from(chunk)));
      stream.on("end", () => resolve());
      stream.on("error", reject);
    });

    const payload = JSON.parse(Buffer.concat(chunks).toString("utf8")) as { ok: boolean };
    expect(payload.ok).toBe(true);
  });
});
