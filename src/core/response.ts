import { Buffer } from "node:buffer";

export interface TlsClientResponseInit {
  statusCode: number;
  statusMessage?: string;
  url: string;
  headers: Record<string, string | string[]>;
  rawBody: Buffer;
  requestMethod: string;
  retryCount: number;
}

export class TlsClientResponse {
  public readonly statusCode: number;
  public readonly statusMessage?: string;
  public readonly url: string;
  public readonly headers: Record<string, string | string[]>;
  public readonly rawBody: Buffer;
  public readonly requestMethod: string;
  public readonly retryCount: number;

  public constructor(init: TlsClientResponseInit) {
    this.statusCode = init.statusCode;
    this.statusMessage = init.statusMessage;
    this.url = init.url;
    this.headers = init.headers;
    this.rawBody = init.rawBody;
    this.requestMethod = init.requestMethod;
    this.retryCount = init.retryCount;
  }

  public get ok(): boolean {
    return this.statusCode >= 200 && this.statusCode < 300;
  }

  public async text(): Promise<string> {
    return this.rawBody.toString("utf8");
  }

  public async json<T = unknown>(): Promise<T> {
    return JSON.parse(await this.text()) as T;
  }

  public async buffer(): Promise<Buffer> {
    return Buffer.from(this.rawBody);
  }

  public get body(): string {
    return this.rawBody.toString("utf8");
  }
}
