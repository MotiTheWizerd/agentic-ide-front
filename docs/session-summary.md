# Session Summary — 2026-02-14 (Session 13)

## Theme: Fix WS "not connected" after login (Session 12 blocker)

Resolved the top-priority bug from Session 12: the toast "Cannot execute: not connected to server" appearing even after successful login and WebSocket connection.

---

## Root Cause

**React 18 Strict Mode double-invokes `useMemo` factories in development.**

Next.js 13+ enables `reactStrictMode: true` by default. This causes `useMemo(() => bootstrap(), [])` in `AppProviders` to call `bootstrap()` **twice**:

1. **First call** → Container A created → WS Manager A resolved → `setWebSocketManagerInstance(wsManagerA)` set as module singleton
2. **Second call** → Container B created → WS Manager B resolved → `setWebSocketManagerInstance(wsManagerB)` **overwrites the singleton**

React keeps Container A (from the first call) as the memoized value. So:
- `AppProviders.useEffect` resolves **Manager A** from Container A → connects it → pings work
- `getWebSocketManager()` returns **Manager B** (the overwritten singleton) → never connected → `state = "disconnected"`

This affected ALL backward-compat singletons: `eventBus`, `undoManager`, `executorManager`, `editorManager`, `wsManager`.

### Diagnostic Evidence

Added temporary `console.log` statements to trace the issue:
- `[runFromNode] WS state: disconnected` — store sees disconnected manager (Manager B)
- `[websocket] → ping {}` — pings going through on a different instance (Manager A)
- No `[AppProviders.sync]` log near the error — sync ran on Manager A, not B

---

## Fix

**File:** `src/modules/bootstrap.ts`

Added a module-level idempotency guard:

```typescript
let _container: Container | null = null;

export function bootstrap(): Container {
  if (_container) {
    log.info("bootstrap() already called — returning existing container");
    return _container;
  }

  const container = new Container();
  // ... all registrations + wiring (unchanged) ...

  _container = container;
  return container;
}
```

This ensures the second Strict Mode invocation returns the **same** container — no new instances, no overwritten singletons, no duplicate event wiring.

---

## Files Modified This Session

```
src/modules/bootstrap.ts                           # Added _container idempotency guard
docs/QUICKSTART.md                                 # Documented idempotency guard in DI section
docs/session-summary.md                            # This file
```

---

## Pending / Next Session

- Clean up dead code: `runner.ts`, executors, `ExecutorManager`, `buildExecutionPlan`, `resolveModelForNode`
- Wire `flow:closed` handler in event-wiring.ts (cancel pending saves + clear undo history)
- Add `cancelSave(flowId)` to auto-save scheduler
- Rewire `characters.ts` to FastAPI backend
- Loading component fields/ports/api-config for full node configuration from backend
- Incremental migration of consumers from proxy imports to `useService()` hook
- AI provider strategy (evaluating fal.ai, Fireworks, Together AI)
