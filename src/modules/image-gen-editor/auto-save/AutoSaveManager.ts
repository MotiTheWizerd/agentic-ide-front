/**
 * AutoSaveManager — browser lifecycle for the auto-save subsystem.
 *
 * Manages the beforeunload listener to flush pending saves on page close.
 * Event bus subscriptions (flow:dirty → scheduleSave) are wired centrally
 * in event-wiring.ts — this class does NOT subscribe to events itself.
 *
 * Delegates to:
 *  - scheduler.ts   — debounced save scheduling
 *  - persistence.ts — flow saving + beacon flush
 *  - serializer.ts  — flow serialization (strips runtime state)
 */

import { cancelAll } from "./scheduler";
import { flushAll } from "./persistence";

export class AutoSaveManager {
  private _initialized = false;

  /** Attach browser lifecycle listeners. Safe to call multiple times (idempotent). */
  init(): void {
    if (this._initialized) return;
    this._initialized = true;
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
