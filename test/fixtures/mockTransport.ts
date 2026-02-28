import { Buffer } from "node:buffer";
import { randomUUID } from "node:crypto";
import type { Transport } from "../../src/core/transport";
import type { NativeRequestPayload, NativeResponsePayload } from "../../src/native/types";

export class MockHttpTransport implements Transport {
  public async request(payload: NativeRequestPayload): Promise<NativeResponsePayload> {
    const headers = new Headers(payload.headers);

    if (payload.requestCookies.length > 0 && !headers.has("cookie")) {
      const cookieValue = payload.requestCookies
        .map((cookie) => `${cookie.name}=${cookie.value}`)
        .join("; ");
      headers.set("cookie", cookieValue);
    }

    let requestBody: BodyInit | undefined;
    if (payload.requestBody !== undefined) {
      requestBody = payload.isByteRequest
        ? Buffer.from(payload.requestBody, "base64")
        : payload.requestBody;
    }

    const response = await fetch(payload.requestUrl, {
      method: payload.requestMethod,
      headers,
      body: requestBody,
      redirect: payload.followRedirects ? "follow" : "manual",
    });

    const responseHeaders: Record<string, string | string[]> = {};
    response.headers.forEach((value, key) => {
      responseHeaders[key] = value;
    });

    const setCookieValues = (response.headers as Headers & {
      getSetCookie?: () => string[];
    }).getSetCookie?.();
    if (setCookieValues && setCookieValues.length > 0) {
      responseHeaders["set-cookie"] = setCookieValues;
    }

    let body: string;
    if (payload.isByteResponse) {
      const bytes = Buffer.from(await response.arrayBuffer());
      body = `data:application/octet-stream;base64,${bytes.toString("base64")}`;
    } else {
      body = await response.text();
    }

    return {
      id: randomUUID(),
      status: response.status,
      body,
      headers: responseHeaders,
      target: response.url,
      usedProtocol: "HTTP/1.1",
      sessionId: payload.sessionId,
    };
  }

  public async destroySession(): Promise<boolean> {
    return true;
  }

  public async destroyAll(): Promise<boolean> {
    return true;
  }
}
