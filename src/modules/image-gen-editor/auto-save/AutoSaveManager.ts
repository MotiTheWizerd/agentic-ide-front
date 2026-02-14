/**
 * AutoSaveManager — facade for the auto-save subsystem.
 *
 * Delegates to:
 *  - scheduler.ts  — debounced save scheduling
 *  - persistence.ts — flow saving + beacon flush
 *  - serializer.ts  — flow serialization (strips runtime state)
 *
 * Wires up event bus subscription and beforeunload listener.
 */

import { eventBus } from "../event-bus";
import { scheduleSave, cancelAll } from "./scheduler";
import { flushAll } from "./persistence";

class AutoSaveManager {
  private static instance: AutoSaveManager;
  private _initialized = false;

  private constructor() {}

  static getInstance(): AutoSaveManager {
    if (!AutoSaveManager.instance) {
      AutoSaveManager.instance = new AutoSaveManager();
    }
    return AutoSaveManager.instance;
  }

  /** Wire up event listeners. Safe to call multiple times (idempotent). */
  init(): void {
    if (this._initialized) return;
    this._initialized = true;
    eventBus.on("flow:dirty", ({ flowId }) => scheduleSave(flowId));
    window.addEventListener("beforeunload", flushAll);
  }

  /** Cancel pending saves and tear down listeners. */
  destroy(): void {
    cancelAll();
    window.removeEventListener("beforeunload", flushAll);
    this._initialized = false;
  }

  get initialized(): boolean {
    return this._initialized;
  }
}

export const autoSaveManager = AutoSaveManager.getInstance();
