/**
 * Pattern Grouping Logic
 * Groups patterns by psychological dimension
 */

import type { DetectionResult } from '../detectors/types';

export interface PatternGroup {
  dimension: string;
  patterns: DetectionResult[];
  dominance: number; // How strong this dimension is (0-1)
}

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

  return Array.from(groups.entries()).map(([dimension, patterns]) => ({
    dimension,
    patterns,
    dominance: calculateDominance(patterns)
  })).sort((a, b) => b.dominance - a.dominance);
}

function calculateDominance(patterns: DetectionResult[]): number {
  const avgConfidence = patterns.reduce((sum, p) => sum + p.confidence, 0) / patterns.length;
  const count = patterns.length;

  // Weight: 70% avg confidence, 30% pattern count (normalized to max 5 patterns)
  return (avgConfidence * 0.7) + (Math.min(count / 5, 1) * 0.3);
}
