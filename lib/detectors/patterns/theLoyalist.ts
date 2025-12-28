/**
 * The Loyalist Detector
 *
 * Detects consistent favorites - artists who appear in your top 10 across
 * ALL time ranges (4 weeks, 6 months, and all-time). Indicates deep attachment,
 * reliable comfort, and stable identity anchors in your music taste.
 *
 * Pattern ID: 22
 * Category: identity
 * Psychological Dimension: identity and attachment
 * Priority: V1 - High Priority
 */

import type { UserListeningData, DetectionResult, Evidence } from '../types';

/**
 * Configuration for loyalist detection
 */
const CONFIG = {
  MIN_LOYAL_ARTISTS: 2,      // Need at least 2 consistent artists
  TOP_N_CHECK: 10,           // Check top 10 in each time range
  HIGH_LOYALTY_COUNT: 4,     // 4+ loyal artists = very high loyalty
};

/**
 * Find artists that appear in top N across all time ranges
 */
function findLoyalArtists(data: UserListeningData): Array<{
  artist: any;
  shortTermRank: number;
  mediumTermRank: number;
  longTermRank: number;
}> {
  const loyalArtists: Array<{
    artist: any;
    shortTermRank: number;
    mediumTermRank: number;
    longTermRank: number;
  }> = [];

  // Check each artist in short-term top N
  data.topArtists.short.slice(0, CONFIG.TOP_N_CHECK).forEach((shortArtist, shortIdx) => {
    // Find in medium-term
    const mediumIdx = data.topArtists.medium.findIndex(a => a.id === shortArtist.id);

    // Find in long-term
    const longIdx = data.topArtists.long.findIndex(a => a.id === shortArtist.id);

    // If in all three time ranges AND in top 10 of each
    if (mediumIdx !== -1 && mediumIdx < CONFIG.TOP_N_CHECK &&
        longIdx !== -1 && longIdx < CONFIG.TOP_N_CHECK) {
      loyalArtists.push({
        artist: shortArtist,
        shortTermRank: shortIdx + 1,
        mediumTermRank: mediumIdx + 1,
        longTermRank: longIdx + 1,
      });
    }
  });

  return loyalArtists;
}

/**
 * Detect The Loyalist pattern
 *
 * Identifies users with consistent favorite artists across all time ranges.
 * This indicates:
 * - Deep attachment to specific artists
 * - Stable identity anchors in music taste
 * - Reliable comfort and emotional regulation
 * - Long-term preference consistency
 *
 * @param data - User's complete listening data
 * @returns Detection result or null if pattern not found
 */
export async function detectTheLoyalist(
  data: UserListeningData
): Promise<DetectionResult | null> {
  console.log('[The Loyalist] Starting detection...');
  const loyalArtists = findLoyalArtists(data);

  console.log(`[The Loyalist] Found ${loyalArtists.length} loyal artists`);
  if (loyalArtists.length > 0) {
    loyalArtists.forEach((loyal, i) => {
      console.log(`  ${i + 1}. ${loyal.artist.name}: ranks ${loyal.shortTermRank}/${loyal.mediumTermRank}/${loyal.longTermRank}`);
    });
  }

  if (loyalArtists.length < CONFIG.MIN_LOYAL_ARTISTS) {
    console.log('[The Loyalist] Not enough loyal artists detected');
    return null;
  }

  // Calculate confidence based on number of loyal artists and rank consistency
  // 2 artists = 0.7, 3 = 0.8, 4+ = 0.9
  let confidence = Math.min(0.5 + (loyalArtists.length * 0.15), 0.95);

  // Bonus for high-ranking consistency (top 5 in all ranges)
  const highRankArtists = loyalArtists.filter(
    a => a.shortTermRank <= 5 && a.mediumTermRank <= 5 && a.longTermRank <= 5
  );
  if (highRankArtists.length >= 2) {
    confidence = Math.min(confidence + 0.1, 1.0);
  }

  // Build evidence - use top 3 for cleaner Instagram cards
  const topLoyalArtists = loyalArtists.slice(0, 3);

  const evidence: Evidence[] = [
    {
      type: 'count',
      value: topLoyalArtists.length,
      humanReadable: `${topLoyalArtists.length} artists appear in your top 10 across ALL time ranges`
    }
  ];

  // Show top 3 loyal artists with their ranks
  topLoyalArtists.forEach(loyal => {
    evidence.push({
      type: 'artist',
      value: loyal.artist,
      humanReadable: `${loyal.artist.name} (ranks: #${loyal.shortTermRank} → #${loyal.mediumTermRank} → #${loyal.longTermRank})`
    });
  });

  // Add interpretation based on loyalty count
  if (topLoyalArtists.length >= CONFIG.HIGH_LOYALTY_COUNT) {
    evidence.push({
      type: 'timestamp',
      value: 'high',
      humanReadable: `${topLoyalArtists.length} consistent artists shows exceptionally stable musical identity`
    });
  } else {
    evidence.push({
      type: 'timestamp',
      value: 'moderate',
      humanReadable: `Consistent favorites suggest these artists are identity anchors for you`
    });
  }

  // Check if any are extremely stable (within 3 positions across all ranges)
  const extremelyStable = loyalArtists.filter(a => {
    const maxRank = Math.max(a.shortTermRank, a.mediumTermRank, a.longTermRank);
    const minRank = Math.min(a.shortTermRank, a.mediumTermRank, a.longTermRank);
    return (maxRank - minRank) <= 3;
  });

  if (extremelyStable.length > 0) {
    evidence.push({
      type: 'artist',
      value: extremelyStable[0].artist,
      humanReadable: `${extremelyStable[0].artist.name} shows remarkable rank stability - a true constant in your music life`
    });
  }

  return {
    patternId: 22,
    patternName: 'The Loyalist',
    confidence,
    evidence,
    psychologicalDimension: 'identity and attachment',
    category: 'identity',
    insightPotential: 0, // Will be calculated by runner
  };
}
