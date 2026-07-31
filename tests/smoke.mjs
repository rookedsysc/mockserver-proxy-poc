import assert from "node:assert/strict";

const baseUrl = process.env.MOCKSERVER_BASE_URL ?? "http://localhost:1080";

async function getJson(path) {
  const response = await fetch(`${baseUrl}${path}`);
  const responseBody = await response.text();

  assert.equal(
    response.status,
    200,
    `${path} returned ${response.status}: ${responseBody}`,
  );

  return JSON.parse(responseBody);
}

const mockResponse = await getJson("/api/users/42");
assert.deepEqual(mockResponse, {
  source: "mockserver",
  id: "42",
  name: "Mock User",
});

const proxyResponse = await getJson("/api/passthrough");
assert.deepEqual(proxyResponse, {
  source: "real-upstream",
  method: "GET",
  path: "/api/passthrough",
});

const dashboardResponse = await fetch(`${baseUrl}/mockserver/dashboard`);
const dashboardHtml = await dashboardResponse.text();

assert.equal(dashboardResponse.status, 200);
assert.match(
  dashboardResponse.headers.get("content-type") ?? "",
  /^text\/html/,
);
assert.match(dashboardHtml, /<title>MockServer Dashboard<\/title>/);

console.log("PASS mock response, proxy fallback, and dashboard");
