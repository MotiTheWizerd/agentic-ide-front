import { NextRequest, NextResponse } from "next/server";
import { runClaude } from "@/lib/claude-code";

export async function POST(request: NextRequest) {
  try {
    const { prompt } = await request.json();

    if (!prompt) {
      return NextResponse.json(
        { error: "prompt is required" },
        { status: 400 }
      );
    }

    console.log("=== Claude Code Test ===");
    console.log("Prompt:", prompt);

    const result = await runClaude(prompt);

    console.log("Success:", result.success);
    console.log("Execution time:", result.executionTime, "ms");
    console.log("Output length:", result.output.length);

    return NextResponse.json(result);
  } catch (error: unknown) {
    console.error("Test Error:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed";
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}
