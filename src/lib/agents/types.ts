/**
 * Agent System Types
 *
 * Agents are configurable units that execute specific tasks via Claude Code.
 */

import { ClaudeCodeOptions } from "../claude-code/types";

/**
 * Agent definition
 */
export interface Agent {
  /** Unique identifier for the agent */
  id: string;
  /** Human-readable name */
  name: string;
  /** Description of what this agent does */
  description: string;
  /** Prompt template - use {{input}} for variable substitution */
  promptTemplate: string;
  /** Claude Code options for this agent */
  options?: ClaudeCodeOptions;
}

/**
 * Input to an agent execution
 */
export interface AgentInput {
  /** The main input text (replaces {{input}} in template) */
  text?: string;
  /** Additional variables for template substitution */
  variables?: Record<string, string>;
  /** Image inputs if agent supports vision */
  images?: Array<{
    data: string; // base64 or path
    label?: string;
  }>;
}

/**
 * Result from an agent execution
 */
export interface AgentResult {
  /** The agent that was executed */
  agentId: string;
  /** Whether execution succeeded */
  success: boolean;
  /** Output from the agent */
  output: string;
  /** Error if failed */
  error?: string;
  /** Execution time in ms */
  executionTime: number;
}

/**
 * Task for parallel execution
 */
export interface AgentTask {
  agent: Agent;
  input: AgentInput;
}
