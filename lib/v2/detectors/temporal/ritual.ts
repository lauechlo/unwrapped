// The Ritual Detector
// Finds songs played at the same time on multiple days
// Psychology: Temporal anchoring, ritualistic behavior (Levitin, 2006)

import { SourceOfTruth, DetectionResult, Evidence, TrackAggregate } from '../../types';

const PATTERN_ID = 'the-ritual';
const PATTERN_NAME = 'The Ritual';
const PATTERN_FAMILY = 'temporal';
const BASE_RATE = 0.65; // ~10% of users have strong ritual songs

interface RitualCandidate {
  track: TrackAggregate;
  dominantHour: number;
  playsAtDominantHour: number;
  totalPlays: number;
  consistency: number; // 0-1: how consistent the timing is
  uniqueDays: number;
  hourDistribution: Map<number, number>;
}

/**
 * Detect ritualistic listening patterns - same track at same time
 *
 * @param sot - SourceOfTruth index
 * @param maxResults - Maximum number of results to return (default 10)
 * @returns Array of detection results, sorted by strength
 */
export function detectRitual(sot: SourceOfTruth, maxResults: number = 10): DetectionResult[] {
  const candidates = findRitualCandidates(sot);

  if (candidates.length === 0) return [];

  // Sort by consistency and total plays
  candidates.sort((a, b) => {
    const scoreA = a.consistency * Math.log(a.totalPlays);
    const scoreB = b.consistency * Math.log(b.totalPlays);
    return scoreB - scoreA;
  });

  // Filter candidates that meet threshold
  const validCandidates = candidates.filter(candidate => {
    // Threshold: Strong absolute signal OR high consistency
    // Strong signal: 15+ plays at dominant hour, 5+ unique days
    // High consistency: 50%+ consistency, 3+ unique days
    const hasStrongSignal = candidate.playsAtDominantHour >= 15 && candidate.uniqueDays >= 5;
    const hasHighConsistency = candidate.consistency >= 0.5 && candidate.uniqueDays >= 3;
    return hasStrongSignal || hasHighConsistency;
  });

  // Return top N results
  return validCandidates.slice(0, maxResults).map(candidate => {
    // Calculate distinctiveness (how unusual is this level of consistency?)
    const distinctiveness = calculateDistinctiveness(candidate.consistency, BASE_RATE);

    // Build evidence
    const evidence: Evidence[] = [
      {
        type: 'track',
        metric: 'ritual_track',
        value: candidate.track.name,
        sourceIndices: candidate.track.plays.map(p => p.rawIndex),
        humanReadable: `"${candidate.track.name}" by ${candidate.track.artist}`,
      },
      {
        type: 'count',
        metric: 'total_plays',
        value: candidate.totalPlays,
        sourceIndices: candidate.track.plays.map(p => p.rawIndex),
        humanReadable: `${candidate.totalPlays} plays total`,
      },
      {
        type: 'timestamp',
        metric: 'dominant_hour',
        value: candidate.dominantHour,
        sourceIndices: candidate.track.plays
          .filter(p => p.timestamp.getHours() === candidate.dominantHour)
          .map(p => p.rawIndex),
        humanReadable: formatHour(candidate.dominantHour),
      },
      {
        type: 'count',
        metric: 'plays_at_hour',
        value: candidate.playsAtDominantHour,
        sourceIndices: candidate.track.plays
          .filter(p => p.timestamp.getHours() === candidate.dominantHour)
          .map(p => p.rawIndex),
        humanReadable: `${candidate.playsAtDominantHour} of those at ${formatHour(candidate.dominantHour)}`,
      },
      {
        type: 'ratio',
        metric: 'consistency',
        value: candidate.consistency,
        sourceIndices: [],
        humanReadable: `${Math.round(candidate.consistency * 100)}% time consistency`,
      },
    ];

    // Add detailed time breakdown
    const hourBreakdown = Array.from(candidate.hourDistribution.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([hour, count]) => `${formatHour(hour)}: ${count} plays`)
      .join('\n');

    evidence.push({
      type: 'count',
      metric: 'time_breakdown',
      value: hourBreakdown,
      sourceIndices: [],
      humanReadable: `TIME BREAKDOWN:\n${hourBreakdown}`,
    });

    // Add specific ritual instances (first 10 dates at dominant hour)
    const ritualInstances = candidate.track.plays
      .filter(p => p.timestamp.getHours() === candidate.dominantHour)
      .slice(0, 10)
      .map(p => {
        const date = p.timestamp.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        const time = p.timestamp.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
        const duration = Math.round(p.msPlayed / 1000 / 60);
        return `${date} at ${time} (${duration}m${p.completed ? ', finished' : ', skipped'})`;
      })
      .join('\n');

    evidence.push({
      type: 'timestamp',
      metric: 'ritual_instances',
      value: ritualInstances,
      sourceIndices: [],
      humanReadable: `RITUAL INSTANCES:\n${ritualInstances}`,
    });

    // Add day-of-week pattern
    const dayOfWeekCounts = new Map<number, number>();
    for (const play of candidate.track.plays) {
      const dow = play.timestamp.getDay();
      dayOfWeekCounts.set(dow, (dayOfWeekCounts.get(dow) || 0) + 1);
    }

    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const topDays = Array.from(dayOfWeekCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([day, count]) => `${dayNames[day]}: ${count} plays`)
      .join(', ');

    const isWeekdayRitual = (dayOfWeekCounts.get(1) || 0) + (dayOfWeekCounts.get(2) || 0) +
                            (dayOfWeekCounts.get(3) || 0) + (dayOfWeekCounts.get(4) || 0) +
                            (dayOfWeekCounts.get(5) || 0) >
                            (dayOfWeekCounts.get(0) || 0) + (dayOfWeekCounts.get(6) || 0);

    evidence.push({
      type: 'count',
      metric: 'day_pattern',
      value: topDays,
      sourceIndices: [],
      humanReadable: `DAY PATTERN:\n${topDays}\nType: ${isWeekdayRitual ? 'Weekday ritual (work/school routine)' : 'Weekend ritual (leisure time)'}`,
    });

    return {
      patternId: PATTERN_ID,
      patternName: PATTERN_NAME,
      patternFamily: PATTERN_FAMILY,
      confidence: candidate.consistency,
      distinctiveness,
      evidence,
      psychologicalBasis:
        'Temporal anchoring and ritualistic behavior. Music as temporal marker for specific contexts or emotional states (Levitin, 2006; Saarikallio, 2007)',
    };
  });
}

