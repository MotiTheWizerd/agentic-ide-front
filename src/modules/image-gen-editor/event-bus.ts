import { EventBus } from "@/modules/core";
import type { NodeExecutionStatus, NodeOutput } from "./engine/types";

/**
 * Domain-specific event map for the image-gen editor.
 * The generic EventBus from core provides the pub/sub machinery.
 */
export type EventMap = {
  // Flow lifecycle
  "flow:created": { flowId: string; name: string };
  "flow:closed": { flowId: string };
  "flow:switched": { flowId: string };
  "flow:renamed": { flowId: string; name: string };
  "flow:dirty": { flowId: string };
  "flow:saved": { flowId: string };

  // Editor state
  "editor:status": { status: "disabled" | "active" };

  // Execution lifecycle (per-flow)
  "execution:started": { flowId: string };
  "execution:node-status": {
    flowId: string;
    nodeId: string;
    status: NodeExecutionStatus;
    output?: NodeOutput;
  };
  "execution:completed": { flowId: string };
  "execution:error": { flowId: string; error: string };
};

export const eventBus = new EventBus<EventMap>();
