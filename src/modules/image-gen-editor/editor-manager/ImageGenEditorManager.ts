/**
 * ImageGenEditorManager — slim facade for the image-gen editor module.
 *
 * Responsibilities:
 *  - Lifecycle: init/destroy orchestration — delegates to submodules
 *  - Router/Facade: external consumers go through the manager
 *
 * Submodules (owned instances, not singletons):
 *  - ProjectService  — project CRUD and selection
 *  - FlowLoader      — load persisted flows into the store
 *  - NodeIdService    — monotonic node ID counter
 *
 * React components read reactive state via `useImageGenEditorStore` (Zustand).
 * Actions go through the singleton `imageGenEditor`.
 */

import type { EditorStatus, ProjectOption } from "./types";
import { syncReactiveState } from "./store";
import { ProjectService } from "./project-service";
import { FlowLoader } from "./flow-loader";
import { NodeIdService } from "./node-id-service";
import { eventBus } from "../event-bus";
import { autoSaveManager } from "../auto-save";

class ImageGenEditorManager {
  private static instance: ImageGenEditorManager;

  // Submodules (owned instances)
  private projectService = new ProjectService();
  private flowLoader = new FlowLoader();
  private nodeIdService = new NodeIdService();

  // Lifecycle flags
  private _initialized = false;
  private _loading = false;

  private constructor() {}

  static getInstance(): ImageGenEditorManager {
    if (!ImageGenEditorManager.instance) {
      ImageGenEditorManager.instance = new ImageGenEditorManager();
    }
    return ImageGenEditorManager.instance;
  }

  // ---- Lifecycle ----

  async init(userId: string): Promise<void> {
    if (this._initialized) return;
    this._initialized = true;
    this._loading = true;
    this.pushState();

    // 1. Init auto-save
    autoSaveManager.init();

    // 2. Fetch projects
    try {
      await this.projectService.fetchProjects(userId);
      eventBus.emit("editor:status", { status: this.projectService.state.status });
    } catch {
      // Projects fetch failed — editor stays disabled
    }

    // 3. Load flows from persistence
    try {
      const loaded = await this.flowLoader.loadFlows();
      if (loaded) {
        this.nodeIdService.syncFromFlows();
      }
    } catch {
      this.flowLoader.createDefaultFlow();
    }

    this._loading = false;
    this.pushState();
  }

  destroy(): void {
    this.projectService.reset();
    this.nodeIdService.reset();
    this._initialized = false;
    this._loading = false;
    this.pushState();
  }

  // ---- Actions (delegated to submodules) ----

  selectProject(projectId: string): void {
    this.projectService.selectProject(projectId);
    eventBus.emit("editor:status", { status: this.projectService.state.status });
    this.pushState();
  }

  async createProject(name: string, userId: string): Promise<void> {
    await this.projectService.createProject(name, userId);
    eventBus.emit("editor:status", { status: "active" });
    this.pushState();
  }

  getNextNodeId(): number {
    return this.nodeIdService.getNextNodeId();
  }

  // ---- State Accessors ----

  get status(): EditorStatus { return this.projectService.state.status; }
  get projects(): ProjectOption[] { return this.projectService.state.projects; }
  get activeProjectId(): string { return this.projectService.state.activeProjectId; }
  get initialized(): boolean { return this._initialized; }
  get loading(): boolean { return this._loading; }

  // ---- Private ----

  /** Compose full state from submodules and push to Zustand store. */
  private pushState(): void {
    const ps = this.projectService.state;
    syncReactiveState({
      status: ps.status,
      projects: ps.projects,
      activeProjectId: ps.activeProjectId,
      initialized: this._initialized,
      loading: this._loading,
    });
  }
}

// ---- Exports ----

/** Singleton manager instance — use for actions, lifecycle. */
export const imageGenEditor = ImageGenEditorManager.getInstance();
