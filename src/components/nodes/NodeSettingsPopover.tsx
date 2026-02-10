"use client";

import { useEffect, useRef } from "react";
import { X } from "lucide-react";

const MAX_ADAPTERS = 5;

const TOKEN_PRESETS = [512, 1024, 1500, 2048, 4096];

interface NodeSettingsPopoverProps {
  adapterCount: number;
  onAdapterCountChange: (count: number) => void;
  maxTokens?: number;
  onMaxTokensChange?: (tokens: number) => void;
  onClose: () => void;
}

export function NodeSettingsPopover({
  adapterCount,
  onAdapterCountChange,
  maxTokens = 1500,
  onMaxTokensChange,
  onClose,
}: NodeSettingsPopoverProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose();
      }
    }
    function handleEscape(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [onClose]);

  return (
    <div
      ref={ref}
      className="nodrag nowheel absolute top-full left-0 mt-1 z-50 w-56 bg-gray-800 border border-gray-600 rounded-lg shadow-xl shadow-black/50 p-3"
      onClick={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-[11px] font-semibold text-gray-300 uppercase tracking-wide">
          Settings
        </span>
        <button
          onClick={onClose}
          className="p-0.5 text-gray-500 hover:text-gray-300 transition-colors"
        >
          <X className="w-3 h-3" />
        </button>
      </div>

      <div className="space-y-3">
        {/* Adapter Inputs */}
        <div className="space-y-1.5">
          <label className="text-[10px] text-gray-400 font-medium">
            Adapter Inputs
          </label>
          <div className="flex gap-1">
            {Array.from({ length: MAX_ADAPTERS + 1 }, (_, i) => (
              <button
                key={i}
                onClick={() => onAdapterCountChange(i)}
                className={`w-7 h-7 text-[11px] font-medium rounded-md border transition-colors ${
                  adapterCount === i
                    ? "bg-amber-500/20 border-amber-500/60 text-amber-400"
                    : "bg-gray-700/50 border-gray-600 text-gray-400 hover:bg-gray-700 hover:text-gray-300"
                }`}
              >
                {i}
              </button>
            ))}
          </div>
        </div>

        {/* Max Tokens */}
        {onMaxTokensChange && (
          <div className="space-y-1.5">
            <label className="text-[10px] text-gray-400 font-medium">
              Max Tokens
            </label>
            <div className="flex gap-1 flex-wrap">
              {TOKEN_PRESETS.map((preset) => (
                <button
                  key={preset}
                  onClick={() => onMaxTokensChange(preset)}
                  className={`px-2 h-7 text-[10px] font-medium rounded-md border transition-colors ${
                    maxTokens === preset
                      ? "bg-blue-500/20 border-blue-500/60 text-blue-400"
                      : "bg-gray-700/50 border-gray-600 text-gray-400 hover:bg-gray-700 hover:text-gray-300"
                  }`}
                >
                  {preset >= 1000 ? `${(preset / 1000).toFixed(preset % 1000 === 0 ? 0 : 1)}k` : preset}
                </button>
              ))}
            </div>
            <input
              type="number"
              value={maxTokens}
              onChange={(e) => {
                const val = parseInt(e.target.value, 10);
                if (val > 0) onMaxTokensChange(val);
              }}
              min={1}
              max={16384}
              className="w-full bg-gray-700/50 border border-gray-600 rounded-md px-2 py-1 text-[11px] text-gray-300 focus:outline-none focus:ring-1 focus:ring-blue-500/50 focus:border-transparent"
            />
          </div>
        )}
      </div>
    </div>
  );
}
