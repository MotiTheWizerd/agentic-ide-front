import { NextRequest, NextResponse } from "next/server";
import { getProvider, DEFAULT_PROVIDER, extractTextContent } from "@/lib/providers";
import { callClaudeText } from "@/lib/claude-code/api-adapter";

export async function POST(request: NextRequest) {
  try {
    const { text, style, providerId = DEFAULT_PROVIDER, maxTokens } = await request.json();

    if (!text) {
      return NextResponse.json({ error: "Text is required" }, { status: 400 });
    }

    const styleInstruction = style
      ? ` Adjust the tone to be ${style}.`
      : "";

    const prompt = `Fix all grammar, spelling, and punctuation errors in the following English text.${styleInstruction} Output ONLY the corrected text, nothing else. Do not add explanations, notes, or formatting. Keep the output under 2500 characters.\n\n${text}`;

    // === Claude CLI provider ===
    if (providerId === "claude") {
      const fixed = await callClaudeText(prompt);
      return NextResponse.json({ fixed });
    }

    // === OpenAI-compatible providers (Mistral, GLM, OpenRouter) ===
    const provider = getProvider(providerId);

    const response = await provider.client.chat.completions.create({
      model: provider.textModel,
      stream: false,
      messages: [{ role: "user", content: prompt }],
      max_tokens: maxTokens || 2000,
    });

    return NextResponse.json({
      fixed: extractTextContent(response.choices[0]?.message?.content),
    });
  } catch (error: unknown) {
    console.error("Grammar Fix API Error:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Failed to fix grammar";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
