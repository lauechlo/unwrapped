// Pattern Selection Utility
// Selects best N patterns across all families with diversity

import { DetectionResult, PatternFamily } from '../types';

export interface SelectionOptions {
  maxTotal?: number;       // Maximum total patterns to return (default 10)
  maxPerFamily?: number;   // Maximum patterns per family (default 4)
  minDistinctiveness?: number;  // Minimum distinctiveness score (default 0.3)
}

/**
 * Select best patterns from all detected results
 * Ensures diversity across pattern families
 */
export function selectBestPatterns(
  allPatterns: DetectionResult[],
  options: SelectionOptions = {}
): DetectionResult[] {
  const {
    maxTotal = 10,
    maxPerFamily = 4,
    minDistinctiveness = 0.3,
  } = options;

  // Filter by minimum distinctiveness
  const qualifiedPatterns = allPatterns.filter(
    p => p.distinctiveness >= minDistinctiveness
  );

  if (qualifiedPatterns.length === 0) return [];

  // Group by family
  const familyGroups = new Map<PatternFamily, DetectionResult[]>();

  for (const pattern of qualifiedPatterns) {
    if (!familyGroups.has(pattern.patternFamily)) {
      familyGroups.set(pattern.patternFamily, []);
    }
    familyGroups.get(pattern.patternFamily)!.push(pattern);
  }

  // Sort each family by combined score (confidence * distinctiveness)
  for (const [family, patterns] of familyGroups) {
    patterns.sort((a, b) => {
      const scoreA = a.confidence * a.distinctiveness;
      const scoreB = b.confidence * b.distinctiveness;
      return scoreB - scoreA;
    });

    // Limit to maxPerFamily
    familyGroups.set(family, patterns.slice(0, maxPerFamily));
  }

  // Flatten and sort all patterns
  const limitedPatterns = Array.from(familyGroups.values()).flat();

  limitedPatterns.sort((a, b) => {
    const scoreA = a.confidence * a.distinctiveness;
    const scoreB = b.confidence * b.distinctiveness;
    return scoreB - scoreA;
  });

  // Return top N
  return limitedPatterns.slice(0, maxTotal);
}

/**
 * Group patterns by family for organized display
 */
export function groupPatternsByFamily(
  patterns: DetectionResult[]
): Map<PatternFamily, DetectionResult[]> {
  const groups = new Map<PatternFamily, DetectionResult[]>();

  for (const pattern of patterns) {
    if (!groups.has(pattern.patternFamily)) {
      groups.set(pattern.patternFamily, []);
    }
    groups.get(pattern.patternFamily)!.push(pattern);
  }

  return groups;
}
