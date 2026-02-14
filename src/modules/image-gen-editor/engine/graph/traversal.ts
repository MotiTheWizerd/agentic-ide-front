import type { Node, Edge } from "@xyflow/react";

/** BFS backwards from a start node to find all upstream ancestors (inclusive). */
export function getUpstreamNodes(
  startNodeId: string,
  nodes: Node[],
  edges: Edge[]
): Set<string> {
  const nodeIds = new Set(nodes.map((n) => n.id));
  const upstream = new Set<string>([startNodeId]);
  const queue = [startNodeId];
  while (queue.length > 0) {
    const current = queue.shift()!;
    for (const edge of edges) {
      if (
        edge.target === current &&
        nodeIds.has(edge.source) &&
        !upstream.has(edge.source)
      ) {
        upstream.add(edge.source);
        queue.push(edge.source);
      }
    }
  }
  return upstream;
}

/** BFS from a start node to find all downstream nodes (inclusive). */
export function getDownstreamNodes(
  startNodeId: string,
  nodes: Node[],
  edges: Edge[]
): Set<string> {
  const nodeIds = new Set(nodes.map((n) => n.id));
  const downstream = new Set<string>([startNodeId]);
  const queue = [startNodeId];
  while (queue.length > 0) {
    const current = queue.shift()!;
    for (const edge of edges) {
      if (
        edge.source === current &&
        nodeIds.has(edge.target) &&
        !downstream.has(edge.target)
      ) {
        downstream.add(edge.target);
        queue.push(edge.target);
      }
    }
  }
  return downstream;
}
