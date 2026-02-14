import type { Snapshot, FlowHistory } from "./types";
import { MAX_HISTORY } from "./types";

/** Pure per-flow history stack — no timers, no scheduling. */
export class HistoryStack {
  private stacks = new Map<string, FlowHistory>();

  getOrCreate(flowId: string): FlowHistory {
    let h = this.stacks.get(flowId);
    if (!h) {
      h = { past: [], future: [] };
      this.stacks.set(flowId, h);
    }
    return h;
  }

  /** Push a snapshot to past, trim to MAX_HISTORY, clear future. */
  commit(flowId: string, snapshot: Snapshot): void {
    const h = this.getOrCreate(flowId);
    h.past.push(snapshot);
    if (h.past.length > MAX_HISTORY) h.past.shift();
    h.future = [];
  }

  undo(flowId: string, currentSnapshot: Snapshot): Snapshot | null {
    const h = this.stacks.get(flowId);
    if (!h || h.past.length === 0) return null;
    const restored = h.past.pop()!;
    h.future.push(currentSnapshot);
    return restored;
  }

  redo(flowId: string, currentSnapshot: Snapshot): Snapshot | null {
    const h = this.stacks.get(flowId);
    if (!h || h.future.length === 0) return null;
    const restored = h.future.pop()!;
    h.past.push(currentSnapshot);
    return restored;
  }

  canUndo(flowId: string): boolean {
    const h = this.stacks.get(flowId);
    return !!h && h.past.length > 0;
  }

  canRedo(flowId: string): boolean {
    const h = this.stacks.get(flowId);
    return !!h && h.future.length > 0;
  }

  /** Set initial snapshot for a flow (only if history is empty). */
  seedInitial(flowId: string, snapshot: Snapshot): void {
    const h = this.getOrCreate(flowId);
    if (h.past.length === 0) {
      h.past.push(snapshot);
    }
  }

  /** Remove all history for a flow. */
  clear(flowId: string): void {
    this.stacks.delete(flowId);
  }
}
