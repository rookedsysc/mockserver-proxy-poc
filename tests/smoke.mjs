import assert from "node:assert/strict";

const mockServerBaseUrl =
  process.env.MOCKSERVER_BASE_URL ?? "http://localhost:1080";
const nestjsBaseUrl = process.env.NESTJS_BASE_URL ?? "http://nestjs:3000";

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

const mockResponse = await getJson(mockServerBaseUrl, "/api/users/42");
assert.deepEqual(mockResponse, {
  source: "nestjs-openapi",
  id: "42",
  name: "Mock User",
});

const proxyResponse = await getJson(mockServerBaseUrl, "/api/passthrough");
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

const dashboardResponse = await fetch(
  `${mockServerBaseUrl}/mockserver/dashboard`,
);
const dashboardHtml = await dashboardResponse.text();

assert.equal(dashboardResponse.status, 200);
assert.match(
  dashboardResponse.headers.get("content-type") ?? "",
  /^text\/html/,
);
assert.match(dashboardHtml, /<title>MockServer Dashboard<\/title>/);

console.log(
  "PASS NestJS OpenAPI auto-mock, proxy fallback, Swagger UI, and dashboard",
);
