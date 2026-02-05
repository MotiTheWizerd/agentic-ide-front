/**
 * Agent Executor
 *
 * Runs agents using Claude Code CLI.
 */

import { runClaude } from "../claude-code";
import { Agent, AgentInput, AgentResult, AgentTask } from "./types";

/**
 * Build the final prompt from agent template and input
 */
function buildPrompt(agent: Agent, input: AgentInput): string {
  let prompt = agent.promptTemplate;

  // Replace {{input}} with main text
  if (input.text) {
    prompt = prompt.replace(/\{\{input\}\}/g, input.text);
  }

  // Replace other variables
  if (input.variables) {
    for (const [key, value] of Object.entries(input.variables)) {
      prompt = prompt.replace(new RegExp(`\\{\\{${key}\\}\\}`, "g"), value);
    }
  }

  return prompt;
}

/**
 * Run a single agent
 */
export async function runAgent(
  agent: Agent,
  input: AgentInput
): Promise<AgentResult> {
  const prompt = buildPrompt(agent, input);

  const result = await runClaude(prompt, agent.options);

  return {
    agentId: agent.id,
    success: result.success,
    output: result.output,
    error: result.error,
    executionTime: result.executionTime,
  };
}

/**
 * Run multiple agents in parallel
 */
export async function runAgentsParallel(
  tasks: AgentTask[]
): Promise<AgentResult[]> {
  return Promise.all(
    tasks.map((task) => runAgent(task.agent, task.input))
  );
}

/**
 * Run agents sequentially, passing output to next agent
 */
export async function runAgentsPipeline(
  agents: Agent[],
  initialInput: AgentInput
): Promise<AgentResult[]> {
  const results: AgentResult[] = [];
  let currentInput = initialInput;

  for (const agent of agents) {
    const result = await runAgent(agent, currentInput);
    results.push(result);

    if (!result.success) {
      break; // Stop pipeline on failure
    }

    // Pass output as input to next agent
    currentInput = { text: result.output };
  }

  return results;
}

export * from "./types";
