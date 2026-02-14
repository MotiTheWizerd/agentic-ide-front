export { ImageGenEditorManager } from "./ImageGenEditorManager";
export { ProjectService } from "./project-service";
export { ComponentService } from "./component-service";
export type { ComponentItem, ComponentGroup } from "./component-service";
export { FlowLoader } from "./flow-loader";
export { NodeIdService } from "./node-id-service";
export { useImageGenEditorStore } from "./store";
export type { EditorStatus, ProjectOption } from "./types";

// Backward-compat singleton — set by bootstrap()
let _instance: import("./ImageGenEditorManager").ImageGenEditorManager | null = null;

export function setEditorManagerInstance(
  instance: import("./ImageGenEditorManager").ImageGenEditorManager
): void {
  _instance = instance;
}

function getEditorManager(): import("./ImageGenEditorManager").ImageGenEditorManager {
  if (!_instance) {
    throw new Error("[editor-manager] Not initialized. Was bootstrap() called?");
  }
  return _instance;
}

/** @deprecated Resolve from DI container instead. */
export const imageGenEditor = new Proxy(
  {} as import("./ImageGenEditorManager").ImageGenEditorManager,
  {
    get(_target, prop, receiver) {
      return Reflect.get(getEditorManager(), prop, receiver);
    },
  }
);
