import { createServer } from "node:http";

const port = 8080;

const server = createServer((request, response) => {
  const requestUrl = new URL(request.url, `http://${request.headers.host}`);
  const body = JSON.stringify({
    source: "real-upstream",
    method: request.method,
    path: requestUrl.pathname,
  });

  response.writeHead(200, {
    "content-type": "application/json; charset=utf-8",
    "content-length": Buffer.byteLength(body),
  });
  response.end(body);
});

server.listen(port, "0.0.0.0");
