/**
 * V2.5 Music Type System - Detection Thresholds
 *
 * Defines thresholds for detecting each dimension type
 * and utilities for calculating dimension values.
 */

import type { SourceOfTruth } from '@/lib/v2/types';
import type {
  TemporalType,
  ProcessingType,
  DiscoveryType,
  AttachmentType,
  TemporalResult,
  ProcessingResult,
  DiscoveryResult,
  AttachmentResult,
} from './types';

// ============================================================================
// Thresholds
// ============================================================================

/**
 * Temporal dimension thresholds
 */
export const TEMPORAL_THRESHOLDS = {
  /** Percentage of plays after 9pm to be classified as Nocturnal */
  NOCTURNAL_THRESHOLD: 0.5, // 50%

  /** Baseline average for comparison */
  BASELINE_NIGHT_PERCENTAGE: 0.34, // 34%

  /** Minimum plays needed for reliable detection */
  MINIMUM_PLAYS: 100,

  /** Hour that defines "night" (24-hour format) */
  NIGHT_START_HOUR: 21, // 9pm
} as const;

/**
 * Processing dimension thresholds
 */
export const PROCESSING_THRESHOLDS = {
  /** Replay multiplier threshold (vs average) */
  LOOPER_THRESHOLD: 1.5, // 1.5x average

  /** Baseline replay rate */
  BASELINE_REPLAY_RATE: 1.0,

  /** Minimum unique tracks needed */
  MINIMUM_TRACKS: 50,

  /** Skip rate threshold (not primary, but useful for confidence) */
  HIGH_SKIP_RATE: 0.3, // 30%
} as const;

/**
 * Discovery dimension thresholds
 */
export const DISCOVERY_THRESHOLDS = {
  /** Unique artist percentage threshold */
  EXPLORER_THRESHOLD: 0.3, // 30%

  /** Baseline unique artist percentage */
  BASELINE_UNIQUE_ARTISTS: 0.25, // 25%

  /** Minimum months of data needed */
  MINIMUM_MONTHS: 3,

  /** Artist turnover rate (new artists per month) */
  HIGH_TURNOVER_RATE: 10, // 10+ new artists per month
} as const;

/**
 * Attachment dimension thresholds
 */
export const ATTACHMENT_THRESHOLDS = {
  /** Months with same top artist to be Anchored */
  ANCHORED_THRESHOLD: 6, // 6 months

  /** Baseline months */
  BASELINE_MONTHS: 4,

  /** Minimum months of data needed */
  MINIMUM_MONTHS: 6,

  /** Top artist dominance (% of plays) */
  HIGH_DOMINANCE: 0.2, // 20% of all plays
} as const;

// ============================================================================
// Temporal Calculation
// ============================================================================

/**
 * Calculate temporal dimension from source of truth
 */
export function calculateTemporal(sot: SourceOfTruth): TemporalResult {
  const { temporal, meta } = sot;

  // Calculate night listening percentage from temporal data
  // Night is defined as 9pm-6am (hours 21-23, 0-5)
  let nightPlays = 0;
  let totalPlays = meta.totalPlays;

  for (let hour = 21; hour <= 23; hour++) {
    nightPlays += temporal.byHour.get(hour) || 0;
  }
  for (let hour = 0; hour <= 5; hour++) {
    nightPlays += temporal.byHour.get(hour) || 0;
  }

  const nightPercentage = totalPlays > 0 ? nightPlays / totalPlays : 0;

  // Determine type
  const isNocturnal = nightPercentage >= TEMPORAL_THRESHOLDS.NOCTURNAL_THRESHOLD;
  const code: TemporalType = isNocturnal ? 'N' : 'D';
  const label = isNocturnal ? 'Nocturnal' : 'Diurnal';

  // Calculate confidence
  const hasSufficientData = totalPlays >= TEMPORAL_THRESHOLDS.MINIMUM_PLAYS;
  const confidence = hasSufficientData
    ? Math.min(totalPlays / TEMPORAL_THRESHOLDS.MINIMUM_PLAYS, 1.0)
    : totalPlays / TEMPORAL_THRESHOLDS.MINIMUM_PLAYS;

  // Format metric and comparison
  const percentage = Math.round(nightPercentage * 100);
  const metric = isNocturnal ? `${percentage}% after 9pm` : `${100 - percentage}% before 9pm`;
  const baseline = Math.round(TEMPORAL_THRESHOLDS.BASELINE_NIGHT_PERCENTAGE * 100);
  const comparison = `vs ${baseline}% average`;

  return {
    category: 'temporal',
    code,
    label,
    value: nightPercentage,
    metric,
    comparison,
    confidence,
    hasSufficientData,
    nightPercentage,
    totalPlays,
  };
}

