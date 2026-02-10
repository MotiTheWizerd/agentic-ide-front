import { type NodeProps, NodeResizer } from "@xyflow/react";
import { Group } from "lucide-react";
import { useFlowStore } from "@/store/flow-store";

const GROUP_COLORS: { key: string; bg: string; border: string; hoverBg: string; hoverBorder: string; swatch: string }[] = [
  { key: "gray",   bg: "bg-gray-800/20",   border: "border-gray-600",   hoverBg: "bg-blue-500/10",    hoverBorder: "border-blue-500",    swatch: "bg-gray-500" },
  { key: "blue",   bg: "bg-blue-500/8",     border: "border-blue-500/40", hoverBg: "bg-blue-500/15",    hoverBorder: "border-blue-400",    swatch: "bg-blue-500" },
  { key: "purple", bg: "bg-purple-500/8",   border: "border-purple-500/40", hoverBg: "bg-purple-500/15", hoverBorder: "border-purple-400", swatch: "bg-purple-500" },
  { key: "green",  bg: "bg-emerald-500/8",  border: "border-emerald-500/40", hoverBg: "bg-emerald-500/15", hoverBorder: "border-emerald-400", swatch: "bg-emerald-500" },
  { key: "amber",  bg: "bg-amber-500/8",    border: "border-amber-500/40", hoverBg: "bg-amber-500/15",  hoverBorder: "border-amber-400",  swatch: "bg-amber-500" },
  { key: "red",    bg: "bg-red-500/8",      border: "border-red-500/40",  hoverBg: "bg-red-500/15",     hoverBorder: "border-red-400",     swatch: "bg-red-500" },
  { key: "cyan",   bg: "bg-cyan-500/8",     border: "border-cyan-500/40", hoverBg: "bg-cyan-500/15",    hoverBorder: "border-cyan-400",    swatch: "bg-cyan-500" },
  { key: "pink",   bg: "bg-pink-500/8",     border: "border-pink-500/40", hoverBg: "bg-pink-500/15",    hoverBorder: "border-pink-400",    swatch: "bg-pink-500" },
];

export function GroupNode({ id, data, selected }: NodeProps) {
  const updateNodeData = useFlowStore((s) => s.updateNodeData);
  const isHovered = useFlowStore((s) => s.flows[s.activeFlowId]?.hoveredGroupId === id);
  const label = (data.label as string) || "Group";
  const colorKey = (data.color as string) || "gray";
  const palette = GROUP_COLORS.find((c) => c.key === colorKey) || GROUP_COLORS[0];

  return (
    <>
      <NodeResizer
        isVisible={selected}
        minWidth={250}
        minHeight={150}
        lineClassName="!border-blue-500/50"
        handleClassName="!w-2.5 !h-2.5 !bg-blue-500 !border-2 !border-gray-900 !rounded-sm"
      />
      <div
        className={`w-full h-full rounded-xl border-2 border-dashed transition-colors duration-150 ${
          isHovered
            ? `${palette.hoverBorder} ${palette.hoverBg}`
            : `${palette.border} ${palette.bg}`
        } backdrop-blur-[2px]`}
      >
        <div className="flex items-center gap-2 px-3 py-2 bg-gray-800/60 rounded-t-xl border-b border-gray-600/50">
          <Group className="w-4 h-4 text-blue-400 shrink-0" />
          <input
            value={label}
            onChange={(e) => updateNodeData(id, { label: e.target.value })}
            className="nodrag bg-transparent text-sm font-semibold text-gray-200 outline-none placeholder-gray-500 w-full"
            placeholder="Group name"
          />
          <div className="nodrag flex items-center gap-1 shrink-0">
            {GROUP_COLORS.map((c) => (
              <button
                key={c.key}
                onClick={(e) => { e.stopPropagation(); updateNodeData(id, { color: c.key }); }}
                className={`w-3 h-3 rounded-full ${c.swatch} transition-all ${
                  colorKey === c.key
                    ? "ring-1 ring-white ring-offset-1 ring-offset-gray-900 scale-110"
                    : "opacity-50 hover:opacity-80"
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
