import { randomUUID } from "node:crypto";
import { DEFAULT_COOKIE_JAR } from "./core/constants";
import { executeRequest } from "./core/request";
import { NativeTransport, type Transport } from "./core/transport";
import type { GotDefaults, HttpMethodAlias, RequestOptions } from "./core/types";
import { createDefaultState, mergeRequestOptions, normalizeOptions, splitInput } from "./core/options";
import { decorateResponsePromise, type RequestPromise } from "./promise";
import { createPagination } from "./pagination";
import { createStreamApi, type GotStreamApi } from "./stream";
import type { TlsClientResponse } from "./core/response";

const METHOD_ALIASES: HttpMethodAlias[] = [
  "get",
  "post",
  "put",
  "patch",
  "head",
  "delete",
  "options",
];

export interface GotInstance {
  (url: string | URL | RequestOptions, options?: RequestOptions): RequestPromise<TlsClientResponse>;
  extend(...defaults: RequestOptions[]): GotInstance;
  stream: GotStreamApi;
  paginate: {
    <T = unknown>(url: string | URL, options?: RequestOptions): AsyncIterableIterator<T>;
    each: <T = unknown>(url: string | URL, options?: RequestOptions) => AsyncIterableIterator<T>;
    all: <T = unknown>(url: string | URL, options?: RequestOptions) => Promise<T[]>;
  };
  close(): Promise<void>;
  destroyAll(): Promise<void>;
  defaults: GotDefaults;
  [key: string]:
    | unknown
    | ((url: string | URL, options?: RequestOptions) => RequestPromise<TlsClientResponse>);
}

export interface CreateClientOptions {
  transport?: Transport;
  defaults?: RequestOptions;
  defaultsState?: GotDefaults;
}

export const createClient = (options: CreateClientOptions = {}): GotInstance => {
  const transport = options.transport ?? new NativeTransport();
  const defaultsState = options.defaultsState ?? createDefaultState();
  defaultsState.options = mergeRequestOptions(defaultsState.options, options.defaults ?? {});
  defaultsState.cookieJar = defaultsState.options.cookieJar ?? defaultsState.cookieJar ?? DEFAULT_COOKIE_JAR();
  defaultsState.sessionId = defaultsState.options.session?.id ?? defaultsState.sessionId ?? randomUUID();

  const got = ((input: string | URL | RequestOptions, requestOptions?: RequestOptions) => {
    const mergedInput = splitInput(input, requestOptions);
    const normalized = normalizeOptions(defaultsState, mergedInput);
    const responsePromise = executeRequest(normalized, transport);
    return decorateResponsePromise(responsePromise);
  }) as GotInstance;

  for (const method of METHOD_ALIASES) {
    got[method] = ((url: string | URL, methodOptions?: RequestOptions) =>
      got(url, {
        ...(methodOptions ?? {}),
        method: method.toUpperCase() as RequestOptions["method"],
      })) as GotInstance[HttpMethodAlias];
  }

  got.extend = (...defaults: RequestOptions[]) => {
    const mergedDefaults = defaults.reduce(
      (acc, entry) => mergeRequestOptions(acc, entry),
      defaultsState.options
    );

    return createClient({
      transport,
      defaults: mergedDefaults,
      defaultsState: {
        options: mergedDefaults,
        cookieJar: mergedDefaults.cookieJar ?? defaultsState.cookieJar,
        sessionId: mergedDefaults.session?.id ?? randomUUID(),
      },
    });
  };

  const pagination = createPagination(got);
  got.paginate = ((
    url: string | URL,
    paginationOptions?: RequestOptions
  ) => pagination.each(url, paginationOptions)) as GotInstance["paginate"];
  got.paginate.each = pagination.each;
  got.paginate.all = pagination.all;

  got.stream = createStreamApi(got);

  got.close = async (): Promise<void> => {
    await transport.destroySession(defaultsState.sessionId);
  };

  got.destroyAll = async (): Promise<void> => {
    await transport.destroyAll();
  };

  got.defaults = defaultsState;
  return got;
};
