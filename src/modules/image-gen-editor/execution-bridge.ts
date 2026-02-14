/**
 * execution-bridge.ts — bridges WebSocket execution events to the Zustand store.
 *
 * When the user clicks Play, `sendRemoteExecution()` packages the graph and
 * sends it over WebSocket. The server runs the pipeline and streams back
 * per-node status events which this module routes to the store.
 *
 * Follows the same teardown / unsub-collection pattern as event-wiring.ts.
 */

import type { Node, Edge } from "@xyflow/react";
import type { WebSocketManager } from "@/modules/websocket";
import type { NodeOutput, NodeExecutionStatus } from "./engine/types";
import { useFlowStore, patchFlow } from "@/store/flow-store";
import { emitEditorEvent } from "./event-bus";
import { toastSuccess, toastError, toastWarning } from "@/lib/toast";
import { Logger } from "@/modules/core";

const log = new Logger("execution-bridge");

// ---- Module-level execution tracking ----
// WS events don't include flow_id, so we track it here.
// Only one execution at a time (enforced by isRunning guard in store).

let _executingFlowId: string | null = null;
let _executingRunId: string | null = null;
let _teardown: (() => void) | null = null;

// ================================================================
// Case Conversion (explicit field mapping)
// ================================================================

/** Server snake_case → frontend camelCase NodeOutput. */
export function mapOutputToCamel(raw: Record<string, unknown>): NodeOutput {
  return {
    text: raw.text as string | undefined,
    image: raw.image as string | undefined,
    personaDescription: raw.persona_description as string | undefined,
    personaName: raw.persona_name as string | undefined,
    replacePrompt: raw.replace_prompt as string | undefined,
    injectedPrompt: raw.injected_prompt as string | undefined,
    error: raw.error as string | undefined,
    durationMs: raw.duration_ms as number | undefined,
  };
}

/** Frontend camelCase → server snake_case (for cached_outputs payload). */
export function mapOutputToSnake(output: NodeOutput): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  if (output.text !== undefined) result.text = output.text;
  if (output.image !== undefined) result.image = output.image;
  if (output.personaDescription !== undefined)
    result.persona_description = output.personaDescription;
  if (output.personaName !== undefined)
    result.persona_name = output.personaName;
  if (output.replacePrompt !== undefined)
    result.replace_prompt = output.replacePrompt;
  if (output.injectedPrompt !== undefined)
    result.injected_prompt = output.injectedPrompt;
  if (output.error !== undefined) result.error = output.error;
  if (output.durationMs !== undefined) result.duration_ms = output.durationMs;
  return result;
}

// ================================================================
// Send Execution Request
// ================================================================

/**
 * Package the graph and send `execution.start` over WebSocket.
 * Sets module-level `_executingFlowId` for response routing.
 */
export function sendRemoteExecution(
  ws: WebSocketManager,
  flowId: string,
  nodes: Node[],
  edges: Edge[],
  providerId: string,
  triggerNodeId: string | null,
  cachedOutputs?: Record<string, NodeOutput>,
): void {
  if (_executingFlowId) {
    log.warn(
      `Already executing flow ${_executingFlowId} — refusing to start ${flowId}`,
    );
    return;
  }

  _executingFlowId = flowId;
  _executingRunId = null; // set by execution.started response

  // Convert cached outputs to snake_case
  let snakeCachedOutputs: Record<string, Record<string, unknown>> | null =
    null;
  if (cachedOutputs && Object.keys(cachedOutputs).length > 0) {
    snakeCachedOutputs = {};
    for (const [nodeId, output] of Object.entries(cachedOutputs)) {
      snakeCachedOutputs[nodeId] = mapOutputToSnake(output);
    }
  }

  ws.send("execution.start", {
    flow_id: flowId,
    nodes: nodes.map((n) => ({ id: n.id, type: n.type, data: n.data })),
    edges: edges.map((e) => ({
      source: e.source,
      target: e.target,
      sourceHandle: e.sourceHandle ?? null,
      targetHandle: e.targetHandle ?? null,
    })),
    provider_id: providerId,
    trigger_node_id: triggerNodeId,
    cached_outputs: snakeCachedOutputs,
  });

  log.info(`Sent execution.start for flow=${flowId} trigger=${triggerNodeId}`);
}

