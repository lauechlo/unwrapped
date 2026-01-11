// The Searcher Detector
// Finds high intentional selection vs. passive listening
// Psychology: Active curation, musical agency, dissatisfaction with algorithmic suggestions
// V2 EXCLUSIVE: Uses `reason_start` field

import { SourceOfTruth, DetectionResult, Evidence } from '../../types';

const PATTERN_ID = 'the-searcher';
const PATTERN_NAME = 'The Searcher';
const PATTERN_FAMILY = 'behavioral';
const BASE_RATE = 0.18; // ~18% of users are high searchers

interface SearcherCandidate {
  totalPlays: number;
  clickrowCount: number;
  trackdoneCount: number;
  clickrowRatio: number;
  topSearchedTracks: Array<{ trackName: string; artist: string; count: number }>;
  avgSkipRate: number;
}

/**
 * Detect active search/selection behavior vs. passive listening
 * V2 EXCLUSIVE: Only works with Extended Streaming History
 *
 * @param sot - SourceOfTruth index
 * @param maxResults - Maximum number of results to return (default 10)
 * @returns Array of detection results for search patterns
 */
export function detectSearcher(sot: SourceOfTruth, maxResults: number = 10): DetectionResult[] {
  const candidate = findSearcherPattern(sot);

  if (!candidate) return [];

  // Check if meets threshold
  // Threshold:
  // - At least 30% clickrow starts (active selection)
  // - At least 50 total plays (meaningful sample)
  if (candidate.clickrowRatio < 0.30 || candidate.totalPlays < 50) {
    return [];
  }

  // Calculate confidence based on ratio and volume
  const confidence = Math.min(
    (candidate.clickrowRatio * 0.7) + (candidate.clickrowCount / 500 * 0.3),
    1.0
  );

  // Calculate distinctiveness
  const distinctiveness = calculateDistinctiveness(
    candidate.clickrowRatio,
    candidate.clickrowCount,
    BASE_RATE
  );

  // Build evidence
  const evidence: Evidence[] = [
    {
      type: 'count',
      metric: 'total_plays',
      value: candidate.totalPlays,
      sourceIndices: [],
      humanReadable: `${candidate.totalPlays} total plays`,
    },
    {
      type: 'count',
      metric: 'clickrow_count',
      value: candidate.clickrowCount,
      sourceIndices: [],
      humanReadable: `${candidate.clickrowCount} direct selections`,
    },
    {
      type: 'ratio',
      metric: 'clickrow_ratio',
      value: candidate.clickrowRatio,
      sourceIndices: [],
      humanReadable: `${Math.round(candidate.clickrowRatio * 100)}% active searching`,
    },
    {
      type: 'count',
      metric: 'trackdone_count',
      value: candidate.trackdoneCount,
      sourceIndices: [],
      humanReadable: `${candidate.trackdoneCount} autoplay`,
    },
  ];

  // Add skip rate if high (indicates dissatisfaction)
  if (candidate.avgSkipRate >= 0.50) {
    evidence.push({
      type: 'ratio',
      metric: 'skip_rate',
      value: candidate.avgSkipRate,
      sourceIndices: [],
      humanReadable: `${Math.round(candidate.avgSkipRate * 100)}% skip rate`,
    });
  }

  // Add top searched tracks
  if (candidate.topSearchedTracks.length > 0) {
    const topTracks = candidate.topSearchedTracks
      .slice(0, 3)
      .map(t => `"${t.trackName}" by ${t.artist}`)
      .join(', ');

    evidence.push({
      type: 'track',
      metric: 'top_searched',
      value: topTracks,
      sourceIndices: [],
      humanReadable: `Most searched: ${topTracks}`,
    });
  }

  // Add detailed track breakdown
  if (candidate.topSearchedTracks.length > 0) {
    const trackBreakdown = candidate.topSearchedTracks
      .slice(0, 15)
      .map((t, i) => `${i + 1}. "${t.trackName}" by ${t.artist}: ${t.count} searches`)
      .join('\n');

    evidence.push({
      type: 'count',
      metric: 'search_breakdown',
      value: trackBreakdown,
      sourceIndices: [],
      humanReadable: `TOP SEARCHED TRACKS:\n${trackBreakdown}`,
    });
  }

  // Add search behavior analysis
  const searchLevel = candidate.clickrowRatio > 0.6 ? 'EXTREME SEARCHER' :
                     candidate.clickrowRatio > 0.45 ? 'ACTIVE SEARCHER' :
                     'MODERATE SEARCHER';

  const controlStyle = candidate.avgSkipRate >= 0.5
    ? `You search for specific tracks but skip ${Math.round(candidate.avgSkipRate * 100)}% - picky curator`
    : 'You search and commit - decisive taste';

  evidence.push({
    type: 'ratio',
    metric: 'search_behavior',
    value: candidate.clickrowRatio,
    sourceIndices: [],
    humanReadable: `SEARCH BEHAVIOR:\n- Level: ${searchLevel}\n- ${controlStyle}\n- ${candidate.clickrowCount} of ${candidate.totalPlays} plays were manually searched\n- ${candidate.trackdoneCount} plays were autoplay/algorithm\n- Interpretation: ${candidate.clickrowRatio > 0.6 ? 'You don\'t trust the algorithm - total control over your listening' : candidate.avgSkipRate >= 0.5 ? 'Active curator with high standards - you know what you want' : 'Intentional listener - you choose your music deliberately'}`,
  });

  // Determine psychology based on skip rate
  const psychologicalBasis =
    candidate.avgSkipRate >= 0.50
      ? 'Active musical curation with high search behavior. Elevated skip rate suggests dissatisfaction with algorithmic recommendations and strong preference specificity (North & Hargreaves, 2008)'
      : 'Intentional listening behavior. High active selection reveals musical agency and deliberate curation over passive consumption (DeNora, 2000)';

  return [
    {
      patternId: PATTERN_ID,
      patternName: PATTERN_NAME,
      patternFamily: PATTERN_FAMILY,
      confidence,
      distinctiveness,
      evidence,
      psychologicalBasis,
    },
  ];
}

