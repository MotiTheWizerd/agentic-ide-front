// Manager class (for DI registration)
export { ExecutorManager } from "./ExecutorManager";

// Backward-compat singleton — set by bootstrap()
let _instance: import("./ExecutorManager").ExecutorManager | null = null;

export function setExecutorManagerInstance(
  instance: import("./ExecutorManager").ExecutorManager
): void {
  _instance = instance;
}

function getExecutorManager(): import("./ExecutorManager").ExecutorManager {
  if (!_instance) {
    throw new Error("[executor] Not initialized. Was bootstrap() called?");
  }
  return _instance;
}

/** @deprecated Resolve from DI container instead. */
export const executorManager = new Proxy(
  {} as import("./ExecutorManager").ExecutorManager,
  {
    get(_target, prop, receiver) {
      return Reflect.get(getExecutorManager(), prop, receiver);
    },
  }
);

/** @deprecated Resolve executorManager from DI container instead. */
export const executorRegistry = new Proxy(
  {} as Record<string, import("../types").NodeExecutor>,
  {
    get(_target, prop) {
      return getExecutorManager().getAll()[prop as string];
    },
    ownKeys() {
      return Object.keys(getExecutorManager().getAll());
    },
    getOwnPropertyDescriptor(_target, prop) {
      const all = getExecutorManager().getAll();
      if (prop in all) {
        return { configurable: true, enumerable: true, value: all[prop as string] };
      }
      return undefined;
    },
  }
);

// Sub-module re-exports for direct access
export { consistentCharacter, sceneBuilder } from "./data-sources";
export { initialPrompt, promptEnhancer, translator, storyTeller, grammarFix, compressor } from "./text-processing";
export { imageDescriber, imageGenerator, personasReplacer } from "./image-processing";
export { textOutput } from "./output";

// Shared utilities
export { mergeInputText, extractPersonas, injectPersonasIfPresent, LANGUAGE_NAMES, toStr } from "./utils";
