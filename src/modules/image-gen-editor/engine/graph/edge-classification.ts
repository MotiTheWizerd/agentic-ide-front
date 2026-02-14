import type { Edge } from "@xyflow/react";

/** Get the IDs of nodes that feed TEXT into the given node (non-adapter edges). */
export function getTextInputNodeIds(nodeId: string, edges: Edge[]): string[] {
  return edges
    .filter(
      (e) =>
        e.target === nodeId &&
        !(e.targetHandle || "").startsWith("adapter-")
    )
    .map((e) => e.source);
}

/** Get the IDs of ADAPTER nodes that attach to the given node (adapter-* target handles). */
export function getAdapterInputNodeIds(
  nodeId: string,
  edges: Edge[]
): string[] {
  return edges
    .filter(
      (e) =>
        e.target === nodeId &&
        (e.targetHandle || "").startsWith("adapter-")
    )
    .map((e) => e.source);
}
