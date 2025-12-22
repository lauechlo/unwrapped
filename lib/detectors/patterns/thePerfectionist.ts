/**
 * The Perfectionist Detector
 *
 * Detects immediate track replays - when you play the same song again within
 * 5 minutes of it finishing. This is different from Coping Song (rapid succession
 * over 10min windows) - this is INSTANT replay, suggesting:
 * - Obsessive enjoyment / chasing the perfect moment
 * - Trying to recapture a feeling
 * - Musical OCD / completionist behavior
 * - "That was so good I need it again RIGHT NOW"
 *
 * When you hit replay the second the song ends, you're not processing -
 * you're chasing perfection.
 *
 * Pattern ID: 44
 * Category: repetition
 * Psychological Dimension: obsessive tendencies
 * Priority: V1 - High Priority
 */

import type { UserListeningData, DetectionResult, Evidence } from '../types';

/**
 * Configuration for perfectionist detection
 */
const CONFIG = {
  MAX_REPLAY_GAP_MINUTES: 5,     // 5 minutes = immediate replay
  MIN_INSTANT_REPLAYS: 3,        // Need 3+ instant replays
  MIN_TRACKS_WITH_PATTERN: 2,    // Need pattern across 2+ tracks
};

/**
 * Find instant replays
 */
function findInstantReplays(data: UserListeningData): Array<{
  track: any;
  instantReplays: number;
  replayTimes: Date[];
  shortestGap: number; // in seconds
}> {
  if (data.recentlyPlayed.length < 2) return [];

  const chronologicalPlays = [...data.recentlyPlayed].reverse();

  const trackReplayStats = new Map<string, {
    track: any;
    instantReplays: number;
    replayTimes: Date[];
    shortestGap: number;
  }>();

  for (let i = 0; i < chronologicalPlays.length - 1; i++) {
    const currentPlay = chronologicalPlays[i];
    const nextPlay = chronologicalPlays[i + 1];

    // Check if next play is same track
    if (currentPlay.track.id === nextPlay.track.id) {
      const currentTime = new Date(currentPlay.played_at);
      const nextTime = new Date(nextPlay.played_at);
      const gapMinutes = (nextTime.getTime() - currentTime.getTime()) / (1000 * 60);

      // Is this an instant replay?
      if (gapMinutes <= CONFIG.MAX_REPLAY_GAP_MINUTES) {
        const trackId = currentPlay.track.id;

        if (!trackReplayStats.has(trackId)) {
          trackReplayStats.set(trackId, {
            track: currentPlay.track,
            instantReplays: 0,
            replayTimes: [],
            shortestGap: gapMinutes * 60, // Store in seconds
          });
        }

        const stats = trackReplayStats.get(trackId)!;
        stats.instantReplays++;
        stats.replayTimes.push(currentTime);
        stats.shortestGap = Math.min(stats.shortestGap, gapMinutes * 60);
      }
    }
  }

  // Filter to tracks with sufficient instant replays
  const perfectionistTracks: Array<{
    track: any;
    instantReplays: number;
    replayTimes: Date[];
    shortestGap: number;
  }> = [];

  trackReplayStats.forEach((stats) => {
    if (stats.instantReplays >= CONFIG.MIN_INSTANT_REPLAYS) {
      perfectionistTracks.push(stats);
    }
  });

  return perfectionistTracks.sort((a, b) => b.instantReplays - a.instantReplays);
}

/**
 * Detect The Perfectionist pattern
 *
 * Identifies immediate track replays (within 5 minutes). This indicates:
 * - Obsessive enjoyment / chasing the moment
 * - Trying to recapture a specific feeling
 * - Musical OCD behavior
 * - Perfectionist tendencies
 * - "One more time" compulsion
 *
 * When you hit replay the instant a song ends, you're not just enjoying it -
 * you're compulsively chasing a perfect emotional moment.
 *
 * @param data - User's complete listening data
 * @returns Detection result or null if pattern not found
 */
