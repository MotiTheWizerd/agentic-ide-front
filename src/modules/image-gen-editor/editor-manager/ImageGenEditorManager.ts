/**
 * ImageGenEditorManager — slim facade for the image-gen editor module.
 *
 * Responsibilities:
 *  - Lifecycle: init/destroy orchestration — delegates to submodules
 *  - Router/Facade: external consumers go through the manager
 *
 * Dependencies (injected via constructor):
 *  - AutoSaveManager   — initialized on startup
 *  - ProjectService    — project CRUD and selection
 *  - ComponentService  — fetch component registry from backend
 *  - FlowLoader        — load persisted flows into the store
 *  - NodeIdService     — monotonic node ID counter
 *
 * React components read reactive state via `useImageGenEditorStore` (Zustand).
 * Actions go through the DI-resolved manager instance.
 */

import type { EditorStatus, ProjectOption } from "./types";
import { syncReactiveState } from "./store";
import { emitEditorEvent } from "../event-bus";
import type { AutoSaveManager } from "../auto-save";
import type { ProjectService } from "./project-service";
import type { ComponentService } from "./component-service";
import type { FlowLoader } from "./flow-loader";
import type { NodeIdService } from "./node-id-service";

export class ImageGenEditorManager {
  // Lifecycle flags
  private _initialized = false;
  private _loading = false;

  constructor(
    private autoSaveManager: AutoSaveManager,
    private projectService: ProjectService,
    private componentService: ComponentService,
    private flowLoader: FlowLoader,
    private nodeIdService: NodeIdService,
  ) {}

  // ---- Lifecycle ----

  async init(userId: string): Promise<void> {
    if (this._initialized) return;
    this._initialized = true;
    this._loading = true;
    this.pushState();

    // 1. Init auto-save
    this.autoSaveManager.init();

    // 2. Fetch projects + components in parallel
    try {
      await Promise.all([
        this.projectService.fetchProjects(userId),
        this.componentService.fetchComponents(),
      ]);
      emitEditorEvent("editor:status", { status: this.projectService.state.status });
      this.pushState(); // sync activeProjectId to Zustand BEFORE loadFlows reads it
    } catch {
      // Fetch failed — editor stays disabled
    }

    // 3. Load flows from persistence (store stays empty if no flows)
    try {
      const loaded = await this.flowLoader.loadFlows();
      if (loaded) {
        this.nodeIdService.syncFromFlows();
      }
    } catch {
      // Load failed — store stays empty, user can create flows manually
    }

    this._loading = false;
    this.pushState();
  }

  destroy(): void {
    this.autoSaveManager.destroy();
    this.projectService.reset();
    this.componentService.reset();
    this.nodeIdService.reset();
    this._initialized = false;
    this._loading = false;
    this.pushState();
  }

  // ---- Actions (delegated to submodules) ----

  selectProject(projectId: string): void {
    this.projectService.selectProject(projectId);
    emitEditorEvent("editor:status", { status: this.projectService.state.status });
    this.pushState();
  }

  async createProject(name: string, userId: string): Promise<void> {
    await this.projectService.createProject(name, userId);
    emitEditorEvent("editor:status", { status: "active" });
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
      componentGroups: this.componentService.groups,
      initialized: this._initialized,
      loading: this._loading,
    });
  }
}
