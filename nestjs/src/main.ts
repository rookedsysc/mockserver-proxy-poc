import "reflect-metadata";
import { Logger } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { AppModule } from "./app.module";

const logger = new Logger("Bootstrap");

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  const port = Number(process.env.PORT ?? "3000");

  const swaggerConfig = new DocumentBuilder()
    .setTitle("NestJS Mock Source API")
    .setDescription(
      "Mockoon mock routes are generated from NestJS Swagger decorators.",
    )
    .setVersion("1.0.0")
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);

  SwaggerModule.setup("docs", app, document, {
    customSiteTitle: "NestJS Mock Source API",
  });

  app.enableShutdownHooks();
  await app.listen(port, "0.0.0.0");
}

bootstrap().catch((error: unknown) => {
  logger.error("NestJS bootstrap failed", error);
  process.exitCode = 1;
});
