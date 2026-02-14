/**
 * image-gen-editor module — public API surface.
 *
 * External consumers should import from this barrel:
 *   import { imageGenEditor, useImageGenEditorStore } from "@/modules/image-gen-editor";
 */

// ---- Manager (entry point) ----
export { imageGenEditor, useImageGenEditorStore } from "./editor-manager";
export type { EditorStatus, ProjectOption } from "./editor-manager";

// ---- Logger ----
import { Logger } from "@/modules/core";
export const logger = new Logger("gen-editor");

// ---- Event Bus ----
export { eventBus } from "./event-bus";
export type { EventMap } from "./event-bus";

// ---- Subsystems ----
export { autoSaveManager } from "./auto-save";
export { undoManager } from "./undo-manager";
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
