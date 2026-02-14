// Manager class (for DI registration)
export { GraphManager } from "./GraphManager";

// Standalone functions (used directly by flow-store and runner)
export { buildExecutionPlan } from "./topological-sort";
export { getTextInputNodeIds, getAdapterInputNodeIds } from "./edge-classification";
export { getUpstreamNodes, getDownstreamNodes } from "./traversal";
