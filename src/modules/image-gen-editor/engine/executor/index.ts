// Manager (entry point)
export { executorManager } from "./ExecutorManager";

// Backward-compatible registry object
import { executorManager } from "./ExecutorManager";
export const executorRegistry = executorManager.getAll();

// Sub-module re-exports for direct access
export { consistentCharacter, sceneBuilder } from "./data-sources";
export { initialPrompt, promptEnhancer, translator, storyTeller, grammarFix, compressor } from "./text-processing";
export { imageDescriber, imageGenerator, personasReplacer } from "./image-processing";
export { textOutput } from "./output";

// Shared utilities
export { mergeInputText, extractPersonas, injectPersonasIfPresent, LANGUAGE_NAMES, toStr } from "./utils";
