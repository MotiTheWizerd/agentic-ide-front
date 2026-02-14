import type { Snapshot } from "./types";
import { DEBOUNCE_MS, BATCH_MS } from "./types";
import type { HistoryStack } from "./history";

/** Debounce + batch scheduling for undo snapshots. */
export class SnapshotScheduler {
  private pendingTimers = new Map<string, ReturnType<typeof setTimeout>>();
  private pendingSnapshots = new Map<string, Snapshot>();
  private batchTimestamps = new Map<string, number>();

  constructor(private history: HistoryStack) {}

  /**
   * Schedule a snapshot commit with optional debouncing.
   * - debounce=true: "first snapshot wins" + timer reset (for drag/typing)
   * - debounce=false: batch window dedup + immediate commit (for discrete actions)
   */
  schedule(flowId: string, snapshot: Snapshot, debounce: boolean): void {
    if (debounce) {
      // "First snapshot wins" — capture state before the burst started
      if (!this.pendingSnapshots.has(flowId)) {
        this.pendingSnapshots.set(flowId, snapshot);
      }
      // Reset the timer
      const existing = this.pendingTimers.get(flowId);
      if (existing) clearTimeout(existing);
      this.pendingTimers.set(
        flowId,
        setTimeout(() => {
          this.pendingTimers.delete(flowId);
          const snap = this.pendingSnapshots.get(flowId);
          if (snap) {
            this.pendingSnapshots.delete(flowId);
            this.history.commit(flowId, snap);
          }
        }, DEBOUNCE_MS)
      );
    } else {
      // Batch immediate pushes within the same frame
      // (e.g. node remove + connected edge remove fire separately but are one action)
      const now = Date.now();
      const lastBatch = this.batchTimestamps.get(flowId) ?? 0;
      if (now - lastBatch < BATCH_MS) {
        // Within batch window — skip, the first push already captured the "before" state
        return;
      }

      // Flush any pending debounced snapshot first
      this.flushPending(flowId);
      this.history.commit(flowId, snapshot);
      this.batchTimestamps.set(flowId, now);
    }
  }

  /** Commit any pending debounced snapshot immediately. */
  flushPending(flowId: string): void {
    const timer = this.pendingTimers.get(flowId);
    if (timer) {
      clearTimeout(timer);
      this.pendingTimers.delete(flowId);
    }
    const pending = this.pendingSnapshots.get(flowId);
    if (pending) {
      this.pendingSnapshots.delete(flowId);
      this.history.commit(flowId, pending);
    }
  }

  /** Cancel pending timer and clear state for a flow. */
  cancelPending(flowId: string): void {
    const timer = this.pendingTimers.get(flowId);
    if (timer) clearTimeout(timer);
    this.pendingTimers.delete(flowId);
    this.pendingSnapshots.delete(flowId);
    this.batchTimestamps.delete(flowId);
  }
}
