import type { ComponentGroup } from "./component-service";

export type EditorStatus = "disabled" | "active";

export interface ProjectOption {
  value: string;
  label: string;
}

export interface EditorReactiveState {
  status: EditorStatus;
  projects: ProjectOption[];
  activeProjectId: string;
  componentGroups: ComponentGroup[];
  initialized: boolean;
  loading: boolean;
}
