import { DEBOUNCE_MS } from "./types";
import { saveFlow } from "./persistence";

const pendingTimers = new Map<string, ReturnType<typeof setTimeout>>();

/** Schedule a debounced save for a flow. Resets the timer on repeated calls. */
export function scheduleSave(flowId: string): void {
  const existing = pendingTimers.get(flowId);
  if (existing) clearTimeout(existing);

  pendingTimers.set(
    flowId,
    setTimeout(() => {
      pendingTimers.delete(flowId);
      saveFlow(flowId);
    }, DEBOUNCE_MS)
  );
}

/** Cancel all pending debounced saves. */
export function cancelAll(): void {
  for (const timer of pendingTimers.values()) clearTimeout(timer);
  pendingTimers.clear();
}
