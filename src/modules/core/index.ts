/**
 * core module — shared infrastructure.
 */

export { EventBus } from "./bus";
export { Logger } from "./logger";
export { Container, TOKENS, DIProvider, useContainer, useService } from "./di";
export type { Factory } from "./di";
