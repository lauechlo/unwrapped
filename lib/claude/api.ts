/**
 * Claude API Wrapper
 * Handles all communication with Anthropic API
 */

import Anthropic from '@anthropic-ai/sdk';
import { RESEARCHER_SYSTEM_PROMPT } from './prompts';

// Get Anthropic client - lazily initialized to allow env vars to load
let anthropicClient: Anthropic | null = null;

function getAnthropicClient(): Anthropic {
  if (!anthropicClient) {
    const apiKey = process.env.ANTHROPIC_API_KEY;

    if (!apiKey) {
      console.error('[Claude API] API key not found in environment');
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
}

export async function callClaude(
  prompt: string,
  options: ClaudeOptions = {}
): Promise<string> {
  const {
    maxTokens = 2000,
    temperature = 0.7,
    expectJson = false
  } = options;

  try {
    console.log('[Claude API] Sending request...');

    const anthropic = getAnthropicClient();

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: maxTokens,
      temperature,
      system: RESEARCHER_SYSTEM_PROMPT,
      messages: [
        { role: 'user', content: prompt }
      ]
    });

    const text = response.content[0].type === 'text'
      ? response.content[0].text
      : '';

    console.log('[Claude API] Response received:', text.substring(0, 200) + '...');

    if (expectJson) {
      // Strip markdown code blocks if present
      let cleanedText = text.trim();
      if (cleanedText.startsWith('```json')) {
        cleanedText = cleanedText.replace(/^```json\n?/, '').replace(/\n?```$/, '');
      } else if (cleanedText.startsWith('```')) {
        cleanedText = cleanedText.replace(/^```\n?/, '').replace(/\n?```$/, '');
      }

      // Validate JSON before returning
      try {
        JSON.parse(cleanedText);
      } catch (e) {
        console.error('[Claude API] Invalid JSON response:', cleanedText);
        throw new Error('Claude returned invalid JSON');
      }

      return cleanedText;
    }

    return text;
  } catch (error) {
    console.error('[Claude API] Error:', error);
    throw new Error('Failed to generate insight');
  }
}
