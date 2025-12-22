/**
 * The Looper Detector
 *
 * Detects users who obsessively replay the same track. Since Spotify's API
 * provides ranked top tracks (not raw play counts), we detect looping by:
 * 1. Track dominance in short-term rankings (top 3 = current obsession)
 * 2. Persistence across time ranges (appearing in multiple periods = sustained obsession)
 *
 * Pattern ID: 15
 * Category: repetition
 * Psychological Dimension: emotional regulation
 * Priority: V1 - High Priority
 */

import type { UserListeningData, DetectionResult, Evidence } from '../types';

/**
 * Configuration for looper detection
 */
const CONFIG = {
  TOP_POSITION_THRESHOLD: 3,  // Top 3 tracks indicate dominant listening
  PERSISTENCE_BONUS: 0.2,     // Confidence bonus if track appears across time ranges
};

/**
 * Check if track appears in top N of a time range
 */
function findTrackRanking(trackId: string, tracks: any[], topN: number): number | null {
  const index = tracks.findIndex(t => t.id === trackId);
  if (index !== -1 && index < topN) {
    return index + 1; // Return 1-based rank
  }
  return null;
}

/**
 * Detect The Looper pattern
 *
 * Identifies users who obsessively replay the same track. Uses top tracks
 * ranking across time periods to infer repetitive listening behavior.
 *
 * Detection logic:
 * - Rank 1 in short-term = 0.9 confidence (dominant current listening)
 * - Rank 2-3 in short-term = 0.7 confidence (heavy rotation)
 * - Bonus +0.2 if also in medium/long term top 10 (persistent obsession)
 *
 * @param data - User's complete listening data
 * @returns Detection result or null if pattern not found
 */
export async function detectTheLooper(
  data: UserListeningData
): Promise<DetectionResult | null> {
  const shortTracks = data.topTracks.short;
  const mediumTracks = data.topTracks.medium;
  const longTracks = data.topTracks.long;

  // Need sufficient data
  if (shortTracks.length === 0) {
    return null;
  }

  // Check top 3 tracks in short-term for dominant listening
  for (let i = 0; i < Math.min(CONFIG.TOP_POSITION_THRESHOLD, shortTracks.length); i++) {
    const track = shortTracks[i];
    const rank = i + 1;

    // Base confidence based on ranking
    // Rank 1 = 0.9, Rank 2 = 0.8, Rank 3 = 0.7
    let confidence = 1.0 - (rank * 0.1);

    // Check for persistence across time ranges
    const inMediumTop10 = findTrackRanking(track.id, mediumTracks, 10) !== null;
    const inLongTop10 = findTrackRanking(track.id, longTracks, 10) !== null;

    // Bonus for appearing across multiple time ranges
    if (inMediumTop10) confidence = Math.min(confidence + CONFIG.PERSISTENCE_BONUS, 1.0);
    if (inLongTop10) confidence = Math.min(confidence + CONFIG.PERSISTENCE_BONUS, 1.0);

    // Build evidence
    const evidence: Evidence[] = [
      {
        type: 'track',
        value: track,
        humanReadable: `"${track.name}" by ${track.artists[0].name}`
      },
      {
        type: 'count',
        value: rank,
        humanReadable: `#${rank} most played track over the last 4 weeks`
      }
    ];

    // Add persistence evidence if applicable
    const mediumRank = findTrackRanking(track.id, mediumTracks, 10);
    const longRank = findTrackRanking(track.id, longTracks, 10);

    if (mediumRank) {
      evidence.push({
        type: 'timestamp',
        value: mediumRank,
        humanReadable: `Also #${mediumRank} over the last 6 months (persistent obsession)`
      });
    }

    if (longRank) {
      evidence.push({
        type: 'timestamp',
        value: longRank,
        humanReadable: `Also #${longRank} in all-time favorites (long-term attachment)`
      });
    }

    // Return first detected looper (highest ranked track)
    return {
      patternId: 15,
      patternName: 'The Looper',
      confidence,
      evidence,
      psychologicalDimension: 'emotional regulation',
      category: 'repetition',
      insightPotential: 0, // Will be calculated by runner
    };
  }

  return null;
}
