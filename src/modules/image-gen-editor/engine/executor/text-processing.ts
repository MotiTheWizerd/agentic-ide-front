import type { NodeExecutor } from "../types";
import { mergeInputText, injectPersonasIfPresent, LANGUAGE_NAMES } from "./utils";

/** InitialPromptNode: pass-through text, with persona injection if adapters connected. */
export const initialPrompt: NodeExecutor = async (ctx) => {
  const text = (ctx.nodeData.text as string) || "";
  const maxTokens = (ctx.nodeData.maxTokens as number) || undefined;
  if (!text.trim()) {
    return { success: false, output: { error: "No prompt text entered" } };
  }

  const start = Date.now();
  const finalText = await injectPersonasIfPresent(text, ctx.adapterInputs, ctx.providerId, maxTokens, ctx.model);

  return {
    success: true,
    output: { text: finalText, durationMs: Date.now() - start },
  };
};

/** PromptEnhancerNode: enhances upstream text with additional notes via /api/enhance. */
export const promptEnhancer: NodeExecutor = async (ctx) => {
  const { nodeData, inputs, adapterInputs, providerId, model } = ctx;
  const notes = (nodeData.notes as string) || "";
  const maxTokens = (nodeData.maxTokens as number) || undefined;
  const upstreamText = mergeInputText(inputs);

  if (!upstreamText) {
    return { success: false, output: { error: "No input text to enhance" } };
  }

  const start = Date.now();
  const res = await fetch("/api/enhance", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      text: upstreamText,
      notes: notes || undefined,
      providerId,
      ...(model && { model }),
      ...(maxTokens && { maxTokens }),
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Enhancement failed" }));
    return { success: false, output: { error: err.error || "Enhancement failed" } };
  }

  const { enhanced } = await res.json();
  const finalText = await injectPersonasIfPresent(enhanced, adapterInputs, providerId, maxTokens, model);

  return {
    success: true,
    output: { text: finalText, durationMs: Date.now() - start },
  };
};

/** TranslatorNode: translates upstream text to target language via /api/translate. */
export const translator: NodeExecutor = async (ctx) => {
  const { nodeData, inputs, providerId, model } = ctx;
  const language = (nodeData.language as string) || "";
  const maxTokens = (nodeData.maxTokens as number) || undefined;
  const upstreamText = mergeInputText(inputs);

  if (!upstreamText) {
    return { success: false, output: { error: "No input text to translate" } };
  }

  // No language selected → pass through
  if (!language) {
    return { success: true, output: { text: upstreamText } };
  }

  const languageName = LANGUAGE_NAMES[language] || language;
  const start = Date.now();

  const res = await fetch("/api/translate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      text: upstreamText,
      language: languageName,
      providerId,
      ...(model && { model }),
      ...(maxTokens && { maxTokens }),
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Translation failed" }));
    return { success: false, output: { error: err.error || "Translation failed" } };
  }

  const { translation } = await res.json();
  return {
    success: true,
    output: { text: translation, durationMs: Date.now() - start },
  };
};

/** StoryTellerNode: creative prompt generator — different output every time. */
export const storyTeller: NodeExecutor = async (ctx) => {
  const { nodeData, inputs, adapterInputs, providerId, model } = ctx;
  const idea = (nodeData.idea as string) || "";
  const tags = (nodeData.tags as string) || "";
  const maxTokens = (nodeData.maxTokens as number) || undefined;
  const upstreamText = mergeInputText(inputs);

  const text = upstreamText || idea;
  if (!text.trim()) {
    return { success: false, output: { error: "No idea provided" } };
  }

  const start = Date.now();
  const res = await fetch("/api/storyteller", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text, tags: tags || undefined, providerId, ...(model && { model }), ...(maxTokens && { maxTokens }) }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Story generation failed" }));
    return { success: false, output: { error: err.error || "Story generation failed" } };
  }

  const { story } = await res.json();
  const finalText = await injectPersonasIfPresent(story, adapterInputs, providerId, maxTokens, model);

  return {
    success: true,
    output: { text: finalText, durationMs: Date.now() - start },
  };
};

/** GrammarFixNode: fixes grammar & typos in English text via /api/grammar-fix. */
export const grammarFix: NodeExecutor = async (ctx) => {
  const { nodeData, inputs, providerId, model } = ctx;
  const style = (nodeData.style as string) || "";
  const maxTokens = (nodeData.maxTokens as number) || undefined;
  const upstreamText = mergeInputText(inputs);

  if (!upstreamText) {
    return { success: false, output: { error: "No input text to fix" } };
  }

  const start = Date.now();
  const res = await fetch("/api/grammar-fix", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      text: upstreamText,
      style: style || undefined,
      providerId,
      ...(model && { model }),
      ...(maxTokens && { maxTokens }),
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Grammar fix failed" }));
    return { success: false, output: { error: err.error || "Grammar fix failed" } };
  }

  const { fixed } = await res.json();
  return {
    success: true,
    output: { text: fixed, durationMs: Date.now() - start },
  };
};

/** CompressorNode: compresses text via /api/compress when over threshold (2500 chars), otherwise passes through. */
export const compressor: NodeExecutor = async (ctx) => {
  const { inputs, providerId, model } = ctx;
  const maxTokens = (ctx.nodeData.maxTokens as number) || undefined;
  const upstreamText = mergeInputText(inputs);

  if (!upstreamText) {
    return { success: false, output: { error: "No input text to compress" } };
  }

  const THRESHOLD = 2500;

  // Below threshold — pass through unchanged
  if (upstreamText.length <= THRESHOLD) {
    return { success: true, output: { text: upstreamText } };
  }

  const start = Date.now();
  const res = await fetch("/api/compress", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      text: upstreamText,
      providerId,
      ...(model && { model }),
      ...(maxTokens && { maxTokens }),
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Compression failed" }));
    return { success: false, output: { error: err.error || "Compression failed" } };
  }

  const { compressed } = await res.json();
  return {
    success: true,
    output: { text: compressed, durationMs: Date.now() - start },
  };
};
