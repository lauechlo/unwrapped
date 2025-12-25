/**
 * The Morning Person Detector
 *
 * Detects when 60%+ of recent plays happen during morning hours (6am-12pm).
 * Not about specific tracks - about your overall listening schedule revealing
 * you as a morning-oriented person who uses music to start the day.
 *
 * Pattern ID: 56
 * Category: temporal
 * Psychological Dimension: temporal and routine
 * Priority: V1 - High Priority
 */

import type { UserListeningData, DetectionResult, Evidence } from '../types';

/**
 * Configuration for morning person detection
 */
const CONFIG = {
  MORNING_START: 6,               // 6am
  MORNING_END: 12,                // 12pm (noon)
  MIN_MORNING_RATIO: 0.60,        // 60%+ morning plays
  MIN_TOTAL_PLAYS: 10,            // Need enough data
  HIGH_MORNING_RATIO: 0.75,       // 75%+ = extreme morning person
};

/**
 * Analyze temporal distribution of plays
 */
function analyzeMorningListening(data: UserListeningData): {
  morningPlays: number;
  afternoonPlays: number;
  eveningPlays: number;
  nightPlays: number;
  totalPlays: number;
  morningRatio: number;
  morningTimes: Date[];
} {
  let morningPlays = 0;
  let afternoonPlays = 0;  // 12pm-6pm
  let eveningPlays = 0;    // 6pm-10pm
  let nightPlays = 0;      // 10pm-6am
  const morningTimes: Date[] = [];

  data.recentlyPlayed.forEach(play => {
    const playTime = new Date(play.played_at);
    const hour = playTime.getHours();

    if (hour >= CONFIG.MORNING_START && hour < CONFIG.MORNING_END) {
      morningPlays++;
      morningTimes.push(playTime);
    } else if (hour >= 12 && hour < 18) {
      afternoonPlays++;
    } else if (hour >= 18 && hour < 22) {
      eveningPlays++;
    } else {
      nightPlays++;
    }
  });

  const totalPlays = data.recentlyPlayed.length;

  return {
    morningPlays,
    afternoonPlays,
    eveningPlays,
    nightPlays,
    totalPlays,
    morningRatio: morningPlays / totalPlays,
    morningTimes,
  };
}

/**
 * Detect The Morning Person pattern
 *
 * Identifies users who predominantly listen during morning hours.
 * This indicates:
 * - Morning-oriented circadian rhythm
 * - Music as part of morning routine (wake up, commute, work start)
 * - Energy regulation - using music to activate and focus
 * - Structured daily habits
 *
 * @param data - User's complete listening data
 * @returns Detection result or null if pattern not found
 */
