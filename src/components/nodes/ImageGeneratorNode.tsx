import { useState, useEffect, useCallback, useMemo } from "react";
import { type NodeProps } from "@xyflow/react";
import { ImageIcon, Maximize2 } from "lucide-react";
import { BaseNode } from "./BaseNode";
import { GeneralDropdown } from "@/components/shared/GeneralDropdown";
import { SchemaField } from "@/components/shared/SchemaField";
import { useFlowStore } from "@/store/flow-store";
import api from "@/lib/api";
import {
  fetchModelSchemas,
  getModelSchema,
  getModelDefaults,
  type ModelSchemasResponse,
} from "@/lib/provider-schemas";

interface ProviderInfo {
  id: string;
  name: string;
  models?: { id: string; name: string }[];
}

// Module-level provider cache
const providerCache = new Map<string, ProviderInfo[]>();

const SLIDER_FIELDS = new Set(["guidance_scale", "steps"]);
const PROVIDER_ENDPOINT = "/providers";

export function ImageGeneratorNode({ id, data }: NodeProps) {
  const updateNodeData = useFlowStore((s) => s.updateNodeData);
  const runFromNode = useFlowStore((s) => s.runFromNode);
  const openLightbox = useFlowStore((s) => s.openLightbox);
  const status = useFlowStore(
    (s) => s.flows[s.activeFlowId]?.execution.nodeStatus[id] || "idle"
  );
  const errorMessage = useFlowStore(
    (s) => s.flows[s.activeFlowId]?.execution.nodeOutputs[id]?.error
  );
  const outputText = useFlowStore(
    (s) => s.flows[s.activeFlowId]?.execution.nodeOutputs[id]?.text
  );
  const outputImage = useFlowStore(
    (s) => s.flows[s.activeFlowId]?.execution.nodeOutputs[id]?.image
  );

  const userProviderId = data.providerId as string | undefined;
  const userModel = data.model as string | undefined;
  const userProviderParams = data.providerParams as
    | Record<string, unknown>
    | undefined;

  // ── Fetch providers (cached) ──
  const [providers, setProviders] = useState<ProviderInfo[]>(
    providerCache.get(PROVIDER_ENDPOINT) || []
  );

  useEffect(() => {
    if (providerCache.has(PROVIDER_ENDPOINT)) return;
    api
      .get(PROVIDER_ENDPOINT)
      .then((res) => {
        providerCache.set(PROVIDER_ENDPOINT, res.data.providers);
        setProviders(res.data.providers);
      })
      .catch(() => {});
  }, []);

  const activeProviderId = userProviderId || "";
  const activeModel = userModel || "";
  const activeProvider = providers.find((p) => p.id === activeProviderId);
  const models = activeProvider?.models ?? [];
  const providerOptions = providers.map((p) => ({
    value: p.id,
    label: p.name,
  }));
  const modelOptions = models.map((m) => ({ value: m.id, label: m.name }));

  const handleProviderChange = useCallback(
    (pid: string) => {
      updateNodeData(id, {
        providerId: pid,
        model: undefined,
        providerParams: {},
      });
    },
    [id, updateNodeData]
  );

  const handleModelChange = useCallback(
    (m: string) => {
      updateNodeData(id, { model: m || undefined, providerParams: {} });
    },
    [id, updateNodeData]
  );

  // ── Fetch model schemas (cached) ──
  const [schemas, setSchemas] = useState<ModelSchemasResponse>({ models: {} });
  useEffect(() => {
    fetchModelSchemas().then(setSchemas);
  }, []);

  const modelSchema = activeModel
    ? getModelSchema(activeModel, schemas)
    : undefined;
  const hasParams =
    modelSchema && Object.keys(modelSchema.fields).length > 0;
  const activeParams = useMemo(() => {
    const defaults = activeModel
      ? getModelDefaults(activeModel, schemas)
      : {};
    return { ...defaults, ...userProviderParams };
  }, [activeModel, schemas, userProviderParams]);

  const handleParamChange = useCallback(
    (key: string, value: unknown) => {
      updateNodeData(id, {
        providerParams: { ...activeParams, [key]: value },
      });
    },
    [activeParams, id, updateNodeData]
  );

  return (
    <div className="relative">
      <BaseNode
        title="Image Generator"
        icon={<ImageIcon className="w-4 h-4 text-fuchsia-400" />}
        color="ring-fuchsia-500/30"
        onTrigger={() => runFromNode(id)}
        usesLLM
        status={status}
        errorMessage={errorMessage}
        outputText={outputText}
      >
        <div className="space-y-2">
          <div className="text-[10px] text-gray-500">
            Generates image from upstream prompt
          </div>

          {/* Provider & Model */}
          <div className="space-y-1.5 pt-1 border-t border-gray-700/40">
            <div className="flex items-center gap-2">
              <label className="text-[8px] text-gray-400 uppercase tracking-wider w-16 shrink-0">
                Provider
              </label>
              <GeneralDropdown
                options={providerOptions}
                value={activeProviderId}
                onChange={handleProviderChange}
                placeholder="Select..."
                popoverWidth="w-48"
              />
            </div>

            {modelOptions.length > 0 && (
              <div className="flex items-center gap-2">
                <label className="text-[8px] text-gray-400 uppercase tracking-wider w-16 shrink-0">
                  Model
                </label>
                <GeneralDropdown
                  options={modelOptions}
                  value={activeModel}
                  onChange={handleModelChange}
                  placeholder="Select..."
                  popoverWidth="w-48"
                />
              </div>
            )}
          </div>

          {/* Inline model parameters */}
          {hasParams && (
            <div className="space-y-2 pt-1 border-t border-gray-700/40">
              {Object.entries(modelSchema!.fields)
                .sort(([a], [b]) => {
                  if (a === "safety_check") return 1;
                  if (b === "safety_check") return -1;
                  return 0;
                })
                .map(([key, fieldConfig]) => (
                  <SchemaField
                    key={key}
                    name={key}
                    field={fieldConfig}
                    value={activeParams[key]}
                    onChange={(val) => handleParamChange(key, val)}
                    useSlider={SLIDER_FIELDS.has(key)}
                  />
                ))}
            </div>
          )}

          {/* Generated image output */}
          {outputImage && status === "complete" && (
            <div className="relative group mt-2 rounded overflow-hidden border border-white/10">
              <img
                src={outputImage}
                alt="Generated"
                className="w-full h-auto max-h-48 object-contain bg-black/20"
              />
              <button
                onClick={() => openLightbox(outputImage)}
                className="absolute bottom-1.5 left-1.5 p-1 rounded-md bg-gray-900/80 border border-gray-700 text-gray-400 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Maximize2 className="w-3 h-3" />
              </button>
            </div>
          )}
        </div>
      </BaseNode>
    </div>
  );
}
