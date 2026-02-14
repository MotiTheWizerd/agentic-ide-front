import type { SerializableFlow } from "./types";

/** Serialize a flow for persistence (strips runtime state). */
export function serializeFlow(flow: SerializableFlow) {
  return {
    id: flow.id,
    name: flow.name,
    nodes: flow.nodes,
    edges: flow.edges,
    providerId: flow.execution.providerId,
    updatedAt: Date.now(),
    createdAt: flow.lastSavedAt || Date.now(),
  };
}
