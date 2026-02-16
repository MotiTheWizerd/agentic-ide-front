"use client";

import { useCallback } from "react";
import type { FieldConfig } from "@/lib/provider-schemas";
import { GeneralDropdown } from "./GeneralDropdown";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";

interface SchemaFieldProps {
  name: string;
  field: FieldConfig;
  value: unknown;
  onChange: (value: unknown) => void;
  /** Render a slider instead of number input (requires min/max in validation) */
  useSlider?: boolean;
}

/**
 * Renders a form field based on backend field configuration.
 * Supports: select (dropdown), boolean (checkbox), number (input/slider), text (input)
 */
export function SchemaField({ name, field, value, onChange, useSlider }: SchemaFieldProps) {
  const numValue = field.type === "number"
    ? (value !== undefined ? Number(value) : (field.default as number) ?? 0)
    : 0;
  const min = field.validation?.min;
  const max = field.validation?.max;
  const step = field.validation?.step ?? 0.1;

  const handleNumberChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      let val = parseFloat(e.target.value);
      if (isNaN(val)) return;
      if (min !== undefined && val < min) val = min;
      if (max !== undefined && val > max) val = max;
      onChange(val);
    },
    [min, max, onChange]
  );

  // Select → Dropdown
  if (field.type === "select" && field.options) {
    return (
      <div className="flex items-center gap-2">
        <label className="text-[8px] text-gray-400 uppercase tracking-wider w-20 shrink-0">
          {field.label}
        </label>
        <GeneralDropdown
          options={field.options}
          value={(value as string) ?? (field.default as string) ?? field.options[0]?.value ?? ""}
          onChange={(val) => onChange(val)}
          popoverWidth="w-48"
        />
      </div>
    );
  }

  // Boolean → Checkbox
  if (field.type === "boolean") {
    const checked = value !== undefined ? Boolean(value) : Boolean(field.default ?? false);
    return (
      <div className="flex items-center gap-2">
        <label className="text-[8px] text-gray-400 uppercase tracking-wider w-20 shrink-0">
          {field.label}
        </label>
        <Checkbox
          checked={checked}
          onCheckedChange={(val) => onChange(val)}
        />
      </div>
    );
  }

  // Number → Slider or Number Input
  if (field.type === "number") {
    // Slider variant for bounded numeric fields
    if (useSlider && min !== undefined && max !== undefined) {
      return (
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <label className="text-[8px] text-gray-400 uppercase tracking-wider">
              {field.label}
            </label>
            <span className="text-[9px] text-gray-300 font-mono tabular-nums">
              {numValue}
            </span>
          </div>
          <Slider
            min={min}
            max={max}
            step={step}
            value={[numValue]}
            onValueChange={([val]) => onChange(val)}
          />
        </div>
      );
    }

    return (
      <div className="flex items-center gap-2">
        <label className="text-[8px] text-gray-400 uppercase tracking-wider w-20 shrink-0">
          {field.label}
        </label>
        <div className="flex-1 flex items-center gap-1">
          <Input
            type="number"
            value={numValue}
            onChange={handleNumberChange}
            min={min}
            max={max}
            step={step}
            className="flex-1"
          />
          {(min !== undefined || max !== undefined) && (
            <span className="text-[7px] text-gray-500 shrink-0">
              ({min ?? "−∞"}–{max ?? "∞"})
            </span>
          )}
        </div>
      </div>
    );
  }

  // Text → Text Input
  if (field.type === "text") {
    const stringValue = value !== undefined ? String(value) : (field.default as string) ?? "";
    return (
      <div className="flex items-center gap-2">
        <label className="text-[8px] text-gray-400 uppercase tracking-wider w-20 shrink-0">
          {field.label}
        </label>
        <Input
          type="text"
          value={stringValue}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1"
        />
      </div>
    );
  }

  // Fallback for unsupported types
  return null;
}
