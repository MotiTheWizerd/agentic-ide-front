import type { WebSocketManager as WSManager } from "./WebSocketManager";

export { WebSocketManager } from "./WebSocketManager";
export type {
  WSMessage,
  WSMessageHandler,
  WSConnectionState,
  WSStateChangeCallback,
} from "./types";
export { WS_CONFIG } from "./types";

// ---- Backward-compat singleton (set by bootstrap) ----
// Allows non-React code (stores, services) to access the WS manager imperatively.

let _wsInstance: WSManager | null = null;

export function setWebSocketManagerInstance(instance: WSManager): void {
  _wsInstance = instance;
}

export function getWebSocketManager(): WSManager {
  if (!_wsInstance) {
    throw new Error("[websocket] Not initialized. Was bootstrap() called?");
  }
  return _wsInstance;
}
