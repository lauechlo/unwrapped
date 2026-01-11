// The Loyalist Detector
// Finds artists with sustained long-term devotion
// Psychology: Attachment, consistency, comfort-seeking (Saarikallio, 2007)

import { SourceOfTruth, DetectionResult, Evidence, ArtistAggregate } from '../../types';

const PATTERN_ID = 'the-loyalist';
const PATTERN_NAME = 'The Loyalist';
const PATTERN_FAMILY = 'loyalty_retention';
const BASE_RATE = 0.75; // ~20% of users have strong artist loyalty

interface LoyalistCandidate {
  artist: ArtistAggregate;
  totalPlays: number;
  totalWeeks: number;
  consecutiveWeeks: number;
  avgPlaysPerWeek: number;
  firstPlay: Date;
  lastPlay: Date;
  consistencyScore: number;
}

/**
 * Detect sustained artist loyalty over time
 *
 * @param sot - SourceOfTruth index
 * @param maxResults - Maximum number of results to return (default 10)
 * @returns Array of detection results for loyal artist relationships
 */
export function detectLoyalist(sot: SourceOfTruth, maxResults: number = 10): DetectionResult[] {
  const candidates = findLoyalistCandidates(sot);

  if (candidates.length === 0) return [];

  // Sort by consistency score (total plays × consistency)
  candidates.sort((a, b) => b.consistencyScore - a.consistencyScore);

  // Filter candidates that meet threshold
  const validCandidates = candidates.filter(candidate => {
    // Threshold:
    // - At least 30 plays total (significant engagement)
    // - At least 4 weeks of listening (temporal consistency)
    // - Average at least 3 plays/week (sustained interest)
    return (
      candidate.totalPlays >= 30 &&
      candidate.totalWeeks >= 4 &&
      candidate.avgPlaysPerWeek >= 3
    );
  });

  if (validCandidates.length === 0) return [];

  // Return top N results
  return validCandidates.slice(0, maxResults).map(candidate => {
    // Calculate confidence based on volume + consistency
    const confidence = Math.min(
      (candidate.totalPlays / 100 * 0.5) + (candidate.consistencyScore * 0.5),
      1.0
    );

    // Calculate distinctiveness
    const distinctiveness = calculateDistinctiveness(
      candidate.totalPlays,
      candidate.totalWeeks,
      candidate.consecutiveWeeks,
      BASE_RATE
    );

    // Calculate duration of loyalty
    const durationDays = Math.floor(
      (candidate.lastPlay.getTime() - candidate.firstPlay.getTime()) / (1000 * 60 * 60 * 24)
    );
    const durationWeeks = Math.floor(durationDays / 7);

    // Build evidence
    const evidence: Evidence[] = [
      {
        type: 'artist',
        metric: 'loyal_artist',
        value: candidate.artist.name,
        sourceIndices: [], // Artist-level pattern, no specific play indices
        humanReadable: candidate.artist.name,
      },
      {
        type: 'count',
        metric: 'total_plays',
        value: candidate.totalPlays,
        sourceIndices: [],
        humanReadable: `${candidate.totalPlays} plays total`,
      },
      {
        type: 'count',
        metric: 'weeks_active',
        value: candidate.totalWeeks,
        sourceIndices: [],
        humanReadable: `${candidate.totalWeeks} weeks of listening`,
      },
      {
        type: 'ratio',
        metric: 'avg_plays_per_week',
        value: candidate.avgPlaysPerWeek,
        sourceIndices: [],
        humanReadable: `${candidate.avgPlaysPerWeek.toFixed(1)} plays/week average`,
      },
    ];

    // Add consecutive weeks if significant
    if (candidate.consecutiveWeeks >= 4) {
      evidence.push({
        type: 'count',
        metric: 'consecutive_weeks',
        value: candidate.consecutiveWeeks,
        sourceIndices: [],
        humanReadable: `${candidate.consecutiveWeeks} consecutive weeks`,
      });
    }

    // Add duration
    if (durationWeeks > 0) {
      evidence.push({
        type: 'duration',
        metric: 'loyalty_duration',
        value: durationDays,
        sourceIndices: [],
        humanReadable: `${durationWeeks} ${durationWeeks === 1 ? 'week' : 'weeks'} of loyalty`,
      });
    }

    // Add week-by-week breakdown (most recent 10 weeks)
    const weeklyBreakdown = Array.from(candidate.artist.playsByWeek.entries())
      .sort((a, b) => b[0].localeCompare(a[0])) // Most recent first
      .slice(0, 10)
      .map(([week, plays]) => `${week}: ${plays} plays`)
      .join('\n');

    evidence.push({
      type: 'count',
      metric: 'weekly_breakdown',
      value: weeklyBreakdown,
      sourceIndices: [],
      humanReadable: `WEEKLY BREAKDOWN (most recent):\n${weeklyBreakdown}`,
    });

    // Get top tracks from this artist
    const artistTracks = Array.from(sot.tracks.values())
      .filter(t => t.artist === candidate.artist.name)
      .sort((a, b) => b.totalPlays - a.totalPlays)
      .slice(0, 5);

    const topTracks = artistTracks
      .map((t, i) => `${i + 1}. "${t.name}": ${t.totalPlays} plays (${Math.round(t.completedPlays / t.totalPlays * 100)}% completion)`)
      .join('\n');

    evidence.push({
      type: 'track',
      metric: 'top_tracks',
      value: topTracks,
      sourceIndices: [],
      humanReadable: `TOP TRACKS:\n${topTracks}`,
    });

    // Add loyalty consistency metric
    const weeksWithPlays = candidate.artist.playsByWeek.size;
    const loyaltyRate = (weeksWithPlays / candidate.totalWeeks) * 100;

    evidence.push({
      type: 'ratio',
      metric: 'loyalty_consistency',
      value: loyaltyRate,
      sourceIndices: [],
      humanReadable: `LOYALTY TYPE:\n- Consistency: ${Math.round(loyaltyRate)}% (present in ${weeksWithPlays}/${candidate.totalWeeks} weeks)\n- Pattern: ${candidate.consecutiveWeeks >= 8 ? 'Obsessive devotion - uninterrupted listening' : candidate.consecutiveWeeks >= 4 ? 'Sustained attachment - recurring comfort' : 'Periodic revisit - occasional favorite'}`,
    });

    return {
      patternId: PATTERN_ID,
      patternName: PATTERN_NAME,
      patternFamily: PATTERN_FAMILY,
      confidence,
      distinctiveness,
      evidence,
      psychologicalBasis:
        'Sustained musical attachment reflects emotional consistency and comfort-seeking behavior. Loyal artist relationships provide psychological stability and identity anchoring (Saarikallio, 2007; Hargreaves & North, 1999)',
    };
  });
}

