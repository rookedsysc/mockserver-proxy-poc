import { Module } from "@nestjs/common";
import { AppController } from "./app.controller";
import { MockSyncState } from "./mock-sync-state";

@Module({
  controllers: [AppController],
  providers: [MockSyncState],
})
export class AppModule {}
