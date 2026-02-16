"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-7 w-full rounded border border-gray-600/50 bg-gray-700/40 px-2 py-1 text-[10px] text-gray-300 transition-colors",
          "file:border-0 file:bg-transparent file:text-sm file:font-medium",
          "placeholder:text-gray-500",
          "focus:outline-none focus:ring-1 focus:ring-blue-500/50 focus:border-blue-500/50",
          "disabled:cursor-not-allowed disabled:opacity-50",
          "nodrag nowheel",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";

export { Input };
