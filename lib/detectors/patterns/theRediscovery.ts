/**
 * The Rediscovery Detector
 *
 * Detects when tracks from your all-time favorites that weren't in recent rotation
 * suddenly reappear in your listening history. This reveals nostalgic returns,
 * emotional callbacks, or life circumstances bringing old meanings back.
 * The gap + return pattern indicates these aren't just favorites - they're
 * emotionally triggered memories.
 *
 * Pattern ID: 36
 * Category: temporal
 * Psychological Dimension: memory and nostalgia
 * Priority: V1 - High Priority
 */

import type { UserListeningData, DetectionResult, Evidence } from '../types';

/**
 * Configuration for rediscovery detection
 */
const CONFIG = {
  MIN_RECENT_PLAYS: 3,           // Need 3+ plays to show intentional return
  MIN_GAP_INDICATOR: true,       // Must NOT be in medium-term (shows gap)
};

/**
 * Find rediscovered tracks
 */
function findRediscoveries(data: UserListeningData): Array<{
  track: any;
  recentPlayCount: number;
  longTermRank: number;
  playTimes: Date[];
  inMediumTerm: boolean;
}> {
  const rediscoveries: Array<{
    track: any;
    recentPlayCount: number;
    longTermRank: number;
    playTimes: Date[];
    inMediumTerm: boolean;
  }> = [];

  // Count recent plays per track
  const recentPlayCounts = new Map<string, { track: any; count: number; times: Date[] }>();
  data.recentlyPlayed.forEach(play => {
    const existing = recentPlayCounts.get(play.track.id);
    if (existing) {
      existing.count++;
      existing.times.push(new Date(play.played_at));
    } else {
      recentPlayCounts.set(play.track.id, {
        track: play.track,
        count: 1,
        times: [new Date(play.played_at)]
      });
    }
  });

  // Check each all-time favorite
  data.topTracks.long.forEach((longTermTrack, longIdx) => {
    // Is it being played recently?
    const recentPlays = recentPlayCounts.get(longTermTrack.id);

    if (recentPlays && recentPlays.count >= CONFIG.MIN_RECENT_PLAYS) {
      // Was it ABSENT from medium-term? (indicates gap)
      const inMediumTerm = data.topTracks.medium.some(t => t.id === longTermTrack.id);

      if (!inMediumTerm) {
        // This is a rediscovery! Was gone, now back
        rediscoveries.push({
          track: longTermTrack,
          recentPlayCount: recentPlays.count,
          longTermRank: longIdx + 1,
          playTimes: recentPlays.times,
          inMediumTerm,
        });
      }
    }
  });

  // Sort by recent play count (most rediscovered)
  return rediscoveries.sort((a, b) => b.recentPlayCount - a.recentPlayCount);
}

/**
 * Detect The Rediscovery pattern
 *
 * Identifies all-time favorites that disappeared then suddenly returned.
 * This indicates:
 * - Nostalgic emotional callbacks
 * - Life circumstances triggering old associations
 * - Processing similar emotions to past periods
 * - Music as time capsule for specific feelings
 *
 * When an old favorite returns after months away, it's not random -
 * something in your current life resonates with what that song meant before.
 *
 * @param data - User's complete listening data
 * @returns Detection result or null if pattern not found
 */
export async function detectTheRediscovery(
  data: UserListeningData
): Promise<DetectionResult | null> {
  console.log('[The Rediscovery] Starting detection...');

  const rediscoveries = findRediscoveries(data);

  console.log(`[The Rediscovery] Found ${rediscoveries.length} rediscovered tracks`);
  if (rediscoveries.length > 0) {
    rediscoveries.forEach((rediscovery, i) => {
      console.log(`  ${i + 1}. "${rediscovery.track.name}": all-time #${rediscovery.longTermRank}, ${rediscovery.recentPlayCount} recent plays, not in 6-month`);
    });
  }

  if (rediscoveries.length === 0) {
    console.log('[The Rediscovery] No rediscovery patterns detected');
    return null;
  }

  // Use the most rediscovered track
  const theRediscovery = rediscoveries[0];

  // Calculate confidence based on play frequency and rank
  // 3 plays = 0.7, 5+ plays = 0.85
  let confidence = Math.min(0.6 + (theRediscovery.recentPlayCount * 0.05), 0.9);

  // Bonus for high all-time ranking (top 10)
  if (theRediscovery.longTermRank <= 10) {
    confidence = Math.min(confidence + 0.1, 1.0);
  }

  // Build evidence
  const evidence: Evidence[] = [
    {
      type: 'track',
      value: theRediscovery.track,
      humanReadable: `"${theRediscovery.track.name}" by ${theRediscovery.track.artists[0].name}`
    },
    {
      type: 'count',
      value: theRediscovery.longTermRank,
      humanReadable: `#${theRediscovery.longTermRank} in your all-time top tracks`
    },
    {
      type: 'timestamp',
      value: 'gap',
      humanReadable: `NOT in your 6-month favorites - took a break from this track`
    },
    {
      type: 'count',
      value: theRediscovery.recentPlayCount,
      humanReadable: `${theRediscovery.recentPlayCount} plays in recent listening - deliberately brought it back`
    }
  ];

  // Show when it returned
  if (theRediscovery.playTimes.length > 0) {
    const firstReturn = theRediscovery.playTimes[theRediscovery.playTimes.length - 1]; // Oldest recent play
    const lastPlay = theRediscovery.playTimes[0]; // Newest play

    const formatDate = (date: Date) => {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    };

    evidence.push({
      type: 'timestamp',
      value: theRediscovery.playTimes,
      humanReadable: `Returned: ${formatDate(firstReturn)}${theRediscovery.playTimes.length > 1 ? ` - ${formatDate(lastPlay)}` : ''}`
    });
  }

  // Add interpretation based on play intensity
  if (theRediscovery.recentPlayCount >= 5) {
    evidence.push({
      type: 'count',
      value: 'intense',
      humanReadable: `${theRediscovery.recentPlayCount} plays in days - something about now resonates with what this song meant before`
    });
  } else {
    evidence.push({
      type: 'count',
      value: 'moderate',
      humanReadable: `This return isn't random - your current emotional state called this song back`
    });
  }

  // Check if multiple rediscoveries exist (pattern vs one-off)
  if (rediscoveries.length >= 3) {
    evidence.push({
      type: 'count',
      value: rediscoveries.length,
      humanReadable: `${rediscoveries.length} tracks returning from your past - you're in a nostalgic or reflective phase`
    });
  }

  // Interpretation based on all-time rank
  if (theRediscovery.longTermRank <= 5) {
    evidence.push({
      type: 'count',
      value: 'top-tier',
      humanReadable: `Top 5 all-time favorite - this track has deep emotional significance for you`
    });
  }

  return {
    patternId: 36,
    patternName: 'The Rediscovery',
    confidence,
    evidence,
    psychologicalDimension: 'memory and nostalgia',
    category: 'temporal',
    insightPotential: 0, // Will be calculated by runner
  };
}
