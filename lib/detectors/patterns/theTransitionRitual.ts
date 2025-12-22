/**
 * The Transition Ritual Detector
 *
 * Detects tracks that consistently appear right before long listening gaps (30min+),
 * suggesting they're used to mark transitions - end of work, bedtime preparation,
 * leaving the house, etc. These are "closing songs" that help you shift contexts.
 *
 * Different from Emotional Bookender (morning/evening) - this is about
 * marking ANY significant life transition with music.
 *
 * Pattern ID: 41
 * Category: temporal
 * Psychological Dimension: ritual and routine
 * Priority: V1 - Medium Priority
 */

import type { UserListeningData, DetectionResult, Evidence } from '../types';

/**
 * Configuration for transition ritual detection
 */
const CONFIG = {
  MIN_TRANSITION_COUNT: 3,       // Need 3+ instances
  MIN_GAP_MINUTES: 30,           // 30+ minute gap = context transition
  GAP_CLUSTERING_THRESHOLD: 0.6, // 60% of plays must precede gaps
};

/**
 * Find tracks that precede long listening gaps
 */
function findTransitionTracks(data: UserListeningData): Array<{
  track: any;
  transitionCount: number;
  totalPlayCount: number;
  transitionRatio: number;
  gapDurations: number[]; // in hours
  transitionTimes: Date[];
}> {
  if (data.recentlyPlayed.length < 5) return [];

  const chronologicalPlays = [...data.recentlyPlayed].reverse();

  // Track plays per track ID
  const trackStats = new Map<string, {
    track: any;
    totalPlays: number;
    transitionsAfter: number;
    gapDurations: number[];
    transitionTimes: Date[];
  }>();

  chronologicalPlays.forEach((play, index) => {
    const trackId = play.track.id;
    const playTime = new Date(play.played_at);

    // Initialize or update track stats
    if (!trackStats.has(trackId)) {
      trackStats.set(trackId, {
        track: play.track,
        totalPlays: 0,
        transitionsAfter: 0,
        gapDurations: [],
        transitionTimes: [],
      });
    }

    const stats = trackStats.get(trackId)!;
    stats.totalPlays++;

    // Check if there's a long gap after this play
    if (index < chronologicalPlays.length - 1) {
      const nextPlay = chronologicalPlays[index + 1];
      const nextPlayTime = new Date(nextPlay.played_at);
      const gapMinutes = (nextPlayTime.getTime() - playTime.getTime()) / (1000 * 60);

      if (gapMinutes >= CONFIG.MIN_GAP_MINUTES) {
        stats.transitionsAfter++;
        stats.gapDurations.push(gapMinutes / 60); // Store in hours
        stats.transitionTimes.push(playTime);
      }
    }
  });

  // Find tracks with high transition ratio
  const transitionTracks: Array<{
    track: any;
    transitionCount: number;
    totalPlayCount: number;
    transitionRatio: number;
    gapDurations: number[];
    transitionTimes: Date[];
  }> = [];

  trackStats.forEach((stats) => {
    if (stats.transitionsAfter >= CONFIG.MIN_TRANSITION_COUNT) {
      const transitionRatio = stats.transitionsAfter / stats.totalPlays;

      if (transitionRatio >= CONFIG.GAP_CLUSTERING_THRESHOLD) {
        transitionTracks.push({
          track: stats.track,
          transitionCount: stats.transitionsAfter,
          totalPlayCount: stats.totalPlays,
          transitionRatio,
          gapDurations: stats.gapDurations,
          transitionTimes: stats.transitionTimes,
        });
      }
    }
  });

  // Sort by transition count
  return transitionTracks.sort((a, b) => b.transitionCount - a.transitionCount);
}

/**
 * Detect The Transition Ritual pattern
 *
 * Identifies tracks consistently played before long listening gaps. This indicates:
 * - Ritual marking of life transitions
 * - Using music to close contexts
 * - Intentional boundary-setting behavior
 * - Music as transition aid
 *
 * When the same song consistently marks the end of listening sessions,
 * you're not just enjoying it - you're using it to signal "time to move on."
 *
 * @param data - User's complete listening data
 * @returns Detection result or null if pattern not found
 */
