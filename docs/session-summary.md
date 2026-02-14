# Session Summary — 2026-02-14 (Session 11)

## Theme: Adapter Handle UX + Character Lock-Follow + Ghost Auto-Connect

Improved adapter handle management (double-click removal, edge-delete cleanup, ghost auto-connect), added lock-follow behavior on ConsistentCharacter nodes, and removed the MiniMap.

---

## 1. Adapter Handle Double-Click Removal

Red adapter handles on the top of nodes can now be removed by double-clicking them.

### Store action: `removeAdapter(nodeId, adapterIndex)`

- Finds the edge targeting `adapter-{index}` on the node and removes it
- Re-indexes all higher adapter edges (e.g. `adapter-3` → `adapter-2`)
- Decrements `adapterCount` in node data

### BaseNode changes

- New prop: `onAdapterRemove?: (adapterIndex: number) => void`
- Adapter handles gain `onDoubleClick` handler and `hover:!bg-red-400` highlight when removal is enabled
- Wired in all 4 adapter-supporting nodes: InitialPromptNode, PromptEnhancerNode, StoryTellerNode, PersonasReplacerNode

---

## 2. Adapter Edge Selection + Backspace Cleanup

When a user selects an adapter edge and presses Backspace/Delete, the adapter handle is also cleaned up (not just the edge).

### Enhanced `onEdgesChange` in flow-store

- Detects adapter edge removals (edges with `targetHandle` matching `adapter-*`)
- Groups removals by target node, sorts indices descending to avoid re-index conflicts
- Re-indexes remaining higher adapters and decrements `adapterCount`
- Works for both direct edge deletion and double-click edge removal

---

## 3. MiniMap Removed

Removed the `<MiniMap>` component and its import from `page.tsx`. Only `<Controls>` remain.

---

## 4. ConsistentCharacter Lock-Follow

A lock/unlock icon appears on ConsistentCharacter nodes when they are connected to a downstream node.

### Lock toggle
- Positioned top-right outside the node container (`absolute -top-3 -right-3`)
- Only visible when the node has an outgoing `adapter-out` edge (`isConnected` selector)
- Stores `data.adapterLocked` boolean in node data

### Drag-follow behavior (page.tsx)
- `onNodeDragStart`: captures all locked character nodes connected to the dragged node + their starting positions
- `onNodeDrag`: applies position delta to all companion nodes
- `onNodeDragStop`: clears companion refs
- Uses `dragStartRef` and `dragCompanionsRef` refs

---

## 5. Ghost Adapter Auto-Connect

Dragging a connector from a character node and dropping it on the ghost "+" button automatically creates a new adapter handle and connects them.

### Store action: `connectToGhostAdapter(sourceNodeId, sourceHandle, targetNodeId)`
- Atomically increments `adapterCount` and creates the edge in a single store update

### page.tsx wiring
- `onConnectStart`: captures source node ID and handle in a ref
- `onConnectEnd`: uses `document.elementFromPoint()` to detect drops on elements with `[data-ghost-adapter]` attribute
- Walks up the DOM to find the closest React Flow node wrapper, extracts the node ID
- Calls `connectToGhostAdapter` if a valid ghost target is found

### BaseNode change
- Added `data-ghost-adapter` HTML attribute to the ghost "+" button for DOM detection

---

## Files Modified This Session

```
src/store/flow-store.ts                              # Added removeAdapter, connectToGhostAdapter, enhanced onEdgesChange
src/components/nodes/BaseNode.tsx                     # Added onAdapterRemove prop, data-ghost-adapter attr, double-click on handles
src/components/nodes/InitialPromptNode.tsx            # Wired removeAdapter
src/components/nodes/PromptEnhancerNode.tsx           # Wired removeAdapter
src/components/nodes/StoryTellerNode.tsx              # Wired removeAdapter
src/components/nodes/PersonasReplacerNode.tsx         # Wired removeAdapter
src/components/nodes/ConsistentCharacterNode.tsx      # Added lock toggle (position, visibility, adapterLocked state)
src/app/image-genai/page.tsx                          # Removed MiniMap, added drag-follow refs/callbacks, added onConnectStart/End
docs/QUICKSTART.md                                    # Updated adapter docs, keyboard shortcuts, UI features
docs/session-summary.md                               # This file
```

---

## Pending / Next Session

- Rewire `flow-loader.ts` to load flows from FastAPI backend (still hits dead `/api/flows`)
- Build backend `GET /api/v1/flows` endpoint for listing/loading flows
- Wire `flow:closed` handler in event-wiring.ts (cancel pending saves + clear undo history)
- Add `cancelSave(flowId)` to auto-save scheduler
- Rewire `characters.ts` to FastAPI backend
- Loading component fields/ports/api-config for full node configuration from backend