// ============================================================================
// Processing Calculation
// ============================================================================

/**
 * Calculate processing dimension from source of truth
 */
export function calculateProcessing(sot: SourceOfTruth): ProcessingResult {
  const { meta, tracks } = sot;

  // Calculate replay multiplier
  const totalPlays = meta.totalPlays;
  const uniqueTracks = meta.uniqueTracks;
  const avgPlaysPerTrack = uniqueTracks > 0 ? totalPlays / uniqueTracks : 1.0;

  // Normalize to multiplier (baseline = 1.0)
  const replayMultiplier = avgPlaysPerTrack / PROCESSING_THRESHOLDS.BASELINE_REPLAY_RATE;

  // Get skip rate from metadata
  const skipRate = meta.overallSkipRate;

  // Determine type
  const isLooper = replayMultiplier >= PROCESSING_THRESHOLDS.LOOPER_THRESHOLD;
  const code: ProcessingType = isLooper ? 'L' : 'S';
  const label = isLooper ? 'Looper' : 'Skimmer';

  // Calculate confidence
  const hasSufficientData = uniqueTracks >= PROCESSING_THRESHOLDS.MINIMUM_TRACKS;
  const confidence = hasSufficientData
    ? Math.min(uniqueTracks / PROCESSING_THRESHOLDS.MINIMUM_TRACKS, 1.0)
    : uniqueTracks / PROCESSING_THRESHOLDS.MINIMUM_TRACKS;

  // Format metric and comparison
  const metric = `${replayMultiplier.toFixed(1)}x replay rate`;
  const comparison = `vs 1.0x average`;

  return {
    category: 'processing',
    code,
    label,
    value: replayMultiplier,
    metric,
    comparison,
    confidence,
    hasSufficientData,
    replayMultiplier,
    skipRate,
  };
}

// ============================================================================
// Discovery Calculation
// ============================================================================

/**
 * Calculate discovery dimension from source of truth
 */
export function calculateDiscovery(sot: SourceOfTruth): DiscoveryResult {
  const { meta } = sot;

  // Calculate unique artist percentage
  const totalPlays = meta.totalPlays;
  const uniqueArtists = meta.uniqueArtists;
  const uniqueArtistPercentage = totalPlays > 0 ? uniqueArtists / totalPlays : 0;

  // Determine type
  const isExplorer = uniqueArtistPercentage >= DISCOVERY_THRESHOLDS.EXPLORER_THRESHOLD;
  const code: DiscoveryType = isExplorer ? 'E' : 'L';
  const label = isExplorer ? 'Explorer' : 'Loyalist';

  // Calculate confidence based on data range
  const dateRange = meta.dateRange;
  const startDate = new Date(dateRange.start);
  const endDate = new Date(dateRange.end);
  const months = Math.max(
    1,
    Math.floor((endDate.getTime() - startDate.getTime()) / (30 * 24 * 60 * 60 * 1000))
  );

  const hasSufficientData = months >= DISCOVERY_THRESHOLDS.MINIMUM_MONTHS;
  const confidence = hasSufficientData
    ? Math.min(months / DISCOVERY_THRESHOLDS.MINIMUM_MONTHS, 1.0)
    : months / DISCOVERY_THRESHOLDS.MINIMUM_MONTHS;

  // Format metric and comparison
  const percentage = Math.round(uniqueArtistPercentage * 100);
  const metric = `${percentage}% unique artists`;
  const baseline = Math.round(DISCOVERY_THRESHOLDS.BASELINE_UNIQUE_ARTISTS * 100);
  const comparison = `vs ${baseline}% average`;

  return {
    category: 'discovery',
    code,
    label,
    value: uniqueArtistPercentage,
    metric,
    comparison,
    confidence,
    hasSufficientData,
    uniqueArtistPercentage,
    uniqueArtists,
  };
}

// ============================================================================
// Attachment Calculation
// ============================================================================

/**
 * Calculate attachment dimension from source of truth
 */
