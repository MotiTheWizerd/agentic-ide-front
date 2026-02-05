/**
 * Simple test for Claude Code integration
 * Run with: pnpm test:claude
 */

import { runClaude, runClaudeParallel } from "../src/lib/claude-code";

async function testSimple() {
  console.log("\n" + "=".repeat(50));
  console.log("Test 1: Simple prompt");
  console.log("=".repeat(50));

  const result = await runClaude("say hello in exactly 3 words");

  console.log("Success:", result.success);
  console.log("Time:", result.executionTime, "ms");
  console.log("Output:", result.output);
  if (result.error) console.log("Error:", result.error);
}

async function testParallel() {
  console.log("\n" + "=".repeat(50));
  console.log("Test 2: Parallel execution");
  console.log("=".repeat(50));

  const prompts = [
    "what is 2+2? answer with just the number",
    "what is 3+3? answer with just the number",
  ];

  console.log("Running 2 prompts in parallel...");
  const startTime = Date.now();

  const results = await runClaudeParallel(prompts);

  const totalTime = Date.now() - startTime;
  console.log(`Total time: ${totalTime}ms`);

  results.forEach((result, i) => {
    console.log(`\nResult ${i + 1}:`);
    console.log("  Success:", result.success);
    console.log("  Time:", result.executionTime, "ms");
    console.log("  Output:", result.output);
  });
}

async function main() {
  console.log("Claude Code Integration Test");
  console.log("============================\n");

  await testSimple();
  await testParallel();

  console.log("\n" + "=".repeat(50));
  console.log("Tests complete!");
  console.log("=".repeat(50));
}

main().catch(console.error);
