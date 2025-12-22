/**
 * The 2AM Song Detector
 *
 * Detects a single track that dominates late-night listening (midnight-4am).
 * This is the "hero detector" - the coping mechanism song, not just a favorite.
 * When 80%+ of a track's plays happen between midnight-4am, it reveals something
 * deeper than preference - it's an emotional regulation tool.
 *
 * Pattern ID: 31
 * Category: emotional
 * Psychological Dimension: emotional regulation
 * Priority: V1 - Hero Detector (High viral potential)
 */

import type { UserListeningData, DetectionResult, Evidence } from '../types';

/**
 * Configuration for 2AM song detection
 */
const CONFIG = {
  MIN_TOTAL_PLAYS: 5,           // Need at least 5 plays of the track
  MIN_NIGHT_RATIO: 0.7,         // 70%+ of plays must be late-night
  HERO_NIGHT_RATIO: 0.85,       // 85%+ = truly a night song
  NIGHT_START: 0,               // Midnight (0:00)
  NIGHT_END: 4,                 // 4:00 AM
};

/**
 * Find tracks with extreme late-night concentration
 */
function findNightSongs(data: UserListeningData): Array<{
  track: any;
  totalPlays: number;
  nightPlays: number;
  nightRatio: number;
  nightPlayTimes: Date[];
}> {
  const trackStats = new Map<string, {
    track: any;
    totalPlays: number;
    nightPlays: number;
    nightPlayTimes: Date[];
  }>();

  // Count plays per track, tracking which were at night
  data.recentlyPlayed.forEach(play => {
    const playTime = new Date(play.played_at);
    const hour = playTime.getHours();
    const isNight = hour >= CONFIG.NIGHT_START && hour < CONFIG.NIGHT_END;

    const existing = trackStats.get(play.track.id);
    if (existing) {
      existing.totalPlays++;
      if (isNight) {
        existing.nightPlays++;
        existing.nightPlayTimes.push(playTime);
      }
    } else {
      trackStats.set(play.track.id, {
        track: play.track,
        totalPlays: 1,
        nightPlays: isNight ? 1 : 0,
        nightPlayTimes: isNight ? [playTime] : [],
      });
    }
  });

  // Find tracks with high night concentration
  const nightSongs: Array<{
    track: any;
    totalPlays: number;
    nightPlays: number;
    nightRatio: number;
    nightPlayTimes: Date[];
  }> = [];

  trackStats.forEach((stats) => {
    if (stats.totalPlays >= CONFIG.MIN_TOTAL_PLAYS) {
      const nightRatio = stats.nightPlays / stats.totalPlays;
      if (nightRatio >= CONFIG.MIN_NIGHT_RATIO) {
        nightSongs.push({
          track: stats.track,
          totalPlays: stats.totalPlays,
          nightPlays: stats.nightPlays,
          nightRatio,
          nightPlayTimes: stats.nightPlayTimes,
        });
      }
    }
  });

  // Sort by night ratio (most concentrated first), then by play count
  return nightSongs.sort((a, b) => {
    if (Math.abs(a.nightRatio - b.nightRatio) < 0.05) {
      return b.nightPlays - a.nightPlays;
    }
    return b.nightRatio - a.nightRatio;
  });
}

/**
 * Detect The 2AM Song pattern
 *
 * Identifies a track that serves as a late-night emotional regulation tool.
 * This goes beyond preference - when a song is played almost exclusively
 * between midnight-4am, it's serving a specific psychological function:
 * - Processing difficult emotions
 * - Coping with insomnia or anxiety
 * - Emotional release in private moments
 * - Identity exploration when social masks are off
 *
 * This is the "hero detector" - the insight that makes users say "how did it know?"
 *
 * @param data - User's complete listening data
 * @returns Detection result or null if pattern not found
 */
