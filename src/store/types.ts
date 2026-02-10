import type { Node, Edge } from "@xyflow/react";
import type { ExecutionState } from "@/lib/engine/types";

export interface FlowData {
  id: string;
  name: string;
  nodes: Node[];
  edges: Edge[];
  hoveredGroupId: string | null;
  execution: ExecutionState;
  isDirty: boolean;
  lastSavedAt: number | null;
}

export interface TabState {
  activeFlowId: string;
  flowIds: string[];
  flows: Record<string, FlowData>;
}
