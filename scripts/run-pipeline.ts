/**
 * Run Full Pipeline with Claude Code CLI
 *
 * Usage:
 *   pnpm pipeline --persona <image> --target <image> [--reference <image>...]
 *
 * Examples:
 *   pnpm pipeline --persona person.jpg --target pose.jpg
 *   pnpm pipeline --persona person.jpg --target pose.jpg --reference scene1.jpg
 *   pnpm pipeline -p person.jpg -t pose.jpg -r scene.jpg
 */

import * as fs from "fs";
import * as path from "path";
import { runClaudeWithImage, runClaude } from "../src/lib/claude-code";

interface PipelineInput {
  personaPath: string;
  targetPath: string;
  referencePaths: string[];
  additionalText?: string;
}

interface PipelineResult {
  success: boolean;
  personaDescription?: string;
  replacePrompt?: string;
  error?: string;
  timing: {
    step1Ms: number;
    step2Ms: number;
    totalMs: number;
  };
}

function validateImage(imagePath: string): void {
  const absolutePath = path.resolve(imagePath);
  if (!fs.existsSync(absolutePath)) {
    throw new Error(`Image not found: ${absolutePath}`);
  }

  const ext = path.extname(absolutePath).toLowerCase();
  const validExts = [".jpg", ".jpeg", ".png", ".gif", ".webp"];
  if (!validExts.includes(ext)) {
    throw new Error(`Unsupported image format: ${ext}`);
  }

  const stats = fs.statSync(absolutePath);
  const sizeMB = stats.size / (1024 * 1024);
  console.log(`  Validated: ${path.basename(absolutePath)} (${sizeMB.toFixed(2)}MB)`);
}

function parseArgs(): PipelineInput {
  const args = process.argv.slice(2);
  let personaPath = "";
  let targetPath = "";
  const referencePaths: string[] = [];
  let additionalText = "";

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    const nextArg = args[i + 1];

    if ((arg === "--persona" || arg === "-p") && nextArg) {
      personaPath = nextArg;
      i++;
    } else if ((arg === "--target" || arg === "-t") && nextArg) {
      targetPath = nextArg;
      i++;
    } else if ((arg === "--reference" || arg === "-r") && nextArg) {
      referencePaths.push(nextArg);
      i++;
    } else if ((arg === "--text" || arg === "-x") && nextArg) {
      additionalText = nextArg;
      i++;
    }
  }

  return { personaPath, targetPath, referencePaths, additionalText };
}

function printUsage() {
  console.log(`
Pipeline Script - Generate Replace Prompts using Claude Code

Usage:
  pnpm pipeline --persona <image> --target <image> [options]

Required:
  -p, --persona <path>    Persona image (face/identity to use)
  -t, --target <path>     Target image (pose/clothes to keep)

Optional:
  -r, --reference <path>  Reference image(s) for scene/style (can use multiple)
  -x, --text <text>       Additional instructions

Examples:
  pnpm pipeline -p person.jpg -t pose.jpg
  pnpm pipeline -p person.jpg -t pose.jpg -r scene1.jpg -r scene2.jpg
  pnpm pipeline --persona me.png --target outfit.png --text "cinematic lighting"
`);
}

