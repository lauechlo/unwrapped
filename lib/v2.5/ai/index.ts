/**
 * V2.5 AI Module
 *
 * Exports for the scoped AI integration layer.
 */

// Types
export type {
  ScopedAIOutput,
  ScopedAIInput,
  SynthesisStats,
  SynthesizeRequest,
  SynthesizeResponse,
  SynthesizeError,
  AIInsightsCache,
} from './types';

export {
  AI_INSIGHTS_CACHE_KEY,
  AI_INSIGHTS_CACHE_DURATION,
} from './types';

// Synthesis
export { synthesizeScoped, generateFallback } from './synthesize';

// Prompts (for debugging/testing)
export {
  V25_SYSTEM_PROMPT,
  V25_SYNTHESIS_PROMPT,
  buildSynthesisPrompt,
} from './prompts';
