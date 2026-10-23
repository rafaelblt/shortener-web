import { createServer } from "node:http";
import type { IncomingMessage, Server, ServerResponse } from "node:http";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";

import type { Handler } from "./app.ts";

/** A server of node:http for the handler, which takes and gives the requests of the Fetch API. */
export function serve(handler: Handler): Server {
  return createServer((incoming, outgoing) => {
    answer(handler, incoming, outgoing).catch((error: unknown) => {
      console.error("An answer couldn't be sent:", error);
      outgoing.destroy();
    });
  });
}

async function answer(handler: Handler, incoming: IncomingMessage, outgoing: ServerResponse) {
  const response = await handler(requestOf(incoming), incoming.socket.remoteAddress ?? "");
  for (const [name, value] of response.headers) {
    if (name !== "set-cookie") outgoing.setHeader(name, value);
  }
  const cookies = response.headers.getSetCookie();
  if (cookies.length > 0) outgoing.setHeader("set-cookie", cookies);
  outgoing.writeHead(response.status);

  if (response.body && incoming.method !== "HEAD") {
    await pipeline(Readable.fromWeb(response.body), outgoing);
  } else {
    await response.body?.cancel();
    outgoing.end();
  }
}

function requestOf(incoming: IncomingMessage): Request {
  const method = incoming.method ?? "GET";
  const headers = new Headers();
  for (let index = 0; index < incoming.rawHeaders.length; index += 2) {
    headers.append(incoming.rawHeaders[index] ?? "", incoming.rawHeaders[index + 1] ?? "");
  }
  const hasBody = method !== "GET" && method !== "HEAD";
  // The host doesn't matter: the server reads only the path and the query.
  return new Request(new URL(incoming.url ?? "/", "http://localhost"), {
    method,
    headers,
    body: hasBody ? Readable.toWeb(incoming) : undefined,
    duplex: "half",
  });
}