async function runPipeline(input: PipelineInput): Promise<PipelineResult> {
  const startTime = Date.now();
  let step1Time = 0;
  let step2Time = 0;

  try {
    console.log("\n" + "=".repeat(60));
    console.log("PIPELINE - Claude Code Full Workflow");
    console.log("=".repeat(60));
    console.log("Persona:", input.personaPath);
    console.log("Target:", input.targetPath);
    console.log("References:", input.referencePaths.length > 0 ? input.referencePaths.join(", ") : "(none)");
    if (input.additionalText) console.log("Text:", input.additionalText);
    console.log("=".repeat(60));

    // Validate images
    console.log("\nValidating images...");
    validateImage(input.personaPath);
    validateImage(input.targetPath);
    input.referencePaths.forEach(validateImage);

    // ============================================
    // STEP 1: Generate Persona Description
    // ============================================
    console.log("\n--- STEP 1: Analyzing Persona with Claude Code ---");
    const step1Start = Date.now();

    const step1Prompt = `You are a Visual Analysis Agent. Analyze this image and provide a detailed description for AI image generation.

Focus on:
1. PERSON: Face features, expression, hair (color, style, length), skin tone, body type
2. CLOTHING: Exact outfit description, colors, style, accessories
3. POSE: Body position, camera angle, framing
4. SETTING: Background, environment, lighting

${input.additionalText ? `Additional context: ${input.additionalText}\n` : ""}
Output a structured description that preserves every visual detail of the person.
Be specific and detailed - this will be used to recreate this exact person in another scene.`;

    const step1Result = await runClaudeWithImage(
      step1Prompt,
      { path: path.resolve(input.personaPath), label: "persona" },
      { timeout: 180000 } // 3 minutes
    );

    step1Time = Date.now() - step1Start;

    if (!step1Result.success) {
      throw new Error(`Step 1 failed: ${step1Result.error}`);
    }

    const personaDescription = step1Result.output;
    console.log(`\nStep 1 complete (${step1Time}ms)`);
    console.log("\n--- PERSONA DESCRIPTION ---");
    console.log(personaDescription);

    // ============================================
    // STEP 2: Generate Replace Prompt
    // ============================================
    console.log("\n--- STEP 2: Generating Replace Prompt with Claude Code ---");
    const step2Start = Date.now();

    const step2Prompt = `You are analyzing a TARGET IMAGE to create an AI image generation prompt.

## PERSONA DESCRIPTION (this person's IDENTITY/FACE must be used):
${personaDescription}

## YOUR TASK:
Analyze this TARGET IMAGE and create a detailed prompt that will:

1. USE THE PERSONA'S IDENTITY from the description above:
   - Their face, facial features, skin tone
   - Their hair style and color
   - Their body type and distinctive characteristics
   - DO NOT use their original clothing - ignore clothing from persona description

2. KEEP EVERYTHING FROM THIS TARGET IMAGE:
   - The EXACT clothing and accessories the person is wearing
   - The EXACT pose and body position
   - The EXACT camera angle and framing
   - The background/environment/scene
   - The lighting and mood

3. THE GOAL: Replace ONLY the person's identity in the target image with the persona, keeping the target's clothes, pose, and scene.

Think of it as: "Put the persona's face on the person in this image, keeping everything else identical"

Output ONLY the final image generation prompt.`;

    const step2Result = await runClaudeWithImage(
      step2Prompt,
      { path: path.resolve(input.targetPath), label: "target" },
      { timeout: 180000 }
    );

    step2Time = Date.now() - step2Start;

    if (!step2Result.success) {
      throw new Error(`Step 2 failed: ${step2Result.error}`);
    }

    const replacePrompt = step2Result.output;

    console.log(`\nStep 2 complete (${step2Time}ms)`);
    console.log("\n" + "=".repeat(60));
    console.log("FINAL REPLACE PROMPT");
    console.log("=".repeat(60));
    console.log(replacePrompt);

    const totalTime = Date.now() - startTime;
    console.log("\n" + "=".repeat(60));
    console.log("TIMING SUMMARY");
    console.log("=".repeat(60));
    console.log(`Step 1 (Persona):  ${step1Time}ms`);
    console.log(`Step 2 (Replace):  ${step2Time}ms`);
    console.log(`Total:             ${totalTime}ms`);
    console.log("=".repeat(60));

    return {
      success: true,
      personaDescription,
      replacePrompt,
      timing: { step1Ms: step1Time, step2Ms: step2Time, totalMs: totalTime },
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Pipeline failed";
    console.error("\nPipeline Error:", errorMessage);
    return {
      success: false,
      error: errorMessage,
      timing: {
        step1Ms: step1Time,
        step2Ms: step2Time,
        totalMs: Date.now() - startTime,
      },
    };
  }
}

async function main() {
  const input = parseArgs();

  if (!input.personaPath || !input.targetPath) {
    printUsage();
    process.exit(1);
  }

  const result = await runPipeline(input);

  if (!result.success) {
    process.exit(1);
  }
}

main().catch(console.error);
