"use client";

import { useState, useEffect, useCallback } from "react";
import { X } from "lucide-react";
import { NODE_MODEL_DEFAULTS } from "@/modules/image-gen-editor";
import { GeneralDropdown } from "@/components/shared/GeneralDropdown";
import { SchemaField } from "@/components/shared/SchemaField";
import { Modal } from "@/components/shared/Modal";
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

// Module-level cache keyed by endpoint
const providerCache = new Map<string, ProviderInfo[]>();

interface NodeSettingsPopoverProps {
  nodeType: string;
  providerId?: string;
  model?: string;
  providerParams?: Record<string, unknown>;
  onProviderChange: (providerId: string) => void;
  onModelChange: (model: string) => void;
  onProviderParamsChange?: (params: Record<string, unknown>) => void;
  onClose: () => void;
}

export function NodeSettingsPopover({
  nodeType,
  providerId,
  model,
  providerParams = {},
  onProviderChange,
  onModelChange,
  onProviderParamsChange,
  onClose,
}: NodeSettingsPopoverProps) {
  const endpoint = "/providers";
  const defaults = NODE_MODEL_DEFAULTS[nodeType];
  const activeProviderId = providerId || defaults?.providerId || "mistral";
  const activeModel = model || defaults?.model || "";

  // Fetch providers
  const [providers, setProviders] = useState<ProviderInfo[]>(
    providerCache.get(endpoint) || []
  );

  useEffect(() => {
    if (providerCache.has(endpoint)) return;
    api
      .get(endpoint)
      .then((res) => {
        providerCache.set(endpoint, res.data.providers);
        setProviders(res.data.providers);
      })
      .catch(() => {});
  }, [endpoint]);

  const activeProvider = providers.find((p) => p.id === activeProviderId);
  const models = activeProvider?.models ?? [];

  const providerOptions = providers.map((p) => ({ value: p.id, label: p.name }));
  const modelOptions = models.map((m) => ({ value: m.id, label: m.name }));

  const handleProviderChange = useCallback(
    (pid: string) => {
      onProviderChange(pid);
      onModelChange("");
      // Clear provider params when provider changes
      if (onProviderParamsChange) {
        onProviderParamsChange({});
      }
    },
    [onProviderChange, onModelChange, onProviderParamsChange]
  );

  const handleModelChange = useCallback(
    (m: string) => {
      onModelChange(m);
      // Clear provider params when model changes
      if (onProviderParamsChange) {
        onProviderParamsChange({});
      }
    },
    [onModelChange, onProviderParamsChange]
  );

  // Fetch model schemas
  const [schemas, setSchemas] = useState<ModelSchemasResponse>({ models: {} });

  useEffect(() => {
    fetchModelSchemas().then(setSchemas);
  }, []);

  // Get schema for active MODEL (not provider!)
  const modelSchema = activeModel ? getModelSchema(activeModel, schemas) : undefined;
  const hasParams = modelSchema && Object.keys(modelSchema.fields).length > 0;

  // Merge defaults with current params
  const defaults_params = activeModel ? getModelDefaults(activeModel, schemas) : {};
  const activeParams = { ...defaults_params, ...providerParams };

  const handleParamChange = useCallback(
    (key: string, value: unknown) => {
      if (!onProviderParamsChange) return;
      onProviderParamsChange({ ...activeParams, [key]: value });
    },
    [activeParams, onProviderParamsChange]
  );

  return (
    <Modal open={true} onClose={onClose}>
      <div className="space-y-3">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-700 pb-2">
          <h2 className="text-[10px] font-bold text-gray-300 uppercase tracking-widest">
            Settings
          </h2>
          <button
            onClick={onClose}
            className="p-0.5 text-gray-500 hover:text-gray-300 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Provider & Model Section */}
        <div className="space-y-2">
          {/* Provider */}
          <div className="flex items-center gap-2">
            <label className="text-[8px] text-gray-400 uppercase tracking-wider w-16 shrink-0">
              Provider
            </label>
            <GeneralDropdown
              options={providerOptions}
              value={activeProviderId}
              onChange={handleProviderChange}
              popoverWidth="w-48"
            />
          </div>

          {/* Model */}
          {activeProviderId !== "claude" && modelOptions.length > 0 && (
            <div className="flex items-center gap-2">
              <label className="text-[8px] text-gray-400 uppercase tracking-wider w-16 shrink-0">
                Model
              </label>
              <GeneralDropdown
                options={modelOptions}
                value={activeModel}
                onChange={handleModelChange}
                popoverWidth="w-48"
              />
            </div>
          )}

          {activeProviderId === "claude" && (
            <div className="text-[8px] text-gray-500 italic pl-[4.5rem]">
              Claude CLI — auto
            </div>
          )}
        </div>

        {/* Model Parameters Section */}
        {hasParams && (
          <div className="space-y-2 pt-1.5 border-t border-gray-700/50">
            <h3 className="text-[8px] font-semibold text-gray-400 uppercase tracking-wider">
              Model Parameters
            </h3>
            <div className="space-y-1.5">
              {Object.entries(modelSchema!.fields)
                .sort(([keyA], [keyB]) => {
                  // Move safety_check to the bottom
                  if (keyA === "safety_check") return 1;
                  if (keyB === "safety_check") return -1;
                  return 0;
                })
                .map(([key, fieldConfig]) => (
                  <SchemaField
                    key={key}
                    name={key}
                    field={fieldConfig}
                    value={activeParams[key]}
                    onChange={(val) => handleParamChange(key, val)}
                  />
                ))}
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
