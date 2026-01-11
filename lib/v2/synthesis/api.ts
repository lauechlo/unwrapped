/**
 * V2 Claude API Wrapper
 * Handles synthesis requests with V2 system prompt
 */

import Anthropic from '@anthropic-ai/sdk';
import { SYNTHESIS_SYSTEM_PROMPT } from './prompts';

// Lazily initialized Anthropic client
let anthropicClient: Anthropic | null = null;

function getAnthropicClient(): Anthropic {
  if (!anthropicClient) {
    const apiKey = process.env.ANTHROPIC_API_KEY;

    if (!apiKey) {
      console.error('[V2 Claude API] API key not found in environment');
      throw new Error('ANTHROPIC_API_KEY not set in environment');
    }

    anthropicClient = new Anthropic({
      apiKey,
    });
  }

  return anthropicClient;
}

export interface ClaudeOptions {
  maxTokens?: number;
  temperature?: number;
  expectJson?: boolean;
  model?: 'sonnet' | 'haiku';
}

/**
 * Call Claude API with V2 synthesis system prompt
 * Implements prefilling for guaranteed JSON + caching for cost optimization
 */
export async function callClaude(
  prompt: string,
  options: ClaudeOptions = {}
): Promise<string> {
  const {
    maxTokens = 1000,
    temperature = 0.3,  // Lower temperature for V2 - we want accuracy, not creativity
    expectJson = true,   // V2 defaults to JSON output
    model = 'haiku',     // V2 defaults to Haiku - detectors already did the hard work
  } = options;

  try {
    // Select model ID
    const modelId = model === 'haiku'
      ? 'claude-3-5-haiku-20241022'  // Fast + cheap
      : 'claude-sonnet-4-20250514';   // Quality when needed

    console.log(`[V2 Claude API] Sending request (model: ${model}, temp: ${temperature}, json: ${expectJson})...`);

    const anthropic = getAnthropicClient();

    // Build messages with optional prefilling for JSON
    const messages: Anthropic.MessageParam[] = [
      { role: 'user', content: prompt }
    ];

    // Prefill technique for guaranteed JSON structure
    // Per Anthropic docs: forces Claude to continue with JSON
    if (expectJson) {
      messages.push({
        role: 'assistant',
        content: '{'  // Forces Claude to continue with JSON object
      });
    }

    const response = await anthropic.messages.create({
      model: modelId,
      max_tokens: maxTokens,
      temperature,
      // Use prompt caching for system prompt (90% cost savings)
      // Per Anthropic docs: cache_control marks content for caching
      system: [
        {
          type: 'text',
          text: SYNTHESIS_SYSTEM_PROMPT,
          cache_control: { type: 'ephemeral' }
        }
      ],
      messages
    });

    let text = response.content[0].type === 'text'
      ? response.content[0].text
      : '';

    // Re-add prefilled opening brace if we used prefilling
    if (expectJson) {
      text = '{' + text;
    }

    console.log('[V2 Claude API] Response received:', text.substring(0, 150) + '...');

    if (expectJson) {
      // Validate JSON before returning
      try {
        JSON.parse(text);
      } catch (e) {
        console.error('[V2 Claude API] Invalid JSON response:', text);
        throw new Error('Claude returned invalid JSON');
      }

      return text;
    }

    return text;
  } catch (error) {
    console.error('[V2 Claude API] Error:', error);
    throw new Error('Failed to generate synthesis');
  }
}