/**
 * Find tracks with ritualistic time patterns
 */
function findRitualCandidates(sot: SourceOfTruth): RitualCandidate[] {
  const candidates: RitualCandidate[] = [];

  for (const track of sot.tracks.values()) {
    // Need at least 5 plays
    if (track.totalPlays < 5) continue;

    // Build hour distribution
    const hourDistribution = new Map<number, number>();
    const uniqueDays = new Set<string>();

    for (const play of track.plays) {
      const hour = play.timestamp.getHours();
      const day = play.timestamp.toISOString().split('T')[0]; // YYYY-MM-DD

      hourDistribution.set(hour, (hourDistribution.get(hour) || 0) + 1);
      uniqueDays.add(day);
    }

    // Find dominant hour (most common)
    let dominantHour = 0;
    let maxPlays = 0;

    for (const [hour, plays] of hourDistribution) {
      if (plays > maxPlays) {
        maxPlays = plays;
        dominantHour = hour;
      }
    }

    // Calculate plays within ±1 hour window
    const adjacentHours = [
      dominantHour - 1 < 0 ? 23 : dominantHour - 1,
      dominantHour,
      dominantHour + 1 > 23 ? 0 : dominantHour + 1,
    ];

    const playsInWindow = adjacentHours.reduce(
      (sum, hour) => sum + (hourDistribution.get(hour) || 0),
      0
    );

    // Consistency: % of plays in the ±1 hour window
    const consistency = playsInWindow / track.totalPlays;

    // Only consider if dominant hour has significant concentration
    if (maxPlays >= 3) {
      candidates.push({
        track,
        dominantHour,
        playsAtDominantHour: maxPlays,
        totalPlays: track.totalPlays,
        consistency,
        uniqueDays: uniqueDays.size,
        hourDistribution,
      });
    }
  }

  return candidates;
}

/**
 * Calculate how distinctive this ritual is
 */
function calculateDistinctiveness(consistency: number, baseRate: number): number {
  // Higher consistency = more distinctive
  // Base rate is % of users with ritual songs
  return Math.min(consistency / baseRate, 1.0);
}

/**
 * Format hour as human-readable time
 */
function formatHour(hour: number): string {
  if (hour === 0) return '12am';
  if (hour === 12) return '12pm';
  if (hour < 12) return `${hour}am`;
  return `${hour - 12}pm`;
}
