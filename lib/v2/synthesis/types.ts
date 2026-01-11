/**
 * V2 Synthesis Types
 * Structures for narrative synthesis from detected patterns
 */

import { z } from 'zod';
import { DetectionResult } from '../types';

/**
 * Zod Schemas for Runtime Validation
 * Ensures Claude output meets quality standards
 */

export const PatternNarrativeSchema = z.object({
  title: z.string()
    .min(10, 'Title must be at least 10 characters')
    .max(80, 'Title must be under 80 characters')
    .refine(s => /\d/.test(s) || /[A-Z][a-z]+/.test(s),
      'Title must include a number or specific name for virality'),
  finding: z.string()
    .min(20, 'Finding must be substantive')
    .max(300, 'Finding too long'),
  context: z.string()
    .min(20, 'Context must explain psychological basis')
    .max(400, 'Context too long'),
  callout: z.string()
    .min(10, 'Callout must be substantive')
    .max(150, 'Callout too long'),
});

export const HeroInsightSchema = z.object({
  headline: z.string()
    .min(5, 'Headline too short')
    .max(80, 'Headline too long')
    .refine(s => s.split(' ').length <= 15, 'Headline max 15 words'),
  subtext: z.string()
    .min(10, 'Subtext too short')
    .max(300, 'Subtext too long'),
  patternId: z.string(),
});

// Export inferred TypeScript types
export type PatternNarrativeData = z.infer<typeof PatternNarrativeSchema>;
export type HeroInsightData = z.infer<typeof HeroInsightSchema>;

/**
 * Hero Insight - The most striking finding
 */
export interface HeroInsight {
  headline: string;        // 5-10 words, screenshot-worthy
  subtext: string;         // 2-3 sentences with specific evidence
  patternId: string;       // Which pattern this is based on
}

/**
 * Pattern Narrative - Story for a single pattern
 */
export interface PatternNarrative {
  patternId: string;       // Links back to DetectionResult
  patternFamily: string;   // For grouping/filtering
  title: string;           // Viral, Gen Z label with specific names
  finding: string;         // What we detected (with numbers)
  context: string;         // Why this matters psychologically
  callout: string;         // Punchy POV statement
  confidence: number;      // From original detection
  evidenceSummary: string[]; // Human-readable evidence lines
}

/**
 * Timeline Narrative - Story connecting multiple patterns
 */
export interface TimelineNarrative {
  title: string;           // e.g., "Your Autumn Arc"
  description: string;     // How patterns connect temporally
  patterns: string[];      // Pattern IDs included
}

/**
 * Synthesis Output - Complete narrative package
 */
export interface SynthesisOutput {
  heroInsight: HeroInsight;
  narratives: PatternNarrative[];
  timeline?: TimelineNarrative;
  psychologicalSummary: string; // Overall interpretation
}

/**
 * Validation Allowlist - Ground truth from evidence
 */
export interface EvidenceAllowlist {
  artists: Set<string>;
  tracks: Set<string>;
  numbers: Set<number>;
  dates: Set<string>;
  hours: Set<number>;
  patterns: Set<string>;  // Detected pattern names
}
