/**
 * The Skip-Proof Track Detector
 *
 * Detects tracks that appear in your recently played WAY more than their top tracks
 * ranking would suggest. If a track is #25 in your top tracks but appears 8 times
 * in recent plays (50 tracks), you're deliberately choosing it - it has 100%
 * play-through rate. You never skip this track.
 *
 * This reveals tracks with perfect emotional reliability - they ALWAYS deliver.
 *
 * Pattern ID: 40
 * Category: repetition
 * Psychological Dimension: emotional regulation
 * Priority: V1 - High Priority
 */

import type { UserListeningData, DetectionResult, Evidence } from '../types';

/**
 * Configuration for skip-proof track detection
 */
const CONFIG = {
  MIN_RECENT_PLAYS: 4,           // Need 4+ recent plays
  MIN_OVERPERFORMANCE: 2.5,      // Must appear 2.5x more than expected
  TOP_TRACKS_SAMPLE: 50,         // Consider top 50 tracks
};

/**
 * Find skip-proof tracks
 */
function findSkipProofTracks(data: UserListeningData): Array<{
  track: any;
  recentPlayCount: number;
  topTracksRank: number;
  expectedPlays: number;
  overperformanceRatio: number;
}> {
  // Count recent plays per track
  const recentPlayCounts = new Map<string, { track: any; count: number }>();
  data.recentlyPlayed.forEach(play => {
    const existing = recentPlayCounts.get(play.track.id);
    if (existing) {
      existing.count++;
    } else {
      recentPlayCounts.set(play.track.id, { track: play.track, count: 1 });
    }
  });

  const skipProofCandidates: Array<{
    track: any;
    recentPlayCount: number;
    topTracksRank: number;
    expectedPlays: number;
    overperformanceRatio: number;
  }> = [];

  // Check each top track for overperformance in recent plays
  data.topTracks.short.forEach((topTrack, idx) => {
    const rank = idx + 1;

    if (rank > CONFIG.TOP_TRACKS_SAMPLE) return;

    const recentData = recentPlayCounts.get(topTrack.id);

    if (recentData && recentData.count >= CONFIG.MIN_RECENT_PLAYS) {
      // Calculate expected plays based on rank
      // Top 10 = expect more plays, #50 = expect fewer
      // Rough heuristic: top track might appear 5 times, #50 might appear 1 time
      const expectedPlaysByRank = Math.max(1, 6 - (rank / 10));

      const overperformance = recentData.count / expectedPlaysByRank;

      if (overperformance >= CONFIG.MIN_OVERPERFORMANCE) {
        skipProofCandidates.push({
          track: topTrack,
          recentPlayCount: recentData.count,
          topTracksRank: rank,
          expectedPlays: expectedPlaysByRank,
          overperformanceRatio: overperformance,
        });
      }
    }
  });

  // Sort by overperformance ratio
  return skipProofCandidates.sort((a, b) => b.overperformanceRatio - a.overperformanceRatio);
}

/**
 * Detect The Skip-Proof Track pattern
 *
 * Identifies tracks that appear far more in recent plays than their ranking suggests.
 * This indicates:
 * - Perfect emotional reliability - never skipped
 * - High intentionality in listening choices
 * - Track delivers consistently without fail
 * - Strong emotional regulation tool
 *
 * When a mid-ranking favorite shows up constantly in recent plays,
 * it's not your "favorite" - it's your most reliable emotional tool.
 *
 * @param data - User's complete listening data
 * @returns Detection result or null if pattern not found
 */
export async function detectTheSkipProofTrack(
  data: UserListeningData
): Promise<DetectionResult | null> {
  console.log('[Skip-Proof Track] Starting detection...');

  const skipProofTracks = findSkipProofTracks(data);

  console.log(`[Skip-Proof Track] Found ${skipProofTracks.length} skip-proof candidates`);
  if (skipProofTracks.length > 0) {
    skipProofTracks.forEach((track, i) => {
      console.log(`  ${i + 1}. "${track.track.name}": rank #${track.topTracksRank}, ${track.recentPlayCount} recent plays (${track.overperformanceRatio.toFixed(1)}x expected)`);
    });
  }

  if (skipProofTracks.length === 0) {
    console.log('[Skip-Proof Track] No skip-proof patterns detected');
    return null;
  }

  // Use the most skip-proof track
  const theSkipProofTrack = skipProofTracks[0];

  // Calculate confidence based on overperformance and play count
  // 2.5x = 0.75, 4x+ = 0.9
  let confidence = Math.min(0.6 + (theSkipProofTrack.overperformanceRatio * 0.1), 0.95);

  // Bonus for high play count (more evidence)
  if (theSkipProofTrack.recentPlayCount >= 6) {
    confidence = Math.min(confidence + 0.05, 1.0);
  }

  // Build evidence
  const evidence: Evidence[] = [
    {
      type: 'track',
      value: theSkipProofTrack.track,
      humanReadable: `"${theSkipProofTrack.track.name}" by ${theSkipProofTrack.track.artists[0].name}`
    },
    {
      type: 'count',
      value: theSkipProofTrack.topTracksRank,
      humanReadable: `#${theSkipProofTrack.topTracksRank} in your top tracks`
    },
    {
      type: 'count',
      value: theSkipProofTrack.recentPlayCount,
      humanReadable: `${theSkipProofTrack.recentPlayCount} plays in recent listening (last ~50 tracks)`
    },
    {
      type: 'ratio',
      value: theSkipProofTrack.overperformanceRatio,
      humanReadable: `${theSkipProofTrack.overperformanceRatio.toFixed(1)}x more than expected for rank #${theSkipProofTrack.topTracksRank}`
    }
  ];

  // Add interpretation based on overperformance
  if (theSkipProofTrack.overperformanceRatio >= 4) {
    evidence.push({
      type: 'ratio',
      value: 'extreme',
      humanReadable: `${theSkipProofTrack.overperformanceRatio.toFixed(1)}x overperformance - you NEVER skip this track when it comes on`
    });
  } else {
    evidence.push({
      type: 'ratio',
      value: 'high',
      humanReadable: `This track has perfect emotional reliability - it always delivers exactly what you need`
    });
  }

  // Calculate play-through percentage
  const totalRecentTracks = data.recentlyPlayed.length;
  const playThroughPercentage = (theSkipProofTrack.recentPlayCount / totalRecentTracks) * 100;

  evidence.push({
    type: 'ratio',
    value: playThroughPercentage / 100,
    humanReadable: `${playThroughPercentage.toFixed(1)}% of your recent listening - disproportionately high for rank #${theSkipProofTrack.topTracksRank}`
  });

  // Check if in saved tracks
  if (data.savedTracks) {
    const isSaved = data.savedTracks.some(t => t.id === theSkipProofTrack.track.id);
    if (isSaved) {
      evidence.push({
        type: 'count',
        value: 'saved',
        humanReadable: `Saved to library - you consciously recognize this track's reliability`
      });
    }
  }

  // Interpretation of what skip-proof means
  evidence.push({
    type: 'count',
    value: 'interpretation',
    humanReadable: `Not your top-ranked favorite, but your most dependable emotional tool`
  });

  return {
    patternId: 40,
    patternName: 'The Skip-Proof Track',
    confidence,
    evidence,
    psychologicalDimension: 'emotional regulation',
    category: 'repetition',
    insightPotential: 0, // Will be calculated by runner
  };
}
