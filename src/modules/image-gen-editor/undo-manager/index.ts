export { UndoManager } from "./UndoManager";
export type { Snapshot } from "./types";

// Backward-compat singleton — set by bootstrap()
let _instance: import("./UndoManager").UndoManager | null = null;

export function setUndoManagerInstance(
  instance: import("./UndoManager").UndoManager
): void {
  _instance = instance;
}

function getUndoManager(): import("./UndoManager").UndoManager {
  if (!_instance) {
    throw new Error("[undo] Not initialized. Was bootstrap() called?");
  }
  return _instance;
}

/** @deprecated Resolve from DI container instead. */
export const undoManager = new Proxy(
  {} as import("./UndoManager").UndoManager,
  {
    get(_target, prop, receiver) {
      return Reflect.get(getUndoManager(), prop, receiver);
    },
  }
);
