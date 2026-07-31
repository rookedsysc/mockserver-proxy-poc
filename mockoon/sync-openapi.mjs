import { readFile, writeFile } from "node:fs/promises";
import { OpenApiConverter } from "@mockoon/commons";

const openApiUrl =
  process.env.OPENAPI_URL ?? "http://nestjs:3000/docs-json";
const outputFile =
  process.env.MOCKOON_DATA_FILE ?? "/data/environment.json";
const upstreamUrl = process.env.UPSTREAM_URL ?? "http://nestjs:3000";
const mockoonPort = Number(process.env.MOCKOON_PORT ?? "1080");

function getRouteKey(route) {
  return `${route.method}:${route.endpoint}`;
}

function mergeOpenApiRoutes(currentEnvironment, importedEnvironment) {
  const currentRoutes = new Map(
    currentEnvironment.routes.map((route) => [getRouteKey(route), route]),
  );

  for (const importedRoute of importedEnvironment.routes) {
    const routeKey = getRouteKey(importedRoute);
    const currentRoute = currentRoutes.get(routeKey);

    if (!currentRoute) {
      currentEnvironment.routes.push(importedRoute);
      currentEnvironment.rootChildren.push({
        type: "route",
        uuid: importedRoute.uuid,
      });
      continue;
    }

    const currentStatusCodes = new Set(
      currentRoute.responses.map((response) => response.statusCode),
    );

    for (const importedResponse of importedRoute.responses) {
      if (!currentStatusCodes.has(importedResponse.statusCode)) {
        importedResponse.default = false;
        currentRoute.responses.push(importedResponse);
      }
    }
  }
}

async function readCurrentEnvironment() {
  try {
    const serializedEnvironment = await readFile(outputFile, "utf8");

    return {
      environment: JSON.parse(serializedEnvironment),
      serializedEnvironment,
    };
  } catch (error) {
    if (error?.code === "ENOENT") {
      return null;
    }

    throw error;
  }
}

async function fetchOpenApiDocument() {
  const response = await fetch(openApiUrl);

  if (!response.ok) {
    throw new Error(
      `OpenAPI 문서를 가져오지 못했습니다 (${response.status} ${response.statusText})`,
    );
  }

  return response.text();
}

async function synchronizeEnvironment() {
  const openApiDocument = await fetchOpenApiDocument();
  const importedEnvironment = await new OpenApiConverter().convertFromOpenAPI(
    openApiDocument,
    mockoonPort,
  );

  if (!importedEnvironment) {
    throw new Error("OpenAPI 문서를 Mockoon 환경으로 변환하지 못했습니다.");
  }

  const currentEnvironment = await readCurrentEnvironment();
  const environment =
    currentEnvironment?.environment ?? importedEnvironment;

  if (currentEnvironment) {
    mergeOpenApiRoutes(environment, importedEnvironment);
  }

  environment.lastMigration = importedEnvironment.lastMigration;
  environment.name = importedEnvironment.name;
  environment.port = mockoonPort;
  environment.hostname = "0.0.0.0";
  environment.proxyMode = true;
  environment.proxyHost = upstreamUrl;

  const serializedEnvironment = `${JSON.stringify(environment, null, 2)}\n`;

  if (currentEnvironment?.serializedEnvironment === serializedEnvironment) {
    console.log(`Mockoon 환경이 최신 상태입니다: ${outputFile}`);
    return;
  }

  await writeFile(outputFile, serializedEnvironment);

  console.log(
    `Mockoon 환경 동기화 완료: ${environment.routes.length}개 route, ${outputFile}`,
  );
}

await synchronizeEnvironment();
