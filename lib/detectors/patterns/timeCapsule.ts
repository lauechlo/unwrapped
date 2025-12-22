/**
 * Time Capsule Detector
 *
 * Detects when your current top tracks are dominated by all-time favorites.
 * The opposite of The Trendy - indicates preference stability, nostalgia,
 * or deep attachment to established favorites.
 *
 * Pattern ID: 25
 * Category: identity
 * Psychological Dimension: identity and attachment
 * Priority: V1 - High Priority
 */

import type { UserListeningData, DetectionResult, Evidence } from '../types';

/**
 * Configuration for time capsule detection
 */
const CONFIG = {
  MIN_CLASSIC_RATIO: 0.6,       // 60%+ of top 10 must be all-time favorites
  HIGH_CLASSIC_RATIO: 0.8,      // 80%+ = very strong time capsule
  ANALYZE_TOP_N: 10,            // Check top 10 tracks
};

/**
 * Find tracks in short-term that also appear in long-term (classics)
 */
function findClassicTracks(data: UserListeningData): {
  classicTracks: Array<{ track: any; longTermRank: number }>;
  totalAnalyzed: number;
  classicRatio: number;
} {
  const shortTermTop = data.topTracks.short.slice(0, CONFIG.ANALYZE_TOP_N);
  const classicTracks: Array<{ track: any; longTermRank: number }> = [];

  shortTermTop.forEach(track => {
    // Find track in long-term
    const longIndex = data.topTracks.long.findIndex(t => t.id === track.id);

    // Track is "classic" if it appears in long-term favorites
    if (longIndex !== -1) {
      classicTracks.push({
        track,
        longTermRank: longIndex + 1,
      });
    }
  });

  return {
    classicTracks,
    totalAnalyzed: shortTermTop.length,
    classicRatio: classicTracks.length / shortTermTop.length,
  };
}

/**
 * Detect Time Capsule pattern
 *
 * Identifies users whose current favorites are dominated by all-time classics.
 * This indicates:
 * - Strong preference stability over time
 * - Deep attachment to established favorites
 * - Nostalgia and comfort-seeking behavior
 * - Consistent musical identity
 *
 * @param data - User's complete listening data
 * @returns Detection result or null if pattern not found
 */
export async function detectTimeCapsule(
  data: UserListeningData
): Promise<DetectionResult | null> {
  console.log('[Time Capsule] Starting detection...');

  const { classicTracks, totalAnalyzed, classicRatio } = findClassicTracks(data);

  console.log(`[Time Capsule] Found ${classicTracks.length}/${totalAnalyzed} classic tracks (${(classicRatio * 100).toFixed(0)}%)`);
  if (classicTracks.length > 0) {
    console.log('  Sample classics:', classicTracks.slice(0, 3).map(c => c.track.name).join(', '));
  }

  // Check if ratio meets threshold
  if (classicRatio < CONFIG.MIN_CLASSIC_RATIO) {
    console.log(`[Time Capsule] Classic ratio ${(classicRatio * 100).toFixed(0)}% below threshold of ${CONFIG.MIN_CLASSIC_RATIO * 100}%`);
    return null;
  }

  // Calculate confidence based on classic track ratio
  // 60% = 0.7, 80%+ = 0.9
  let confidence = Math.min(0.5 + (classicRatio * 0.5), 0.95);

  // Bonus for very high classic ratio
  if (classicRatio >= CONFIG.HIGH_CLASSIC_RATIO) {
    confidence = Math.min(confidence + 0.1, 1.0);
  }

  // Build evidence
  const evidence: Evidence[] = [
    {
      type: 'count',
      value: classicTracks.length,
      humanReadable: `${classicTracks.length} of your top ${totalAnalyzed} tracks are ALL-TIME favorites`
    },
    {
      type: 'ratio',
      value: classicRatio,
      humanReadable: `${Math.round(classicRatio * 100)}% of your current top tracks are established classics`
    }
  ];

  // Show sample tracks with their all-time rankings
  const sampleClassics = classicTracks.slice(0, 3);
  if (sampleClassics.length > 0) {
    sampleClassics.forEach(classic => {
      evidence.push({
        type: 'track',
        value: classic.track,
        humanReadable: `"${classic.track.name}" - #${classic.longTermRank} all-time`
      });
    });
  }

  // Add interpretation based on ratio
  if (classicRatio >= CONFIG.HIGH_CLASSIC_RATIO) {
    evidence.push({
      type: 'timestamp',
      value: 'very-high',
      humanReadable: `${Math.round(classicRatio * 100)}% classics shows strong preference stability and deep attachment to favorites`
    });
  } else {
    evidence.push({
      type: 'timestamp',
      value: 'high',
      humanReadable: `You consistently return to your tried-and-true favorites`
    });
  }

  // Check for tracks that maintain similar rankings (ultra-stable)
  const ultraStable = classicTracks.filter(c => {
    const shortRank = data.topTracks.short.findIndex(t => t.id === c.track.id) + 1;
    const rankDiff = Math.abs(shortRank - c.longTermRank);
    return rankDiff <= 5; // Within 5 positions
  });

  if (ultraStable.length >= 3) {
    evidence.push({
      type: 'track',
      value: ultraStable[0].track,
      humanReadable: `${ultraStable.length} tracks maintain similar rankings across time - remarkable consistency`
    });
    confidence = Math.min(confidence + 0.05, 1.0);
  }

  return {
    patternId: 25,
    patternName: 'Time Capsule',
    confidence,
    evidence,
    psychologicalDimension: 'identity and attachment',
    category: 'identity',
    insightPotential: 0, // Will be calculated by runner
  };
}
