import { Handle, Position, type NodeProps } from "@xyflow/react";
import { Lock, Unlock } from "lucide-react";
import { useFlowStore } from "@/store/flow-store";
import type { NodeExecutionStatus } from "@/modules/image-gen-editor";

const statusRing: Record<NodeExecutionStatus, string> = {
  idle: "ring-amber-500/30",
  pending: "ring-gray-400/40 animate-pulse",
  running: "ring-blue-500/60 animate-pulse",
  complete: "ring-emerald-500/60",
  error: "ring-red-500/60",
  skipped: "ring-gray-500/20 opacity-60",
};

export function ConsistentCharacterNode({ id, data }: NodeProps) {
  const updateNodeData = useFlowStore((s) => s.updateNodeData);
  const status = useFlowStore((s) => s.flows[s.activeFlowId]?.execution.nodeStatus[id] || "idle");
  const errorMessage = useFlowStore((s) => s.flows[s.activeFlowId]?.execution.nodeOutputs[id]?.error);
  const isConnected = useFlowStore((s) => {
    const flow = s.flows[s.activeFlowId];
    return flow?.edges.some((e) => e.source === id && e.sourceHandle === "adapter-out") ?? false;
  });

  const name = (data.characterName as string) || "Unknown";
  const imagePath = (data.characterImagePath as string) || "";
  const locked = !!data.adapterLocked;

  return (
    <div className="relative">
      {/* Lock toggle — top-right outside container, only when connected */}
      {isConnected && (
        <button
          onClick={(e) => { e.stopPropagation(); updateNodeData(id, { adapterLocked: !locked }); }}
          onMouseDown={(e) => e.stopPropagation()}
          className={`nodrag absolute -top-3 -right-3 p-0.5 rounded transition-colors cursor-pointer z-10 ${
            locked
              ? "text-amber-400 hover:text-amber-300"
              : "text-gray-600 hover:text-gray-400"
          }`}
          title={locked ? "Unlock — stop following target" : "Lock — follow target when dragged"}
        >
          {locked ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
        </button>
      )}

      <div
        className={`flex flex-col items-center gap-1 w-16 ring-1 rounded-xl p-1.5 bg-gray-900 border border-gray-700 shadow-lg shadow-black/30 ${statusRing[status]}`}
        title={status === "error" && errorMessage ? errorMessage : undefined}
      >
        {/* Avatar */}
        <div className="w-11 h-11 rounded-full overflow-hidden border-2 border-amber-500/40 bg-gray-800">
          {imagePath ? (
            <img
              src={imagePath}
              alt={name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-amber-400 text-xs font-bold">
              {name[0]}
            </div>
          )}
        </div>

        {/* Name */}
        <span className="text-[9px] text-gray-400 font-medium text-center leading-tight truncate w-full">
          {name}
        </span>

        {/* Adapter output handle (bottom) */}
        <Handle
          type="source"
          position={Position.Bottom}
          id="adapter-out"
          className="!w-3 !h-3 !bg-green-500 !border-2 !border-gray-900"
        />
      </div>
    </div>
  );
}
