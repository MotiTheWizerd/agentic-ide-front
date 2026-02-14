/**
 * ExecutorManager — entry point for the executor sub-module.
 *
 * Responsibilities:
 *  - Registry: stores and retrieves NodeExecutor functions by node type
 *  - Extensibility: new executors can be registered at runtime
 *  - Lookup: runner.ts resolves executors through this manager
 *
 * All built-in executors are auto-registered on construction.
 */

import type { NodeExecutor } from "../types";
import { Logger } from "@/modules/core";

// Sub-module executor imports
import { consistentCharacter, sceneBuilder } from "./data-sources";
import { initialPrompt, promptEnhancer, translator, storyTeller, grammarFix, compressor } from "./text-processing";
import { imageDescriber, imageGenerator, personasReplacer } from "./image-processing";
import { textOutput } from "./output";

const logger = new Logger("executor");

class ExecutorManager {
  private static instance: ExecutorManager;
  private registry = new Map<string, NodeExecutor>();

  private constructor() {
    this.registerBuiltins();
  }

  static getInstance(): ExecutorManager {
    if (!ExecutorManager.instance) {
      ExecutorManager.instance = new ExecutorManager();
    }
    return ExecutorManager.instance;
  }

  /** Register a node executor by type name. Overwrites if already registered. */
  register(nodeType: string, executor: NodeExecutor): this {
    this.registry.set(nodeType, executor);
    logger.info(`Registered executor: ${nodeType}`);
    return this;
  }

  /** Look up an executor by node type. Returns undefined if not found. */
  get(nodeType: string): NodeExecutor | undefined {
    return this.registry.get(nodeType);
  }

  /** Check if an executor is registered for the given node type. */
  has(nodeType: string): boolean {
    return this.registry.has(nodeType);
  }

  /** Return the full registry as a plain object (backward compat with runner.ts). */
  getAll(): Record<string, NodeExecutor> {
    return Object.fromEntries(this.registry);
  }

  /** List all registered node types. */
  get nodeTypes(): string[] {
    return [...this.registry.keys()];
  }

  // ---- Private ----

  private registerBuiltins(): void {
    // Data sources (no API call)
    this.registry.set("consistentCharacter", consistentCharacter);
    this.registry.set("sceneBuilder", sceneBuilder);

    // Text processing (AI API calls)
    this.registry.set("initialPrompt", initialPrompt);
    this.registry.set("promptEnhancer", promptEnhancer);
    this.registry.set("translator", translator);
    this.registry.set("storyTeller", storyTeller);
    this.registry.set("grammarFix", grammarFix);
    this.registry.set("compressor", compressor);

    // Image processing (vision / generation API calls)
    this.registry.set("imageDescriber", imageDescriber);
    this.registry.set("imageGenerator", imageGenerator);
    this.registry.set("personasReplacer", personasReplacer);

    // Output (terminal sink)
    this.registry.set("textOutput", textOutput);
  }
}

/** Singleton executor manager instance. */
export const executorManager = ExecutorManager.getInstance();
