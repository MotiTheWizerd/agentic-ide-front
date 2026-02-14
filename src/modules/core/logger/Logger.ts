/**
 * Colored console logger with module prefix.
 *
 * Usage:
 *   const logger = new Logger("gen-editor");
 *   logger.info("Pipeline started");   // [gen-editor] Pipeline started  (blue)
 *   logger.warn("Slow node");          // [gen-editor] Slow node         (amber)
 *   logger.error("Node failed", err);  // [gen-editor] Node failed       (red)
 *   logger.log("Debug data", obj);     // [gen-editor] Debug data        (gray)
 */

const STYLES = {
  log:   "color: #9ca3af; font-weight: normal;", // gray-400
  info:  "color: #38bdf8; font-weight: bold;",   // sky-400
  warn:  "color: #fbbf24; font-weight: bold;",   // amber-400
  error: "color: #f87171; font-weight: bold;",   // red-400
} as const;

const PREFIX_STYLE = "font-weight: bold;";

export class Logger {
  private prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  log(...args: unknown[]): void {
    console.log(`%c[${this.prefix}]`, `${PREFIX_STYLE} ${STYLES.log}`, ...args);
  }

  info(...args: unknown[]): void {
    console.info(`%c[${this.prefix}]`, `${PREFIX_STYLE} ${STYLES.info}`, ...args);
  }

  warn(...args: unknown[]): void {
    console.warn(`%c[${this.prefix}]`, `${PREFIX_STYLE} ${STYLES.warn}`, ...args);
  }

  error(...args: unknown[]): void {
    console.error(`%c[${this.prefix}]`, `${PREFIX_STYLE} ${STYLES.error}`, ...args);
  }
}
