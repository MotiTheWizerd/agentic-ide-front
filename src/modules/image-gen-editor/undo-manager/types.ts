import type { Node, Edge } from "@xyflow/react";

export interface Snapshot {
  nodes: Node[];
  edges: Edge[];
}

export interface FlowHistory {
  past: Snapshot[];
  future: Snapshot[];
}

/** Maximum number of undo snapshots per flow. */
export const MAX_HISTORY = 50;

/** Debounce delay for grouping rapid changes (e.g. dragging). */
export const DEBOUNCE_MS = 500;

/** Batch window for absorbing immediate pushes within the same frame. */
export const BATCH_MS = 50;
