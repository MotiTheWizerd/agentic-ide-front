import { useFlowStore } from "@/store/flow-store";
import type { FlowData } from "@/store/types";

export class FlowLoader {
  /**
   * Load all saved flows from /api/flows and hydrate the flow store.
   * If no flows exist, creates a default "Flow 1".
   * Returns true if flows were loaded successfully.
   */
  async loadFlows(): Promise<boolean> {
    const response = await fetch("/api/flows");
    const data: { flows: { id: string; name: string }[] } = await response.json();

    if (!data.flows || data.flows.length === 0) {
      useFlowStore.getState().createFlow("Flow 1");
      return false;
    }

    for (const summary of data.flows) {
      const res = await fetch(`/api/flows/${summary.id}`);
      if (!res.ok) continue;
      const flowJson = await res.json();
      const flowData: FlowData = {
        id: flowJson.id,
        name: flowJson.name,
        nodes: flowJson.nodes || [],
        edges: flowJson.edges || [],
        hoveredGroupId: null,
        execution: {
          isRunning: false,
          nodeStatus: {},
          nodeOutputs: {},
          globalError: null,
          providerId: flowJson.providerId || "mistral",
        },
        isDirty: false,
        lastSavedAt: flowJson.updatedAt || null,
      };
      useFlowStore.getState().loadFlowData(flowData);
    }
    useFlowStore.getState().switchFlow(data.flows[0].id);
    return true;
  }

  /** Create a default flow when loading fails or no flows exist. */
  createDefaultFlow(): void {
    useFlowStore.getState().createFlow("Flow 1");
  }
}
