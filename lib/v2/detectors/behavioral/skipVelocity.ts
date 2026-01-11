// Skip Velocity Detector
// Finds artists with INSTANT rejection or EXTREME skip patterns
// Psychology: Active rejection, immediate emotional response
// V2 EXCLUSIVE: Uses `skipped` and `ms_played` fields
// DIFFERENTIATION: Focuses on VELOCITY (how quickly you skip), not sustained completion

import { SourceOfTruth, DetectionResult, Evidence, ArtistAggregate } from '../../types';

const PATTERN_ID = 'skip-velocity';
const PATTERN_NAME = 'Skip Velocity';
const PATTERN_FAMILY = 'behavioral';
const BASE_RATE = 0.15; // ~15% of users have extreme skip patterns

interface SkipCandidate {
  artist: ArtistAggregate;
  totalPlays: number;
  skipCount: number;
  skipRate: number;
  avgMsBeforeSkip: number;
  completionRate: number;
  avgCompletionMs: number;
  pattern: 'instant_reject' | 'slow_reject';
}

/**
 * Detect extreme skip or completion patterns by artist
 * V2 EXCLUSIVE: Only works with Extended Streaming History
 *
 * @param sot - SourceOfTruth index
 * @param maxResults - Maximum number of results to return (default 10)
 * @returns Array of detection results for skip/completion patterns
 */
