/**
 * Model parameter schemas fetcher
 *
 * Fetches model-specific parameter schemas from the backend and provides type-safe access
 * to model configuration parameters.
 */

import api from "./api";

export interface FieldOption {
  value: string;
  label: string;
}

export interface FieldConfig {
  type: "select" | "boolean" | "number" | "text";
  label: string;
  description: string;
  default: unknown;
  required: boolean;
  options?: FieldOption[] | null;
  validation?: {
    min?: number;
    max?: number;
    step?: number;
  } | null;
}

export interface ModelSchema {
  fields: Record<string, FieldConfig>;
}

export interface ModelSchemasResponse {
  models: Record<string, ModelSchema>;
}

// Module-level cache
let _schemasCache: ModelSchemasResponse | null = null;
let _fetchPromise: Promise<ModelSchemasResponse> | null = null;

/**
 * Fetch model schemas from the backend.
 * Results are cached in memory.
 */
export async function fetchModelSchemas(): Promise<ModelSchemasResponse> {
  // Return cached if available
  if (_schemasCache) {
    return _schemasCache;
  }

  // Return in-flight promise if already fetching
  if (_fetchPromise) {
    return _fetchPromise;
  }

  // Fetch from backend using axios api instance
  _fetchPromise = api
    .get("/providers/models/schemas")
    .then((res) => {
      _schemasCache = res.data as ModelSchemasResponse;
      _fetchPromise = null;
      return _schemasCache;
    })
    .catch((err) => {
      _fetchPromise = null;
      console.error("Failed to fetch model schemas:", err);
      return { models: {} };
    });

  return _fetchPromise;
}

/**
 * Get schema for a specific model.
 * Returns undefined if schema not available.
 */
export function getModelSchema(
  modelId: string,
  schemas: ModelSchemasResponse
): ModelSchema | undefined {
  return schemas.models?.[modelId];
}

/**
 * Get default values for a model's parameters.
 */
export function getModelDefaults(
  modelId: string,
  schemas: ModelSchemasResponse
): Record<string, unknown> {
  const schema = getModelSchema(modelId, schemas);
  if (!schema) return {};

  const defaults: Record<string, unknown> = {};
  for (const [key, field] of Object.entries(schema.fields)) {
    if (field.default !== undefined && field.default !== null) {
      defaults[key] = field.default;
    }
  }
  return defaults;
}
