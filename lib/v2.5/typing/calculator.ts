/**
 * V2.5 Music Type System - Core Calculator
 *
 * Main entry point for calculating a user's 4-letter music type.
 * Takes SourceOfTruth and returns TypeResult.
 */

import type { SourceOfTruth } from '@/lib/v2/types';
import type {
  TypeResult,
  TypeCode,
  TypeCalculationMetadata,
  DataSufficiencyWarning,
} from './types';
import {
  calculateTemporal,
  calculateProcessing,
  calculateDiscovery,
  calculateAttachment,
  checkDataSufficiency,
} from './thresholds';
import { getShortTypeDescription } from './dimensions';

// ============================================================================
// Type Rarity Estimates
// ============================================================================

/**
 * Estimated population percentages for each type
 * Based on planned distribution from V2.5 pivot plan
 *
 * These will be replaced with real data once we have enough users
 */
const TYPE_RARITY_MAP: Record<string, number> = {
  // Common types (20-30%)
  DSLA: 28, // The Steady Listener
  DLEA: 22, // The Devoted Fan

  // Moderately common (10-20%)
  NSLA: 18, // The Night Owl Loyalist
  DLEF: 15, // The Curious Mind
  DSEL: 12, // The Daytime Wanderer

  // Less common (5-10%)
  NLEA: 8, // The Night Owl Explorer
  DSEF: 7, // The Free Spirit
  NSEA: 6, // The Night Adventurer

  // Rare (1-5%)
  NSEF: 4, // The Nocturnal Nomad
  NLEF: 3, // The Night Wanderer

  // Very rare (<1%)
  // (other combinations)
};

/**
 * Get rarity percentage for a type code (1-100)
 * Lower = more rare
 */
function getTypeRarity(typeCode: string): number {
  return TYPE_RARITY_MAP[typeCode] || 5; // Default: 5% for unknown types
}

// ============================================================================
// Main Type Calculation
// ============================================================================

/**
 * Calculate complete music type from source of truth
 *
 * @param sot - Source of truth from pattern detection
 * @returns Complete type result with 4-letter code and dimensions
 */
export function calculateMusicType(sot: SourceOfTruth): TypeResult {
  // Calculate each dimension
  const temporal = calculateTemporal(sot);
  const processing = calculateProcessing(sot);
  const discovery = calculateDiscovery(sot);
  const attachment = calculateAttachment(sot);

  // Construct 4-letter type code
  const typeCode: TypeCode = `${temporal.code}${processing.code}${discovery.code}${attachment.code}`;

  // Get type description
  const description = getShortTypeDescription(typeCode);

  // Calculate overall confidence (average of dimension confidences)
  const confidence = (
    temporal.confidence +
    processing.confidence +
    discovery.confidence +
    attachment.confidence
  ) / 4;

  // Check if all dimensions have sufficient data
  const isComplete =
    temporal.hasSufficientData &&
    processing.hasSufficientData &&
    discovery.hasSufficientData &&
    attachment.hasSufficientData;

  // Get rarity
  const rarity = getTypeRarity(typeCode);

  return {
    code: typeCode,
    dimensions: [temporal, processing, discovery, attachment],
    rarity,
    description,
    confidence,
    isComplete,
    calculatedAt: Date.now(),
  };
}

// ============================================================================
// Type Calculation with Metadata
// ============================================================================

/**
 * Calculate music type with detailed metadata about data quality
 */
