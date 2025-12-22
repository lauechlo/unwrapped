/**
 * Early Bird Processor Detector
 *
 * Detects users who primarily listen to music during early morning hours.
 * Indicates preference for morning listening as part of their routine.
 *
 * Pattern ID: 9
 * Category: temporal
 * Psychological Dimension: temporal
 * Priority: V1 - High Priority
 */

import type { UserListeningData, DetectionResult, Evidence } from '../types';

/**
 * Configuration for early bird detection
 */
const CONFIG = {
  MORNING_START: 6,          // 6am
  MORNING_END: 10,           // 10am
  MIN_MORNING_RATIO: 0.35,   // Minimum 35% morning listening to detect
  MIN_PLAYS: 20,             // Minimum plays needed for reliable detection
  MAX_CONFIDENCE: 0.6,       // Cap confidence due to limited temporal data (~2 days)
};

/**
 * Check if an hour falls in morning window
 */
function isMorningHour(hour: number): boolean {
  return hour >= CONFIG.MORNING_START && hour < CONFIG.MORNING_END;
}

/**
 * Get hour from ISO timestamp
 */
function getHourFromTimestamp(timestamp: string): number {
  return new Date(timestamp).getHours();
}

/**
 * Format hour for display (12-hour format)
 */
function formatHour(hour: number): string {
  if (hour === 0) return '12am';
  if (hour < 12) return `${hour}am`;
  if (hour === 12) return '12pm';
  return `${hour - 12}pm`;
}

/**
 * Detect Early Bird Processor pattern
 *
 * Identifies users who listen to music primarily during early morning hours.
 * High morning listening ratio indicates use of music for morning routines,
 * wake-up rituals, or commute accompaniment.
 *
 * @param data - User's complete listening data
 * @returns Detection result or null if pattern not found
 */
export async function detectEarlyBirdProcessor(
  data: UserListeningData
): Promise<DetectionResult | null> {
  const plays = data.recentlyPlayed;

  // Need sufficient data
  if (plays.length < CONFIG.MIN_PLAYS) {
    return null;
  }

  // Count plays by time of day
  const morningPlays = plays.filter(play =>
    isMorningHour(getHourFromTimestamp(play.played_at))
  );

  const morningRatio = morningPlays.length / plays.length;

  // Check if meets threshold
  if (morningRatio < CONFIG.MIN_MORNING_RATIO) {
    return null;
  }

  // Calculate confidence (capped at 0.6 due to limited temporal data)
  // Higher ratio = higher confidence
  // Scale: 0.35 -> 0.5, 0.50 -> 0.6 (max)
  const baseConfidence = Math.min(morningRatio * 1.5, 1.0);
  const confidence = Math.min(baseConfidence, CONFIG.MAX_CONFIDENCE);

  // Build evidence
  const evidence: Evidence[] = [
    {
      type: 'ratio',
      value: morningRatio,
      humanReadable: `${Math.round(morningRatio * 100)}% of listening occurs between 6am-10am`
    },
    {
      type: 'count',
      value: morningPlays.length,
      humanReadable: `${morningPlays.length} of ${plays.length} recent plays were in the morning`
    },
    {
      type: 'timestamp',
      value: plays.length,
      humanReadable: `⚠️ Based on ~2 days of recent listening history (limited data)`
    }
  ];

  // Only add peak hour if there are actual morning plays
  if (morningPlays.length > 0) {
    const hourCounts = new Map<number, number>();
    morningPlays.forEach(play => {
      const hour = getHourFromTimestamp(play.played_at);
      hourCounts.set(hour, (hourCounts.get(hour) || 0) + 1);
    });

    let peakHour = 0;
    let peakCount = 0;
    hourCounts.forEach((count, hour) => {
      if (count > peakCount) {
        peakCount = count;
        peakHour = hour;
      }
    });

    evidence.push({
      type: 'timestamp',
      value: peakHour,
      humanReadable: `Peak listening hour: ${formatHour(peakHour)}`
    });
  }

  return {
    patternId: 9,
    patternName: 'Early Bird Processor',
    confidence,
    evidence,
    psychologicalDimension: 'temporal',
    category: 'temporal',
    insightPotential: 0, // Will be calculated by runner
  };
}
