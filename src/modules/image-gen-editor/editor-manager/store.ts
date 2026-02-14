import { create } from "zustand";
import type { EditorReactiveState } from "./types";

const useEditorStore = create<EditorReactiveState>(() => ({
  status: "disabled",
  projects: [],
  activeProjectId: "",
  initialized: false,
  loading: false,
}));

/** Zustand hook for React components to subscribe to editor state. */
export const useImageGenEditorStore = useEditorStore;

/** Push imperative state into the Zustand store for React reactivity. */
export function syncReactiveState(state: Partial<EditorReactiveState>): void {
  useEditorStore.setState(state);
}