/**
 * Analyze overall search/intentionality pattern
 */
function findSearcherPattern(sot: SourceOfTruth): SearcherCandidate | null {
  let clickrowCount = 0;
  let trackdoneCount = 0;
  let otherCount = 0;
  let totalPlays = 0;
  let totalSkipped = 0;

  // Track which tracks were clicked on
  const clickrowTracks = new Map<string, { trackName: string; artist: string; count: number }>();

  // Iterate through all tracks and their plays
  for (const track of sot.tracks.values()) {
    for (const play of track.plays) {
      totalPlays++;

      if (play.skipped) {
        totalSkipped++;
      }

      // Categorize by reason_start
      if (play.reasonStart === 'clickrow') {
        clickrowCount++;

        // Track this selection
        const key = `${track.name}|${track.artist}`;
        const existing = clickrowTracks.get(key);
        if (existing) {
          existing.count++;
        } else {
          clickrowTracks.set(key, {
            trackName: track.name,
            artist: track.artist,
            count: 1,
          });
        }
      } else if (play.reasonStart === 'trackdone') {
        trackdoneCount++;
      } else {
        otherCount++;
      }
    }
  }

  if (totalPlays === 0) return null;

  const clickrowRatio = clickrowCount / totalPlays;
  const avgSkipRate = totalSkipped / totalPlays;

  // Get top searched tracks
  const topSearchedTracks = Array.from(clickrowTracks.values())
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  return {
    totalPlays,
    clickrowCount,
    trackdoneCount,
    clickrowRatio,
    topSearchedTracks,
    avgSkipRate,
  };
}

/**
 * Calculate distinctiveness
 */
function calculateDistinctiveness(
  clickrowRatio: number,
  clickrowCount: number,
  baseRate: number
): number {
  // Higher ratio + more volume = more distinctive
  const ratioScore = clickrowRatio; // Already 0-1
  const volumeScore = Math.min(clickrowCount / 300, 1.0);
  const score = (ratioScore * 0.7) + (volumeScore * 0.3);
  return Math.min(score / baseRate, 1.0);
}
