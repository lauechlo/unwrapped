/**
 * Night Owl Processor Detector
 *
 * Detects users who primarily listen to music during late night hours.
 * Indicates preference for nighttime listening as part of their routine.
 *
 * Pattern ID: 8
 * Category: temporal
 * Psychological Dimension: temporal
 * Priority: V1 - High Priority
 */

import type { UserListeningData, DetectionResult, Evidence } from '../types';

/**
 * Configuration for night owl detection
 */
const CONFIG = {
  NIGHT_START: 22,           // 10pm
  NIGHT_END: 4,              // 4am
  MIN_NIGHT_RATIO: 0.35,     // Minimum 35% night listening to detect
  MIN_PLAYS: 20,             // Minimum plays needed for reliable detection
  MAX_CONFIDENCE: 0.6,       // Cap confidence due to limited temporal data (~2 days)
};

/**
 * Check if an hour falls in nighttime window
 */
function isNightHour(hour: number): boolean {
  return hour >= CONFIG.NIGHT_START || hour <= CONFIG.NIGHT_END;
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
 * Detect Night Owl Processor pattern
 *
 * Identifies users who listen to music primarily during late night hours.
 * High night listening ratio indicates use of music for late-night activities,
 * emotional processing, or work/study during quiet hours.
 *
 * @param data - User's complete listening data
 * @returns Detection result or null if pattern not found
 */
export async function detectNightOwlProcessor(
  data: UserListeningData
): Promise<DetectionResult | null> {
  const plays = data.recentlyPlayed;

  // Need sufficient data
  if (plays.length < CONFIG.MIN_PLAYS) {
    return null;
  }

  // Count plays by time of day
  const nightPlays = plays.filter(play =>
    isNightHour(getHourFromTimestamp(play.played_at))
  );

  const nightRatio = nightPlays.length / plays.length;

  // Check if meets threshold
  if (nightRatio < CONFIG.MIN_NIGHT_RATIO) {
    return null;
  }

  // Calculate confidence (capped at 0.6 due to limited temporal data)
  // Higher ratio = higher confidence
  // Scale: 0.35 -> 0.5, 0.50 -> 0.6 (max)
  const baseConfidence = Math.min(nightRatio * 1.5, 1.0);
  const confidence = Math.min(baseConfidence, CONFIG.MAX_CONFIDENCE);

  // Build evidence
  const evidence: Evidence[] = [
    {
      type: 'ratio',
      value: nightRatio,
      humanReadable: `${Math.round(nightRatio * 100)}% of listening occurs after 10pm`
    },
    {
      type: 'count',
      value: nightPlays.length,
      humanReadable: `${nightPlays.length} of ${plays.length} recent plays were at night`
    },
    {
      type: 'timestamp',
      value: plays.length,
      humanReadable: `⚠️ Based on ~2 days of recent listening history (limited data)`
    }
  ];

  // Only add peak hour if there are actual night plays
  if (nightPlays.length > 0) {
    const hourCounts = new Map<number, number>();
    nightPlays.forEach(play => {
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
    patternId: 8,
    patternName: 'Night Owl Processor',
    confidence,
    evidence,
    psychologicalDimension: 'temporal',
    category: 'temporal',
    insightPotential: 0, // Will be calculated by runner
  };
}
