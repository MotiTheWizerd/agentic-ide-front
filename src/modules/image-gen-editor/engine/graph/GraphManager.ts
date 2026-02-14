/**
 * GraphManager — entry point for the graph analysis sub-module.
 *
 * Responsibilities:
 *  - Facade: single access point for topological sorting, edge classification, and traversal
 *  - Delegates to specialized sub-modules for each responsibility
 *
 * Consumers can use the singleton `graphManager` or import standalone functions directly.
 */

import type { Node, Edge } from "@xyflow/react";
import type { ExecutionStep } from "../types";
import { buildExecutionPlan } from "./topological-sort";
import { getTextInputNodeIds, getAdapterInputNodeIds } from "./edge-classification";
import { getUpstreamNodes, getDownstreamNodes } from "./traversal";

class GraphManager {
  private static instance: GraphManager;

  private constructor() {}

  static getInstance(): GraphManager {
    if (!GraphManager.instance) {
      GraphManager.instance = new GraphManager();
    }
    return GraphManager.instance;
  }

  // ---- Topological Sort ----

  /** Build a topologically sorted execution plan. Throws on cycles. */
  buildPlan(nodes: Node[], edges: Edge[]): ExecutionStep[] {
    return buildExecutionPlan(nodes, edges);
  }

  // ---- Edge Classification ----

  /** Get IDs of nodes that feed text into a target node (non-adapter edges). */
  getTextInputs(nodeId: string, edges: Edge[]): string[] {
    return getTextInputNodeIds(nodeId, edges);
  }

  /** Get IDs of adapter nodes attached to a target node (adapter-* handles). */
  getAdapterInputs(nodeId: string, edges: Edge[]): string[] {
    return getAdapterInputNodeIds(nodeId, edges);
  }

  // ---- Graph Traversal ----

  /** BFS backward — find all upstream ancestors (inclusive). */
  getUpstream(nodeId: string, nodes: Node[], edges: Edge[]): Set<string> {
    return getUpstreamNodes(nodeId, nodes, edges);
  }

  /** BFS forward — find all downstream descendants (inclusive). */
  getDownstream(nodeId: string, nodes: Node[], edges: Edge[]): Set<string> {
    return getDownstreamNodes(nodeId, nodes, edges);
  }
}

/** Singleton graph manager instance. */
export const graphManager = GraphManager.getInstance();
