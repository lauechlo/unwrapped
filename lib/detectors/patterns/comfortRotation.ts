/**
 * Comfort Rotation Detector
 *
 * Detects specific tracks that appear in your top favorites across ALL time
 * ranges. These are your reliable comfort songs - the tracks you return to
 * consistently for emotional regulation and familiarity.
 *
 * Pattern ID: 26
 * Category: emotional
 * Psychological Dimension: emotional regulation
 * Priority: V1 - High Priority
 */

import type { UserListeningData, DetectionResult, Evidence } from '../types';

/**
 * Configuration for comfort rotation detection
 */
const CONFIG = {
  MIN_COMFORT_TRACKS: 2,     // Need at least 2 consistent tracks
  TOP_N_CHECK: 20,           // Check top 20 in each time range
  HIGH_COMFORT_COUNT: 5,     // 5+ comfort tracks = very strong pattern
};

/**
 * Find tracks that appear in top N across all time ranges
 */
function findComfortTracks(data: UserListeningData): Array<{
  track: any;
  shortTermRank: number;
  mediumTermRank: number;
  longTermRank: number;
}> {
  const comfortTracks: Array<{
    track: any;
    shortTermRank: number;
    mediumTermRank: number;
    longTermRank: number;
  }> = [];

  // Check each track in short-term top N
  data.topTracks.short.slice(0, CONFIG.TOP_N_CHECK).forEach((shortTrack, shortIdx) => {
    // Find in medium-term
    const mediumIdx = data.topTracks.medium.findIndex(t => t.id === shortTrack.id);

    // Find in long-term
    const longIdx = data.topTracks.long.findIndex(t => t.id === shortTrack.id);

    // If in all three time ranges AND in top 20 of each
    if (mediumIdx !== -1 && mediumIdx < CONFIG.TOP_N_CHECK &&
        longIdx !== -1 && longIdx < CONFIG.TOP_N_CHECK) {
      comfortTracks.push({
        track: shortTrack,
        shortTermRank: shortIdx + 1,
        mediumTermRank: mediumIdx + 1,
        longTermRank: longIdx + 1,
      });
    }
  });

  return comfortTracks;
}

/**
 * Detect Comfort Rotation pattern
 *
 * Identifies specific tracks that persist as favorites across all time ranges.
 * This indicates:
 * - Reliable emotional regulation tools
 * - Deep attachment to specific songs
 * - Consistent comfort-seeking behavior
 * - Songs that serve specific psychological functions
 *
 * @param data - User's complete listening data
 * @returns Detection result or null if pattern not found
 */
export async function detectComfortRotation(
  data: UserListeningData
): Promise<DetectionResult | null> {
  console.log('[Comfort Rotation] Starting detection...');
  const comfortTracks = findComfortTracks(data);

  console.log(`[Comfort Rotation] Found ${comfortTracks.length} comfort tracks`);
  if (comfortTracks.length > 0) {
    comfortTracks.forEach((comfort, i) => {
      console.log(`  ${i + 1}. "${comfort.track.name}": ranks ${comfort.shortTermRank}/${comfort.mediumTermRank}/${comfort.longTermRank}`);
    });
  }

  if (comfortTracks.length < CONFIG.MIN_COMFORT_TRACKS) {
    console.log('[Comfort Rotation] Not enough comfort tracks detected');
    return null;
  }

  // Calculate confidence based on number of comfort tracks and rank consistency
  // 2 tracks = 0.7, 3 = 0.8, 5+ = 0.95
  let confidence = Math.min(0.5 + (comfortTracks.length * 0.12), 0.95);

  // Bonus for ultra-stable tracks (within 5 positions across all ranges)
  const ultraStable = comfortTracks.filter(c => {
    const maxRank = Math.max(c.shortTermRank, c.mediumTermRank, c.longTermRank);
    const minRank = Math.min(c.shortTermRank, c.mediumTermRank, c.longTermRank);
    return (maxRank - minRank) <= 5;
  });

  if (ultraStable.length >= 2) {
    confidence = Math.min(confidence + 0.1, 1.0);
  }

  // Build evidence
  const evidence: Evidence[] = [
    {
      type: 'count',
      value: comfortTracks.length,
      humanReadable: `${comfortTracks.length} tracks appear in your top 20 across ALL time ranges`
    }
  ];

  // Show the comfort tracks
  const topComfortTracks = comfortTracks.slice(0, 3);
  topComfortTracks.forEach(comfort => {
    evidence.push({
      type: 'track',
      value: comfort.track,
      humanReadable: `"${comfort.track.name}" by ${comfort.track.artists[0].name} (ranks: #${comfort.shortTermRank} → #${comfort.mediumTermRank} → #${comfort.longTermRank})`
    });
  });

  // Add interpretation based on track count
  if (comfortTracks.length >= CONFIG.HIGH_COMFORT_COUNT) {
    evidence.push({
      type: 'timestamp',
      value: 'high',
      humanReadable: `${comfortTracks.length} consistent tracks suggests these are essential emotional regulation tools`
    });
  } else {
    evidence.push({
      type: 'timestamp',
      value: 'moderate',
      humanReadable: `These specific songs serve as reliable comfort anchors in your life`
    });
  }

  // Highlight ultra-stable tracks
  if (ultraStable.length > 0) {
    evidence.push({
      type: 'track',
      value: ultraStable[0].track,
      humanReadable: `"${ultraStable[0].track.name}" shows remarkable rank stability - a true constant`
    });
  }

  return {
    patternId: 26,
    patternName: 'Comfort Rotation',
    confidence,
    evidence,
    psychologicalDimension: 'emotional regulation',
    category: 'emotional',
    insightPotential: 0, // Will be calculated by runner
  };
}