/**
 * Find artists with sustained loyalty patterns
 */
function findLoyalistCandidates(sot: SourceOfTruth): LoyalistCandidate[] {
  const candidates: LoyalistCandidate[] = [];

  for (const artist of sot.artists.values()) {
    // Need significant engagement
    if (artist.totalPlays < 20) continue;

    // Use existing weekly play distribution
    const weeklyPlays = artist.playsByWeek;
    const firstPlay = artist.firstPlayed;
    const lastPlay = artist.lastPlayed;

    const totalWeeks = weeklyPlays.size;
    const avgPlaysPerWeek = artist.totalPlays / totalWeeks;

    // Find longest consecutive week streak
    const consecutiveWeeks = findLongestConsecutiveWeeks(weeklyPlays);

    // Calculate consistency score (plays × weeks × consecutive streak)
    const consistencyScore =
      (artist.totalPlays / 100) * (totalWeeks / 10) * (consecutiveWeeks / 5);

    candidates.push({
      artist,
      totalPlays: artist.totalPlays,
      totalWeeks,
      consecutiveWeeks,
      avgPlaysPerWeek,
      firstPlay,
      lastPlay,
      consistencyScore: Math.min(consistencyScore, 1.0),
    });
  }

  return candidates;
}

/**
 * Get week key (YYYY-MM-DD of Monday)
 */
function getWeekKey(date: Date): string {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust to Monday
  const monday = new Date(d.setDate(diff));
  return monday.toISOString().split('T')[0];
}

/**
 * Find longest consecutive week streak
 */
function findLongestConsecutiveWeeks(weeklyPlays: Map<string, number>): number {
  const weeks = Array.from(weeklyPlays.keys()).sort();

  if (weeks.length === 0) return 0;

  let maxStreak = 1;
  let currentStreak = 1;

  for (let i = 1; i < weeks.length; i++) {
    const prevDate = new Date(weeks[i - 1]);
    const currDate = new Date(weeks[i]);

    // Check if dates are consecutive weeks (7 days apart)
    const daysDiff = Math.floor(
      (currDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (daysDiff <= 7) {
      currentStreak++;
      maxStreak = Math.max(maxStreak, currentStreak);
    } else {
      currentStreak = 1;
    }
  }

  return maxStreak;
}

/**
 * Calculate distinctiveness
 */
function calculateDistinctiveness(
  totalPlays: number,
  totalWeeks: number,
  consecutiveWeeks: number,
  baseRate: number
): number {
  // More plays + more weeks + longer streak = more distinctive
  const playsScore = Math.min(totalPlays / 100, 1.0);
  const weeksScore = Math.min(totalWeeks / 12, 1.0);
  const streakScore = Math.min(consecutiveWeeks / 8, 1.0);
  const score = (playsScore + weeksScore + streakScore) / 3;
  return Math.min(score / baseRate, 1.0);
}
