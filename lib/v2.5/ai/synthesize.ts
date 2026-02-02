/**
 * V2.5 AI Synthesis Engine
 *
 * Main synthesis function that calls Claude Haiku to generate personalized insights.
 * Validates output against evidence to prevent hallucination.
 *
 * Cost: ~$0.01-0.03 per user (1 Claude Haiku call)
 */

import Anthropic from '@anthropic-ai/sdk';
import { z } from 'zod';
import type { TypeResult } from '../typing/types';
import type { DetectionResult } from '@/lib/v2/types';
import type { ScopedAIOutput, SynthesisStats } from './types';
import { V25_SYSTEM_PROMPT, buildSynthesisPrompt } from './prompts';

// ============================================================================
// Zod Schema for Output Validation
// ============================================================================

/**
 * Strict validation schema for AI output
 * Ensures character limits and required fields
 */
const ScopedAIOutputSchema = z.object({
  heroInsight: z.string()
    .min(50, 'Hero insight must be at least 50 characters')
    .max(120, 'Hero insight must be under 120 characters'),
  crossPatternSynthesis: z.string()
    .min(250, 'Cross-pattern synthesis must be at least 250 characters')
    .max(550, 'Cross-pattern synthesis must be under 550 characters'),
  psychologicalSummary: z.string()
    .min(200, 'Psychological summary must be at least 200 characters')
    .max(500, 'Psychological summary must be under 500 characters'),
});

// ============================================================================
// Anthropic Client
// ============================================================================

let anthropicClient: Anthropic | null = null;

function getAnthropicClient(): Anthropic {
  if (!anthropicClient) {
    const apiKey = process.env.ANTHROPIC_API_KEY;

    if (!apiKey) {
      console.error('[V2.5 AI] ANTHROPIC_API_KEY not found in environment');
      throw new Error('ANTHROPIC_API_KEY not set');
    }

    anthropicClient = new Anthropic({ apiKey });
  }

  return anthropicClient;
}

// ============================================================================
// Evidence Extraction for Validation
// ============================================================================

/**
 * Build an allowlist of valid evidence from input data
 * Used to validate AI output doesn't hallucinate
 */
function buildEvidenceAllowlist(
  typeResult: TypeResult,
  patterns: DetectionResult[],
  stats: SynthesisStats
): Set<string> {
  const allowlist = new Set<string>();

  // Add type codes and labels
  allowlist.add(typeResult.code.toLowerCase());
  typeResult.dimensions.forEach(d => {
    allowlist.add(d.code.toLowerCase());
    allowlist.add(d.label.toLowerCase());
  });

  // Add numbers from type dimensions
  typeResult.dimensions.forEach(d => {
    if (d.evidence?.topExamples) {
      d.evidence.topExamples.forEach(e => {
        // Extract numbers from value and detail
        const nums = (e.value + ' ' + e.detail).match(/\d+/g);
        if (nums) nums.forEach(n => allowlist.add(n));

        // Extract artist/track names (lowercase for comparison)
        const words = e.value.toLowerCase().split(/[\s,]+/);
        words.forEach(w => {
          if (w.length > 2) allowlist.add(w);
        });
      });
    }
  });

  // Add pattern evidence
  patterns.forEach(p => {
    allowlist.add(p.patternName.toLowerCase());
    p.evidence.forEach(e => {
      // Extract all numbers
      const nums = e.humanReadable.match(/\d+/g);
      if (nums) nums.forEach(n => allowlist.add(n));

      // Extract artist/track names
      if (e.type === 'artist' || e.type === 'track') {
        const words = String(e.value).toLowerCase().split(/[\s,]+/);
        words.forEach(w => {
          if (w.length > 2) allowlist.add(w);
        });
      }
    });
  });

  // Add stats numbers
  allowlist.add(String(stats.totalPlays));
  allowlist.add(String(stats.uniqueArtists));
  allowlist.add(String(stats.uniqueTracks));

  return allowlist;
}

/**
 * Validate AI output doesn't contain hallucinated numbers
 * Returns warnings (not rejections) for soft validation
 */
function validateAgainstEvidence(
  output: ScopedAIOutput,
  allowlist: Set<string>
): string[] {
  const warnings: string[] = [];

  // Extract all numbers from output
  const allText = `${output.heroInsight} ${output.crossPatternSynthesis} ${output.psychologicalSummary}`;
  const numbers = allText.match(/\d+/g) || [];

  // Check if numbers are in allowlist
  numbers.forEach(num => {
    if (!allowlist.has(num)) {
      // Allow common numbers (1-10) and percentages
      const n = parseInt(num, 10);
      if (n > 10 && !allowlist.has(num)) {
        warnings.push(`Number "${num}" not found in evidence`);
      }
    }
  });

  return warnings;
}

// ============================================================================
// Main Synthesis Function
// ============================================================================

export interface SynthesizeOptions {
  /** Validate output against evidence allowlist (default: true) */
  validateEvidence?: boolean;
  /** Max retries on validation failure (default: 1) */
  maxRetries?: number;
}

