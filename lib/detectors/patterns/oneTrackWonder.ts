/**
 * One-Track Wonder Detector
 *
 * Detects extreme single-track dominance where one song completely dominates
 * your listening. More extreme than The Looper - indicates a particularly
 * powerful emotional connection or obsession with a specific song.
 *
 * Pattern ID: 30
 * Category: emotional
 * Psychological Dimension: emotional regulation
 * Priority: V1 - High Priority
 */

import type { UserListeningData, DetectionResult, Evidence } from '../types';

/**
 * Configuration for one-track wonder detection
 */
const CONFIG = {
  MIN_RECENT_PLAY_RATIO: 0.15,  // 15%+ of recent plays must be same track
  HIGH_OBSESSION_RATIO: 0.25,   // 25%+ = extreme obsession
  MIN_PLAYS: 8,                 // Need at least 8 plays
};

/**
 * Find the most played track in recent history
 */
function findDominantTrack(data: UserListeningData): {
  track: any;
  playCount: number;
  playRatio: number;
  totalPlays: number;
} | null {
  const trackCounts = new Map<string, { track: any; count: number }>();

  // Count plays for each track
  data.recentlyPlayed.forEach(play => {
    const existing = trackCounts.get(play.track.id);
    if (existing) {
      existing.count++;
    } else {
      trackCounts.set(play.track.id, {
        track: play.track,
        count: 1,
      });
    }
  });

  // Find most played track
  let maxCount = 0;
  let dominantTrack: { track: any; count: number } | null = null;

  trackCounts.forEach((data) => {
    if (data.count > maxCount) {
      maxCount = data.count;
      dominantTrack = data;
    }
  });

  if (!dominantTrack) return null;

  return {
    track: dominantTrack.track,
    playCount: dominantTrack.count,
    playRatio: dominantTrack.count / data.recentlyPlayed.length,
    totalPlays: data.recentlyPlayed.length,
  };
}

/**
 * Detect One-Track Wonder pattern
 *
 * Identifies extreme single-track dominance in recent listening.
 * This indicates:
 * - Particularly powerful emotional connection to specific song
 * - Obsessive listening behavior
 * - Song serving critical emotional regulation function
 * - Possible link to specific life event or emotional state
 *
 * @param data - User's complete listening data
 * @returns Detection result or null if pattern not found
 */
export async function detectOneTrackWonder(
  data: UserListeningData
): Promise<DetectionResult | null> {
  console.log('[One-Track Wonder] Starting detection...');

  const dominant = findDominantTrack(data);

  if (!dominant) {
    console.log('[One-Track Wonder] No plays found');
    return null;
  }

  console.log(`[One-Track Wonder] "${dominant.track.name}": ${dominant.playCount}/${dominant.totalPlays} plays (${(dominant.playRatio * 100).toFixed(0)}%)`);

  // Check if meets minimum thresholds
  if (dominant.playCount < CONFIG.MIN_PLAYS) {
    console.log(`[One-Track Wonder] Only ${dominant.playCount} plays, below threshold of ${CONFIG.MIN_PLAYS}`);
    return null;
  }

  if (dominant.playRatio < CONFIG.MIN_RECENT_PLAY_RATIO) {
    console.log(`[One-Track Wonder] Ratio ${(dominant.playRatio * 100).toFixed(0)}% below threshold of ${CONFIG.MIN_RECENT_PLAY_RATIO * 100}%`);
    return null;
  }

  // Calculate confidence based on play ratio
  // 15% = 0.75, 25%+ = 0.95
  let confidence = Math.min(0.6 + (dominant.playRatio * 1.5), 0.98);

  // Bonus for extreme obsession
  if (dominant.playRatio >= CONFIG.HIGH_OBSESSION_RATIO) {
    confidence = Math.min(confidence + 0.1, 1.0);
  }

  // Build evidence
  const evidence: Evidence[] = [
    {
      type: 'track',
      value: dominant.track,
      humanReadable: `"${dominant.track.name}" by ${dominant.track.artists[0].name}`
    },
    {
      type: 'count',
      value: dominant.playCount,
      humanReadable: `${dominant.playCount} plays in your last ${dominant.totalPlays} tracks`
    },
    {
      type: 'ratio',
      value: dominant.playRatio,
      humanReadable: `${Math.round(dominant.playRatio * 100)}% of your recent listening is this ONE track`
    }
  ];

  // Check if track is also #1 in short-term
  const isTopShortTerm = data.topTracks.short.length > 0 &&
                         data.topTracks.short[0].id === dominant.track.id;

  if (isTopShortTerm) {
    evidence.push({
      type: 'timestamp',
      value: 'short',
      humanReadable: `Also your #1 track in last 4 weeks - consistent obsession`
    });
    confidence = Math.min(confidence + 0.05, 1.0);
  }

  // Add interpretation based on obsession level
  if (dominant.playRatio >= CONFIG.HIGH_OBSESSION_RATIO) {
    evidence.push({
      type: 'count',
      value: 'extreme',
      humanReadable: `${Math.round(dominant.playRatio * 100)}% of recent plays shows extreme fixation - this song likely serves a critical emotional function`
    });
  } else {
    evidence.push({
      type: 'count',
      value: 'high',
      humanReadable: `This track has captured your attention in a particularly intense way`
    });
  }

  return {
    patternId: 30,
    patternName: 'One-Track Wonder',
    confidence,
    evidence,
    psychologicalDimension: 'emotional regulation',
    category: 'emotional',
    insightPotential: 0, // Will be calculated by runner
  };
}
