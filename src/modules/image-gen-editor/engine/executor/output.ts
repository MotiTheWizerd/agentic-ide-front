import type { NodeExecutor } from "../types";
import { mergeInputText } from "./utils";

/** TextOutputNode: terminal sink — receives upstream text, no API call. */
export const textOutput: NodeExecutor = async (ctx) => {
  const text = mergeInputText(ctx.inputs);
  return { success: true, output: { text } };
};
