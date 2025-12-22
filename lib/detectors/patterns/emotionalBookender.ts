/**
 * Emotional Bookender Detector
 *
 * Detects when the same track consistently appears at both the start and end
 * of listening sessions or days. This reveals a track serving as an emotional
 * "reset button" - used to establish mood in the morning and process/release
 * emotions at night. Indicates intentional emotional regulation strategy.
 *
 * Pattern ID: 32
 * Category: emotional
 * Psychological Dimension: emotional regulation
 * Priority: V1 - High Priority
 */

import type { UserListeningData, DetectionResult, Evidence } from '../types';

/**
 * Configuration for emotional bookender detection
 */
const CONFIG = {
  MIN_BOOKEND_PAIRS: 3,         // Need at least 3 instances
  MORNING_START: 5,             // 5:00 AM
  MORNING_END: 10,              // 10:00 AM
  EVENING_START: 20,            // 8:00 PM
  EVENING_END: 24,              // Midnight
  MAX_SESSION_GAP_HOURS: 8,     // Consider plays within 8 hours as "same day"
};

/**
 * Group plays into daily sessions and find bookend patterns
 */
function findBookendTracks(data: UserListeningData): Array<{
  track: any;
  bookendPairs: number;
  morningPlays: Date[];
  eveningPlays: Date[];
}> {
  const trackBookends = new Map<string, {
    track: any;
    morningPlays: Date[];
    eveningPlays: Date[];
  }>();

  // Categorize plays by track and time of day
  data.recentlyPlayed.forEach(play => {
    const playTime = new Date(play.played_at);
    const hour = playTime.getHours();

    const isMorning = hour >= CONFIG.MORNING_START && hour < CONFIG.MORNING_END;
    const isEvening = hour >= CONFIG.EVENING_START && hour < CONFIG.EVENING_END;

    if (isMorning || isEvening) {
      const existing = trackBookends.get(play.track.id);
      if (existing) {
        if (isMorning) existing.morningPlays.push(playTime);
        if (isEvening) existing.eveningPlays.push(playTime);
      } else {
        trackBookends.set(play.track.id, {
          track: play.track,
          morningPlays: isMorning ? [playTime] : [],
          eveningPlays: isEvening ? [playTime] : [],
        });
      }
    }
  });

  // Find tracks that appear in both morning and evening
  const bookendCandidates: Array<{
    track: any;
    bookendPairs: number;
    morningPlays: Date[];
    eveningPlays: Date[];
  }> = [];

  trackBookends.forEach((data) => {
    if (data.morningPlays.length > 0 && data.eveningPlays.length > 0) {
      // Count potential pairs (morning plays * evening plays, but cap reasonably)
      const bookendPairs = Math.min(
        data.morningPlays.length,
        data.eveningPlays.length
      );

      if (bookendPairs >= CONFIG.MIN_BOOKEND_PAIRS) {
        bookendCandidates.push({
          track: data.track,
          bookendPairs,
          morningPlays: data.morningPlays,
          eveningPlays: data.eveningPlays,
        });
      }
    }
  });

  // Sort by number of bookend pairs
  return bookendCandidates.sort((a, b) => b.bookendPairs - a.bookendPairs);
}

/**
 * Detect Emotional Bookender pattern
 *
 * Identifies tracks that consistently appear at both start and end of day.
 * This indicates:
 * - Intentional emotional regulation strategy
 * - Track serves as mood setter AND emotional processor
 * - Ritual behavior around music listening
 * - High emotional intelligence in music use
 *
 * The same song establishing your morning mindset and helping you process
 * the day at night? That's not coincidence - that's a coping mechanism.
 *
 * @param data - User's complete listening data
 * @returns Detection result or null if pattern not found
 */
