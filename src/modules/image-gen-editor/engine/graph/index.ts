// Manager (entry point)
export { graphManager } from "./GraphManager";

// Standalone functions (backward compat)
export { buildExecutionPlan } from "./topological-sort";
export { getTextInputNodeIds, getAdapterInputNodeIds } from "./edge-classification";
export { getUpstreamNodes, getDownstreamNodes } from "./traversal";
