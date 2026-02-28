import type { TlsClientResponse } from "./core/response";

export interface RequestPromise<T = TlsClientResponse> extends Promise<T> {
  json<U = unknown>(): Promise<U>;
  text(): Promise<string>;
  buffer(): Promise<Buffer>;
}

export const decorateResponsePromise = (
  promise: Promise<TlsClientResponse>
): RequestPromise => {
  const decorated = promise as RequestPromise;
  decorated.json = async <U = unknown>() => (await promise).json<U>();
  decorated.text = async () => (await promise).text();
  decorated.buffer = async () => (await promise).buffer();
  return decorated;
};
