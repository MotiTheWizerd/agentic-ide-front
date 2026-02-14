import api from "@/lib/api";
import { useFlowStore } from "@/store/flow-store";
import { useUserStore } from "@/store/user-store";
import { emitEditorEvent } from "../event-bus";
import { useImageGenEditorStore } from "../editor-manager/store";
import { serializeFlow } from "./serializer";

/** Save a single flow to the backend. Marks it clean on success. */
export async function saveFlow(flowId: string): Promise<void> {
  const flow = useFlowStore.getState().flows[flowId];
  if (!flow || !flow.isDirty) return;

  const userId = useUserStore.getState().user?.id;
  const projectId = useImageGenEditorStore.getState().activeProjectId;
  if (!userId || !projectId) return;

  try {
    await api.post("/flows/save-flow", {
      ...serializeFlow(flow),
      user_id: Number(userId),
      project_id: Number(projectId),
    });
    useFlowStore.getState().markClean(flowId);
    emitEditorEvent("flow:saved", { flowId });
  } catch (err) {
    console.error("Auto-save failed for flow", flowId, err);
  }
}

/** Flush all dirty flows immediately (fire-and-forget on page unload). */
export function flushAll(): void {
  const { flows } = useFlowStore.getState();
  const userId = useUserStore.getState().user?.id;
  const projectId = useImageGenEditorStore.getState().activeProjectId;
  if (!userId || !projectId) return;

  for (const flow of Object.values(flows)) {
    if (!flow.isDirty) continue;
    api.post("/flows/save-flow", {
      ...serializeFlow(flow),
      user_id: Number(userId),
      project_id: Number(projectId),
    }).catch(() => {});
  }
}
