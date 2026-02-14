/**
 * image-gen-editor module — public API surface.
 *
 * External consumers should import from this barrel:
 *   import { imageGenEditor, useImageGenEditorStore } from "@/modules/image-gen-editor";
 */

// ---- Manager (entry point) ----
export { ImageGenEditorManager, imageGenEditor, useImageGenEditorStore, setEditorManagerInstance } from "./editor-manager";
export { ProjectService, ComponentService, FlowLoader, NodeIdService } from "./editor-manager";
export type { EditorStatus, ProjectOption, ComponentItem, ComponentGroup } from "./editor-manager";

// ---- Logger ----
import { Logger } from "@/modules/core";
export const logger = new Logger("gen-editor");

// ---- Event Bus ----
export { eventBus, getEventBus, setEventBusInstance, emitEditorEvent } from "./event-bus";
export type { EventMap, EditorEventBus } from "./event-bus";

// ---- Event Wiring (single source of truth for subscriptions) ----
export { wireEditorEvents, teardownEditorEvents } from "./event-wiring";

// ---- Execution Bridge (WS-based remote execution) ----
export {
  sendRemoteExecution,
  wireExecutionWs,
  teardownExecutionWs,
  getExecutingFlowId,
  clearExecutionTracking,
  mapOutputToCamel,
  mapOutputToSnake,
} from "./execution-bridge";

// ---- Subsystems ----
export { AutoSaveManager } from "./auto-save";
export { UndoManager, undoManager, setUndoManagerInstance } from "./undo-manager";
export type { Snapshot } from "./undo-manager";

// ---- Model & Scene ----
export { resolveModelForNode, NODE_MODEL_DEFAULTS } from "./model-defaults";
export type { ModelAssignment } from "./model-defaults";
export { SCENE_OPTIONS, composeScenePrompt } from "./scene-prompts";
export type { SceneCategory } from "./scene-prompts";

// ---- Media ----
export { prepareImageForAPI } from "./image-utils";

// ---- Characters ----
export { getCharacters, saveCharacter, deleteCharacter } from "./characters";
export type { Character } from "./characters";

// ---- Execution Engine ----
export { executeGraph } from "./engine";
export { GraphManager, ExecutorManager, setExecutorManagerInstance } from "./engine";
export { buildExecutionPlan, getTextInputNodeIds, getAdapterInputNodeIds } from "./engine";
export { executorRegistry } from "./engine";
export type {
  NodeExecutionStatus,
  NodeOutput,
  PersonaInput,
  NodeExecutionContext,
  NodeExecutionResult,
  NodeExecutor,
  ExecutorRegistry,
  ExecutionStep,
  ExecutionState,
  StatusCallback,
} from "./engine";
