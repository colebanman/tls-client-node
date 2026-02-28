import { PassThrough } from "node:stream";
import type { HttpMethodAlias, RequestOptions } from "./core/types";
import type { GotInstance } from "./create";

const METHODS: HttpMethodAlias[] = [
  "get",
  "post",
  "put",
  "patch",
  "head",
  "delete",
  "options",
];

export type GotStreamApi = ((url: string | URL, options?: RequestOptions) => PassThrough) & {
  [K in HttpMethodAlias]: (url: string | URL, options?: RequestOptions) => PassThrough;
};

export const createStreamApi = (instance: GotInstance): GotStreamApi => {
  const streamFn = ((url: string | URL, options: RequestOptions = {}) => {
    const stream = new PassThrough();

    void instance(url, { ...options, responseType: "buffer" })
      .then(async (response) => {
        stream.emit("response", response);
        stream.end(await response.buffer());
      })
      .catch((error) => {
        stream.emit("error", error);
        stream.end();
      });

    return stream;
  }) as GotStreamApi;

  for (const method of METHODS) {
    streamFn[method] = (url, options = {}) =>
      streamFn(url, {
        ...options,
        method: method.toUpperCase() as RequestOptions["method"],
      });
  }

  return streamFn;
};