export async function detectEmotionalBookender(
  data: UserListeningData
): Promise<DetectionResult | null> {
  console.log('[Emotional Bookender] Starting detection...');

  const bookendTracks = findBookendTracks(data);

  console.log(`[Emotional Bookender] Found ${bookendTracks.length} tracks appearing in both morning and evening`);
  if (bookendTracks.length > 0) {
    bookendTracks.forEach((bookend, i) => {
      console.log(`  ${i + 1}. "${bookend.track.name}": ${bookend.bookendPairs} bookend pairs (${bookend.morningPlays.length} morning, ${bookend.eveningPlays.length} evening)`);
    });
  }

  if (bookendTracks.length === 0) {
    console.log('[Emotional Bookender] No bookend patterns detected');
    return null;
  }

  // Use the track with most bookend pairs
  const theBookend = bookendTracks[0];

  // Calculate confidence based on bookend frequency
  // 3 pairs = 0.75, 5+ pairs = 0.9
  let confidence = Math.min(0.6 + (theBookend.bookendPairs * 0.08), 0.95);

  // Bonus if track appears in top tracks (consistent over time)
  const inTopTracks = data.topTracks.short.some(t => t.id === theBookend.track.id) ||
                      data.topTracks.long.some(t => t.id === theBookend.track.id);
  if (inTopTracks) {
    confidence = Math.min(confidence + 0.1, 1.0);
  }

  // Build evidence
  const evidence: Evidence[] = [
    {
      type: 'track',
      value: theBookend.track,
      humanReadable: `"${theBookend.track.name}" by ${theBookend.track.artists[0].name}`
    },
    {
      type: 'count',
      value: theBookend.bookendPairs,
      humanReadable: `Appears at both start and end of day ${theBookend.bookendPairs} times`
    },
    {
      type: 'count',
      value: theBookend.morningPlays.length,
      humanReadable: `${theBookend.morningPlays.length} morning plays (${CONFIG.MORNING_START}AM-${CONFIG.MORNING_END}AM)`
    },
    {
      type: 'count',
      value: theBookend.eveningPlays.length,
      humanReadable: `${theBookend.eveningPlays.length} evening plays (${CONFIG.EVENING_START}-${CONFIG.EVENING_END})`
    }
  ];

  // Show sample times
  if (theBookend.morningPlays.length > 0 && theBookend.eveningPlays.length > 0) {
    const morningTime = theBookend.morningPlays[0];
    const eveningTime = theBookend.eveningPlays[0];

    const formatTime = (date: Date) => {
      const hours = date.getHours();
      const minutes = date.getMinutes();
      const ampm = hours >= 12 ? 'PM' : 'AM';
      const displayHour = hours > 12 ? hours - 12 : (hours === 0 ? 12 : hours);
      return `${displayHour}:${minutes.toString().padStart(2, '0')}${ampm}`;
    };

    evidence.push({
      type: 'timestamp',
      value: [morningTime, eveningTime],
      humanReadable: `Example: ${formatTime(morningTime)} → ${formatTime(eveningTime)}`
    });
  }

  // Add interpretation based on pattern strength
  if (theBookend.bookendPairs >= 5) {
    evidence.push({
      type: 'count',
      value: 'high',
      humanReadable: `This isn't random - you're using this song as an emotional reset button`
    });
  } else {
    evidence.push({
      type: 'count',
      value: 'moderate',
      humanReadable: `This track serves dual purpose: setting your morning tone and processing your day at night`
    });
  }

  // Check if in saved tracks (intentional curation)
  if (data.savedTracks) {
    const isSaved = data.savedTracks.some(t => t.id === theBookend.track.id);
    if (isSaved) {
      evidence.push({
        type: 'count',
        value: 'saved',
        humanReadable: `Saved to library - you know this song is important to your routine`
      });
    }
  }

  return {
    patternId: 32,
    patternName: 'Emotional Bookender',
    confidence,
    evidence,
    psychologicalDimension: 'emotional regulation',
    category: 'emotional',
    insightPotential: 0, // Will be calculated by runner
  };
}
