// Ghost Timeline Detector
// Finds artists played heavily then completely abandoned
// Psychology: Emotional disassociation, memory avoidance (North & Hargreaves, 2008)

import { SourceOfTruth, DetectionResult, Evidence, ArtistAggregate } from '../../types';
import { formatDate } from '../../sourceOfTruth/utils';

const PATTERN_ID = 'ghost-timeline';
const PATTERN_NAME = 'Ghost Timeline';
const PATTERN_FAMILY = 'loyalty_dropoff';
const BASE_RATE = 0.70; // ~20% of users have dramatic artist drop-offs

interface GhostCandidate {
  artist: ArtistAggregate;
  totalPlays: number;
  lastPlayed: Date;
  daysSinceLastPlay: number;
  peakMonth: string;
  peakMonthPlays: number;
  ghostingSeverity: number; // 0-1: how dramatic the drop-off is
}

/**
 * Detect artists that were heavily played then completely abandoned
 *
 * @param sot - SourceOfTruth index
 * @param maxResults - Maximum number of results to return (default 10)
 * @returns Array of detection results, sorted by strength
 */
export function detectGhostTimeline(sot: SourceOfTruth, maxResults: number = 10): DetectionResult[] {
  const candidates = findGhostCandidates(sot);

  if (candidates.length === 0) return [];

  // Sort by ghosting severity (combination of play count and recency)
  candidates.sort((a, b) => b.ghostingSeverity - a.ghostingSeverity);

  // Filter candidates that meet threshold
  const validCandidates = candidates.filter(candidate => {
    // Threshold:
    // - At least 30 plays total
    // - Not played in last 30 days
    // - Peak month had at least 15 plays
    return candidate.totalPlays >= 30 && candidate.daysSinceLastPlay >= 30 && candidate.peakMonthPlays >= 15;
  });

  // Return top N results
  return validCandidates.slice(0, maxResults).map(candidate => {
    // Calculate distinctiveness
    const distinctiveness = calculateDistinctiveness(
      candidate.totalPlays,
      candidate.daysSinceLastPlay,
      BASE_RATE
    );

    // Build evidence
    const evidence: Evidence[] = [
      {
        type: 'artist',
        metric: 'ghosted_artist',
        value: candidate.artist.name,
        sourceIndices: [], // Would need to map back to plays
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
        type: 'timestamp',
        metric: 'last_played',
        value: candidate.lastPlayed.toISOString(),
        sourceIndices: [],
        humanReadable: `Last heard: ${formatDate(candidate.lastPlayed)}`,
      },
      {
        type: 'duration',
        metric: 'days_since_last_play',
        value: candidate.daysSinceLastPlay,
        sourceIndices: [],
        humanReadable: `${candidate.daysSinceLastPlay} days ago`,
      },
      {
        type: 'timestamp',
        metric: 'peak_month',
        value: candidate.peakMonth,
        sourceIndices: [],
        humanReadable: `Peak: ${formatMonth(candidate.peakMonth)} (${candidate.peakMonthPlays} plays)`,
      },
    ];

    // Add monthly breakdown showing the fall-off
    const monthlyBreakdown = Array.from(candidate.artist.playsByMonth.entries())
      .sort((a, b) => a[0].localeCompare(b[0])) // Chronological
      .map(([month, plays]) => {
        const isPeak = month === candidate.peakMonth;
        const indicator = isPeak ? ' 🔥' : '';
        return `${formatMonth(month)}: ${plays} plays${indicator}`;
      })
      .join('\n');

    evidence.push({
      type: 'count',
      metric: 'monthly_timeline',
      value: monthlyBreakdown,
      sourceIndices: [],
      humanReadable: `MONTHLY TIMELINE:\n${monthlyBreakdown}`,
    });

    // Get top tracks from when they were popular
    const artistTracks = Array.from(sot.tracks.values())
      .filter(t => t.artist === candidate.artist.name)
      .sort((a, b) => b.totalPlays - a.totalPlays)
      .slice(0, 10);

    if (artistTracks.length > 0) {
      const trackBreakdown = artistTracks
        .map((t, i) => `${i + 1}. "${t.name}": ${t.totalPlays} plays`)
        .join('\n');

      evidence.push({
        type: 'track',
        metric: 'popular_tracks',
        value: trackBreakdown,
        sourceIndices: [],
        humanReadable: `TRACKS YOU LOVED:\n${trackBreakdown}`,
      });
    }

    // Add ghosting pattern analysis
    const ghostingLevel = candidate.daysSinceLastPlay > 90 ? 'FULLY GHOSTED' :
                         candidate.daysSinceLastPlay > 60 ? 'HARD GHOST' :
                         'SOFT GHOST';

    const wasObsessed = candidate.totalPlays > 100;

    evidence.push({
      type: 'duration',
      metric: 'ghosting_analysis',
      value: candidate.daysSinceLastPlay,
      sourceIndices: [],
      humanReadable: `GHOSTING PATTERN:\n- Status: ${ghostingLevel}\n- Last played: ${candidate.daysSinceLastPlay} days ago\n- Peak period: ${formatMonth(candidate.peakMonth)} (${candidate.peakMonthPlays} plays)\n- Total plays: ${candidate.totalPlays}\n- Interpretation: ${wasObsessed ? 'You were OBSESSED, then cut them off completely - clean break energy' : 'This was your thing for a while, then you moved on - natural drift'}`,
    });

    return {
      patternId: PATTERN_ID,
      patternName: PATTERN_NAME,
      patternFamily: PATTERN_FAMILY,
      confidence: Math.min(candidate.ghostingSeverity, 1.0),
      distinctiveness,
      evidence,
      psychologicalBasis:
        'Emotional disassociation and memory avoidance. Dramatic shifts in artist preference often correlate with life events or relationship changes (North & Hargreaves, 2008)',
    };
  });
}

