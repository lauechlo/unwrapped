/**
 * The Consistency Champion Detector
 *
 * Detects tracks appearing in top 5 across ALL three time ranges (4-week, 6-month,
 * all-time). These are ultimate emotional anchors - tracks so core to your identity
 * that they've remained constant for months or years.
 *
 * Deeper than The Looper (which only checks #1 position). This finds tracks with
 * extreme persistence at the very top of your rotation.
 *
 * Pattern ID: 48
 * Category: identity
 * Psychological Dimension: core identity
 * Priority: V1 - High Priority
 */

import type { UserListeningData, DetectionResult, Evidence } from '../types';

/**
 * Configuration for consistency champion detection
 */
const CONFIG = {
  MAX_RANK_ALL_RANGES: 5,        // Must be top 5 in ALL three ranges
  MIN_CHAMPIONS: 1,              // Need at least 1 champion
};

/**
 * Find consistency champions
 */
function findConsistencyChampions(data: UserListeningData): Array<{
  track: any;
  shortTermRank: number;
  mediumTermRank: number;
  longTermRank: number;
  avgRank: number;
  rankVariance: number;
}> {
  const champions: Array<{
    track: any;
    shortTermRank: number;
    mediumTermRank: number;
    longTermRank: number;
    avgRank: number;
    rankVariance: number;
  }> = [];

  // Check top 5 short-term tracks
  data.topTracks.short.slice(0, CONFIG.MAX_RANK_ALL_RANGES).forEach((track, shortIdx) => {
    const shortTermRank = shortIdx + 1;

    // Must also be in top 5 of medium-term
    const mediumIdx = data.topTracks.medium.findIndex(t => t.id === track.id);
    if (mediumIdx === -1 || mediumIdx >= CONFIG.MAX_RANK_ALL_RANGES) return;
    const mediumTermRank = mediumIdx + 1;

    // Must also be in top 5 of long-term
    const longIdx = data.topTracks.long.findIndex(t => t.id === track.id);
    if (longIdx === -1 || longIdx >= CONFIG.MAX_RANK_ALL_RANGES) return;
    const longTermRank = longIdx + 1;

    // Calculate consistency metrics
    const avgRank = (shortTermRank + mediumTermRank + longTermRank) / 3;
    const rankVariance = Math.max(
      Math.abs(shortTermRank - avgRank),
      Math.abs(mediumTermRank - avgRank),
      Math.abs(longTermRank - avgRank)
    );

    champions.push({
      track,
      shortTermRank,
      mediumTermRank,
      longTermRank,
      avgRank,
      rankVariance,
    });
  });

  // Sort by average rank (best overall position)
  return champions.sort((a, b) => a.avgRank - b.avgRank);
}

/**
 * Detect The Consistency Champion pattern
 *
 * Identifies tracks with extreme persistence at the top. This indicates:
 * - Core identity anchors
 * - Tracks central to emotional regulation
 * - Music as reliable self-definition
 * - Unchanging emotional needs
 *
 * When a track stays in your top 5 for months or years,
 * it's not just a favorite - it's a part of who you are.
 *
 * @param data - User's complete listening data
 * @returns Detection result or null if pattern not found
 */
export async function detectTheConsistencyChampion(
  data: UserListeningData
): Promise<DetectionResult | null> {
  console.log('[Consistency Champion] Starting detection...');

  const champions = findConsistencyChampions(data);

  console.log(`[Consistency Champion] Found ${champions.length} tracks in top 5 across all time ranges`);
  if (champions.length > 0) {
    champions.forEach((champ, i) => {
      console.log(`  ${i + 1}. "${champ.track.name}": #${champ.shortTermRank}/#${champ.mediumTermRank}/#${champ.longTermRank} (avg: ${champ.avgRank.toFixed(1)})`);
    });
  }

  if (champions.length < CONFIG.MIN_CHAMPIONS) {
    console.log('[Consistency Champion] No consistency champions detected');
    return null;
  }

  // Use the most consistent champion (lowest average rank)
  const theChampion = champions[0];

  // Calculate confidence based on rank consistency
  // Avg rank 1.0 = 1.0 confidence, avg rank 5.0 = 0.8
  let confidence = Math.max(1.1 - (theChampion.avgRank * 0.06), 0.8);

  // Bonus for low variance (very stable position)
  if (theChampion.rankVariance <= 1.0) {
    confidence = Math.min(confidence + 0.05, 1.0);
  }

  // Build evidence
  const evidence: Evidence[] = [
    {
      type: 'track',
      value: theChampion.track,
      humanReadable: `"${theChampion.track.name}" by ${theChampion.track.artists[0].name}`
    },
    {
      type: 'count',
      value: 'all-ranges',
      humanReadable: `Top 5 across ALL time ranges: #${theChampion.shortTermRank} (4-week), #${theChampion.mediumTermRank} (6-month), #${theChampion.longTermRank} (all-time)`
    },
    {
      type: 'ratio',
      value: theChampion.avgRank,
      humanReadable: `Average rank: ${theChampion.avgRank.toFixed(1)} - consistently at the very top`
    }
  ];

  // Interpret rank stability
  if (theChampion.rankVariance <= 1.0) {
    evidence.push({
      type: 'count',
      value: 'stable',
      humanReadable: `Remarkably stable (variance: ${theChampion.rankVariance.toFixed(1)}) - unwavering emotional anchor`
    });
  } else {
    evidence.push({
      type: 'count',
      value: 'variable',
      humanReadable: `Some rank variation (${theChampion.rankVariance.toFixed(1)}) but always top 5 - persistent favorite`
    });
  }

  // Interpret based on average rank
  if (theChampion.avgRank <= 2.0) {
    evidence.push({
      type: 'count',
      value: 'extreme',
      humanReadable: `Average top 2 across years - this track is central to your identity`
    });
  } else if (theChampion.avgRank <= 3.5) {
    evidence.push({
      type: 'count',
      value: 'high',
      humanReadable: `Consistently top 3 - core emotional regulation tool`
    });
  } else {
    evidence.push({
      type: 'count',
      value: 'moderate',
      humanReadable: `Stable top 5 presence - reliable comfort track`
    });
  }

  // Check if multiple champions exist
  if (champions.length >= 2) {
    const secondChamp = champions[1];
    evidence.push({
      type: 'count',
      value: champions.length,
      humanReadable: `${champions.length} consistency champions (also: "${secondChamp.track.name}" avg #${secondChamp.avgRank.toFixed(1)})`
    });

    if (champions.length >= 3) {
      evidence.push({
        type: 'count',
        value: 'stable-identity',
        humanReadable: `${champions.length} tracks with extreme persistence - your taste is remarkably stable`
      });
    }
  }

  // Check artist consistency
  const championArtists = new Set(champions.map(c => c.track.artists[0].id));
  if (championArtists.size === 1 && champions.length >= 2) {
    evidence.push({
      type: 'artist',
      value: 'single-artist',
      humanReadable: `All champions by same artist - extreme loyalty to ${theChampion.track.artists[0].name}`
    });
  }

  return {
    patternId: 48,
    patternName: 'The Consistency Champion',
    confidence,
    evidence,
    psychologicalDimension: 'core identity',
    category: 'identity',
    insightPotential: 0,
  };
}
