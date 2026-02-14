import type { NodeOutput, PersonaInput } from "../types";

/** Map language codes to full names for translation prompts. */
export const LANGUAGE_NAMES: Record<string, string> = {
  en: "English", es: "Spanish", fr: "French", de: "German",
  it: "Italian", pt: "Portuguese", ru: "Russian", ja: "Japanese",
  ko: "Korean", zh: "Chinese", ar: "Arabic", hi: "Hindi",
  tr: "Turkish", pl: "Polish", nl: "Dutch", sv: "Swedish",
  da: "Danish", fi: "Finnish", no: "Norwegian", cs: "Czech",
  el: "Greek", he: "Hebrew", th: "Thai", vi: "Vietnamese",
  id: "Indonesian", uk: "Ukrainian", ro: "Romanian", hu: "Hungarian",
};

/** Coerce any value to a plain string. Handles objects, arrays, etc. */
export function toStr(val: unknown): string {
  if (typeof val === "string") return val;
  if (val == null) return "";
  return String(val);
}

/** Merge upstream text from multiple inputs. Always returns a plain string. */
export function mergeInputText(inputs: NodeOutput[]): string {
  return inputs
    .map((inp) => toStr(inp.text) || toStr(inp.replacePrompt) || toStr(inp.injectedPrompt) || toStr(inp.personaDescription) || "")
    .filter(Boolean)
    .join("\n\n");
}

/** Extract persona data from adapter inputs (filters to those with personaDescription). */
export function extractPersonas(adapterInputs: NodeOutput[]): PersonaInput[] {
  return adapterInputs
    .filter((inp) => inp.personaDescription)
    .map((inp) => ({
      name: inp.personaName || "Character",
      description: inp.personaDescription!,
    }));
}

/** If personas are present, call /api/inject-persona to merge them into the text. */
export async function injectPersonasIfPresent(
  text: string,
  adapterInputs: NodeOutput[],
  providerId: string,
  maxTokens?: number,
  model?: string
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
      ...(model && { model }),
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
