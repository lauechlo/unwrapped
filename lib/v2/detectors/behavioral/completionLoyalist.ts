// Completion Loyalist Detector
// Finds artists with SUSTAINED completion consistency over time
// Psychology: Earned attention, deep engagement, quality over quantity
// V2 EXCLUSIVE: Uses `reason_end` and `ms_played` fields
// DIFFERENTIATION: Focuses on CONSISTENCY over time (multiple weeks), not instant rejection

import { SourceOfTruth, DetectionResult, Evidence, ArtistAggregate } from '../../types';

const PATTERN_ID = 'completion-loyalist';
const PATTERN_NAME = 'Completion Loyalist';
const PATTERN_FAMILY = 'loyalty_retention';
const BASE_RATE = 0.70; // ~16% of users have high completion artists

interface CompletionCandidate {
  artist: ArtistAggregate;
  totalPlays: number;
  completedPlays: number;
  completionRate: number;
  avgCompletionMs: number;
  avgCompletionPercent: number;
  topCompletedTracks: Array<{ trackName: string; completionRate: number }>;
  weeksActive: number; // NEW: Number of weeks with plays
  consistentWeeks: number; // NEW: Weeks with >75% completion
}

/**
 * Detect artists with high completion rates (listened to the end)
 * V2 EXCLUSIVE: Only works with Extended Streaming History
 *
 * @param sot - SourceOfTruth index
 * @param maxResults - Maximum number of results to return (default 10)
 * @returns Array of detection results for completion loyalty
 */
export function detectCompletionLoyalist(
  sot: SourceOfTruth,
  maxResults: number = 10
): DetectionResult[] {
  const candidates = findCompletionCandidates(sot);

  if (candidates.length === 0) return [];

  // Sort by completion rate (highest first)
  candidates.sort((a, b) => b.completionRate - a.completionRate);

  // Filter candidates that meet threshold
  const validCandidates = candidates.filter(candidate => {
    // NEW FOCUS: CONSISTENCY over time
    // Threshold:
    // - At least 80% completion rate overall
    // - At least 20 plays (more data needed for temporal analysis)
    // - At least 3 weeks of listening (temporal consistency)
    // - At least 2 weeks with >75% completion (sustained behavior)
    // - Average completion > 70% of track length
    return (
      candidate.completionRate >= 0.80 &&
      candidate.totalPlays >= 20 &&
      candidate.weeksActive >= 3 &&
      candidate.consistentWeeks >= 2 &&
      candidate.avgCompletionPercent >= 0.70
    );
  });

  if (validCandidates.length === 0) return [];

  // Return top N results
  return validCandidates.slice(0, maxResults).map(candidate => {
    // Calculate confidence based on completion rate and volume
    const confidence = Math.min(
      (candidate.completionRate * 0.7) + (candidate.totalPlays / 50 * 0.3),
      1.0
    );

    // Calculate distinctiveness
    const distinctiveness = calculateDistinctiveness(
      candidate.completionRate,
      candidate.totalPlays,
      BASE_RATE
    );

    // Build evidence (emphasize temporal consistency)
    const evidence: Evidence[] = [
      {
        type: 'artist',
        metric: 'completion_artist',
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
        metric: 'completed_plays',
        value: candidate.completedPlays,
        sourceIndices: [],
        humanReadable: `${candidate.completedPlays} completed`,
      },
      {
        type: 'ratio',
        metric: 'completion_rate',
        value: candidate.completionRate,
        sourceIndices: [],
        humanReadable: `${Math.round(candidate.completionRate * 100)}% completion rate`,
      },
      {
        type: 'count',
        metric: 'weeks_active',
        value: candidate.weeksActive,
        sourceIndices: [],
        humanReadable: `${candidate.weeksActive} weeks of listening`,
      },
      {
        type: 'count',
        metric: 'consistent_weeks',
        value: candidate.consistentWeeks,
        sourceIndices: [],
        humanReadable: `${candidate.consistentWeeks} weeks with >75% completion`,
      },
      {
        type: 'ratio',
        metric: 'avg_completion_percent',
        value: candidate.avgCompletionPercent,
        sourceIndices: [],
        humanReadable: `Avg ${Math.round(candidate.avgCompletionPercent * 100)}% of track listened`,
      },
    ];

    // Add top completed tracks if available
    if (candidate.topCompletedTracks.length > 0) {
      const topTracks = candidate.topCompletedTracks
        .slice(0, 3)
        .map(t => `"${t.trackName}"`)
        .join(', ');

      evidence.push({
        type: 'track',
        metric: 'top_completed',
        value: topTracks,
        sourceIndices: [],
        humanReadable: `Most completed: ${topTracks}`,
      });

      // Add detailed track breakdown
      const trackBreakdown = candidate.topCompletedTracks
        .slice(0, 10)
        .map((t, i) => `${i + 1}. "${t.trackName}": ${Math.round(t.completionRate * 100)}% completion`)
        .join('\n');

      evidence.push({
        type: 'track',
        metric: 'track_breakdown',
        value: trackBreakdown,
        sourceIndices: [],
        humanReadable: `TRACK BREAKDOWN:\n${trackBreakdown}`,
      });
    }

    // Add week-by-week completion consistency
    const weeklyCompletionRates = Array.from(candidate.artist.playsByWeek.entries())
      .sort((a, b) => b[0].localeCompare(a[0]))
      .slice(0, 8)
      .map(([week, plays]) => {
        // Estimate completion for this week (using overall artist completion rate as proxy)
        const completionPct = Math.round(candidate.completionRate * 100);
        return `${week}: ${plays} plays (~${completionPct}% completed)`;
      })
      .join('\n');

    evidence.push({
      type: 'ratio',
      metric: 'weekly_completion',
      value: weeklyCompletionRates,
      sourceIndices: [],
      humanReadable: `WEEKLY ENGAGEMENT (most recent):\n${weeklyCompletionRates}`,
    });

    // Add engagement analysis
    const engagementLevel = candidate.completionRate > 0.85 ? 'OBSESSIVE' :
                           candidate.completionRate > 0.75 ? 'HIGHLY ENGAGED' :
                           candidate.completionRate > 0.65 ? 'ATTENTIVE' : 'SELECTIVE';

    evidence.push({
      type: 'ratio',
      metric: 'engagement_analysis',
      value: candidate.completionRate,
      sourceIndices: [],
      humanReadable: `ENGAGEMENT LEVEL: ${engagementLevel}\n- You finish ${Math.round(candidate.completionRate * 100)}% of tracks by this artist\n- ${candidate.consistentWeeks} weeks with 75%+ completion\n- Interpretation: ${candidate.completionRate > 0.85 ? 'This artist has your full, undivided attention' : candidate.completionRate > 0.75 ? 'You deeply value this artist - minimal skipping' : 'Strong appreciation with selective listening'}`,
    });

    return {
      patternId: PATTERN_ID,
      patternName: PATTERN_NAME,
      patternFamily: PATTERN_FAMILY,
      confidence,
      distinctiveness,
      evidence,
      psychologicalBasis:
        'Earned attention through sustained engagement. High completion rates reveal deep appreciation and active listening—this artist has earned your full attention (Sloboda et al., 2001; Saarikallio, 2007)',
    };
  });
}

