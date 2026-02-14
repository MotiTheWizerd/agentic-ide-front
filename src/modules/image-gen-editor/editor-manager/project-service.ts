import api from "@/lib/api";
import type { EditorStatus, ProjectOption } from "./types";

export interface ProjectState {
  status: EditorStatus;
  projects: ProjectOption[];
  activeProjectId: string;
}

export class ProjectService {
  private _status: EditorStatus = "disabled";
  private _projects: ProjectOption[] = [];
  private _activeProjectId = "";

  get state(): ProjectState {
    return {
      status: this._status,
      projects: this._projects,
      activeProjectId: this._activeProjectId,
    };
  }

  /** Fetch projects from the API for a given user. */
  async fetchProjects(userId: string): Promise<void> {
    const res = await api.post("/projects/select", { user_id: Number(userId) });
    const list: ProjectOption[] = (res.data ?? []).map(
      (p: { id: number; project_name: string }) => ({
        value: String(p.id),
        label: p.project_name,
      })
    );
    const activeId = list.length > 0 ? list[0].value : "";
    this._projects = list;
    this._activeProjectId = activeId;
    this._status = activeId ? "active" : "disabled";
  }

  /** Select (switch to) an existing project. */
  selectProject(projectId: string): void {
    this._status = projectId ? "active" : "disabled";
    this._activeProjectId = projectId;
  }

  /** Create a new project via the API and make it active. */
  async createProject(name: string, userId: string): Promise<void> {
    const res = await api.post("/projects", {
      project_name: name.trim(),
      user_id: Number(userId),
    });
    const created = res.data;
    const newOption: ProjectOption = {
      value: String(created.id),
      label: created.project_name,
    };
    this._projects = [...this._projects, newOption];
    this._activeProjectId = newOption.value;
    this._status = "active";
  }

  /** Reset to initial state. */
  reset(): void {
    this._status = "disabled";
    this._projects = [];
    this._activeProjectId = "";
  }
}
