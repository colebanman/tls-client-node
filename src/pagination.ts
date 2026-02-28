import { setTimeout as delay } from "node:timers/promises";
import type { RequestOptions } from "./core/types";
import type { TlsClientResponse } from "./core/response";
import type { GotInstance } from "./create";

export const createPagination = (instance: GotInstance) => {
  const each = async function* <T = unknown>(
    url: string | URL,
    options: RequestOptions = {}
  ): AsyncIterableIterator<T> {
    let requestOptions: RequestOptions = { ...options, url: url.toString() };
    const paginationOptions = requestOptions.pagination ?? {};
    const allItems: T[] = [];
    let countLimit = paginationOptions.countLimit ?? Number.POSITIVE_INFINITY;
    const requestLimit = paginationOptions.requestLimit ?? 10_000;
    const backoff = paginationOptions.backoff ?? 0;

    for (let requestCount = 0; requestCount < requestLimit; requestCount += 1) {
      if (requestCount > 0 && backoff > 0) {
        await delay(backoff);
      }

      const response = await instance(requestOptions.url!, requestOptions);
      const transformed = await runTransform<T>(response, requestOptions);
      const currentItems: T[] = [];

      for (const item of transformed) {
        if (!runFilter(item, currentItems, allItems, requestOptions)) {
          continue;
        }

        if (!runShouldContinue(item, currentItems, allItems, requestOptions)) {
          return;
        }

        yield item;
        currentItems.push(item);
        if (requestOptions.pagination?.stackAllItems ?? false) {
          allItems.push(item);
        }

        countLimit -= 1;
        if (countLimit <= 0) {
          return;
        }
      }

      const next = runPaginate(response, currentItems, allItems, requestOptions);
      if (next === false) {
        return;
      }

      requestOptions = {
        ...requestOptions,
        ...next,
      };
    }
  };

  return {
    each,
    all: async <T = unknown>(url: string | URL, options?: RequestOptions): Promise<T[]> => {
      const items: T[] = [];
      for await (const item of each<T>(url, options)) {
        items.push(item);
      }
      return items;
    },
  };
};

const runTransform = async <T>(
  response: TlsClientResponse,
  options: RequestOptions
): Promise<T[]> => {
  const transform = options.pagination?.transform;
  if (transform) {
    return transform(response) as Promise<T[]>;
  }

  const json = await response.json<unknown>();
  return Array.isArray(json) ? (json as T[]) : [];
};

const runPaginate = <T>(
  response: TlsClientResponse,
  currentItems: T[],
  allItems: T[],
  options: RequestOptions
): false | RequestOptions => {
  if (!options.pagination?.paginate) {
    const link = response.headers.link;
    if (!link || Array.isArray(link)) {
      return false;
    }

    const next = parseLinkHeader(link);
    if (!next) {
      return false;
    }
    return { url: next };
  }

  return options.pagination.paginate({ response, currentItems, allItems });
};

const runFilter = <T>(
  item: T,
  currentItems: T[],
  allItems: T[],
  options: RequestOptions
): boolean => {
  return options.pagination?.filter
    ? options.pagination.filter({ item, currentItems, allItems })
    : true;
};

const runShouldContinue = <T>(
  item: T,
  currentItems: T[],
  allItems: T[],
  options: RequestOptions
): boolean => {
  return options.pagination?.shouldContinue
    ? options.pagination.shouldContinue({ item, currentItems, allItems })
    : true;
};

const parseLinkHeader = (linkHeader: string): string | undefined => {
  for (const part of linkHeader.split(",")) {
    const [target, ...params] = part.trim().split(";");
    if (!params.some((param) => param.trim() === 'rel="next"')) {
      continue;
    }

    const match = target.match(/^<(.+)>$/);
    if (match) {
      return match[1];
    }
  }

  return undefined;
};