// ================================================================
// WS Event Wiring
// ================================================================

/** Get the currently executing flow from the store (null if closed). */
function getExecutingFlow() {
  if (!_executingFlowId) return null;
  return useFlowStore.getState().flows[_executingFlowId] ?? null;
}

/**
 * Subscribe to all execution WS events.
 * Returns a teardown function. Idempotent — calling twice tears down previous wiring.
 */
export function wireExecutionWs(ws: WebSocketManager): () => void {
  _teardown?.();
  const unsubs: (() => void)[] = [];

  // ── execution.started ──────────────────────────────────────
  unsubs.push(
    ws.on<{ run_id: string }>("execution.started", (data) => {
      if (!_executingFlowId) {
        log.warn("Received execution.started but no flow is executing");
        return;
      }
      _executingRunId = data.run_id;
      log.info(
        `Run acknowledged: run_id=${data.run_id} flow=${_executingFlowId}`,
      );
    }),
  );

  // ── execution.node.status (pending / running / skipped) ────
  unsubs.push(
    ws.on<{ node_id: string; status: string }>(
      "execution.node.status",
      (data) => {
        const flowId = _executingFlowId;
        if (!flowId) return;

        const flow = getExecutingFlow();
        if (!flow) return;

        const nodeId = data.node_id;
        const status = data.status as NodeExecutionStatus;

        useFlowStore.setState({
          flows: patchFlow(useFlowStore.getState().flows, flowId, {
            execution: {
              ...flow.execution,
              nodeStatus: { ...flow.execution.nodeStatus, [nodeId]: status },
            },
          }),
        });

        emitEditorEvent("execution:node-status", { flowId, nodeId, status });
      },
    ),
  );

  // ── execution.node.completed ───────────────────────────────
  unsubs.push(
    ws.on<{ node_id: string; output: Record<string, unknown> }>(
      "execution.node.completed",
      (data) => {
        const flowId = _executingFlowId;
        if (!flowId) return;

        const flow = getExecutingFlow();
        if (!flow) return;

        const nodeId = data.node_id;
        const output = mapOutputToCamel(data.output);

        // Push text into textOutput node data (same logic as old onStatus)
        let newNodes = flow.nodes;
        const node = flow.nodes.find((n) => n.id === nodeId);
        if (node?.type === "textOutput" && output.text) {
          newNodes = flow.nodes.map((n) =>
            n.id === nodeId
              ? { ...n, data: { ...n.data, text: output.text } }
              : n,
          );
        }

        useFlowStore.setState({
          flows: patchFlow(useFlowStore.getState().flows, flowId, {
            nodes: newNodes,
            execution: {
              ...flow.execution,
              nodeStatus: {
                ...flow.execution.nodeStatus,
                [nodeId]: "complete",
              },
              nodeOutputs: { ...flow.execution.nodeOutputs, [nodeId]: output },
            },
          }),
        });

        emitEditorEvent("execution:node-status", {
          flowId,
          nodeId,
          status: "complete" as NodeExecutionStatus,
          output,
        });
      },
    ),
  );

  // ── execution.node.failed ──────────────────────────────────
  unsubs.push(
    ws.on<{ node_id: string; error: string }>(
      "execution.node.failed",
      (data) => {
        const flowId = _executingFlowId;
        if (!flowId) return;

        const flow = getExecutingFlow();
        if (!flow) return;

        const nodeId = data.node_id;
        const output: NodeOutput = { error: data.error };

        useFlowStore.setState({
          flows: patchFlow(useFlowStore.getState().flows, flowId, {
            execution: {
              ...flow.execution,
              nodeStatus: {
                ...flow.execution.nodeStatus,
                [nodeId]: "error",
              },
              nodeOutputs: { ...flow.execution.nodeOutputs, [nodeId]: output },
            },
          }),
        });

        emitEditorEvent("execution:node-status", {
          flowId,
          nodeId,
          status: "error" as NodeExecutionStatus,
          output,
        });
      },
    ),
  );

  // ── execution.completed (all nodes done) ───────────────────
  unsubs.push(
    ws.on<{ outputs: Record<string, Record<string, unknown>> }>(
      "execution.completed",
      (data) => {
        const flowId = _executingFlowId;
        if (!flowId) return;

        const flow = getExecutingFlow();
        if (flow) {
          const finalOutputs: Record<string, NodeOutput> = {
            ...flow.execution.nodeOutputs,
          };
          const finalStatuses: Record<string, NodeExecutionStatus> = {
            ...flow.execution.nodeStatus,
          };
          let newNodes = flow.nodes;

          // Merge any final outputs (in case events arrived out of order)
          if (data.outputs) {
            for (const [nodeId, rawOutput] of Object.entries(data.outputs)) {
              const output = mapOutputToCamel(rawOutput);
              finalOutputs[nodeId] = output;
              if (
                !finalStatuses[nodeId] ||
                finalStatuses[nodeId] === "running" ||
                finalStatuses[nodeId] === "pending"
              ) {
                finalStatuses[nodeId] = output.error ? "error" : "complete";
              }

              const node = flow.nodes.find((n) => n.id === nodeId);
              if (node?.type === "textOutput" && output.text) {
                newNodes = newNodes.map((n) =>
                  n.id === nodeId
                    ? { ...n, data: { ...n.data, text: output.text } }
                    : n,
                );
              }
            }
          }

          useFlowStore.setState({
            flows: patchFlow(useFlowStore.getState().flows, flowId, {
              nodes: newNodes,
              execution: {
                ...flow.execution,
                isRunning: false,
                nodeStatus: finalStatuses,
                nodeOutputs: finalOutputs,
              },
            }),
          });
        }

        emitEditorEvent("execution:completed", { flowId });
        toastSuccess("Pipeline completed");

        _executingFlowId = null;
        _executingRunId = null;
      },
    ),
  );

  // ── execution.failed (fatal error — cycle, etc.) ───────────
  unsubs.push(
    ws.on<{ error: string }>("execution.failed", (data) => {
      const flowId = _executingFlowId;
      if (!flowId) return;

      const flow = getExecutingFlow();
      if (flow) {
        useFlowStore.setState({
          flows: patchFlow(useFlowStore.getState().flows, flowId, {
            execution: {
              ...flow.execution,
              isRunning: false,
              globalError: data.error,
            },
          }),
        });
      }

      emitEditorEvent("execution:error", { flowId, error: data.error });
      toastError("Execution failed", data.error);

      _executingFlowId = null;
      _executingRunId = null;
    }),
  );

  // ── WS disconnect during execution ─────────────────────────
  unsubs.push(
    ws.onStateChange((state) => {
      if (state === "disconnected" && _executingFlowId) {
        const flowId = _executingFlowId;
        const flow = getExecutingFlow();

        log.warn(`WS disconnected during execution of flow=${flowId}`);

        if (flow) {
          useFlowStore.setState({
            flows: patchFlow(useFlowStore.getState().flows, flowId, {
              execution: {
                ...flow.execution,
                isRunning: false,
                globalError: "Connection lost during execution",
              },
            }),
          });
        }

        emitEditorEvent("execution:error", {
          flowId,
          error: "Connection lost during execution",
        });
        toastWarning("Connection lost during pipeline execution");

        _executingFlowId = null;
        _executingRunId = null;
      }
    }),
  );

  _teardown = () => {
    unsubs.forEach((fn) => fn());
    _teardown = null;
  };

  return _teardown;
}

/** Tear down all execution WS subscriptions. */
export function teardownExecutionWs(): void {
  _teardown?.();
}

/** Read-only access to current executing flow ID. */
export function getExecutingFlowId(): string | null {
  return _executingFlowId;
}

/** Force-clear execution tracking (e.g. when a flow is closed mid-execution). */
export function clearExecutionTracking(): void {
  _executingFlowId = null;
  _executingRunId = null;
}
