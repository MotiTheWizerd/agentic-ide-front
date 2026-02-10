import type {
  NodeExecutor,
  ExecutorRegistry,
  NodeOutput,
  PersonaInput,
} from "./types";
import { composeScenePrompt } from "../scene-prompts";

// Map language codes to full names for translation prompts
const LANGUAGE_NAMES: Record<string, string> = {
  en: "English", es: "Spanish", fr: "French", de: "German",
  it: "Italian", pt: "Portuguese", ru: "Russian", ja: "Japanese",
  ko: "Korean", zh: "Chinese", ar: "Arabic", hi: "Hindi",
  tr: "Turkish", pl: "Polish", nl: "Dutch", sv: "Swedish",
  da: "Danish", fi: "Finnish", no: "Norwegian", cs: "Czech",
  el: "Greek", he: "Hebrew", th: "Thai", vi: "Vietnamese",
  id: "Indonesian", uk: "Ukrainian", ro: "Romanian", hu: "Hungarian",
};

/** Coerce any value to a plain string. Handles objects, arrays, etc. */
function toStr(val: unknown): string {
  if (typeof val === "string") return val;
  if (val == null) return "";
  return String(val);
}

/** Merge upstream text from multiple inputs. Always returns a plain string. */
function mergeInputText(inputs: NodeOutput[]): string {
  return inputs
    .map((inp) => toStr(inp.text) || toStr(inp.replacePrompt) || toStr(inp.injectedPrompt) || toStr(inp.personaDescription) || "")
    .filter(Boolean)
    .join("\n\n");
}

/** Extract persona data from adapter inputs (filters to those with personaDescription). */
function extractPersonas(adapterInputs: NodeOutput[]): PersonaInput[] {
  return adapterInputs
    .filter((inp) => inp.personaDescription)
    .map((inp) => ({
      name: inp.personaName || "Character",
      description: inp.personaDescription!,
    }));
}

/** If personas are present, call /api/inject-persona to merge them into the text. */
async function injectPersonasIfPresent(
  text: string,
  adapterInputs: NodeOutput[],
  providerId: string,
  maxTokens?: number
): Promise<string> {
  const personas = extractPersonas(adapterInputs);
  if (personas.length === 0) return text;

  const res = await fetch("/api/inject-persona", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      personas,
      promptText: text,
      providerId,
      ...(maxTokens && { maxTokens }),
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Persona injection failed" }));
    throw new Error(err.error || "Persona injection failed");
  }

  const { injected } = await res.json();
  return injected;
}

/**
 * ConsistentCharacterNode: pure data source — outputs cached persona description.
 * Connects via adapter handles (bottom → top) to prompt-generating nodes.
 */
const consistentCharacter: NodeExecutor = async (ctx) => {
  const { nodeData } = ctx;
  const personaDescription = nodeData.characterDescription as string;
  const characterName = nodeData.characterName as string;

  if (!personaDescription) {
    return {
      success: false,
      output: { error: "No character selected — drag one from Assets" },
    };
  }

  return {
    success: true,
    output: {
      text: personaDescription,
      personaDescription,
      personaName: characterName || "Character",
    },
  };
};

/** InitialPromptNode: pass-through text, with persona injection if adapters connected. */
const initialPrompt: NodeExecutor = async (ctx) => {
  const text = (ctx.nodeData.text as string) || "";
  const maxTokens = (ctx.nodeData.maxTokens as number) || undefined;
  if (!text.trim()) {
    return { success: false, output: { error: "No prompt text entered" } };
  }

  const start = Date.now();
  const finalText = await injectPersonasIfPresent(text, ctx.adapterInputs, ctx.providerId, maxTokens);

  return {
    success: true,
    output: { text: finalText, durationMs: Date.now() - start },
  };
};

/** PromptEnhancerNode: enhances upstream text with additional notes via /api/enhance. */
const promptEnhancer: NodeExecutor = async (ctx) => {
  const { nodeData, inputs, adapterInputs, providerId } = ctx;
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
      ...(maxTokens && { maxTokens }),
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Enhancement failed" }));
    return { success: false, output: { error: err.error || "Enhancement failed" } };
  }

  const { enhanced } = await res.json();
  const finalText = await injectPersonasIfPresent(enhanced, adapterInputs, providerId, maxTokens);

  return {
    success: true,
    output: { text: finalText, durationMs: Date.now() - start },
  };
};

/** TranslatorNode: translates upstream text to target language via /api/translate. */
const translator: NodeExecutor = async (ctx) => {
  const { nodeData, inputs, providerId } = ctx;
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

/** ImageDescriberNode: uploads image to /api/describe, outputs text description. */
const imageDescriber: NodeExecutor = async (ctx) => {
  const { nodeData, providerId } = ctx;
  const image = nodeData.image as string;

  if (!image) {
    return { success: false, output: { error: "No image uploaded" } };
  }

  const start = Date.now();

  const res = await fetch("/api/describe", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      images: [{ data: image, filename: "image.jpg", type: "reference" }],
      providerId,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Describe request failed" }));
    return { success: false, output: { error: err.error || "Image description failed" } };
  }

  const { description } = await res.json();
  return {
    success: true,
    output: { text: description, durationMs: Date.now() - start },
  };
};

/** TextOutputNode: terminal sink — receives upstream text, no API call. */
const textOutput: NodeExecutor = async (ctx) => {
  const text = mergeInputText(ctx.inputs);
  return { success: true, output: { text } };
};

/** StoryTellerNode: creative prompt generator — different output every time. */
const storyTeller: NodeExecutor = async (ctx) => {
  const { nodeData, inputs, adapterInputs, providerId } = ctx;
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
    body: JSON.stringify({ text, tags: tags || undefined, providerId, ...(maxTokens && { maxTokens }) }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Story generation failed" }));
    return { success: false, output: { error: err.error || "Story generation failed" } };
  }

  const { story } = await res.json();
  const finalText = await injectPersonasIfPresent(story, adapterInputs, providerId, maxTokens);

  return {
    success: true,
    output: { text: finalText, durationMs: Date.now() - start },
  };
};

/** GrammarFixNode: fixes grammar & typos in English text via /api/grammar-fix. */
const grammarFix: NodeExecutor = async (ctx) => {
  const { nodeData, inputs, providerId } = ctx;
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

/** SceneBuilderNode: pure source — composes rich scene prompt from config dropdowns. */
const sceneBuilder: NodeExecutor = async (ctx) => {
  const { nodeData } = ctx;
  const selections: Record<string, string> = {};
  for (const key of ["imageStyle", "lighting", "timeOfDay", "weather", "cameraAngle", "cameraLens", "mood"]) {
    const val = nodeData[key] as string;
    if (val) selections[key] = val;
  }

  const text = composeScenePrompt(selections);
  if (!text) {
    return { success: false, output: { error: "No scene attributes selected" } };
  }

  return { success: true, output: { text } };
};

/** Registry mapping node type → executor. Groups are intentionally absent. */
export const executorRegistry: ExecutorRegistry = {
  initialPrompt,
  promptEnhancer,
  translator,
  imageDescriber,
  textOutput,
  consistentCharacter,
  storyTeller,
  grammarFix,
  sceneBuilder,
};
