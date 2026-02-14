import { useFlowStore } from "@/store/flow-store";

export class NodeIdService {
  private _nodeId = 100;

  /** Return the next available node ID and increment the counter. */
  getNextNodeId(): number {
    return this._nodeId++;
  }

  /**
   * Scan all loaded flows and set the counter to max(existing IDs) + 1.
   * Ensures new nodes never collide with persisted ones.
   */
  syncFromFlows(): void {
    const allFlows = useFlowStore.getState().flows;
    let maxId = this._nodeId;
    for (const flow of Object.values(allFlows)) {
      for (const node of flow.nodes) {
        const match = node.id.match(/-(\d+)$/);
        if (match) maxId = Math.max(maxId, Number(match[1]) + 1);
      }
    }
    this._nodeId = maxId;
  }

  /** Reset counter to initial value. */
  reset(): void {
    this._nodeId = 100;
  }
}
