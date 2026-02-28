import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { AddressInfo } from "node:net";

const parseBody = async (request: IncomingMessage): Promise<string> => {
  const chunks: Buffer[] = [];
  for await (const chunk of request) {
    chunks.push(Buffer.from(chunk));
  }
  return Buffer.concat(chunks).toString("utf8");
};

export const startFixtureServer = async () => {
  let flakyAttempts = 0;

  const server = createServer(async (request: IncomingMessage, response: ServerResponse) => {
    const path = request.url ? new URL(request.url, "http://localhost").pathname : "/";
    const url = request.url ? new URL(request.url, "http://localhost") : new URL("http://localhost");

    if (path === "/json") {
      response.setHeader("content-type", "application/json");
      response.end(JSON.stringify({ ok: true, method: request.method }));
      return;
    }

    if (path === "/echo") {
      const body = await parseBody(request);
      response.setHeader("content-type", "application/json");
      response.end(
        JSON.stringify({
          method: request.method,
          query: Object.fromEntries(url.searchParams.entries()),
          headers: request.headers,
          body,
        })
      );
      return;
    }

    if (path === "/set-cookie") {
      response.setHeader("set-cookie", ["session=abc123; Path=/"]);
      response.setHeader("content-type", "application/json");
      response.end(JSON.stringify({ set: true }));
      return;
    }

    if (path === "/needs-cookie") {
      const hasCookie = request.headers.cookie?.includes("session=abc123");
      response.statusCode = hasCookie ? 200 : 401;
      response.setHeader("content-type", "application/json");
      response.end(JSON.stringify({ authenticated: Boolean(hasCookie) }));
      return;
    }

    if (path === "/redirect") {
      response.statusCode = 302;
      response.setHeader("location", "/json");
      response.end();
      return;
    }

    if (path === "/flaky") {
      flakyAttempts += 1;
      response.statusCode = flakyAttempts >= 2 ? 200 : 500;
      response.setHeader("content-type", "application/json");
      response.end(JSON.stringify({ attempts: flakyAttempts }));
      return;
    }

    if (path === "/paginate") {
      const page = Number(url.searchParams.get("page") ?? "1");
      const items = page === 1 ? [1, 2] : page === 2 ? [3, 4] : [];
      if (page < 2) {
        const host = request.headers.host ?? "127.0.0.1";
        response.setHeader(
          "link",
          `<http://${host}/paginate?page=${page + 1}>; rel="next"`
        );
      }
      response.setHeader("content-type", "application/json");
      response.end(JSON.stringify(items));
      return;
    }

    response.statusCode = 404;
    response.end("Not found");
  });

  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", () => resolve()));
  const address = server.address() as AddressInfo;
  const baseUrl = `http://127.0.0.1:${address.port}`;

  return {
    baseUrl,
    getFlakyAttempts: () => flakyAttempts,
    close: async () => {
      await new Promise<void>((resolve, reject) => {
        server.close((error) => {
          if (error) {
            reject(error);
            return;
          }
          resolve();
        });
      });
    },
  };
};
