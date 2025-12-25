/**
 * The Trendy Detector
 *
 * Detects when your current top tracks are dominated by NEW songs that don't
 * appear in your 6-month or all-time favorites. Indicates trend-following
 * behavior, constant discovery, or phase-based listening.
 *
 * Pattern ID: 24
 * Category: identity
 * Psychological Dimension: identity and attachment
 * Priority: V1 - High Priority
 */

import type { UserListeningData, DetectionResult, Evidence } from '../types';

/**
 * Configuration for trendy detection
 */
const CONFIG = {
  MIN_NEW_TRACKS_RATIO: 0.5,    // 50%+ of top 10 must be new (adjusted from 60% based on real data)
  HIGH_NEW_TRACKS_RATIO: 0.75,  // 75%+ = very trendy (adjusted from 80%)
  ANALYZE_TOP_N: 10,            // Check top 10 tracks
};

/**
 * Find tracks in short-term that don't appear in longer timeframes
 */
function findNewTracks(data: UserListeningData): {
  newTracks: any[];
  totalAnalyzed: number;
  newRatio: number;
} {
  const shortTermTop = data.topTracks.short.slice(0, CONFIG.ANALYZE_TOP_N);
  const newTracks: any[] = [];

  shortTermTop.forEach(track => {
    // Check if track is in medium or long-term
    const inMedium = data.topTracks.medium.some(t => t.id === track.id);
    const inLong = data.topTracks.long.some(t => t.id === track.id);

    // Track is "new" if NOT in either medium or long-term
    if (!inMedium && !inLong) {
      newTracks.push(track);
    }
  });

  return {
    newTracks,
    totalAnalyzed: shortTermTop.length,
    newRatio: newTracks.length / shortTermTop.length,
  };
}

/**
 * Detect The Trendy pattern
 *
 * Identifies users whose current favorites are mostly NEW discoveries.
 * This indicates:
 * - High engagement with new music releases
 * - Trend-following or discovery-oriented behavior
 * - Less attachment to long-term favorites
 * - Constantly evolving musical identity
 *
 * @param data - User's complete listening data
 * @returns Detection result or null if pattern not found
 */
export async function detectTheTrendy(
  data: UserListeningData
): Promise<DetectionResult | null> {
  console.log('[The Trendy] Starting detection...');

  const { newTracks, totalAnalyzed, newRatio } = findNewTracks(data);

  console.log(`[The Trendy] Found ${newTracks.length}/${totalAnalyzed} new tracks (${(newRatio * 100).toFixed(0)}%)`);
  if (newTracks.length > 0) {
    console.log('  Sample new tracks:', newTracks.slice(0, 3).map(t => t.name).join(', '));
  }

  // Check if ratio meets threshold
  if (newRatio < CONFIG.MIN_NEW_TRACKS_RATIO) {
    console.log(`[The Trendy] New ratio ${(newRatio * 100).toFixed(0)}% below threshold of ${CONFIG.MIN_NEW_TRACKS_RATIO * 100}%`);
    return null;
  }

  // Calculate confidence based on new track ratio
  // 60% = 0.7, 80%+ = 0.9
  let confidence = Math.min(0.5 + (newRatio * 0.5), 0.95);

  // Bonus for very high new ratio
  if (newRatio >= CONFIG.HIGH_NEW_TRACKS_RATIO) {
    confidence = Math.min(confidence + 0.1, 1.0);
  }

  // Build evidence
  const evidence: Evidence[] = [
    {
      type: 'count',
      value: newTracks.length,
      humanReadable: `${newTracks.length} of your top ${totalAnalyzed} tracks are NEW (not in your 6-month or all-time favorites)`
    },
    {
      type: 'ratio',
      value: newRatio,
      humanReadable: `${Math.round(newRatio * 100)}% of your current top tracks are recent discoveries`
    }
  ];

  // Show sample tracks
  const sampleTracks = newTracks.slice(0, 3).map(t => t.name);
  if (sampleTracks.length > 0) {
    evidence.push({
      type: 'track',
      value: sampleTracks,
      humanReadable: `Examples: "${sampleTracks.join('", "')}"`
    });
  }

  // Add interpretation based on ratio
  if (newRatio >= CONFIG.HIGH_NEW_TRACKS_RATIO) {
    evidence.push({
      type: 'timestamp',
      value: 'very-high',
      humanReadable: `${Math.round(newRatio * 100)}% new tracks shows constant music discovery and trend engagement`
    });
  } else {
    evidence.push({
      type: 'timestamp',
      value: 'high',
      humanReadable: `Strong focus on recent discoveries over long-term favorites`
    });
  }

  // Check if user also has loyal artists (interesting contrast)
  const hasLoyalArtists = data.topArtists.short.slice(0, 5).some(artist => {
    return data.topArtists.long.some(a => a.id === artist.id);
  });

  if (hasLoyalArtists) {
    evidence.push({
      type: 'artist',
      value: 'contrast',
      humanReadable: `Interestingly, you stay loyal to certain artists while constantly discovering new tracks`
    });
  }

  return {
    patternId: 24,
    patternName: 'The Trendy',
    confidence,
    evidence,
    psychologicalDimension: 'identity and attachment',
    category: 'identity',
    insightPotential: 0, // Will be calculated by runner
  };
}
