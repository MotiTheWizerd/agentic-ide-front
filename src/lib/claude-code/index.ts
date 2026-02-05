/**
 * Claude Code CLI Integration
 *
 * Spawns Claude Code processes to execute prompts.
 * For images, uses the Claude Agent SDK with multimodal messages.
 * Usage: await runClaude("your prompt here")
 */

import { exec } from "child_process";
import { promisify } from "util";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import { query } from "@anthropic-ai/claude-agent-sdk";
import { ClaudeCodeOptions, ClaudeCodeResult, ClaudeCodeImageInput } from "./types";

const execAsync = promisify(exec);
const DEFAULT_TIMEOUT = 120000; // 2 minutes

/**
 * Write prompt to temp file and return path
 */
function writeTempPrompt(prompt: string): string {
  const tempDir = os.tmpdir();
  const tempFile = path.join(tempDir, `claude-prompt-${Date.now()}.txt`);
  fs.writeFileSync(tempFile, prompt, "utf-8");
  return tempFile;
}

/**
 * Run Claude Code with a text prompt
 */
export async function runClaude(
  prompt: string,
  options: ClaudeCodeOptions = {}
): Promise<ClaudeCodeResult> {
  const startTime = Date.now();
  const { timeout = DEFAULT_TIMEOUT, cwd } = options;
  let tempFile: string | null = null;

  try {
    // Write prompt to temp file to handle multiline properly
    tempFile = writeTempPrompt(prompt);

    // Use type command to pipe file contents to claude
    const cmd = `type "${tempFile}" | claude --print`;

    const { stdout, stderr } = await execAsync(cmd, {
      timeout,
      cwd,
      maxBuffer: 10 * 1024 * 1024,
      shell: "cmd.exe",
    });

    return {
      success: true,
      output: stdout.trim(),
      error: stderr.trim() || undefined,
      executionTime: Date.now() - startTime,
    };
  } catch (error: unknown) {
    const execError = error as { stdout?: string; stderr?: string; message?: string };
    return {
      success: false,
      output: execError.stdout?.trim() || "",
      error: execError.stderr?.trim() || execError.message || "Unknown error",
      executionTime: Date.now() - startTime,
    };
  } finally {
    // Clean up temp file
    if (tempFile && fs.existsSync(tempFile)) {
      fs.unlinkSync(tempFile);
    }
  }
}

/**
 * Run Claude Code with an image using the Agent SDK
 * Uses multimodal messages with base64-encoded images
 */
export async function runClaudeWithImage(
  prompt: string,
  image: ClaudeCodeImageInput,
  options: ClaudeCodeOptions = {}
): Promise<ClaudeCodeResult> {
  const startTime = Date.now();
  const { cwd } = options;

  try {
    // Read image and convert to base64
    const imagePath = path.resolve(image.path);
    const imageBuffer = fs.readFileSync(imagePath);
    const base64Data = imageBuffer.toString("base64");

    // Determine media type from extension
    const ext = path.extname(imagePath).toLowerCase();
    const mediaType: "image/jpeg" | "image/png" | "image/gif" | "image/webp" =
      ext === ".png" ? "image/png" :
      ext === ".gif" ? "image/gif" :
      ext === ".webp" ? "image/webp" :
      "image/jpeg";

    // Create async generator for streaming input with multimodal content
    async function* createPrompt() {
      yield {
        type: "user" as const,
        session_id: "",
        message: {
          role: "user" as const,
          content: [
            {
              type: "image" as const,
              source: {
                type: "base64" as const,
                media_type: mediaType,
                data: base64Data,
              },
            },
            {
              type: "text" as const,
              text: prompt,
            },
          ],
        },
        parent_tool_use_id: null,
      };
    }

    let result = "";

    for await (const message of query({
      prompt: createPrompt(),
      options: {
        maxTurns: 1,
        cwd: cwd || process.cwd(),
      },
    })) {
      if ("result" in message) {
        result = message.result;
      }
    }

    return {
      success: true,
      output: result,
      executionTime: Date.now() - startTime,
    };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return {
      success: false,
      output: "",
      error: errorMessage,
      executionTime: Date.now() - startTime,
    };
  }
}

/**
 * Run multiple Claude Code calls in parallel
 */
export async function runClaudeParallel(
  prompts: string[],
  options: ClaudeCodeOptions = {}
): Promise<ClaudeCodeResult[]> {
  return Promise.all(prompts.map((prompt) => runClaude(prompt, options)));
}

/**
 * Run multiple images with Claude in parallel
 */
export async function runClaudeWithImagesParallel(
  tasks: Array<{ prompt: string; image: ClaudeCodeImageInput }>,
  options: ClaudeCodeOptions = {}
): Promise<ClaudeCodeResult[]> {
  return Promise.all(
    tasks.map((task) => runClaudeWithImage(task.prompt, task.image, options))
  );
}

export * from "./types";
