/** Auto-save configuration constants. */
export const DEBOUNCE_MS = 2000;

/** Shape of a flow as needed by the serializer (minimal contract). */
export interface SerializableFlow {
  id: string;
  name: string;
  nodes: unknown[];
  edges: unknown[];
  execution: { providerId: string };
  lastSavedAt: number | null;
  isDirty: boolean;
}
