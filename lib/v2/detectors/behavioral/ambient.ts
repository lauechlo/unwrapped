// Ambient/Lock-In Detector
// Finds background/environmental sounds used for focus or sleep
// Psychology: Environmental sound for emotional regulation - "Solace" strategy (Saarikallio, 2007)

import { SourceOfTruth, DetectionResult, Evidence, TrackAggregate } from '../../types';
import { formatDuration } from '../../sourceOfTruth/utils';

const PATTERN_ID = 'ambient-lock-in';
const PATTERN_NAME = 'The Lock-In Sound';
const PATTERN_FAMILY = 'behavioral';
const BASE_RATE = 0.12; // ~12% of users have ambient listening patterns

interface AmbientCandidate {
  track: TrackAggregate;
  avgDuration: number;
  totalDuration: number;
  sessionCount: number;
  skipRate: number;
  dominantHours: number[];
  timeContext: 'sleep' | 'study' | 'work' | 'relax';
  isAmbient: boolean;
}

// Ambient track indicators
const AMBIENT_KEYWORDS = [
  'rain',
  'fireplace',
  'fire',
  'crackling',
  'white noise',
  'brown noise',
  'pink noise',
  'ocean',
  'waves',
  'thunder',
  'nature',
  'ambient',
  'sleep',
  'relax',
  'meditation',
  'focus',
  'study',
  'lo-fi',
  'lofi',
  'chill beats',
  'cafe',
  'coffee shop',
  'library',
  '8 hours',
  '10 hours',
  '12 hours',
];

/**
 * Detect ambient/background listening for focus or sleep
 *
 * @param sot - SourceOfTruth index
 * @param maxResults - Maximum number of results to return (default 10)
 * @returns Array of detection results, sorted by strength
 */
export function detectAmbient(sot: SourceOfTruth, maxResults: number = 10): DetectionResult[] {
  const candidates = findAmbientCandidates(sot);

  if (candidates.length === 0) return [];

  // Sort by total duration (most time spent)
  candidates.sort((a, b) => b.totalDuration - a.totalDuration);

  // Filter candidates that meet threshold
  const validCandidates = candidates.filter(candidate => {
    // Threshold:
    // - Average play duration > 30 minutes (1,800,000 ms)
    // - At least 3 sessions
    // - Skip rate < 50% (letting it run)
    // - Either: ambient track name OR very long sessions
    const hasLongSessions = candidate.avgDuration > 1800000;
    const hasMultipleSessions = candidate.sessionCount >= 3;
    const lowSkipRate = candidate.skipRate < 0.5;
    return hasLongSessions && hasMultipleSessions && lowSkipRate;
  });

  // Return top N results
  return validCandidates.slice(0, maxResults).map(candidate => {
    // Calculate distinctiveness
    const distinctiveness = calculateDistinctiveness(
      candidate.avgDuration,
      candidate.sessionCount,
      BASE_RATE
    );

    // Build evidence
    const evidence: Evidence[] = [
      {
        type: 'track',
        metric: 'ambient_track',
        value: candidate.track.name,
        sourceIndices: candidate.track.plays.map(p => p.rawIndex),
        humanReadable: `"${candidate.track.name}" by ${candidate.track.artist}`,
      },
      {
        type: 'count',
        metric: 'session_count',
        value: candidate.sessionCount,
        sourceIndices: [],
        humanReadable: `${candidate.sessionCount} sessions`,
      },
      {
        type: 'duration',
        metric: 'avg_duration',
        value: candidate.avgDuration,
        sourceIndices: [],
        humanReadable: `Avg ${formatDuration(candidate.avgDuration)} per session`,
      },
      {
        type: 'duration',
        metric: 'total_duration',
        value: candidate.totalDuration,
        sourceIndices: [],
        humanReadable: `${formatDuration(candidate.totalDuration)} total`,
      },
      {
        type: 'timestamp',
        metric: 'time_context',
        value: candidate.timeContext,
        sourceIndices: [],
        humanReadable: getTimeContextDescription(candidate.timeContext, candidate.dominantHours),
      },
    ];

    return {
      patternId: PATTERN_ID,
      patternName: PATTERN_NAME,
      patternFamily: PATTERN_FAMILY,
      confidence: Math.min(candidate.avgDuration / 3600000, 1.0), // Normalize by 1 hour
      distinctiveness,
      evidence,
      psychologicalBasis:
        'Environmental sound preference for emotional regulation. "Solace" strategy: using music/sounds to create comforting atmosphere for focus or relaxation (Saarikallio, 2007)',
    };
  });
}