export function calculateMusicTypeWithMetadata(sot: SourceOfTruth): {
  result: TypeResult;
  metadata: TypeCalculationMetadata;
} {
  // Calculate type
  const result = calculateMusicType(sot);

  // Build metadata
  const totalPlays = sot.meta.totalPlays;
  const dateRange = sot.meta.dateRange;

  // Calculate months
  const startDate = new Date(dateRange.start);
  const endDate = new Date(dateRange.end);
  const months = Math.max(
    1,
    Math.floor((endDate.getTime() - startDate.getTime()) / (30 * 24 * 60 * 60 * 1000))
  );

  // Check data sufficiency
  const { isSufficient, warnings: warningMessages } = checkDataSufficiency(sot);

  // Convert warning messages to structured warnings
  const warnings: DataSufficiencyWarning[] = warningMessages.map((msg) => {
    const [dimensionStr, actionStr] = msg.split(': ');
    const dimension = dimensionStr.toLowerCase() as any;

    return {
      dimension,
      required: actionStr.split('(')[0].trim(),
      action: 'Upload all Extended History files for accurate typing',
    };
  });

  const metadata: TypeCalculationMetadata = {
    totalPlays,
    dateRange: {
      start: dateRange.start.toISOString(),
      end: dateRange.end.toISOString(),
      months,
    },
    warnings,
    isPartial: !isSufficient,
  };

  return {
    result,
    metadata,
  };
}

// ============================================================================
// Type Comparison & Compatibility
// ============================================================================

/**
 * Calculate compatibility score between two types (0-100)
 *
 * This is a simple implementation - can be enhanced later
 * with more sophisticated compatibility logic
 */
export function calculateTypeCompatibility(type1: TypeCode, type2: TypeCode): number {
  let score = 0;

  // Each matching dimension adds 25 points
  for (let i = 0; i < 4; i++) {
    if (type1[i] === type2[i]) {
      score += 25;
    }
  }

  // Bonus points for complementary combinations
  // Example: Nocturnal + Nocturnal (same listening time)
  if (type1[0] === type2[0]) {
    score += 5;
  }

  // Example: Explorer + Loyalist (balance)
  if (
    (type1[2] === 'E' && type2[2] === 'L') ||
    (type1[2] === 'L' && type2[2] === 'E')
  ) {
    score += 5;
  }

  return Math.min(score, 100);
}

/**
 * Get most compatible types for a given type
 * Returns array of [typeCode, compatibilityScore] sorted by score
 */
export function getMostCompatibleTypes(typeCode: TypeCode, limit = 5): Array<[TypeCode, number]> {
  // Get all possible types
  const allTypes = Object.keys(TYPE_RARITY_MAP) as TypeCode[];

  // Calculate compatibility with each type
  const compatibilities = allTypes
    .filter((t) => t !== typeCode) // Exclude self
    .map((t) => [t, calculateTypeCompatibility(typeCode, t)] as [TypeCode, number])
    .sort((a, b) => b[1] - a[1]); // Sort by compatibility descending

  return compatibilities.slice(0, limit);
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Format dimension for display
 */
export function formatDimensionDisplay(code: string, label: string): string {
  return `${code} - ${label}`;
}

/**
 * Get type code from dimension codes
 */
export function buildTypeCode(
  temporal: string,
  processing: string,
  discovery: string,
  attachment: string
): TypeCode {
  return `${temporal}${processing}${discovery}${attachment}` as TypeCode;
}

/**
 * Parse type code into dimension codes
 */
export function parseTypeCode(typeCode: TypeCode): {
  temporal: string;
  processing: string;
  discovery: string;
  attachment: string;
} {
  const [temporal, processing, discovery, attachment] = typeCode.split('');
  return { temporal, processing, discovery, attachment };
}

/**
 * Validate type code format
 */
export function isValidTypeCode(typeCode: string): typeCode is TypeCode {
  if (typeCode.length !== 4) return false;

  const [t, p, d, a] = typeCode.split('');

  return (
    (t === 'D' || t === 'N') &&
    (p === 'L' || p === 'S') &&
    (d === 'E' || d === 'L') &&
    (a === 'A' || a === 'F')
  );
}

// ============================================================================
// Export All
// ============================================================================

export {
  // Main calculation
  calculateMusicType as default,

  // Dimension calculators (for testing)
  calculateTemporal,
  calculateProcessing,
  calculateDiscovery,
  calculateAttachment,

  // Utilities
  getTypeRarity,
  checkDataSufficiency,
};
