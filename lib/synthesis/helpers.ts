/**
 * Helper functions for synthesis system
 */

import { DetectionResult, PatternGroup } from './types';

/**
 * Add spaces around forward slashes for better text wrapping
 * "Artist1/Artist2" → "Artist1 / Artist2"
 */
export function normalizeSlashes(text: string): string {
  return text.replace(/\s*\/\s*/g, ' / ');
}

/**
 * Deduplicate patterns that have significant evidence overlap
 * Prevents showing similar patterns like "Make It To Christmas Disorder" and "Make It To Christmas Stranglehold"
 */
export function deduplicatePatterns(patterns: DetectionResult[]): DetectionResult[] {
  const deduplicated: DetectionResult[] = [];

  for (const pattern of patterns) {
    // Check if this pattern significantly overlaps with any already selected
    const isDuplicate = deduplicated.some(existing => {
      // Get evidence strings for comparison
      const patternEvidence = pattern.evidence.map(e => e.humanReadable.toLowerCase());
      const existingEvidence = existing.evidence.map(e => e.humanReadable.toLowerCase());

      // Count overlapping evidence
      const overlapCount = patternEvidence.filter(p =>
        existingEvidence.some(e => e.includes(p) || p.includes(e))
      ).length;

      // If more than 40% of evidence overlaps, consider it a duplicate
      const overlapRatio = overlapCount / Math.min(patternEvidence.length, existingEvidence.length);
      return overlapRatio > 0.4;
    });

    if (!isDuplicate) {
      deduplicated.push(pattern);
    }
  }

  console.log(`[Deduplication] Filtered ${patterns.length} patterns down to ${deduplicated.length} unique patterns`);
  return deduplicated;
}

/**
 * Group patterns by psychological dimension and calculate dominance
 */
export function groupPatternsByDimension(
  patterns: DetectionResult[]
): PatternGroup[] {
  const groups = new Map<string, DetectionResult[]>();

  patterns.forEach(pattern => {
    const dimension = pattern.psychologicalDimension;
    if (!groups.has(dimension)) {
      groups.set(dimension, []);
    }
    groups.get(dimension)!.push(pattern);
  });

  return Array.from(groups.entries())
    .map(([dimension, patterns]) => ({
      dimension,
      patterns,
      dominance: calculateDominance(patterns)
    }))
    .sort((a, b) => b.dominance - a.dominance);
}

/**
 * Calculate how dominant a dimension is (0-1)
 * Based on average confidence and pattern count
 */
function calculateDominance(patterns: DetectionResult[]): number {
  const avgConfidence =
    patterns.reduce((sum, p) => sum + p.confidence, 0) / patterns.length;
  const countScore = Math.min(patterns.length / 5, 1); // Max at 5 patterns

  // Weight: 70% confidence, 30% count
  return (avgConfidence * 0.7) + (countScore * 0.3);
}

/**
 * Select the "hero" pattern - most impactful for headline
 */
export function selectHeroPattern(patterns: DetectionResult[]): DetectionResult {
  const scored = patterns.map(pattern => ({
    pattern,
    score: calculateHeroScore(pattern)
  }));

  return scored.sort((a, b) => b.score - a.score)[0].pattern;
}

/**
 * Score a pattern for "hero potential"
 */
function calculateHeroScore(pattern: DetectionResult): number {
  let score = pattern.confidence;

  // Bonus for psychologically deep dimensions
  const deepDimensions = [
    'memory and avoidance',
    'identity transition',
    'emotional regulation',
    'identity and memory'
  ];
  if (deepDimensions.includes(pattern.psychologicalDimension.toLowerCase())) {
    score += 0.2;
  }

  // Bonus for specificity (more evidence = more impactful)
  score += Math.min(pattern.evidence.length * 0.05, 0.15);

  // Bonus for certain high-impact patterns
  const heroCandidates = [
    'The Vault Track Hunter',
    'The Consistency Champion',
    'The 2AM Song',
    'Ghost Artist',
    'The Looper',
    'The Wicked Fan'
  ];
  if (heroCandidates.includes(pattern.patternName)) {
    score += 0.15;
  }

  return Math.min(score, 1.0);
}

/**
 * Format pattern data for Claude prompt
 */
export function formatPatternForPrompt(pattern: DetectionResult): string {
  return JSON.stringify({
    patternName: pattern.patternName,
    confidence: pattern.confidence,
    evidence: pattern.evidence.map(e => e.humanReadable),
    dimension: pattern.psychologicalDimension
  }, null, 2);
}

/**
 * Format multiple patterns for Claude prompt
 */
export function formatPatternsForPrompt(patterns: DetectionResult[]): string {
  return patterns.map(formatPatternForPrompt).join('\n\n');
}

/**
 * Parse pattern card from Claude output
 * Expected format:
 * PATTERN: The [Artist/Track] [Viral Phrase]
 * ├─ CORE: ...
 * ├─ SUPPORTING: ...
 * └─ BEHAVIOR: ...
 *
 * *[Callout]*
 */
export function parsePatternCard(output: string, confidence: number, rawEvidence: string[], dimension: string): {
  patternLabel: string;
  core: string;
  supporting: string;
  behavior: string;
  callout: string;
  confidence: number;
  rawEvidence: string[];
  dimension: string;
} {
  const lines = output.split('\n').map(l => l.trim()).filter(l => l);

  let patternLabel = '';
  let core = '';
  let supporting = '';
  let behavior = '';
  let callout = '';

  for (const line of lines) {
    if (line.startsWith('PATTERN:')) {
      patternLabel = line.replace('PATTERN:', '').trim();
    } else if (line.includes('├─ CORE:') || line.includes('CORE:')) {
      core = line.replace(/^.*?CORE:\s*/, '').trim();
    } else if (line.includes('├─ SUPPORTING:') || line.includes('SUPPORTING:')) {
      supporting = line.replace(/^.*?SUPPORTING:\s*/, '').trim();
    } else if (line.includes('└─ BEHAVIOR:') || line.includes('BEHAVIOR:')) {
      behavior = line.replace(/^.*?BEHAVIOR:\s*/, '').trim();
    } else if (line.startsWith('*') && line.endsWith('*')) {
      callout = line.replace(/^\*\s*/, '').replace(/\s*\*$/, '').trim();
    }
  }

  // Normalize slashes for better text wrapping
  return {
    patternLabel: normalizeSlashes(patternLabel),
    core: normalizeSlashes(core),
    supporting: normalizeSlashes(supporting),
    behavior: normalizeSlashes(behavior),
    callout: normalizeSlashes(callout),
    confidence,
    rawEvidence: rawEvidence.map(normalizeSlashes),
    dimension
  };
}