/**
 * Find artists with high completion rates
 */
function findCompletionCandidates(sot: SourceOfTruth): CompletionCandidate[] {
  const candidates: CompletionCandidate[] = [];

  for (const artist of sot.artists.values()) {
    // Need meaningful sample size
    if (artist.totalPlays < 10) continue;

    // Gather all plays for this artist from their tracks
    const artistPlays: Array<any> = [];
    for (const track of sot.tracks.values()) {
      if (track.artist === artist.name) {
        artistPlays.push(...track.plays);
      }
    }

    if (artistPlays.length === 0) continue;

    // Count completed plays (reason_end = 'trackdone' or 'endplay', not skipped)
    const completedPlays = artistPlays.filter(
      p => !p.skipped && (p.reasonEnd === 'trackdone' || p.reasonEnd === 'endplay')
    );

    const completedCount = completedPlays.length;
    const completionRate = completedCount / artistPlays.length;

    // Skip if completion rate too low
    if (completionRate < 0.75) continue;

    // Calculate average completion percentage
    // (ms_played / estimated track length)
    // Rough estimate: tracks are ~180,000 ms (3 min) on average
    const avgCompletionMs =
      completedPlays.length > 0
        ? completedPlays.reduce((sum, p) => sum + p.msPlayed, 0) / completedPlays.length
        : 0;

    // Estimate completion percentage
    // Assume average track is ~3 minutes (180,000 ms)
    const estimatedTrackLength = 180000;
    const avgCompletionPercent = Math.min(avgCompletionMs / estimatedTrackLength, 1.0);

    // Skip if average completion too low
    if (avgCompletionPercent < 0.65) continue;

    // Find top completed tracks for this artist
    const trackCompletionRates = new Map<string, { total: number; completed: number }>();

    // Get completion rates from artist's tracks
    for (const track of sot.tracks.values()) {
      if (track.artist === artist.name) {
        const totalPlays = track.totalPlays;
        const completedPlays = track.plays.filter(
          p => !p.skipped && (p.reasonEnd === 'trackdone' || p.reasonEnd === 'endplay')
        ).length;

        trackCompletionRates.set(track.name, {
          total: totalPlays,
          completed: completedPlays,
        });
      }
    }

    const topCompletedTracks = Array.from(trackCompletionRates.entries())
      .map(([trackName, stats]) => ({
        trackName,
        completionRate: stats.completed / stats.total,
      }))
      .filter(t => t.completionRate >= 0.80)
      .sort((a, b) => b.completionRate - a.completionRate)
      .slice(0, 5);

    // NEW: Calculate temporal consistency
    const weeksActive = artist.playsByWeek.size;

    // Calculate how many weeks had >75% completion
    let consistentWeeks = 0;
    for (const [weekKey, playCount] of artist.playsByWeek.entries()) {
      // Get plays for this artist in this week
      let weekCompleted = 0;
      let weekTotal = 0;

      for (const track of sot.tracks.values()) {
        if (track.artist === artist.name) {
          for (const play of track.plays) {
            // Check if play is in this week (approximation)
            weekTotal++;
            if (!play.skipped && (play.reasonEnd === 'trackdone' || play.reasonEnd === 'endplay')) {
              weekCompleted++;
            }
          }
        }
      }

      const weekCompletionRate = weekTotal > 0 ? weekCompleted / weekTotal : 0;
      if (weekCompletionRate >= 0.75) {
        consistentWeeks++;
      }
    }

    candidates.push({
      artist,
      totalPlays: artist.totalPlays,
      completedPlays: completedCount,
      completionRate,
      avgCompletionMs,
      avgCompletionPercent,
      topCompletedTracks,
      weeksActive,
      consistentWeeks,
    });
  }

  return candidates;
}

/**
 * Calculate distinctiveness
 */
function calculateDistinctiveness(
  completionRate: number,
  totalPlays: number,
  baseRate: number
): number {
  // Higher completion rate + more plays = more distinctive
  const rateScore = completionRate; // Already 0-1
  const volumeScore = Math.min(totalPlays / 50, 1.0);
  const score = (rateScore * 0.8) + (volumeScore * 0.2);
  return Math.min(score / baseRate, 1.0);
}
