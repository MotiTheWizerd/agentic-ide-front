/**
 * event-wiring.ts — single source of truth for all event subscriptions.
 *
 * Read this file to see every event handler in the image-gen editor module.
 * All bus subscriptions are declared here; individual services never call
 * eventBus.on() themselves.
 *
 * Called once by bootstrap() after all services are resolved.
 */

import type { EditorEventBus } from "./event-bus";
import { scheduleSave } from "./auto-save/scheduler";

let _teardown: (() => void) | null = null;

/**
 * Wire all event subscriptions for the editor module.
 * Idempotent — calling twice tears down previous wiring first.
 */
export function wireEditorEvents(eventBus: EditorEventBus): void {
  // Tear down previous wiring if called again (e.g. HMR)
  _teardown?.();

  const unsubs: (() => void)[] = [];

  // ── Auto-Save ──────────────────────────────────────────────
  // Any store mutation marks the flow dirty → debounced save to backend
  unsubs.push(
    eventBus.on("flow:dirty", ({ flowId }) => scheduleSave(flowId)),
  );

  _teardown = () => {
    unsubs.forEach((fn) => fn());
    _teardown = null;
  };
}

/** Tear down all event subscriptions. Called on app destroy. */
export function teardownEditorEvents(): void {
  _teardown?.();
}
