/**
 * Test Visual Agent with Claude Code
 * Run with: pnpm test:visual <image-path>
 */

import { runClaudeWithImage } from "../src/lib/claude-code";

const VISUAL_AGENT_PROMPT = `You are a Visual Analysis Agent. Analyze this image and provide a detailed description for AI image generation.

Focus on:
1. PERSON: Face features, expression, hair (color, style, length), skin tone, body type
2. CLOTHING: Exact outfit description, colors, style, accessories
3. POSE: Body position, camera angle, framing
4. SETTING: Background, environment, lighting

Output a structured description that preserves every visual detail of the person.
Be specific and detailed - this will be used to recreate this exact person in another scene.`;

async function testVisualAgent(imagePath: string) {
  console.log("\n" + "=".repeat(60));
  console.log("Visual Agent Test");
  console.log("=".repeat(60));
  console.log("Image:", imagePath);
  console.log("Prompt:", VISUAL_AGENT_PROMPT.substring(0, 100) + "...");
  console.log("=".repeat(60));

  const result = await runClaudeWithImage(VISUAL_AGENT_PROMPT, {
    path: imagePath,
    label: "persona",
  });

  console.log("\nSuccess:", result.success);
  console.log("Time:", result.executionTime, "ms");
  console.log("\n--- OUTPUT ---\n");
  console.log(result.output);

  if (result.error) {
    console.log("\n--- ERROR ---\n");
    console.log(result.error);
  }

  return result;
}

async function main() {
  const imagePath = process.argv[2];

  if (!imagePath) {
    console.log("Usage: pnpm test:visual <image-path>");
    console.log("Example: pnpm test:visual ./test-image.jpg");
    process.exit(1);
  }

  await testVisualAgent(imagePath);
}

main().catch(console.error);
