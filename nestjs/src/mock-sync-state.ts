import { Injectable } from "@nestjs/common";

@Injectable()
export class MockSyncState {
  private synchronized = false;

  markSynchronized(): void {
    this.synchronized = true;
  }

  isSynchronized(): boolean {
    return this.synchronized;
  }
}
