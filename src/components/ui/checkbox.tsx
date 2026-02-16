"use client";

import * as React from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export interface CheckboxProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
  className?: string;
}

export const Checkbox = React.forwardRef<HTMLButtonElement, CheckboxProps>(
  ({ checked, onCheckedChange, disabled, className }, ref) => {
    return (
      <button
        ref={ref}
        type="button"
        role="checkbox"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onCheckedChange(!checked)}
        className={cn(
          "nodrag nowheel peer h-4 w-4 shrink-0 rounded border border-gray-600/50 bg-gray-700/40",
          "focus:outline-none focus:ring-1 focus:ring-blue-500/50 focus:border-blue-500/50",
          "disabled:cursor-not-allowed disabled:opacity-50",
          "data-[state=checked]:bg-blue-500/20 data-[state=checked]:border-blue-500",
          "transition-colors",
          className
        )}
        data-state={checked ? "checked" : "unchecked"}
      >
        {checked && <Check className="w-3 h-3 text-blue-400" />}
      </button>
    );
  }
);
Checkbox.displayName = "Checkbox";
