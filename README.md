# tls-client-node

Node.js + TypeScript port of [`bogdanfinn/tls-client`](https://github.com/bogdanfinn/tls-client) with a **got-style API**.

It is preconfigured with a Chrome TLS fingerprint by default (`chrome_133`) and supports full custom JA3/TLS/H2 bindings.

## Features

- ✅ Browser fingerprinted requests via upstream `tls-client` native library
- ✅ Default Chrome profile out of the box
- ✅ Custom JA3 + H2/H3 + TLS extension settings
- ✅ got-like API:
  - callable client
  - `.get/.post/.put/.patch/.head/.delete/.options`
  - `.extend()`
  - hooks
  - retries
  - pagination helpers
  - `response.json()/text()/buffer()`
- ✅ Persistent sessions + cookie jar support
- ✅ Stream compatibility API (`client.stream(...)`)

## Install

```bash
npm install tls-client-node
```

## Quick start

```ts
import got from "tls-client-node";

const response = await got("https://tls.peet.ws/api/all");
const data = await response.json();

console.log(response.statusCode, data);
```

## got-like usage

```ts
import got from "tls-client-node";

const client = got.extend({
  prefixUrl: "https://httpbin.org",
  headers: {
    "user-agent":
      "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36",
  },
  retry: { limit: 3 },
  timeout: { request: 10_000 },
});

const result = await client.get("anything", {
  searchParams: { hello: "world" },
}).json();
```

## Persistent sessions and cookies

Cookies are persisted in a `tough-cookie` jar automatically per client instance:

```ts
import got from "tls-client-node";

const client = got.extend({
  prefixUrl: "https://example.com",
});

await client.get("login");
const authed = await client.get("account");
```

You can also provide your own cookie jar:

```ts
import got from "tls-client-node";
import { CookieJar } from "tough-cookie";

const jar = new CookieJar();
const client = got.extend({ cookieJar: jar });
```

## Custom TLS (JA3 + bindings)

You can pass custom TLS settings either at the top level (`customTlsClient`) or nested (`tls.customTlsClient`):

```ts
import got from "tls-client-node";

const response = await got("https://example.com", {
  customTlsClient: {
    ja3String:
      "771,2570-4865-4866-4867-49195-49199-49196-49200-52393-52392-49171-49172-156-157-47-53,2570-0-23-65281-10-11-35-16-5-13-18-51-45-43-27-17513-2570-21,2570-29-23-24,0",
    h2Settings: {
      HEADER_TABLE_SIZE: 65536,
      MAX_CONCURRENT_STREAMS: 1000,
      INITIAL_WINDOW_SIZE: 6291456,
      MAX_HEADER_LIST_SIZE: 262144,
    },
    h2SettingsOrder: [
      "HEADER_TABLE_SIZE",
      "MAX_CONCURRENT_STREAMS",
      "INITIAL_WINDOW_SIZE",
      "MAX_HEADER_LIST_SIZE",
    ],
    supportedSignatureAlgorithms: [
      "ECDSAWithP256AndSHA256",
      "PSSWithSHA256",
      "PKCS1WithSHA256",
    ],
    supportedVersions: ["GREASE", "1.3", "1.2"],
    keyShareCurves: ["GREASE", "X25519"],
    alpnProtocols: ["h2", "http/1.1"],
  },
});
```

## Pagination

```ts
const items = await got.paginate.all("https://api.example.com/resources");

for await (const item of got.paginate.each("https://api.example.com/resources")) {
  console.log(item);
}
```

## Stream API

`client.stream(...)` is provided for compatibility.  
Because the upstream CFFI request API is non-streaming, response bytes are buffered internally and then emitted through the stream.

## Native library behavior

On first use, the package downloads the matching `tls-client` release binary into:

- `~/.cache/tls-client-node` by default

Environment overrides:

- `TLS_CLIENT_NODE_BINARY_PATH` — explicit binary file path (skip download)
- `TLS_CLIENT_NODE_CACHE_DIR` — custom cache directory

## License

ISC