export async function detectThe2amSong(
  data: UserListeningData
): Promise<DetectionResult | null> {
  console.log('[The 2AM Song] Starting detection...');

  const nightSongs = findNightSongs(data);

  console.log(`[The 2AM Song] Found ${nightSongs.length} candidates with ${CONFIG.MIN_NIGHT_RATIO * 100}%+ night plays`);
  if (nightSongs.length > 0) {
    nightSongs.forEach((song, i) => {
      console.log(`  ${i + 1}. "${song.track.name}": ${song.nightPlays}/${song.totalPlays} plays at night (${(song.nightRatio * 100).toFixed(0)}%)`);
    });
  }

  if (nightSongs.length === 0) {
    console.log('[The 2AM Song] No qualifying night songs found');
    return null;
  }

  // Use the most concentrated night song
  const theSong = nightSongs[0];

  // Calculate confidence based on night ratio and play count
  // 70% night ratio = 0.75 base, 85%+ = 0.95 base
  let confidence = Math.min(0.5 + (theSong.nightRatio * 0.6), 0.98);

  // Bonus for high play count (more evidence)
  if (theSong.nightPlays >= 8) {
    confidence = Math.min(confidence + 0.1, 1.0);
  }

  // Build evidence
  const evidence: Evidence[] = [
    {
      type: 'track',
      value: theSong.track,
      humanReadable: `"${theSong.track.name}" by ${theSong.track.artists[0].name}`
    },
    {
      type: 'ratio',
      value: theSong.nightRatio,
      humanReadable: `${Math.round(theSong.nightRatio * 100)}% of plays between midnight-4am`
    },
    {
      type: 'count',
      value: theSong.nightPlays,
      humanReadable: `${theSong.nightPlays} out of ${theSong.totalPlays} total plays were late-night`
    }
  ];

  // Show specific timestamps if available (up to 3)
  if (theSong.nightPlayTimes.length > 0) {
    const timestamps = theSong.nightPlayTimes
      .slice(0, 3)
      .map(t => {
        const hours = t.getHours();
        const minutes = t.getMinutes();
        const ampm = hours >= 12 ? 'AM' : 'AM'; // All will be AM since 0-4 range
        const displayHour = hours === 0 ? 12 : hours;
        return `${displayHour}:${minutes.toString().padStart(2, '0')}${ampm}`;
      });

    evidence.push({
      type: 'timestamp',
      value: timestamps,
      humanReadable: `Recent plays: ${timestamps.join(', ')}`
    });
  }

  // Check if track is also in top tracks (long-term pattern vs recent phase)
  const inShortTerm = data.topTracks.short.some(t => t.id === theSong.track.id);
  const inLongTerm = data.topTracks.long.some(t => t.id === theSong.track.id);

  if (inLongTerm) {
    evidence.push({
      type: 'timestamp',
      value: 'long-term',
      humanReadable: `Also in your all-time top tracks - this is a long-standing coping mechanism`
    });
    confidence = Math.min(confidence + 0.05, 1.0);
  } else if (inShortTerm) {
    evidence.push({
      type: 'timestamp',
      value: 'recent',
      humanReadable: `In your recent top tracks - you're going through something right now`
    });
  } else {
    evidence.push({
      type: 'timestamp',
      value: 'hidden',
      humanReadable: `Not in your top tracks - you only reach for this song when you need it`
    });
    confidence = Math.min(confidence + 0.1, 1.0); // Hidden coping songs are especially revealing
  }

  // Add interpretation based on intensity
  if (theSong.nightRatio >= CONFIG.HERO_NIGHT_RATIO) {
    evidence.push({
      type: 'count',
      value: 'extreme',
      humanReadable: `${Math.round(theSong.nightRatio * 100)}% night concentration - this isn't your favorite song, it's your coping mechanism`
    });
  } else {
    evidence.push({
      type: 'count',
      value: 'strong',
      humanReadable: `Strong late-night preference - this song serves a specific emotional function`
    });
  }

  return {
    patternId: 31,
    patternName: 'The 2AM Song',
    confidence,
    evidence,
    psychologicalDimension: 'emotional regulation',
    category: 'emotional',
    insightPotential: 0, // Will be calculated by runner
  };
}
