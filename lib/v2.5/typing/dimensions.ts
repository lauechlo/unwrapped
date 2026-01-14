/**
 * V2.5 Music Type System - Dimension Definitions
 *
 * Defines the 4 dimensions of music personality:
 * 1. Temporal: When you listen (Diurnal vs Nocturnal)
 * 2. Processing: How you listen (Looper vs Skimmer)
 * 3. Discovery: What you seek (Explorer vs Loyalist)
 * 4. Attachment: How you bond (Anchored vs Fluid)
 */

import type { DimensionDefinition } from './types';

// ============================================================================
// Dimension 1: Temporal (D/N)
// ============================================================================

export const TEMPORAL_DIMENSION: DimensionDefinition = {
  category: 'temporal',
  name: 'Temporal',
  measures: 'When you listen to music',
  options: [
    {
      code: 'D',
      label: 'Diurnal',
      description: 'You listen primarily during daytime hours (before 9pm)',
      threshold: 0.5, // <50% night listening
      baseline: 0.34, // Average person: 34% night listening
    },
    {
      code: 'N',
      label: 'Nocturnal',
      description: 'You listen primarily during nighttime hours (after 9pm)',
      threshold: 0.5, // >50% night listening
      baseline: 0.34,
    },
  ],
  minimumData: {
    metric: 'plays with timestamps',
    value: 100,
  },
};

// ============================================================================
// Dimension 2: Processing (L/S)
// ============================================================================

export const PROCESSING_DIMENSION: DimensionDefinition = {
  category: 'processing',
  name: 'Processing',
  measures: 'How you engage with tracks',
  options: [
    {
      code: 'L',
      label: 'Looper',
      description: 'You replay your favorite tracks repeatedly',
      threshold: 1.5, // >1.5x average replay rate
      baseline: 1.0, // 1.0 = average replay rate
    },
    {
      code: 'S',
      label: 'Skimmer',
      description: 'You move through tracks quickly without replaying',
      threshold: 1.5, // <1.5x average replay rate
      baseline: 1.0,
    },
  ],
  minimumData: {
    metric: 'unique tracks',
    value: 50,
  },
};

// ============================================================================
// Dimension 3: Discovery (E/L)
// ============================================================================

export const DISCOVERY_DIMENSION: DimensionDefinition = {
  category: 'discovery',
  name: 'Discovery',
  measures: 'How you discover new music',
  options: [
    {
      code: 'E',
      label: 'Explorer',
      description: 'You constantly seek out new artists and genres',
      threshold: 0.3, // >30% unique artists
      baseline: 0.25, // Average: 25% unique artists
    },
    {
      code: 'L',
      label: 'Loyalist',
      description: 'You stick with familiar artists and repeat favorites',
      threshold: 0.3, // <30% unique artists
      baseline: 0.25,
    },
  ],
  minimumData: {
    metric: 'months of history',
    value: 3,
  },
};

// ============================================================================
// Dimension 4: Attachment (A/F)
// ============================================================================

export const ATTACHMENT_DIMENSION: DimensionDefinition = {
  category: 'attachment',
  name: 'Attachment',
  measures: 'How you bond with artists',
  options: [
    {
      code: 'A',
      label: 'Anchored',
      description: 'You maintain long-term loyalty to your top artists',
      threshold: 6, // >6 months with same top artist
      baseline: 4, // Average: 4 months
    },
    {
      code: 'F',
      label: 'Fluid',
      description: 'Your top artists change frequently',
      threshold: 6, // <6 months with same top artist
      baseline: 4,
    },
  ],
  minimumData: {
    metric: 'months of history',
    value: 6,
  },
};

// ============================================================================
// All Dimensions (in order: T, P, D, A)
// ============================================================================

export const ALL_DIMENSIONS = [
  TEMPORAL_DIMENSION,
  PROCESSING_DIMENSION,
  DISCOVERY_DIMENSION,
  ATTACHMENT_DIMENSION,
] as const;

// ============================================================================
// Dimension Labels
// ============================================================================

/**
 * Get human-readable label for a dimension code
 */
export function getDimensionLabel(code: string): string {
  const labelMap: Record<string, string> = {
    // Temporal
    D: 'Diurnal',
    N: 'Nocturnal',
    // Processing
    L: 'Looper',
    S: 'Skimmer',
    // Discovery
    E: 'Explorer',
    // Attachment
    A: 'Anchored',
    F: 'Fluid',
  };

  // Handle discovery 'L' conflict
  if (code === 'L') {
    // Context-dependent: needs to be resolved by caller
    return 'Looper/Loyalist';
  }

  return labelMap[code] || code;
}

/**
 * Get full type description from 4-letter code
 */
export function getTypeDescription(typeCode: string): string {
  if (typeCode.length !== 4) return typeCode;

  const [t, p, d, a] = typeCode.split('');

  const temporal = t === 'D' ? 'Diurnal' : 'Nocturnal';
  const processing = p === 'L' ? 'Looper' : 'Skimmer';
  const discovery = d === 'E' ? 'Explorer' : 'Loyalist';
  const attachment = a === 'A' ? 'Anchored' : 'Fluid';

  return `${temporal} · ${processing} · ${discovery} · ${attachment}`;
}

/**
 * Get short type description (for cards)
 */
export function getShortTypeDescription(typeCode: string): string {
  const descriptions: Record<string, string> = {
    // Nocturnal types
    NLEA: 'The Night Owl Explorer',
    NLEL: 'The Night Owl Wanderer',
    NSEF: 'The Nocturnal Nomad',
    NSEA: 'The Night Adventurer',

    // Diurnal types
    DSLA: 'The Steady Listener',
    DLEA: 'The Devoted Fan',
    DLEF: 'The Curious Mind',
    DSEF: 'The Free Spirit',

    // Common types
    NSLA: 'The Night Owl Loyalist',
    DSEL: 'The Daytime Wanderer',
  };

  return descriptions[typeCode] || 'The Music Lover';
}
