/**
 * Hero Insight Selection
 * Selects the most impactful pattern for the hero insight
 */

import type { DetectionResult } from '../detectors/types';

export function selectHeroPattern(patterns: DetectionResult[]): DetectionResult {
  if (patterns.length === 0) {
    throw new Error('No patterns to select from');
  }

  // Score each pattern for "hero potential"
  const scored = patterns.map(pattern => ({
    pattern,
    score: calculateHeroScore(pattern)
  }));

  // Return highest scoring pattern
  return scored.sort((a, b) => b.score - a.score)[0].pattern;
}

function calculateHeroScore(pattern: DetectionResult): number {
  let score = pattern.confidence;

  // Bonus for psychological depth
  const deepDimensions = [
    'memory and avoidance',
    'identity transition',
    'emotional regulation',
    'identity attachment',
    'behavioral consistency'
  ];

  if (deepDimensions.includes(pattern.psychologicalDimension)) {
    score += 0.2;
  }

  // Bonus for specificity (more evidence = more specific)
  score += Math.min(pattern.evidence.length * 0.05, 0.15);

  // Bonus for certain high-impact patterns
  const heroCandidates = [
    'The Vault Track Hunter',
    'The Consistency Champion',
    'The 2AM Song',
    'Ghost Artist',
    'Coping Song',
    'The Fader',
    'Phase Shifter',
    'The Looper'
  ];

  if (heroCandidates.includes(pattern.patternName)) {
    score += 0.15;
  }

  return Math.min(score, 1.0);
}