export function calculateAttachment(sot: SourceOfTruth): AttachmentResult {
  const { artists, meta, temporal } = sot;

  // Find top artist by total plays
  let topArtist: { name: string; plays: number; data: any } = {
    name: 'Unknown',
    plays: 0,
    data: null,
  };

  for (const [name, artistData] of artists.entries()) {
    if (artistData.totalPlays > topArtist.plays) {
      topArtist = {
        name,
        plays: artistData.totalPlays,
        data: artistData,
      };
    }
  }

  // Calculate months of loyalty
  // Calculate how many consecutive months the top artist was #1
  // For MVP: Use simpler approach - months between first and last play
  const topArtistData = topArtist.data;
  let topArtistMonths = 0;

  if (topArtistData) {
    const firstPlayed = new Date(topArtistData.firstPlayed);
    const lastPlayed = new Date(topArtistData.lastPlayed);
    topArtistMonths = Math.max(
      1,
      Math.floor((lastPlayed.getTime() - firstPlayed.getTime()) / (30 * 24 * 60 * 60 * 1000))
    );
  }

  // Determine type
  const isAnchored = topArtistMonths >= ATTACHMENT_THRESHOLDS.ANCHORED_THRESHOLD;
  const code: AttachmentType = isAnchored ? 'A' : 'F';
  const label = isAnchored ? 'Anchored' : 'Fluid';

  // Calculate confidence based on total data range
  const dateRange = meta.dateRange;
  const startDate = new Date(dateRange.start);
  const endDate = new Date(dateRange.end);
  const totalMonths = Math.max(
    1,
    Math.floor((endDate.getTime() - startDate.getTime()) / (30 * 24 * 60 * 60 * 1000))
  );

  const hasSufficientData = totalMonths >= ATTACHMENT_THRESHOLDS.MINIMUM_MONTHS;
  const confidence = hasSufficientData
    ? Math.min(totalMonths / ATTACHMENT_THRESHOLDS.MINIMUM_MONTHS, 1.0)
    : totalMonths / ATTACHMENT_THRESHOLDS.MINIMUM_MONTHS;

  // Format metric and comparison
  const metric = `${topArtistMonths}mo top artist`;
  const baseline = `${ATTACHMENT_THRESHOLDS.BASELINE_MONTHS}mo average`;
  const comparison = `vs ${baseline}`;

  return {
    category: 'attachment',
    code,
    label,
    value: topArtistMonths,
    metric,
    comparison,
    confidence,
    hasSufficientData,
    topArtistMonths,
    topArtistName: topArtist.name,
  };
}

// ============================================================================
// Data Sufficiency Checks
// ============================================================================

/**
 * Check if source of truth has sufficient data for type calculation
 */
export function checkDataSufficiency(sot: SourceOfTruth): {
  isSufficient: boolean;
  warnings: string[];
} {
  const warnings: string[] = [];
  const { meta } = sot;

  // Check temporal data
  const totalPlays = meta.totalPlays;
  if (totalPlays < TEMPORAL_THRESHOLDS.MINIMUM_PLAYS) {
    warnings.push(
      `Temporal: Need ${TEMPORAL_THRESHOLDS.MINIMUM_PLAYS} plays (have ${totalPlays})`
    );
  }

  // Check processing data
  const uniqueTracks = meta.uniqueTracks;
  if (uniqueTracks < PROCESSING_THRESHOLDS.MINIMUM_TRACKS) {
    warnings.push(
      `Processing: Need ${PROCESSING_THRESHOLDS.MINIMUM_TRACKS} unique tracks (have ${uniqueTracks})`
    );
  }

  // Calculate months from date range
  const dateRange = meta.dateRange;
  const startDate = new Date(dateRange.start);
  const endDate = new Date(dateRange.end);
  const months = Math.max(
    1,
    Math.floor((endDate.getTime() - startDate.getTime()) / (30 * 24 * 60 * 60 * 1000))
  );

  // Check discovery data
  if (months < DISCOVERY_THRESHOLDS.MINIMUM_MONTHS) {
    warnings.push(
      `Discovery: Need ${DISCOVERY_THRESHOLDS.MINIMUM_MONTHS} months of data (have ${months})`
    );
  }

  // Check attachment data
  if (months < ATTACHMENT_THRESHOLDS.MINIMUM_MONTHS) {
    warnings.push(
      `Attachment: Need ${ATTACHMENT_THRESHOLDS.MINIMUM_MONTHS} months of data (have ${months})`
    );
  }

  return {
    isSufficient: warnings.length === 0,
    warnings,
  };
}
