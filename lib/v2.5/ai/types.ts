/**
 * V2.5 AI Integration Types
 *
 * Defines the scoped AI output for personalized insights that complement
 * the deterministic type calculation and template system.
 */

import type { TypeResult } from '../typing/types';
import type { DetectionResult } from '@/lib/v2/types';

// ============================================================================
// AI Output Types
// ============================================================================

/**
 * Scoped AI output - personalized insights that templates can't achieve
 * Cost: ~$0.01-0.03 per user (1 Claude Haiku call)
 */
export interface ScopedAIOutput {
  /**
   * Hero insight: 1 punchy sentence (50-120 chars)
   * Sounds like a friend observing habits, not a researcher
   * Example: "You replayed 'Cruel Summer' 234 times—that's not casual listening, that's a ritual"
   */
  heroInsight: string;

  /**
   * Cross-pattern synthesis: 3-4 sentences (250-550 chars) - THE HERO MOMENT
   * Threads together 3+ data points into narrative Spotify can't generate
   * Example: "Your 53 consecutive plays of 'we can't be friends' at 10pm—your peak hour—reveals
   * a deliberate ritual. Combined with 70 months of Taylor Swift as your #1, music isn't
   * background noise for you; it's infrastructure."
   */
  crossPatternSynthesis: string;

  /**
   * Behavioral summary: 1-2 paragraphs (200-500 chars)
   * Conversational tone, describes BEHAVIOR not psychology
   * Connects all 4 dimensions, displayed in CollapsiblePsychologicalSummary
   */
  psychologicalSummary: string;
}

/**
 * Input data for AI synthesis
 * All evidence-grounded to prevent hallucination
 */
export interface ScopedAIInput {
  /** Type calculation result (4-letter code + dimension results) */
  typeResult: TypeResult;

  /** Detected patterns from V2 pattern detection system */
  patterns: DetectionResult[];

  /** Basic stats for context */
  stats: SynthesisStats;
}

/**
 * Basic listening stats for AI context
 */
export interface SynthesisStats {
  totalPlays: number;
  uniqueArtists: number;
  uniqueTracks: number;
  dateRange: string;
}

// ============================================================================
// API Request/Response Types
// ============================================================================

/**
 * Request body for POST /api/v2.5/synthesize
 */
export interface SynthesizeRequest {
  typeResult: TypeResult;
  patterns: DetectionResult[];
  stats: SynthesisStats;
}

/**
 * Response from POST /api/v2.5/synthesize
 */
export interface SynthesizeResponse {
  success: true;
  data: ScopedAIOutput;
}

/**
 * Error response from POST /api/v2.5/synthesize
 */
export interface SynthesizeError {
  success: false;
  error: string;
  message?: string;
  // Rate limit info (when status 429)
  limit?: number;
  remaining?: number;
  resetAt?: string;
}

// ============================================================================
// Cache Types
// ============================================================================

/**
 * LocalStorage cache entry for AI insights
 * Prevents redundant API calls within 24h window
 */
export interface AIInsightsCache {
  /** Cache timestamp */
  timestamp: number;

  /** Type code at time of generation (invalidate if type changes) */
  typeCode: string;

  /** Pattern count at time of generation (invalidate if patterns change) */
  patternCount: number;

  /** Cached AI output */
  insights: ScopedAIOutput;
}

/** Cache key for localStorage */
export const AI_INSIGHTS_CACHE_KEY = 'unwrapped_v25_ai_insights_cache';

/** Cache duration: 24 hours */
export const AI_INSIGHTS_CACHE_DURATION = 24 * 60 * 60 * 1000;
