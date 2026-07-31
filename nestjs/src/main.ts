import "reflect-metadata";
import { Logger } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { DocumentBuilder, OpenAPIObject, SwaggerModule } from "@nestjs/swagger";
import { AppModule } from "./app.module";
import { MockSyncState } from "./mock-sync-state";

const logger = new Logger("OpenApiMockSync");
const syncRetryIntervalMs = 500;
const maxSyncAttempts = 60;

async function syncOpenApiDocument(
  mockServerUrl: string,
  document: OpenAPIObject,
): Promise<void> {
  const response = await fetch(`${mockServerUrl}/mockserver/openapi`, {
    method: "PUT",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify({
      specUrlOrPayload: JSON.stringify(document),
    }),
  });

  if (!response.ok) {
    const responseBody = await response.text();
    throw new Error(
      `MockServer OpenAPI sync failed (${response.status}): ${responseBody}`,
    );
  }
}

async function syncOpenApiDocumentWithRetry(
  mockServerUrl: string,
  document: OpenAPIObject,
): Promise<void> {
  for (let attempt = 1; attempt <= maxSyncAttempts; attempt += 1) {
    try {
      await syncOpenApiDocument(mockServerUrl, document);
      return;
    } catch (error) {
      if (attempt === maxSyncAttempts) {
        throw error;
      }

      logger.warn(
        `MockServer is not ready; retrying OpenAPI sync (${attempt}/${maxSyncAttempts})`,
      );
      await new Promise((resolve) => setTimeout(resolve, syncRetryIntervalMs));
    }
  }
}

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  const mockSyncState = app.get(MockSyncState);
  const port = Number(process.env.PORT ?? "3000");
  const mockServerUrl =
    process.env.MOCKSERVER_URL ?? "http://localhost:1080";

  const swaggerConfig = new DocumentBuilder()
    .setTitle("NestJS Mock Source API")
    .setDescription(
      "NestJS Swagger decorators are synchronized to MockServer at startup.",
    )
    .setVersion("1.0.0")
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);

  SwaggerModule.setup("docs", app, document, {
    customSiteTitle: "NestJS Mock Source API",
  });

  app.enableShutdownHooks();
  await app.listen(port, "0.0.0.0");

  await syncOpenApiDocumentWithRetry(mockServerUrl, document);
  mockSyncState.markSynchronized();
  logger.log(`Synchronized OpenAPI document to ${mockServerUrl}`);
}

bootstrap().catch((error: unknown) => {
  logger.error("NestJS bootstrap failed", error);
  process.exitCode = 1;
});
