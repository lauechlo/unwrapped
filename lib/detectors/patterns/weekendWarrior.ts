/**
 * Weekend Warrior Detector
 *
 * Detects users who listen significantly more on weekends than weekdays.
 * Indicates music as weekend activity, relaxation, or leisure time behavior.
 *
 * Pattern ID: 10
 * Category: temporal
 * Psychological Dimension: temporal
 * Priority: V1 - High Priority
 */

import type { UserListeningData, DetectionResult, Evidence } from '../types';

/**
 * Configuration for weekend warrior detection
 */
const CONFIG = {
  MIN_WEEKEND_RATIO: 2.5,    // Weekend listening must be 2.5x weekday
  MIN_PLAYS: 20,             // Minimum plays needed for reliable detection
  MIN_WEEKEND_PLAYS: 8,      // Need at least 8 weekend plays to be meaningful
  MAX_CONFIDENCE: 0.55,      // Cap confidence due to limited temporal data (~2 days, may not span full weekend)
};

/**
 * Check if a date falls on weekend (Saturday or Sunday)
 */
function isWeekend(timestamp: string): boolean {
  const day = new Date(timestamp).getDay();
  return day === 0 || day === 6; // Sunday = 0, Saturday = 6
}

/**
 * Get day name from timestamp
 */
function getDayName(timestamp: string): string {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return days[new Date(timestamp).getDay()];
}

/**
 * Detect Weekend Warrior pattern
 *
 * Identifies users who listen significantly more on weekends than weekdays.
 * High weekend ratio indicates music as leisure activity or relaxation tied
 * to free time rather than daily routine.
 *
 * @param data - User's complete listening data
 * @returns Detection result or null if pattern not found
 */
export async function detectWeekendWarrior(
  data: UserListeningData
): Promise<DetectionResult | null> {
  const plays = data.recentlyPlayed;

  // Need sufficient data
  if (plays.length < CONFIG.MIN_PLAYS) {
    return null;
  }

  // Count weekend vs weekday plays
  const weekendPlays = plays.filter(play => isWeekend(play.played_at));
  const weekdayPlays = plays.filter(play => !isWeekend(play.played_at));

  // Avoid division by zero
  if (weekdayPlays.length === 0) {
    return null;
  }

  // Calculate ratio and per-day averages
  // 2 weekend days vs 5 weekday days, so normalize
  const weekendPerDay = weekendPlays.length / 2;
  const weekdayPerDay = weekdayPlays.length / 5;
  const ratio = weekendPerDay / weekdayPerDay;

  // Check if meets threshold
  if (ratio < CONFIG.MIN_WEEKEND_RATIO || weekendPlays.length < CONFIG.MIN_WEEKEND_PLAYS) {
    return null;
  }

  // Calculate confidence (capped at 0.55 due to limited temporal data)
  // Higher ratio = higher confidence
  // Scale: 2.5x -> 0.45, 3.5x -> 0.55 (max)
  const baseConfidence = Math.min((ratio - 2.5) * 0.2 + 0.65, 1.0);
  const confidence = Math.min(baseConfidence, CONFIG.MAX_CONFIDENCE);

  // Find most active weekend day
  const saturdayCount = plays.filter(p => new Date(p.played_at).getDay() === 6).length;
  const sundayCount = plays.filter(p => new Date(p.played_at).getDay() === 0).length;
  const favoriteDay = saturdayCount > sundayCount ? 'Saturday' : 'Sunday';

  // Build evidence
  const evidence: Evidence[] = [
    {
      type: 'ratio',
      value: ratio,
      humanReadable: `${ratio.toFixed(1)}x more listening on weekends than weekdays`
    },
    {
      type: 'count',
      value: weekendPlays.length,
      humanReadable: `${weekendPlays.length} weekend plays vs ${weekdayPlays.length} weekday plays`
    },
    {
      type: 'timestamp',
      value: favoriteDay,
      humanReadable: `Most active on ${favoriteDay}s`
    },
    {
      type: 'timestamp',
      value: plays.length,
      humanReadable: `⚠️ Based on ~2 days of recent listening history (may not span full weekend)`
    }
  ];

  return {
    patternId: 10,
    patternName: 'Weekend Warrior',
    confidence,
    evidence,
    psychologicalDimension: 'temporal',
    category: 'temporal',
    insightPotential: 0, // Will be calculated by runner
  };
}
