// Life Event Detection
// Finds weeks with dramatic surges in new artists
// Psychology: Life transitions correlate with music exploration (Levitin, 2006)

import { SourceOfTruth, DetectionResult, Evidence } from '../../types';
import { formatDate } from '../../sourceOfTruth/utils';

const PATTERN_ID = 'life-event';
const PATTERN_NAME = 'Life Event Detection';
const PATTERN_FAMILY = 'evolution';
const BASE_RATE = 0.60; // ~8% of users have dramatic week-over-week shifts

interface LifeEventCandidate {
  weekKey: string;
  weekStart: Date;
  weekEnd: Date;
  totalPlays: number;
  newArtists: Set<string>;
  newArtistRatio: number;
  totalArtists: Set<string>;
  topNewArtists: Array<{ name: string; plays: number }>;
}

/**
 * Detect life events through dramatic shifts in artist exploration
 * Indicators: Surge in new artists (50%+ of listening)
 *
 * @param sot - SourceOfTruth index
 * @param maxResults - Maximum number of results to return (default 10)
 * @returns Array of detection results, sorted by strength
 */
export function detectLifeEvent(sot: SourceOfTruth, maxResults: number = 10): DetectionResult[] {
  const candidates = findLifeEventCandidates(sot);

  if (candidates.length === 0) return [];

  // Sort by new artist ratio and total plays
  candidates.sort((a, b) => {
    const scoreA = a.newArtistRatio * Math.log(a.totalPlays + 1);
    const scoreB = b.newArtistRatio * Math.log(b.totalPlays + 1);
    return scoreB - scoreA;
  });

  // Filter candidates that meet threshold
  const validCandidates = candidates.filter(c => {
    // Threshold:
    // - At least 50% new artists in that week
    // - At least 50 total plays that week (significant volume)
    // - At least 5 new artists (not just 1-2)
    return c.newArtistRatio >= 0.5 && c.totalPlays >= 50 && c.newArtists.size >= 5;
  });

  // Return top N results
  return validCandidates.slice(0, maxResults).map(candidate => {
    // Calculate distinctiveness
    const distinctiveness = calculateDistinctiveness(candidate.newArtistRatio, BASE_RATE);

    // Build evidence
    const evidence: Evidence[] = [
      {
        type: 'timestamp',
        metric: 'event_week',
        value: candidate.weekKey,
        sourceIndices: [],
        humanReadable: `Week of ${formatDate(candidate.weekStart)}`,
      },
      {
        type: 'count',
        metric: 'new_artists',
        value: candidate.newArtists.size,
        sourceIndices: [],
        humanReadable: `${candidate.newArtists.size} new artists`,
      },
      {
        type: 'ratio',
        metric: 'new_artist_ratio',
        value: candidate.newArtistRatio,
        sourceIndices: [],
        humanReadable: `${Math.round(candidate.newArtistRatio * 100)}% of your listening`,
      },
      {
        type: 'count',
        metric: 'total_plays',
        value: candidate.totalPlays,
        sourceIndices: [],
        humanReadable: `${candidate.totalPlays} plays that week`,
      },
    ];

    // Add top new artists with play counts
    if (candidate.topNewArtists.length > 0) {
      // Summary for narrative (top 3)
      evidence.push({
        type: 'artist',
        metric: 'top_new_artists',
        value: candidate.topNewArtists.map(a => a.name).join(', '),
        sourceIndices: [],
        humanReadable: `Including: ${candidate.topNewArtists
          .slice(0, 3)
          .map(a => a.name)
          .join(', ')}`,
      });

      // Detailed breakdown (top 10 with counts)
      const topDiscoveries = candidate.topNewArtists
        .slice(0, 10)
        .map((a, i) => `${i + 1}. ${a.name}: ${a.plays} plays`)
        .join('\n');

      evidence.push({
        type: 'count',
        metric: 'top_discoveries_detailed',
        value: topDiscoveries,
        sourceIndices: [],
        humanReadable: `TOP DISCOVERIES:\n${topDiscoveries}`,
      });

      // Calculate completion and skip rates for new artists
      let totalNewArtistPlays = 0;
      let completedPlays = 0;
      let skippedPlays = 0;

      for (const newArtist of candidate.newArtists) {
        const artistData = sot.artists.get(newArtist);
        if (artistData) {
          const playsThisWeek = artistData.playsByWeek?.get(candidate.weekKey) || 0;
          totalNewArtistPlays += playsThisWeek;

          // Estimate completion/skip based on artist's overall rates
          completedPlays += Math.round(playsThisWeek * artistData.completionRate);
          skippedPlays += Math.round(playsThisWeek * artistData.skipRate);
        }
      }

      const newMusicCompletionRate = totalNewArtistPlays > 0
        ? Math.round((completedPlays / totalNewArtistPlays) * 100)
        : 0;
      const newMusicSkipRate = totalNewArtistPlays > 0
        ? Math.round((skippedPlays / totalNewArtistPlays) * 100)
        : 0;

      evidence.push({
        type: 'ratio',
        metric: 'new_music_behavior',
        value: newMusicCompletionRate,
        sourceIndices: [],
        humanReadable: `BEHAVIOR WITH NEW MUSIC:\n- Completion rate: ${newMusicCompletionRate}%\n- Skip rate: ${newMusicSkipRate}%\n- Engagement: ${newMusicCompletionRate > 70 ? 'High - you gave these artists a real chance' : newMusicCompletionRate > 50 ? 'Moderate - some filtering happening' : 'Low - lots of sampling'}`,
      });
    }

    return {
      patternId: PATTERN_ID,
      patternName: PATTERN_NAME,
      patternFamily: PATTERN_FAMILY,
      confidence: candidate.newArtistRatio,
      distinctiveness,
      evidence,
      psychologicalBasis:
        'Music as temporal marker for life transitions. Dramatic shifts in listening patterns correlate with significant life events, relationship changes, or contextual shifts (Levitin, 2006; North & Hargreaves, 2008)',
    };
  });
}