export async function detectTheMorningPerson(
  data: UserListeningData
): Promise<DetectionResult | null> {
  console.log('[The Morning Person] Starting detection...');

  const stats = analyzeMorningListening(data);

  console.log(`[The Morning Person] ${stats.morningPlays} morning plays / ${stats.totalPlays} total (${(stats.morningRatio * 100).toFixed(0)}%)`);
  console.log(`  Breakdown: ${stats.morningPlays} morning, ${stats.afternoonPlays} afternoon, ${stats.eveningPlays} evening, ${stats.nightPlays} night`);

  // Check minimum data requirement
  if (stats.totalPlays < CONFIG.MIN_TOTAL_PLAYS) {
    console.log(`[The Morning Person] Only ${stats.totalPlays} plays, need ${CONFIG.MIN_TOTAL_PLAYS}`);
    return null;
  }

  // Check if meets morning ratio threshold
  if (stats.morningRatio < CONFIG.MIN_MORNING_RATIO) {
    console.log(`[The Morning Person] Morning ratio ${(stats.morningRatio * 100).toFixed(0)}% below threshold of ${CONFIG.MIN_MORNING_RATIO * 100}%`);
    return null;
  }

  // Calculate confidence based on morning ratio
  // 60% = 0.75, 75%+ = 0.95
  let confidence = Math.min(0.5 + (stats.morningRatio * 0.6), 0.95);

  // Bonus for extreme morning dominance
  if (stats.morningRatio >= CONFIG.HIGH_MORNING_RATIO) {
    confidence = Math.min(confidence + 0.1, 1.0);
  }

  // Build evidence
  const evidence: Evidence[] = [
    {
      type: 'ratio',
      value: stats.morningRatio,
      humanReadable: `${Math.round(stats.morningRatio * 100)}% of your recent plays happen during morning hours (6am-12pm)`
    },
    {
      type: 'count',
      value: stats.morningPlays,
      humanReadable: `${stats.morningPlays} morning plays vs ${stats.afternoonPlays + stats.eveningPlays + stats.nightPlays} afternoon/evening/night plays`
    }
  ];

  // Show specific morning listening pattern
  if (stats.morningTimes.length >= 3) {
    // Get average morning listening time
    const avgTime = stats.morningTimes.reduce((sum, time) => {
      return sum + time.getHours() + (time.getMinutes() / 60);
    }, 0) / stats.morningTimes.length;

    const avgHour = Math.floor(avgTime);
    const avgMinute = Math.round((avgTime - avgHour) * 60);
    const ampm = avgHour >= 12 ? 'PM' : 'AM';
    const displayHour = avgHour > 12 ? avgHour - 12 : (avgHour === 0 ? 12 : avgHour);

    evidence.push({
      type: 'timestamp',
      value: avgTime,
      humanReadable: `Average morning listening time: ~${displayHour}:${avgMinute.toString().padStart(2, '0')}${ampm}`
    });
  }

  // Interpret based on ratio
  if (stats.morningRatio >= CONFIG.HIGH_MORNING_RATIO) {
    evidence.push({
      type: 'count',
      value: 'extreme',
      humanReadable: `${Math.round(stats.morningRatio * 100)}% morning concentration - music is core to your morning routine`
    });
  } else if (stats.morningRatio >= 0.65) {
    evidence.push({
      type: 'count',
      value: 'high',
      humanReadable: `Strong morning preference - you use music to activate and start your day`
    });
  } else {
    evidence.push({
      type: 'count',
      value: 'moderate',
      humanReadable: `Morning-leaning listener - music helps you transition into the day`
    });
  }

  // Check if morning tracks differ from overall favorites
  const morningTrackIds = new Set<string>();
  data.recentlyPlayed.forEach(play => {
    const playTime = new Date(play.played_at);
    const hour = playTime.getHours();
    if (hour >= CONFIG.MORNING_START && hour < CONFIG.MORNING_END) {
      morningTrackIds.add(play.track.id);
    }
  });

  const topTrackIds = new Set(data.topTracks.short.slice(0, 10).map(t => t.id));
  const morningTopOverlap = Array.from(morningTrackIds).filter(id => topTrackIds.has(id)).length;
  const morningSpecificTracks = morningTrackIds.size - morningTopOverlap;

  if (morningSpecificTracks >= 3) {
    evidence.push({
      type: 'count',
      value: 'specific-tracks',
      humanReadable: `${morningSpecificTracks} tracks appear primarily in morning hours - you have a morning soundtrack`
    });
  }

  // Compare to afternoon/evening
  const nonMorningRatio = 1 - stats.morningRatio;
  if (nonMorningRatio < 0.25) {
    evidence.push({
      type: 'timestamp',
      value: 'contrast',
      humanReadable: `Less than ${Math.round(nonMorningRatio * 100)}% of listening happens after noon - afternoons/evenings are quiet`
    });
  }

  return {
    patternId: 56,
    patternName: 'The Morning Person',
    confidence,
    evidence,
    psychologicalDimension: 'temporal and routine',
    category: 'temporal',
    insightPotential: 0, // Will be calculated by runner
  };
}