export function detectSkipVelocity(sot: SourceOfTruth, maxResults: number = 10): DetectionResult[] {
  const candidates = findSkipCandidates(sot);

  if (candidates.length === 0) return [];

  // Sort by extremeness (either very high skip rate or very high completion rate)
  candidates.sort((a, b) => {
    const aExtreme = Math.abs(a.skipRate - 0.5); // Distance from 50%
    const bExtreme = Math.abs(b.skipRate - 0.5);
    return bExtreme - aExtreme;
  });

  // Filter candidates that meet threshold
  const validCandidates = candidates.filter(candidate => {
    // NEW FOCUS: VELOCITY-based detection
    // Threshold:
    // - At least 15 plays (meaningful sample)
    // - Either INSTANT rejection (<30s skip, >70% skip rate)
    // - OR very high skip rate (>85%) regardless of time
    const hasInstantReject =
      candidate.pattern === 'instant_reject' &&
      candidate.skipRate >= 0.70 &&
      candidate.avgMsBeforeSkip < 30000;

    const hasExtremeSkip = candidate.skipRate >= 0.85;

    return candidate.totalPlays >= 15 && (hasInstantReject || hasExtremeSkip);
  });

  if (validCandidates.length === 0) return [];

  // Return top N results
  return validCandidates.slice(0, maxResults).map(candidate => {
    // Calculate confidence based on sample size and extremeness
    const extremeness = Math.abs(candidate.skipRate - 0.5) * 2; // 0-1 scale
    const sampleConfidence = Math.min(candidate.totalPlays / 30, 1.0);
    const confidence = (extremeness * 0.7) + (sampleConfidence * 0.3);

    // Calculate distinctiveness
    const distinctiveness = calculateDistinctiveness(
      candidate.skipRate,
      candidate.totalPlays,
      BASE_RATE
    );

    // Build evidence
    const evidence: Evidence[] = [
      {
        type: 'artist',
        metric: 'skip_artist',
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
    ];

    // Add skip-specific evidence (all patterns are skip-based now)
    evidence.push(
      {
        type: 'count',
        metric: 'skip_count',
        value: candidate.skipCount,
        sourceIndices: [],
        humanReadable: `${candidate.skipCount} skipped`,
      },
      {
        type: 'ratio',
        metric: 'skip_rate',
        value: candidate.skipRate,
        sourceIndices: [],
        humanReadable: `${Math.round(candidate.skipRate * 100)}% skip rate`,
      }
    );

    if (candidate.pattern === 'instant_reject') {
      evidence.push({
        type: 'duration',
        metric: 'avg_time_before_skip',
        value: candidate.avgMsBeforeSkip,
        sourceIndices: [],
        humanReadable: `Avg ${Math.round(candidate.avgMsBeforeSkip / 1000)}s before skip`,
      });
    }

    // Get top skipped tracks from this artist
    const artistTracks = Array.from(sot.tracks.values())
      .filter(t => t.artist === candidate.artist.name)
      .map(track => ({
        name: track.name,
        totalPlays: track.totalPlays,
        skippedPlays: track.skippedPlays,
        skipRate: track.skippedPlays / track.totalPlays,
      }))
      .filter(t => t.totalPlays >= 3) // At least 3 plays to be meaningful
      .sort((a, b) => b.skipRate - a.skipRate)
      .slice(0, 10);

    if (artistTracks.length > 0) {
      const trackBreakdown = artistTracks
        .map((t, i) => `${i + 1}. "${t.name}": ${t.skippedPlays}/${t.totalPlays} skipped (${Math.round(t.skipRate * 100)}%)`)
        .join('\n');

      evidence.push({
        type: 'track',
        metric: 'most_skipped_tracks',
        value: trackBreakdown,
        sourceIndices: [],
        humanReadable: `MOST SKIPPED TRACKS:\n${trackBreakdown}`,
      });
    }

    // Add skip behavior analysis
    const rejectionLevel = candidate.skipRate > 0.9 ? 'EXTREME REJECTION' :
                          candidate.skipRate > 0.8 ? 'STRONG REJECTION' :
                          'ACTIVE REJECTION';

    const velocityAnalysis = candidate.pattern === 'instant_reject'
      ? `You skip within ${Math.round(candidate.avgMsBeforeSkip / 1000)}s on average - this is immediate rejection`
      : 'You give it a chance but consistently skip';

    evidence.push({
      type: 'ratio',
      metric: 'rejection_analysis',
      value: candidate.skipRate,
      sourceIndices: [],
      humanReadable: `REJECTION PATTERN:\n- Level: ${rejectionLevel}\n- ${velocityAnalysis}\n- ${candidate.skipCount} of ${candidate.totalPlays} plays skipped\n- Interpretation: ${candidate.skipRate > 0.9 ? 'This artist triggers an immediate "nope" response - strong learned aversion' : candidate.pattern === 'instant_reject' ? 'You know within seconds this isn\'t for you - decisive taste' : 'Consistent rejection after brief sampling - clear preference boundary'}`,
    });

    // Add weekly skip pattern
    const weeklySkips = Array.from(candidate.artist.playsByWeek.entries())
      .sort((a, b) => b[0].localeCompare(a[0]))
      .slice(0, 8)
      .map(([week, plays]) => {
        // Estimate skips for this week using overall skip rate
        const estimatedSkips = Math.round(plays * candidate.skipRate);
        return `${week}: ${plays} plays (~${estimatedSkips} skipped)`;
      })
      .join('\n');

    evidence.push({
      type: 'count',
      metric: 'weekly_skip_pattern',
      value: weeklySkips,
      sourceIndices: [],
      humanReadable: `WEEKLY SKIP PATTERN (most recent):\n${weeklySkips}`,
    });

    // Pattern-specific psychological basis (skip-focused)
    const psychologyMap = {
      instant_reject:
        'Active musical rejection. Immediate skips (<30s) reveal strong negative preferences and learned associations. This is active dislike, not passive indifference (North & Hargreaves, 2008)',
      slow_reject:
        'Gradual disengagement. Consistent skipping after brief sampling suggests habituation, preference drift, or contextual mismatch',
    };

    return {
      patternId: PATTERN_ID,
      patternName: PATTERN_NAME,
      patternFamily: PATTERN_FAMILY,
      confidence,
      distinctiveness,
      evidence,
      psychologicalBasis: psychologyMap[candidate.pattern],
    };
  });
}

/**
 * Find artists with extreme skip or completion patterns
 */
function findSkipCandidates(sot: SourceOfTruth): SkipCandidate[] {
  const candidates: SkipCandidate[] = [];

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

    // Calculate skip metrics
    const skippedPlays = artistPlays.filter(p => p.skipped);
    const skipCount = skippedPlays.length;
    const skipRate = skipCount / artistPlays.length;

    // Calculate completion metrics
    const completedPlays = artistPlays.filter(p => !p.skipped);
    const completionRate = completedPlays.length / artistPlays.length;

    // Average ms before skip (for skipped plays only)
    const avgMsBeforeSkip =
      skipCount > 0
        ? skippedPlays.reduce((sum, p) => sum + p.msPlayed, 0) / skipCount
        : 0;

    // Average ms for completed plays
    const avgCompletionMs =
      completedPlays.length > 0
        ? completedPlays.reduce((sum, p) => sum + p.msPlayed, 0) /
          completedPlays.length
        : 0;

    // Determine pattern type (SKIP-FOCUSED ONLY)
    let pattern: 'instant_reject' | 'slow_reject';

    if (skipRate >= 0.70) {
      // High skip rate
      if (avgMsBeforeSkip < 30000) {
        // Skip within 30 seconds
        pattern = 'instant_reject';
      } else {
        pattern = 'slow_reject';
      }
    } else {
      // Not a skip pattern - Completion Loyalist handles high completion
      continue;
    }

    candidates.push({
      artist,
      totalPlays: artist.totalPlays,
      skipCount,
      skipRate,
      avgMsBeforeSkip,
      completionRate,
      avgCompletionMs,
      pattern,
    });
  }

  return candidates;
}

/**
 * Calculate distinctiveness
 */
function calculateDistinctiveness(
  skipRate: number,
  totalPlays: number,
  baseRate: number
): number {
  // More extreme skip rate + more plays = more distinctive
  const extremeness = Math.abs(skipRate - 0.5) * 2; // 0-1 scale
  const volumeScore = Math.min(totalPlays / 50, 1.0);
  const score = (extremeness * 0.8) + (volumeScore * 0.2);
  return Math.min(score / baseRate, 1.0);
}
