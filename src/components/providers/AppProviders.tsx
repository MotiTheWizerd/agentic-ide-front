"use client";

/**
 * AppProviders — client-side provider wrapper for the root layout.
 *
 * Bootstraps the DI container once and wraps children with <DIProvider>.
 * This is the single entry point where the container is created.
 */

import { useMemo, type ReactNode } from "react";
import { DIProvider } from "@/modules/core/di";
import { bootstrap } from "@/modules/bootstrap";

export function AppProviders({ children }: { children: ReactNode }) {
  const container = useMemo(() => bootstrap(), []);
  return <DIProvider container={container}>{children}</DIProvider>;
}
