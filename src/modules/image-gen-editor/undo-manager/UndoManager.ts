/**
 * UndoManager — facade for the undo/redo subsystem.
 *
 * Delegates to:
 *  - HistoryStack     — pure per-flow past/future stacks
 *  - SnapshotScheduler — debounce + batch window logic
 */

import type { Snapshot } from "./types";
import { HistoryStack } from "./history";
import { SnapshotScheduler } from "./scheduler";

class UndoManager {
  private history = new HistoryStack();
  private scheduler = new SnapshotScheduler(this.history);

  pushSnapshot(flowId: string, beforeSnapshot: Snapshot, debounce = false): void {
    this.scheduler.schedule(flowId, beforeSnapshot, debounce);
  }

  flushPending(flowId: string): void {
    this.scheduler.flushPending(flowId);
  }

  undo(flowId: string, currentSnapshot: Snapshot): Snapshot | null {
    this.scheduler.flushPending(flowId);
    return this.history.undo(flowId, currentSnapshot);
  }

  redo(flowId: string, currentSnapshot: Snapshot): Snapshot | null {
    return this.history.redo(flowId, currentSnapshot);
  }

  canUndo(flowId: string): boolean {
    return this.history.canUndo(flowId);
  }

  canRedo(flowId: string): boolean {
    return this.history.canRedo(flowId);
  }

  seedInitial(flowId: string, snapshot: Snapshot): void {
    this.history.seedInitial(flowId, snapshot);
  }

  clear(flowId: string): void {
    this.scheduler.cancelPending(flowId);
    this.history.clear(flowId);
  }
}

export const undoManager = new UndoManager();
