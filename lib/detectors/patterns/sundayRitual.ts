/**
 * Sunday Ritual Detector
 *
 * Detects when specific tracks or artists appear consistently on the same
 * day of the week. This reveals music as life structure and ritual behavior -
 * tracks anchored to weekly rhythms rather than just mood. Classic example:
 * Sunday morning coffee with the same playlist, or Friday evening wind-down track.
 *
 * Pattern ID: 34
 * Category: temporal
 * Psychological Dimension: temporal and routine
 * Priority: V1 - High Priority
 */

import type { UserListeningData, DetectionResult, Evidence } from '../types';

/**
 * Configuration for Sunday ritual detection
 */
const CONFIG = {
  MIN_OCCURRENCES: 2,           // Need at least 2 occurrences on same day
  MIN_CONCENTRATION_RATIO: 0.6, // 60%+ of plays on one day of week
  DAY_NAMES: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
};

/**
 * Find tracks that concentrate on specific days of the week
 */
function findDayRituals(data: UserListeningData): Array<{
  track: any;
  dominantDay: number; // 0-6
  dominantDayName: string;
  playsOnDay: number;
  totalPlays: number;
  concentration: number;
  playTimes: Date[];
}> {
  const trackDayStats = new Map<string, {
    track: any;
    dayBreakdown: Map<number, Date[]>; // day of week -> play times
    totalPlays: number;
  }>();

  // Count plays per track per day of week
  data.recentlyPlayed.forEach(play => {
    const playTime = new Date(play.played_at);
    const dayOfWeek = playTime.getDay(); // 0 = Sunday, 6 = Saturday

    const existing = trackDayStats.get(play.track.id);
    if (existing) {
      existing.totalPlays++;
      const dayPlays = existing.dayBreakdown.get(dayOfWeek) || [];
      dayPlays.push(playTime);
      existing.dayBreakdown.set(dayOfWeek, dayPlays);
    } else {
      const dayBreakdown = new Map<number, Date[]>();
      dayBreakdown.set(dayOfWeek, [playTime]);
      trackDayStats.set(play.track.id, {
        track: play.track,
        dayBreakdown,
        totalPlays: 1,
      });
    }
  });

  // Find tracks with high concentration on one day
  const rituals: Array<{
    track: any;
    dominantDay: number;
    dominantDayName: string;
    playsOnDay: number;
    totalPlays: number;
    concentration: number;
    playTimes: Date[];
  }> = [];

  trackDayStats.forEach((stats) => {
    if (stats.totalPlays < 3) return; // Need at least 3 total plays

    // Find day with most plays
    let maxDay = 0;
    let maxPlays = 0;

    stats.dayBreakdown.forEach((plays, day) => {
      if (plays.length > maxPlays) {
        maxPlays = plays.length;
        maxDay = day;
      }
    });

    const concentration = maxPlays / stats.totalPlays;

    if (maxPlays >= CONFIG.MIN_OCCURRENCES && concentration >= CONFIG.MIN_CONCENTRATION_RATIO) {
      rituals.push({
        track: stats.track,
        dominantDay: maxDay,
        dominantDayName: CONFIG.DAY_NAMES[maxDay],
        playsOnDay: maxPlays,
        totalPlays: stats.totalPlays,
        concentration,
        playTimes: stats.dayBreakdown.get(maxDay) || [],
      });
    }
  });

  // Sort by concentration (most concentrated first)
  return rituals.sort((a, b) => b.concentration - a.concentration);
}

/**
 * Detect Sunday Ritual pattern
 *
 * Identifies tracks anchored to specific days of the week. This indicates:
 * - Music as life structure and routine
 * - Ritual behavior around listening
 * - Weekly emotional cycles
 * - Tracks serving specific weekly functions
 *
 * When a song is your "Sunday morning" track or "Friday evening" track,
 * music has become part of your life's temporal architecture.
 *
 * @param data - User's complete listening data
 * @returns Detection result or null if pattern not found
 */
export async function detectSundayRitual(
  data: UserListeningData
): Promise<DetectionResult | null> {
  console.log('[Sunday Ritual] Starting detection...');

  const rituals = findDayRituals(data);

  console.log(`[Sunday Ritual] Found ${rituals.length} tracks with day-of-week patterns`);
  if (rituals.length > 0) {
    rituals.forEach((ritual, i) => {
      console.log(`  ${i + 1}. "${ritual.track.name}": ${ritual.playsOnDay}/${ritual.totalPlays} plays on ${ritual.dominantDayName} (${(ritual.concentration * 100).toFixed(0)}%)`);
    });
  }

  if (rituals.length === 0) {
    console.log('[Sunday Ritual] No day-specific patterns detected');
    return null;
  }

  // Use the most concentrated ritual
  const theRitual = rituals[0];

  // Calculate confidence based on concentration and frequency
  // 60% concentration = 0.7, 80%+ = 0.9
  let confidence = Math.min(0.5 + (theRitual.concentration * 0.5), 0.95);

  // Bonus for high frequency (more evidence)
  if (theRitual.playsOnDay >= 4) {
    confidence = Math.min(confidence + 0.1, 1.0);
  }

  // Build evidence
  const evidence: Evidence[] = [
    {
      type: 'track',
      value: theRitual.track,
      humanReadable: `"${theRitual.track.name}" by ${theRitual.track.artists[0].name}`
    },
    {
      type: 'ratio',
      value: theRitual.concentration,
      humanReadable: `${Math.round(theRitual.concentration * 100)}% of plays happen on ${theRitual.dominantDayName}`
    },
    {
      type: 'count',
      value: theRitual.playsOnDay,
      humanReadable: `${theRitual.playsOnDay} out of ${theRitual.totalPlays} total plays`
    }
  ];

  // Show specific times
  if (theRitual.playTimes.length > 0) {
    const times = theRitual.playTimes
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
      value: theRitual.playTimes,
      humanReadable: `${theRitual.dominantDayName} plays: ${times.join(', ')}`
    });
  }

  // Add day-specific interpretation
  const dayInterpretations: Record<number, string> = {
    0: 'Sunday ritual - setting the tone for a reset day',
    1: 'Monday ritual - preparing for or recovering from week start',
    2: 'Tuesday ritual - mid-week grounding',
    3: 'Wednesday ritual - hump day emotional checkpoint',
    4: 'Thursday ritual - anticipation building',
    5: 'Friday ritual - weekly transition and release',
    6: 'Saturday ritual - freedom and self-time',
  };

  evidence.push({
    type: 'timestamp',
    value: theRitual.dominantDay,
    humanReadable: dayInterpretations[theRitual.dominantDay]
  });

  // General interpretation
  if (theRitual.concentration >= 0.8) {
    evidence.push({
      type: 'count',
      value: 'extreme',
      humanReadable: `This isn't random - music has become part of your weekly structure`
    });
  } else {
    evidence.push({
      type: 'count',
      value: 'strong',
      humanReadable: `This track serves a specific function on ${theRitual.dominantDayName}s`
    });
  }

  // Check if in top tracks (long-term ritual vs recent)
  const inLongTerm = data.topTracks.long.some(t => t.id === theRitual.track.id);
  if (inLongTerm) {
    evidence.push({
      type: 'timestamp',
      value: 'established',
      humanReadable: `Also in all-time favorites - this is an established ritual, not a new habit`
    });
  }

  return {
    patternId: 34,
    patternName: `${theRitual.dominantDayName} Ritual`,
    confidence,
    evidence,
    psychologicalDimension: 'temporal',
    category: 'temporal',
    insightPotential: 0, // Will be calculated by runner
  };
}
