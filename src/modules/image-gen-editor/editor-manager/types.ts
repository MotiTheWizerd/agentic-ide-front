export type EditorStatus = "disabled" | "active";

export interface ProjectOption {
  value: string;
  label: string;
}

export interface EditorReactiveState {
  status: EditorStatus;
  projects: ProjectOption[];
  activeProjectId: string;
  initialized: boolean;
  loading: boolean;
}