export async function detectThePerfectionist(
  data: UserListeningData
): Promise<DetectionResult | null> {
  console.log('[The Perfectionist] Starting detection...');

  const perfectionistTracks = findInstantReplays(data);

  console.log(`[The Perfectionist] Found ${perfectionistTracks.length} tracks with instant replays`);
  if (perfectionistTracks.length > 0) {
    perfectionistTracks.forEach((track, i) => {
      console.log(`  ${i + 1}. "${track.track.name}": ${track.instantReplays} instant replays (shortest: ${track.shortestGap.toFixed(0)}s gap)`);
    });
  }

  if (perfectionistTracks.length < CONFIG.MIN_TRACKS_WITH_PATTERN) {
    console.log(`[The Perfectionist] Only ${perfectionistTracks.length} tracks, below threshold of ${CONFIG.MIN_TRACKS_WITH_PATTERN}`);
    return null;
  }

  // Use the track with most instant replays
  const topPerfectionistTrack = perfectionistTracks[0];

  // Calculate confidence based on instant replay count
  // 3 replays = 0.75, 5+ = 0.9
  let confidence = Math.min(0.6 + (topPerfectionistTrack.instantReplays * 0.08), 0.95);

  // Bonus if pattern appears across multiple tracks
  if (perfectionistTracks.length >= 3) {
    confidence = Math.min(confidence + 0.05, 1.0);
  }

  // Build evidence
  const evidence: Evidence[] = [
    {
      type: 'track',
      value: topPerfectionistTrack.track,
      humanReadable: `"${topPerfectionistTrack.track.name}" by ${topPerfectionistTrack.track.artists[0].name}`
    },
    {
      type: 'count',
      value: topPerfectionistTrack.instantReplays,
      humanReadable: `${topPerfectionistTrack.instantReplays} instant replays (within 5 minutes)`
    },
    {
      type: 'count',
      value: topPerfectionistTrack.shortestGap,
      humanReadable: `Shortest gap: ${Math.round(topPerfectionistTrack.shortestGap)} seconds - you hit replay immediately`
    }
  ];

  // Show sample replay times
  if (topPerfectionistTrack.replayTimes.length > 0) {
    const formatDateTime = (date: Date) => {
      const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      const hours = date.getHours();
      const minutes = date.getMinutes();
      const ampm = hours >= 12 ? 'PM' : 'AM';
      const displayHour = hours > 12 ? hours - 12 : (hours === 0 ? 12 : hours);
      return `${dateStr} ${displayHour}:${minutes.toString().padStart(2, '0')}${ampm}`;
    };

    const sampleTimes = topPerfectionistTrack.replayTimes
      .slice(0, 2)
      .map(formatDateTime);

    evidence.push({
      type: 'timestamp',
      value: topPerfectionistTrack.replayTimes,
      humanReadable: `Replay instances: ${sampleTimes.join(', ')}`
    });
  }

  // Count total instant replays across all tracks
  const totalInstantReplays = perfectionistTracks.reduce((sum, t) => sum + t.instantReplays, 0);

  evidence.push({
    type: 'count',
    value: totalInstantReplays,
    humanReadable: `${totalInstantReplays} total instant replays across ${perfectionistTracks.length} different tracks`
  });

  // Add interpretation based on intensity
  if (topPerfectionistTrack.instantReplays >= 5) {
    evidence.push({
      type: 'count',
      value: 'extreme',
      humanReadable: `${topPerfectionistTrack.instantReplays} instant replays - this is obsessive enjoyment, chasing the perfect moment`
    });
  } else {
    evidence.push({
      type: 'count',
      value: 'high',
      humanReadable: `You're not just enjoying tracks - you're compulsively trying to recapture specific feelings`
    });
  }

  // Check if perfectionist tracks are in top tracks
  const inTopTracks = data.topTracks.short.some(t => t.id === topPerfectionistTrack.track.id);
  if (inTopTracks) {
    evidence.push({
      type: 'track',
      value: 'top',
      humanReadable: `Also in your top tracks - this perfectionist behavior extends to your favorites`
    });
  }

  // Interpretation of psychological dimension
  if (topPerfectionistTrack.shortestGap < 30) {
    evidence.push({
      type: 'count',
      value: 'compulsive',
      humanReadable: `${Math.round(topPerfectionistTrack.shortestGap)}s gap suggests compulsive "one more time" behavior`
    });
  }

  return {
    patternId: 44,
    patternName: 'The Perfectionist',
    confidence,
    evidence,
    psychologicalDimension: 'obsessive tendencies',
    category: 'repetition',
    insightPotential: 0, // Will be calculated by runner
  };
}
