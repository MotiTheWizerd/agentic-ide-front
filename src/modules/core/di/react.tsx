"use client";

/**
 * React integration for the DI container.
 *
 * - DIProvider: wraps the app (or a subtree) and makes the container available.
 * - useContainer: raw access to the container instance.
 * - useService: typed shorthand to resolve a service by token.
 *
 * Usage:
 *   // In a layout:
 *   <DIProvider container={container}>{children}</DIProvider>
 *
 *   // In a component:
 *   const eventBus = useService<EventBus<EventMap>>(TOKENS.EventBus);
 */

import { createContext, useContext, type ReactNode } from "react";
import type { Container } from "./Container";

const DIContext = createContext<Container | null>(null);

export function DIProvider({
  container,
  children,
}: {
  container: Container;
  children: ReactNode;
}) {
  return <DIContext.Provider value={container}>{children}</DIContext.Provider>;
}

/** Access the raw DI container. Throws if used outside a DIProvider. */
export function useContainer(): Container {
  const container = useContext(DIContext);
  if (!container) {
    throw new Error(
      "[DI] useContainer() called outside of <DIProvider>. " +
      "Wrap your component tree with <DIProvider container={...}>."
    );
  }
  return container;
}

/** Resolve a service by token. Throws if the token isn't registered. */
export function useService<T>(token: symbol): T {
  return useContainer().resolve<T>(token);
}
