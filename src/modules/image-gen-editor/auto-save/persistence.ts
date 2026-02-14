import { useFlowStore } from "@/store/flow-store";
import { eventBus } from "../event-bus";
import { serializeFlow } from "./serializer";

/** Save a single flow to the server. Marks it clean on success. */
export async function saveFlow(flowId: string): Promise<void> {
  const flow = useFlowStore.getState().flows[flowId];
  if (!flow || !flow.isDirty) return;

  try {
    const res = await fetch("/api/flows", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(serializeFlow(flow)),
    });
    if (res.ok) {
      useFlowStore.getState().markClean(flowId);
      eventBus.emit("flow:saved", { flowId });
    }
  } catch (err) {
    console.error("Auto-save failed for flow", flowId, err);
  }
}

/** Flush all dirty flows immediately via sendBeacon (fire-and-forget). */
export function flushAll(): void {
  const { flows } = useFlowStore.getState();
  for (const flow of Object.values(flows)) {
    if (!flow.isDirty) continue;
    const blob = new Blob(
      [JSON.stringify(serializeFlow(flow))],
      { type: "application/json" }
    );
    navigator.sendBeacon("/api/flows", blob);
  }
}
