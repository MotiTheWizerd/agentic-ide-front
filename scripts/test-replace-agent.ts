/**
 * Test Replace Agent (Step 2 only)
 *
 * Usage:
 *   pnpm test:replace --target <image> --desc <text or file>
 *
 * Examples:
 *   pnpm test:replace -t pose.jpg -d "A woman with red hair, blue eyes..."
 *   pnpm test:replace -t pose.jpg -f persona-description.txt
 */

import * as fs from "fs";
import * as path from "path";
import { runClaudeWithImage } from "../src/lib/claude-code";

function validateImage(imagePath: string): void {
  const absolutePath = path.resolve(imagePath);
  if (!fs.existsSync(absolutePath)) {
    throw new Error(`Image not found: ${absolutePath}`);
  }

  const ext = path.extname(absolutePath).toLowerCase();
  const validExts = [".jpg", ".jpeg", ".png", ".gif", ".webp"];
  if (!validExts.includes(ext)) {
    throw new Error(`Unsupported image format: ${ext}. Use JPG, PNG, GIF, or WEBP`);
  }

  const stats = fs.statSync(absolutePath);
  const sizeMB = stats.size / (1024 * 1024);
  console.log(`Validated: ${path.basename(absolutePath)} (${sizeMB.toFixed(2)}MB)`);
}

function parseArgs(): { targetPath: string; personaDescription: string } {
  const args = process.argv.slice(2);
  let targetPath = "";
  let personaDescription = "";
  let descFile = "";

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    const nextArg = args[i + 1];

    if ((arg === "--target" || arg === "-t") && nextArg) {
      targetPath = nextArg;
      i++;
    } else if ((arg === "--desc" || arg === "-d") && nextArg) {
      personaDescription = nextArg;
      i++;
    } else if ((arg === "--file" || arg === "-f") && nextArg) {
      descFile = nextArg;
      i++;
    }
  }

  // Read description from file if provided
  if (descFile && !personaDescription) {
    const filePath = path.resolve(descFile);
    if (fs.existsSync(filePath)) {
      personaDescription = fs.readFileSync(filePath, "utf-8");
    } else {
      throw new Error(`Description file not found: ${filePath}`);
    }
  }

  return { targetPath, personaDescription };
}

function printUsage() {
  console.log(`
Test Replace Agent - Run Step 2 only

Usage:
  pnpm test:replace --target <image> --desc <description>
  pnpm test:replace --target <image> --file <description-file>

Required:
  -t, --target <path>     Target image (pose/clothes to keep)

One of:
  -d, --desc <text>       Persona description text
  -f, --file <path>       File containing persona description

Examples:
  pnpm test:replace -t pose.jpg -d "A woman with red hair, fair skin..."
  pnpm test:replace -t pose.jpg -f persona.txt
`);
}

// Default test persona description if none provided
const DEFAULT_PERSONA = `A young woman with the following characteristics:

**Face & Features:**
- Oval face shape with soft, feminine features
- Fair skin with a warm undertone
- Large, expressive blue-green eyes with long lashes
- Naturally arched eyebrows, medium brown
- Small, straight nose
- Full lips with a natural pink color
- High cheekbones with a subtle rosy flush

**Hair:**
- Long, wavy auburn/copper-red hair
- Falls past shoulders to mid-back
- Soft, voluminous waves with natural texture
- Vibrant warm red tone that catches light

**Body Type:**
- Hourglass figure with defined waist
- Medium height, confident posture
- Smooth, healthy-looking skin`;

async function testReplaceAgent(targetPath: string, personaDescription: string) {
  console.log("\n" + "=".repeat(60));
  console.log("TEST REPLACE AGENT (Step 2 Only)");
  console.log("=".repeat(60));
  console.log("Target:", targetPath);
  console.log("Persona desc length:", personaDescription.length, "chars");
  console.log("=".repeat(60));

  // Validate target image
  console.log("\nValidating target image...");
  validateImage(targetPath);

  console.log("\n--- PERSONA DESCRIPTION (input) ---");
  console.log(personaDescription.substring(0, 500) + (personaDescription.length > 500 ? "..." : ""));

  console.log("\n--- Running Replace Agent ---");
  const startTime = Date.now();

  const prompt = `You are analyzing a TARGET IMAGE to create an AI image generation prompt.

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

  const result = await runClaudeWithImage(
    prompt,
    { path: path.resolve(targetPath), label: "target" },
    { timeout: 180000 }
  );

  const elapsed = Date.now() - startTime;

  console.log("\nSuccess:", result.success);
  console.log("Time:", elapsed, "ms");

  if (result.success) {
    console.log("\n" + "=".repeat(60));
    console.log("REPLACE PROMPT OUTPUT");
    console.log("=".repeat(60));
    console.log(result.output);
  } else {
    console.log("\n--- ERROR ---");
    console.log(result.error);
  }

  return result;
}

async function main() {
  const { targetPath, personaDescription } = parseArgs();

  if (!targetPath) {
    printUsage();
    process.exit(1);
  }

  // Use default persona if none provided
  const desc = personaDescription || DEFAULT_PERSONA;
  if (!personaDescription) {
    console.log("No persona description provided, using default test persona.");
  }

  await testReplaceAgent(targetPath, desc);
}

main().catch(console.error);