export async function detectTheTransitionRitual(
  data: UserListeningData
): Promise<DetectionResult | null> {
  console.log('[Transition Ritual] Starting detection...');

  const transitionTracks = findTransitionTracks(data);

  console.log(`[Transition Ritual] Found ${transitionTracks.length} transition ritual candidates`);
  if (transitionTracks.length > 0) {
    transitionTracks.forEach((track, i) => {
      console.log(`  ${i + 1}. "${track.track.name}": ${track.transitionCount}/${track.totalPlayCount} plays precede long gaps (${(track.transitionRatio * 100).toFixed(0)}%)`);
    });
  }

  if (transitionTracks.length === 0) {
    console.log('[Transition Ritual] No transition ritual patterns detected');
    return null;
  }

  // Use the strongest transition track
  const theTransitionTrack = transitionTracks[0];

  // Calculate confidence based on transition ratio and count
  // 60% ratio = 0.7, 80%+ = 0.9
  let confidence = Math.min(0.5 + (theTransitionTrack.transitionRatio * 0.5), 0.95);

  // Bonus for high transition count (more evidence)
  if (theTransitionTrack.transitionCount >= 5) {
    confidence = Math.min(confidence + 0.1, 1.0);
  }

  // Build evidence
  const evidence: Evidence[] = [
    {
      type: 'track',
      value: theTransitionTrack.track,
      humanReadable: `"${theTransitionTrack.track.name}" by ${theTransitionTrack.track.artists[0].name}`
    },
    {
      type: 'count',
      value: theTransitionTrack.transitionCount,
      humanReadable: `${theTransitionTrack.transitionCount} out of ${theTransitionTrack.totalPlayCount} plays are followed by 30+ minute gaps`
    },
    {
      type: 'ratio',
      value: theTransitionTrack.transitionRatio,
      humanReadable: `${Math.round(theTransitionTrack.transitionRatio * 100)}% of plays mark listening session endings`
    }
  ];

  // Show average gap duration
  const avgGapHours = theTransitionTrack.gapDurations.reduce((sum, d) => sum + d, 0) / theTransitionTrack.gapDurations.length;
  evidence.push({
    type: 'count',
    value: avgGapHours,
    humanReadable: `Average gap after: ${avgGapHours.toFixed(1)} hours`
  });

  // Show sample transition times
  if (theTransitionTrack.transitionTimes.length > 0) {
    const sampleTimes = theTransitionTrack.transitionTimes
      .slice(0, 3)
      .map(t => {
        const hours = t.getHours();
        const minutes = t.getMinutes();
        const ampm = hours >= 12 ? 'PM' : 'AM';
        const displayHour = hours > 12 ? hours - 12 : (hours === 0 ? 12 : hours);
        return `${displayHour}:${minutes.toString().padStart(2, '0')}${ampm}`;
      });

    evidence.push({
      type: 'timestamp',
      value: theTransitionTrack.transitionTimes,
      humanReadable: `Transition times: ${sampleTimes.join(', ')}`
    });
  }

  // Analyze time of day pattern
  const transitionHours = theTransitionTrack.transitionTimes.map(t => t.getHours());
  const eveningTransitions = transitionHours.filter(h => h >= 17 && h <= 23).length;
  const morningTransitions = transitionHours.filter(h => h >= 5 && h < 12).length;

  if (eveningTransitions >= theTransitionTrack.transitionCount / 2) {
    evidence.push({
      type: 'timestamp',
      value: 'evening',
      humanReadable: `Most transitions in evening (5PM-11PM) - this is your "day is done" signal`
    });
  } else if (morningTransitions >= theTransitionTrack.transitionCount / 2) {
    evidence.push({
      type: 'timestamp',
      value: 'morning',
      humanReadable: `Most transitions in morning (5AM-12PM) - this is your "time to start" marker`
    });
  }

  // Add interpretation based on ratio
  if (theTransitionTrack.transitionRatio >= 0.8) {
    evidence.push({
      type: 'ratio',
      value: 'extreme',
      humanReadable: `${Math.round(theTransitionTrack.transitionRatio * 100)}% consistency - this isn't just a favorite, it's a ritual closing song`
    });
  } else {
    evidence.push({
      type: 'ratio',
      value: 'high',
      humanReadable: `You use this track to mark transitions - it signals "time to shift contexts"`
    });
  }

  // Check if multiple transition tracks exist
  if (transitionTracks.length >= 2) {
    evidence.push({
      type: 'count',
      value: transitionTracks.length,
      humanReadable: `${transitionTracks.length} tracks serve as transition markers - you're highly intentional about context boundaries`
    });
  }

  return {
    patternId: 41,
    patternName: 'The Transition Ritual',
    confidence,
    evidence,
    psychologicalDimension: 'ritual and routine',
    category: 'temporal',
    insightPotential: 0, // Will be calculated by runner
  };
}