/**
 * Find artists that have been "ghosted"
 */
function findGhostCandidates(sot: SourceOfTruth): GhostCandidate[] {
  const candidates: GhostCandidate[] = [];
  const now = sot.meta.dateRange.end;

  for (const artist of sot.artists.values()) {
    // Need significant play count
    if (artist.totalPlays < 30) continue;

    // Calculate days since last play
    const daysSinceLastPlay = Math.floor(
      (now.getTime() - artist.lastPlayed.getTime()) / (1000 * 60 * 60 * 24)
    );

    // Must not have been played recently
    if (daysSinceLastPlay < 30) continue;

    // Find peak month
    let peakMonth = '';
    let peakMonthPlays = 0;

    for (const [month, plays] of artist.playsByMonth) {
      if (plays > peakMonthPlays) {
        peakMonthPlays = plays;
        peakMonth = month;
      }
    }

    // Calculate ghosting severity
    // Higher severity = more plays + longer time since last play
    const playScore = Math.min(artist.totalPlays / 100, 1.0); // Normalize to 0-1
    const recencyScore = Math.min(daysSinceLastPlay / 60, 1.0); // 60+ days = max score
    const ghostingSeverity = (playScore + recencyScore) / 2;

    candidates.push({
      artist,
      totalPlays: artist.totalPlays,
      lastPlayed: artist.lastPlayed,
      daysSinceLastPlay,
      peakMonth,
      peakMonthPlays,
      ghostingSeverity,
    });
  }

  return candidates;
}

/**
 * Calculate distinctiveness
 */
function calculateDistinctiveness(
  totalPlays: number,
  daysSinceLastPlay: number,
  baseRate: number
): number {
  // More plays + longer absence = more distinctive
  const score = (Math.log(totalPlays) / Math.log(100)) * (daysSinceLastPlay / 60);
  return Math.min(score / baseRate, 1.0);
}

/**
 * Format month key as human-readable
 */
function formatMonth(monthKey: string): string {
  const [year, month] = monthKey.split('-');
  const date = new Date(parseInt(year), parseInt(month) - 1, 1);
  return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
}
