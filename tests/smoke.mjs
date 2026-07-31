import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const mockoonBaseUrl =
  process.env.MOCKOON_BASE_URL ?? "http://localhost:1080";
const nestjsBaseUrl = process.env.NESTJS_BASE_URL ?? "http://nestjs:3000";
const mockoonDataFile =
  process.env.MOCKOON_DATA_FILE ?? "/mockoon/environment.json";

async function getJson(baseUrl, path) {
  const response = await fetch(`${baseUrl}${path}`);
  const responseBody = await response.text();

  assert.equal(
    response.status,
    200,
    `${path} returned ${response.status}: ${responseBody}`,
  );

  return JSON.parse(responseBody);
}

const swaggerDocument = await getJson(nestjsBaseUrl, "/docs-json");
assert.ok(swaggerDocument.paths["/api/users/{userId}"]);
assert.equal(swaggerDocument.paths["/api/passthrough"], undefined);
assert.ok(swaggerDocument.paths["/api/users/{userId}"].get.responses["200"]);
assert.ok(swaggerDocument.paths["/api/users/{userId}"].get.responses["404"]);

const mockoonEnvironment = JSON.parse(
  await readFile(mockoonDataFile, "utf8"),
);
const userRoute = mockoonEnvironment.routes.find(
  (route) => route.method === "get" && route.endpoint === "api/users/:userId",
);

assert.ok(userRoute);
assert.deepEqual(
  userRoute.responses.map((response) => response.statusCode).sort(),
  [200, 404],
);
assert.equal(
  userRoute.responses.find((response) => response.statusCode === 200).default,
  true,
);
assert.equal(
  userRoute.responses.find((response) => response.statusCode === 404).default,
  false,
);
assert.equal(mockoonEnvironment.proxyMode, true);
assert.equal(mockoonEnvironment.proxyHost, "http://nestjs:3000");

const mockResponse = await getJson(mockoonBaseUrl, "/api/users/42");
assert.deepEqual(mockResponse, {
  source: "nestjs-openapi",
  id: "42",
  name: "Mock User",
});

const proxyResponse = await getJson(mockoonBaseUrl, "/api/passthrough");
assert.deepEqual(proxyResponse, {
  source: "nestjs-upstream",
  method: "GET",
  path: "/api/passthrough",
});

const swaggerUiResponse = await fetch(`${nestjsBaseUrl}/docs`);
const swaggerUiHtml = await swaggerUiResponse.text();

assert.equal(swaggerUiResponse.status, 200);
assert.match(swaggerUiResponse.headers.get("content-type") ?? "", /^text\/html/);
assert.match(swaggerUiHtml, /<title>NestJS Mock Source API<\/title>/);

console.log(
  "PASS NestJS OpenAPI to Mockoon sync, selectable responses, and proxy fallback",
);