/**
 * Find weeks with dramatic artist exploration surges
 */
function findLifeEventCandidates(sot: SourceOfTruth): LifeEventCandidate[] {
  const candidates: LifeEventCandidate[] = [];

  // Build running set of artists seen so far
  const seenArtists = new Set<string>();

  // Sort weeks chronologically
  const sortedWeeks = Array.from(sot.temporal.byWeek.entries()).sort((a, b) =>
    a[0].localeCompare(b[0])
  );

  for (const [weekKey, weekData] of sortedWeeks) {
    // Find which artists are NEW this week
    const newArtistsThisWeek = new Set<string>();

    for (const artist of weekData.artists) {
      if (!seenArtists.has(artist)) {
        newArtistsThisWeek.add(artist);
        seenArtists.add(artist);
      }
    }

    // Calculate ratio of new artists
    const newArtistRatio = newArtistsThisWeek.size / weekData.artists.size;

    // Only consider weeks with significant new artist activity
    if (newArtistsThisWeek.size >= 5 && newArtistRatio >= 0.3) {
      // Calculate week start/end dates
      const weekStart = calculateWeekStart(weekKey);
      const weekEnd = new Date(weekStart.getTime() + 7 * 24 * 60 * 60 * 1000);

      // Get play counts for new artists this week
      const topNewArtists = Array.from(newArtistsThisWeek)
        .map(artistName => {
          const artistData = sot.artists.get(artistName);
          const playsThisWeek = artistData?.playsByWeek?.get(weekKey) || 0;
          return { name: artistName, plays: playsThisWeek };
        })
        .sort((a, b) => b.plays - a.plays)
        .slice(0, 10); // Top 10 new artists

      candidates.push({
        weekKey,
        weekStart,
        weekEnd,
        totalPlays: weekData.playCount,
        newArtists: newArtistsThisWeek,
        newArtistRatio,
        totalArtists: weekData.artists,
        topNewArtists,
      });
    }
  }

  return candidates;
}

/**
 * Calculate week start date from week key (YYYY-WW format)
 */
function calculateWeekStart(weekKey: string): Date {
  const [year, weekStr] = weekKey.split('-W');
  const yearNum = parseInt(year);
  const weekNum = parseInt(weekStr);

  // Simple approximation: Jan 1 + (week * 7) days
  const jan1 = new Date(yearNum, 0, 1);
  const daysToAdd = (weekNum - 1) * 7;
  return new Date(jan1.getTime() + daysToAdd * 24 * 60 * 60 * 1000);
}

/**
 * Calculate distinctiveness
 */
function calculateDistinctiveness(ratio: number, baseRate: number): number {
  // How much more dramatic than typical?
  return Math.min(ratio / baseRate, 1.0);
}
