import { EventBus } from "@/modules/core";
import { useUserStore } from "@/store/user-store";
import type { NodeExecutionStatus, NodeOutput } from "./engine/types";

/**
 * Domain-specific event map for the image-gen editor.
 * The generic EventBus from core provides the pub/sub machinery.
 *
 * Every event carries a `userId` via BasePayload.
 * Use `emitEditorEvent()` to emit — it auto-injects userId from the user store.
 */

/** Common fields injected into every event payload. */
type BasePayload = { userId: string };

export type EventMap = {
  // Flow lifecycle
  "flow:created": BasePayload & { flowId: string; name: string };
  "flow:closed": BasePayload & { flowId: string };
  "flow:switched": BasePayload & { flowId: string };
  "flow:renamed": BasePayload & { flowId: string; name: string };
  "flow:dirty": BasePayload & { flowId: string };
  "flow:saved": BasePayload & { flowId: string };

  // Editor state
  "editor:status": BasePayload & { status: "disabled" | "active" };

  // Execution lifecycle (per-flow)
  "execution:started": BasePayload & { flowId: string };
  "execution:node-status": BasePayload & {
    flowId: string;
    nodeId: string;
    status: NodeExecutionStatus;
    output?: NodeOutput;
  };
  "execution:completed": BasePayload & { flowId: string };
  "execution:error": BasePayload & { flowId: string; error: string };
};

/**
 * Emit helper — auto-injects userId from the user store.
 * Use this instead of calling eventBus.emit() directly.
 */
export function emitEditorEvent<K extends keyof EventMap>(
  event: K,
  payload: Omit<EventMap[K], keyof BasePayload>,
): void {
  const userId = useUserStore.getState().user?.id ?? "anonymous";
  getEventBus().emit(event, { ...payload, userId } as EventMap[K]);
}

/** Typed alias for convenience. */
export type EditorEventBus = EventBus<EventMap>;

/**
 * Backward-compat singleton — set by bootstrap(), used by non-React consumers
 * (Zustand stores, plain modules) that can't use hooks.
 */
let _eventBus: EditorEventBus | null = null;

/** Called once by bootstrap() to wire the singleton reference. */
export function setEventBusInstance(instance: EditorEventBus): void {
  _eventBus = instance;
}

/** Imperative access for non-React consumers (stores, services). */
export function getEventBus(): EditorEventBus {
  if (!_eventBus) {
    throw new Error(
      "[event-bus] EventBus not initialized. Was bootstrap() called?"
    );
  }
  return _eventBus;
}

/**
 * Legacy default export — a proxy that delegates to the DI-managed instance.
 * Existing `import { eventBus }` statements keep working with zero changes.
 * Will be removed once all consumers migrate to getEventBus() or useService().
 */
export const eventBus = new Proxy({} as EditorEventBus, {
  get(_target, prop, receiver) {
    return Reflect.get(getEventBus(), prop, receiver);
  },
});
