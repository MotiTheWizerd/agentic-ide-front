import { eventBus } from "./event-bus";
import { useFlowStore } from "@/store/flow-store";

const DEBOUNCE_MS = 2000;
const pendingTimers = new Map<string, ReturnType<typeof setTimeout>>();

let initialized = false;

function scheduleSave(flowId: string) {
  const existing = pendingTimers.get(flowId);
  if (existing) clearTimeout(existing);

  pendingTimers.set(
    flowId,
    setTimeout(async () => {
      pendingTimers.delete(flowId);
      const flow = useFlowStore.getState().flows[flowId];
      if (!flow || !flow.isDirty) return;

      const serialized = {
        id: flow.id,
        name: flow.name,
        nodes: flow.nodes,
        edges: flow.edges,
        providerId: flow.execution.providerId,
        updatedAt: Date.now(),
        createdAt: flow.lastSavedAt || Date.now(),
      };

      try {
        const res = await fetch("/api/flows", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(serialized),
        });
        if (res.ok) {
          useFlowStore.getState().markClean(flowId);
          eventBus.emit("flow:saved", { flowId });
        }
      } catch (err) {
        console.error("Auto-save failed for flow", flowId, err);
      }
    }, DEBOUNCE_MS)
  );
}

export function initAutoSave() {
  if (initialized) return;
  initialized = true;
  eventBus.on("flow:dirty", ({ flowId }) => scheduleSave(flowId));
}