/**
 * Find ambient/background listening candidates
 */
function findAmbientCandidates(sot: SourceOfTruth): AmbientCandidate[] {
  const candidates: AmbientCandidate[] = [];

  for (const track of sot.tracks.values()) {
    // Need significant engagement
    if (track.totalPlays < 3) continue;

    // Check if track name suggests ambient content
    const trackNameLower = track.name.toLowerCase();
    const artistNameLower = track.artist.toLowerCase();
    const isAmbient = AMBIENT_KEYWORDS.some(
      keyword =>
        trackNameLower.includes(keyword) || artistNameLower.includes(keyword)
    );

    // Calculate average duration per play
    const avgDuration = track.avgMsPerPlay;

    // Must be relatively long plays (>10 minutes) to consider
    if (avgDuration < 600000 && !isAmbient) continue;

    // Count sessions (plays that are close together in time)
    const sessionCount = countSessions(track);

    // Calculate skip rate
    const skipRate = track.skippedPlays / track.totalPlays;

    // Find dominant hours
    const hourCounts = new Map<number, number>();
    for (const play of track.plays) {
      const hour = play.timestamp.getHours();
      hourCounts.set(hour, (hourCounts.get(hour) || 0) + 1);
    }

    const dominantHours = Array.from(hourCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([hour]) => hour);

    // Determine time context
    const timeContext = determineTimeContext(dominantHours);

    // Calculate total duration
    const totalDuration = track.totalMsPlayed;

    // Only consider if either:
    // 1. Ambient track name
    // 2. Very long average sessions (>30 min)
    if (isAmbient || avgDuration > 1800000) {
      candidates.push({
        track,
        avgDuration,
        totalDuration,
        sessionCount,
        skipRate,
        dominantHours,
        timeContext,
        isAmbient,
      });
    }
  }

  return candidates;
}

/**
 * Count distinct listening sessions
 * Sessions are separated by >30 minutes
 */
function countSessions(track: TrackAggregate): number {
  if (track.plays.length === 0) return 0;

  const sortedPlays = [...track.plays].sort(
    (a, b) => a.timestamp.getTime() - b.timestamp.getTime()
  );

  let sessionCount = 1;
  let lastTimestamp = sortedPlays[0].timestamp.getTime();

  for (let i = 1; i < sortedPlays.length; i++) {
    const currentTimestamp = sortedPlays[i].timestamp.getTime();
    const gap = currentTimestamp - lastTimestamp;

    // If gap > 30 minutes, it's a new session
    if (gap > 1800000) {
      sessionCount++;
    }

    lastTimestamp = currentTimestamp;
  }

  return sessionCount;
}

/**
 * Determine time context from dominant hours
 */
function determineTimeContext(
  hours: number[]
): 'sleep' | 'study' | 'work' | 'relax' {
  if (hours.length === 0) return 'relax';

  const avgHour = hours.reduce((sum, h) => sum + h, 0) / hours.length;

  // Sleep: 10pm - 6am
  if (avgHour >= 22 || avgHour <= 6) return 'sleep';

  // Work: 9am - 5pm
  if (avgHour >= 9 && avgHour <= 17) return 'work';

  // Study/focus: 2pm - 6pm
  if (avgHour >= 14 && avgHour <= 18) return 'study';

  // Default: relax
  return 'relax';
}

/**
 * Get human-readable time context description
 */
function getTimeContextDescription(
  context: 'sleep' | 'study' | 'work' | 'relax',
  hours: number[]
): string {
  const hourStrs = hours.map(h => {
    if (h === 0) return '12am';
    if (h === 12) return '12pm';
    if (h < 12) return `${h}am`;
    return `${h - 12}pm`;
  });

  const timeWindow = hourStrs.join(', ');

  const contextLabels = {
    sleep: 'Sleep soundtrack',
    study: 'Study/focus sessions',
    work: 'Work background',
    relax: 'Relaxation',
  };

  return `${contextLabels[context]} (${timeWindow})`;
}

/**
 * Calculate distinctiveness
 */
function calculateDistinctiveness(
  avgDuration: number,
  sessionCount: number,
  baseRate: number
): number {
  // Longer duration + more sessions = more distinctive
  const durationScore = Math.min(avgDuration / 3600000, 1.0); // Normalize by 1 hour
  const sessionScore = Math.min(sessionCount / 10, 1.0); // Normalize by 10 sessions
  const score = (durationScore + sessionScore) / 2;
  return Math.min(score / baseRate, 1.0);
}
