// Main SourceOfTruth builder
import { SanitizedStreamingRecord, SourceOfTruth, DatasetMetadata } from '../types';
import { buildTrackAggregates } from './tracks';
import { buildArtistAggregates } from './artists';
import { buildTemporalAggregates } from './temporal';

/**
 * Build complete SourceOfTruth index from sanitized streaming records
 * This is the core data structure that all detectors query against
 */
export function buildSourceOfTruth(
  records: SanitizedStreamingRecord[]
): SourceOfTruth {
  console.log(`Building SourceOfTruth from ${records.length} records...`);

  // Build track aggregates
  const tracks = buildTrackAggregates(records);
  console.log(`Indexed ${tracks.size} unique tracks`);

  // Build artist aggregates
  const artists = buildArtistAggregates(records);
  console.log(`Indexed ${artists.size} unique artists`);

  // Build temporal aggregates
  const temporal = buildTemporalAggregates(records);
  console.log(`Temporal range: ${temporal.dateRange.start.toDateString()} - ${temporal.dateRange.end.toDateString()}`);

  // Calculate overall metadata
  const meta = calculateMetadata(records, tracks, artists, temporal);

  // Store raw indices for validation
  const rawIndices = records.map(r => r.index);

  const sot: SourceOfTruth = {
    tracks,
    artists,
    temporal,
    meta,
    rawIndices,
  };

  console.log('SourceOfTruth built successfully');
  return sot;
}

/**
 * Calculate dataset-level metadata
 */
function calculateMetadata(
  records: SanitizedStreamingRecord[],
  tracks: Map<string, any>,
  artists: Map<string, any>,
  temporal: any
): DatasetMetadata {
  const completedPlays = records.filter(r => r.reason_end === 'trackdone').length;
  const skippedPlays = records.filter(r => r.skipped).length;
  const totalListeningTimeMs = records.reduce((sum, r) => sum + r.ms_played, 0);

  return {
    totalPlays: records.length,
    dateRange: temporal.dateRange,
    uniqueTracks: tracks.size,
    uniqueArtists: artists.size,
    overallSkipRate: skippedPlays / records.length,
    overallCompletionRate: completedPlays / records.length,
    totalListeningTimeMs,
  };
}

/**
 * Export utility functions
 */
export * from './utils';
