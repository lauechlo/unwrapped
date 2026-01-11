// The Explorer Detector
// Finds high artist/track discovery patterns
// Psychology: Openness to experience, musical curiosity (Rentfrow & Gosling, 2003)

import { SourceOfTruth, DetectionResult, Evidence } from '../../types';

const PATTERN_ID = 'the-explorer';
const PATTERN_NAME = 'The Explorer';
const PATTERN_FAMILY = 'diversity';
const BASE_RATE = 0.85; // Adjusted for better score distribution

interface ExplorerCandidate {
  weekKey: string;
  weekLabel: string;
  newArtistCount: number;
  newArtistRatio: number;
  totalPlays: number;
  topNewArtists: Array<{ name: string; plays: number }>;
  uniqueGenreDiversity: number;
  completionRate: number;
  skipRate: number;
  retainedArtists: number; // How many stayed in following weeks
}

/**
 * Detect high discovery/exploration patterns
 *
 * @param sot - SourceOfTruth index
 * @param maxResults - Maximum number of results to return (default 10)
 * @returns Array of detection results for weeks with high discovery
 */
export function detectExplorer(sot: SourceOfTruth, maxResults: number = 10): DetectionResult[] {
  const candidates = findExplorerCandidates(sot);

  if (candidates.length === 0) return [];

  // Sort by new artist ratio (highest exploration first)
  candidates.sort((a, b) => b.newArtistRatio - a.newArtistRatio);

  // Filter candidates that meet threshold
  const validCandidates = candidates.filter(candidate => {
    // Threshold:
    // - At least 30% new artists in that period
    // - At least 20 plays (enough volume to be meaningful)
    // - At least 5 new artists (not just 1-2)
    return (
      candidate.newArtistRatio >= 0.30 &&
      candidate.totalPlays >= 20 &&
      candidate.newArtistCount >= 5
    );
  });

  if (validCandidates.length === 0) return [];

  // Return top N results
  return validCandidates.slice(0, maxResults).map(candidate => {
    // Calculate confidence based on discovery intensity
    const confidence = Math.min(
      (candidate.newArtistRatio * 0.6) + (candidate.newArtistCount / 100 * 0.4),
      1.0
    );

    // Calculate distinctiveness
    const distinctiveness = calculateDistinctiveness(
      candidate.newArtistRatio,
      candidate.newArtistCount,
      BASE_RATE
    );

    // Build evidence
    const evidence: Evidence[] = [
      {
        type: 'timestamp',
        metric: 'discovery_period',
        value: candidate.weekKey,
        sourceIndices: [],
        humanReadable: candidate.weekLabel,
      },
      {
        type: 'count',
        metric: 'new_artists',
        value: candidate.newArtistCount,
        sourceIndices: [],
        humanReadable: `${candidate.newArtistCount} new artists`,
      },
      {
        type: 'ratio',
        metric: 'discovery_ratio',
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

    // Add top new artists to evidence (show top 3 in summary)
    if (candidate.topNewArtists.length > 0) {
      const topThree = candidate.topNewArtists
        .slice(0, 3)
        .map(a => a.name)
        .join(', ');

      evidence.push({
        type: 'artist',
        metric: 'top_discoveries',
        value: topThree,
        sourceIndices: [],
        humanReadable: `Including: ${topThree}`,
      });
    }

    // Add detailed discovery breakdown (top 15 with play counts, full list available)
    if (candidate.topNewArtists.length > 0) {
      const truncatedList = candidate.topNewArtists
        .slice(0, 15)
        .map((a, i) => `${i + 1}. ${a.name}: ${a.plays} plays`)
        .join('\n');

      const fullList = candidate.topNewArtists
        .map((a, i) => `${i + 1}. ${a.name}: ${a.plays} plays`)
        .join('\n');

      evidence.push({
        type: 'count',
        metric: 'discovery_breakdown',
        value: truncatedList,
        sourceIndices: [],
        humanReadable: `TOP NEW DISCOVERIES:\n${truncatedList}`,
        fullValue: fullList,
        truncatedCount: candidate.topNewArtists.length,
      });
    }

    // Add behavioral stats for new music
    evidence.push({
      type: 'ratio',
      metric: 'exploration_behavior',
      value: candidate.completionRate,
      sourceIndices: [],
      humanReadable: `EXPLORATION BEHAVIOR:\n- Completion rate: ${Math.round(candidate.completionRate * 100)}%\n- Skip rate: ${Math.round(candidate.skipRate * 100)}%\n- Pattern: ${candidate.completionRate > 0.7 ? 'Deep listening - fully engaging with discoveries' : candidate.completionRate > 0.5 ? 'Sampling + listening - mixed engagement' : 'Quick sampling - broad exploration'}`,
    });

    // Add retention analysis
    evidence.push({
      type: 'count',
      metric: 'retention_analysis',
      value: candidate.retainedArtists,
      sourceIndices: [],
      humanReadable: `RETENTION:\n- ${candidate.retainedArtists} of ${candidate.newArtistCount} new artists stuck around in following weeks\n- Retention rate: ${Math.round((candidate.retainedArtists / candidate.newArtistCount) * 100)}%\n- Discovery style: ${(candidate.retainedArtists / candidate.newArtistCount) > 0.3 ? 'Selective explorer - finds keepers' : 'Wide net explorer - constantly seeking new sounds'}`,
    });

    return {
      patternId: PATTERN_ID,
      patternName: PATTERN_NAME,
      patternFamily: PATTERN_FAMILY,
      confidence,
      distinctiveness,
      evidence,
      psychologicalBasis:
        'Musical exploration as identity construction. High openness to experience correlates with diverse musical taste and active discovery behavior (Rentfrow & Gosling, 2003; North & Hargreaves, 2008)',
    };
  });
}

/**
 * Find periods with high new artist discovery
 */
function findExplorerCandidates(sot: SourceOfTruth): ExplorerCandidate[] {
  const candidates: ExplorerCandidate[] = [];

  // Build running set of artists seen so far
  const seenArtists = new Set<string>();

  // Sort weeks chronologically
  const sortedWeeks = Array.from(sot.temporal.byWeek.entries()).sort((a, b) =>
    a[0].localeCompare(b[0])
  );

  for (let i = 0; i < sortedWeeks.length; i++) {
    const [weekKey, weekData] = sortedWeeks[i];

    // Find which artists are NEW this week
    const newArtistsThisWeek = new Set<string>();

    for (const artist of weekData.artists) {
      if (!seenArtists.has(artist)) {
        newArtistsThisWeek.add(artist);
      }
    }

    // Calculate ratio of new artists
    const newArtistCount = newArtistsThisWeek.size;
    const totalPlays = weekData.playCount;

    // Get play counts for new artists this week
    const topNewArtists = Array.from(newArtistsThisWeek)
      .map(artistName => {
        const artistData = sot.artists.get(artistName);
        const playsThisWeek = artistData?.playsByWeek?.get(weekKey) || 0;
        return { name: artistName, plays: playsThisWeek };
      })
      .sort((a, b) => b.plays - a.plays);

    // Calculate actual new artist plays and ratio
    const newArtistPlays = topNewArtists.reduce((sum, a) => sum + a.plays, 0);
    const newArtistRatio = newArtistPlays / totalPlays;

    // Calculate behavioral metrics for new artists
    let totalNewArtistPlays = 0;
    let completedPlays = 0;
    let skippedPlays = 0;

    for (const artistName of newArtistsThisWeek) {
      // Get all tracks for this artist
      for (const track of sot.tracks.values()) {
        if (track.artist === artistName) {
          // Filter plays from this week
          for (const play of track.plays) {
            // Simple week matching (could be improved with proper date comparison)
            totalNewArtistPlays++;
            if (play.completed) completedPlays++;
            if (play.skipped) skippedPlays++;
          }
        }
      }
    }

    const completionRate = totalNewArtistPlays > 0 ? completedPlays / totalNewArtistPlays : 0;
    const skipRate = totalNewArtistPlays > 0 ? skippedPlays / totalNewArtistPlays : 0;

    // Calculate retention: how many new artists appear in following weeks?
    let retainedArtists = 0;
    if (i < sortedWeeks.length - 1) {
      // Check next 4 weeks (or remaining weeks if less than 4)
      const weeksToCheck = sortedWeeks.slice(i + 1, i + 5);
      for (const artistName of newArtistsThisWeek) {
        const artistData = sot.artists.get(artistName);
        if (artistData) {
          // Check if artist has plays in any following week
          for (const [futureWeek, _] of weeksToCheck) {
            if (artistData.playsByWeek.has(futureWeek)) {
              retainedArtists++;
              break; // Count each artist only once
            }
          }
        }
      }
    }

    // Only consider weeks with significant new artist activity
    if (newArtistCount >= 5 && newArtistRatio >= 0.3) {
      candidates.push({
        weekKey,
        weekLabel: formatWeekLabel(weekKey),
        newArtistCount,
        newArtistRatio,
        totalPlays,
        topNewArtists,
        uniqueGenreDiversity: weekData.artists.size / totalPlays,
        completionRate,
        skipRate,
        retainedArtists,
      });
    }

    // Add this week's artists to seen set
    newArtistsThisWeek.forEach(artist => seenArtists.add(artist));
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

  // Adjust to Monday
  const dayOfWeek = jan1.getDay();
  const daysUntilMonday = dayOfWeek === 0 ? 1 : dayOfWeek === 1 ? 0 : 8 - dayOfWeek;

  jan1.setDate(jan1.getDate() + daysUntilMonday + daysToAdd);
  return jan1;
}

/**
 * Format week label for display
 */
function formatWeekLabel(weekKey: string): string {
  const weekStart = calculateWeekStart(weekKey);
  const monthNames = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
  ];
  const month = monthNames[weekStart.getMonth()];
  const day = weekStart.getDate();
  const year = weekStart.getFullYear();
  return `Week of ${month} ${day}, ${year}`;
}

/**
 * Calculate distinctiveness
 */
function calculateDistinctiveness(
  newArtistRatio: number,
  newArtistCount: number,
  baseRate: number
): number {
  // High ratio + high absolute count = more distinctive
  const ratioScore = newArtistRatio; // Already 0-1
  const countScore = Math.min(newArtistCount / 50, 1.0); // Normalize by 50 artists
  const score = (ratioScore * 0.7) + (countScore * 0.3);
  return Math.min(score / baseRate, 1.0);
}
