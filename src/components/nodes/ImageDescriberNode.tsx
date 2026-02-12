import { type NodeProps } from "@xyflow/react";
import { ScanEye } from "lucide-react";
import { BaseNode } from "./BaseNode";
import { ImageUpload } from "@/components/shared/ImageUpload";
import { useFlowStore } from "@/store/flow-store";

export function ImageDescriberNode({ id, data }: NodeProps) {
  const updateNodeData = useFlowStore((s) => s.updateNodeData);
  const runFromNode = useFlowStore((s) => s.runFromNode);
  const status = useFlowStore((s) => s.flows[s.activeFlowId]?.execution.nodeStatus[id] || "idle");
  const errorMessage = useFlowStore((s) => s.flows[s.activeFlowId]?.execution.nodeOutputs[id]?.error);
  const outputText = useFlowStore((s) => s.flows[s.activeFlowId]?.execution.nodeOutputs[id]?.text);
  const isTrigger = useFlowStore((s) => {
    const flow = s.flows[s.activeFlowId];
    if (!flow) return false;
    return !flow.edges.some((e) => e.target === id && !(e.targetHandle || "").startsWith("adapter-"));
  });

  const image = (data.image as string) || "";

  return (
    <BaseNode
      title="Image Describer"
      icon={<ScanEye className="w-4 h-4 text-pink-400" />}
      color="ring-pink-500/30"
      hasInput={false}
      onTrigger={isTrigger ? () => runFromNode(id) : undefined}
      usesLLM
      status={status}
      errorMessage={errorMessage}
      outputText={outputText}
    >
      <ImageUpload
        image={image}
        onImageChange={(img) => updateNodeData(id, { image: img })}
        icon={<ScanEye className="w-4 h-4 text-gray-500" />}
        placeholder="Upload Image"
        alt="Image to describe"
        accentColor="pink"
      />
    </BaseNode>
  );
}