/**
 * Generate personalized AI insights from type result and patterns
 *
 * @param typeResult - Calculated music type result
 * @param patterns - Detected listening patterns
 * @param stats - Basic listening stats
 * @param options - Synthesis options
 * @returns Scoped AI output with hero insight, synthesis, and summary
 */
export async function synthesizeScoped(
  typeResult: TypeResult,
  patterns: DetectionResult[],
  stats: SynthesisStats,
  options: SynthesizeOptions = {}
): Promise<ScopedAIOutput> {
  const { validateEvidence = true, maxRetries = 1 } = options;

  console.log(`[V2.5 AI] Starting synthesis for type ${typeResult.code} with ${patterns.length} patterns`);

  const anthropic = getAnthropicClient();

  // Build prompt
  const prompt = buildSynthesisPrompt(typeResult, patterns, stats);

  // Build evidence allowlist for validation
  const allowlist = validateEvidence
    ? buildEvidenceAllowlist(typeResult, patterns, stats)
    : new Set<string>();

  let lastError: Error | null = null;
  let attempts = 0;

  while (attempts <= maxRetries) {
    attempts++;

    try {
      console.log(`[V2.5 AI] Calling Claude Haiku (attempt ${attempts}/${maxRetries + 1})...`);

      const response = await anthropic.messages.create({
        model: 'claude-3-5-haiku-20241022',
        max_tokens: 800,
        temperature: 0.4, // Slightly creative but constrained
        system: [
          {
            type: 'text',
            text: V25_SYSTEM_PROMPT,
            cache_control: { type: 'ephemeral' } // 90% cost savings on system prompt
          }
        ],
        messages: [
          { role: 'user', content: prompt },
          { role: 'assistant', content: '{' } // Prefill for JSON
        ]
      });

      // Extract text response
      let text = response.content[0].type === 'text'
        ? '{' + response.content[0].text
        : '';

      console.log('[V2.5 AI] Raw response:', text.substring(0, 200) + '...');

      // Parse JSON
      let parsed: unknown;
      try {
        parsed = JSON.parse(text);
      } catch (e) {
        console.error('[V2.5 AI] Invalid JSON:', text);
        throw new Error('Claude returned invalid JSON');
      }

      // Validate against schema
      const validated = ScopedAIOutputSchema.parse(parsed);

      // Validate against evidence (warnings only)
      if (validateEvidence) {
        const warnings = validateAgainstEvidence(validated, allowlist);
        if (warnings.length > 0) {
          console.warn('[V2.5 AI] Evidence validation warnings:', warnings);
          // Continue anyway - these are soft warnings
        }
      }

      console.log('[V2.5 AI] Synthesis complete');
      return validated;

    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      console.error(`[V2.5 AI] Attempt ${attempts} failed:`, lastError.message);

      // Don't retry on validation errors (likely a prompt issue)
      if (error instanceof z.ZodError) {
        const zodError = error as z.ZodError<ScopedAIOutput>;
        console.error('[V2.5 AI] Zod validation errors:', zodError.issues);
        throw new Error(`Output validation failed: ${zodError.issues.map((e: z.ZodIssue) => e.message).join(', ')}`);
      }
    }
  }

  throw lastError || new Error('Synthesis failed after retries');
}

/**
 * Generate fallback output when AI synthesis fails
 * Uses template-based generation from type result
 */
export function generateFallback(typeResult: TypeResult): ScopedAIOutput {
  const [temporal, processing, discovery, attachment] = typeResult.dimensions;

  // Build hero insight from type description
  const heroInsight = `You're a${temporal.code === 'N' ? ' nocturnal' : ' daytime'} ${processing.label.toLowerCase()} who ${discovery.code === 'E' ? 'explores widely' : 'stays rooted'} while ${attachment.code === 'A' ? 'keeping favorites close' : 'embracing change'}.`;

  // Build cross-pattern synthesis from evidence
  const crossPatternSynthesis = `Your listening reveals ${temporal.metric}, with ${processing.metric}. You've built a library of ${discovery.metric}, showing a ${discovery.label.toLowerCase()}'s approach to music discovery across your ${attachment.metric} listening period.`;

  // Build psychological summary
  const psychologicalSummary = `Your ${typeResult.code} type reflects a ${typeResult.description.toLowerCase()} approach to music. ${temporal.label} listening combined with ${processing.label.toLowerCase()} behavior suggests you use music for both ${temporal.code === 'N' ? 'late-night reflection' : 'daytime energy'} and ${processing.code === 'L' ? 'emotional processing through repetition' : 'variety-seeking stimulation'}. Your ${discovery.label.toLowerCase()} tendencies paired with ${attachment.label.toLowerCase()} bonds create a balanced relationship with your musical identity.`;

  return {
    heroInsight: heroInsight.slice(0, 120),
    crossPatternSynthesis: crossPatternSynthesis.slice(0, 400),
    psychologicalSummary: psychologicalSummary.slice(0, 500),
  };
}
