/**
 * The Curator Detector
 *
 * Detects high saved tracks ratio in top favorites. Indicates intentional
 * music curation behavior - actively saving and organizing favorites rather
 * than passive listening.
 *
 * Pattern ID: 29
 * Category: identity
 * Psychological Dimension: identity and attachment
 * Priority: V1 - High Priority
 */

import type { UserListeningData, DetectionResult, Evidence } from '../types';

/**
 * Configuration for curator detection
 */
const CONFIG = {
  MIN_SAVED_RATIO: 0.6,      // 60%+ of top tracks must be saved
  HIGH_CURATION: 0.8,        // 80%+ = very high curation
  ANALYZE_TOP_N: 20,         // Check top 20 tracks
};

/**
 * Find how many top tracks are in saved library
 */
function analyzeCuration(data: UserListeningData): {
  savedInTop: number;
  totalAnalyzed: number;
  savedRatio: number;
  savedTrackIds: Set<string>;
} {
  // Build set of saved track IDs for fast lookup
  const savedTrackIds = new Set<string>();
  data.savedTracks?.forEach(track => {
    savedTrackIds.add(track.id);
  });

  // Count how many top tracks are saved
  const topTracks = data.topTracks.short.slice(0, CONFIG.ANALYZE_TOP_N);
  let savedInTop = 0;

  topTracks.forEach(track => {
    if (savedTrackIds.has(track.id)) {
      savedInTop++;
    }
  });

  return {
    savedInTop,
    totalAnalyzed: topTracks.length,
    savedRatio: savedInTop / topTracks.length,
    savedTrackIds,
  };
}

/**
 * Detect The Curator pattern
 *
 * Identifies users who actively save and organize their music. This indicates:
 * - Intentional curation rather than passive listening
 * - Music collection as part of identity
 * - Deliberate relationship with music library
 * - Higher engagement with music discovery
 *
 * @param data - User's complete listening data
 * @returns Detection result or null if pattern not found
 */
export async function detectTheCurator(
  data: UserListeningData
): Promise<DetectionResult | null> {
  console.log('[The Curator] Starting detection...');

  const { savedInTop, totalAnalyzed, savedRatio, savedTrackIds } = analyzeCuration(data);

  console.log(`[The Curator] ${savedInTop}/${totalAnalyzed} top tracks are saved (${(savedRatio * 100).toFixed(0)}%)`);
  console.log(`  Total saved tracks in library: ${savedTrackIds.size}`);

  // Check if ratio meets threshold
  if (savedRatio < CONFIG.MIN_SAVED_RATIO) {
    console.log(`[The Curator] Saved ratio ${(savedRatio * 100).toFixed(0)}% below threshold of ${CONFIG.MIN_SAVED_RATIO * 100}%`);
    return null;
  }

  // Calculate confidence based on saved ratio
  // 60% = 0.7, 80%+ = 0.9
  let confidence = Math.min(0.5 + (savedRatio * 0.5), 0.95);

  // Bonus for very high curation
  if (savedRatio >= CONFIG.HIGH_CURATION) {
    confidence = Math.min(confidence + 0.1, 1.0);
  }

  // Build evidence
  const evidence: Evidence[] = [
    {
      type: 'count',
      value: savedInTop,
      humanReadable: `${savedInTop} of your top ${totalAnalyzed} tracks are saved to your library`
    },
    {
      type: 'ratio',
      value: savedRatio,
      humanReadable: `${Math.round(savedRatio * 100)}% saved rate shows intentional curation`
    },
    {
      type: 'count',
      value: savedTrackIds.size,
      humanReadable: `${savedTrackIds.size} total saved tracks in your library`
    }
  ];

  // Add interpretation based on curation level
  if (savedRatio >= CONFIG.HIGH_CURATION) {
    evidence.push({
      type: 'count',
      value: 'high',
      humanReadable: `${Math.round(savedRatio * 100)}% saved rate indicates highly deliberate music curation - your library is curated, not accidental`
    });
  } else {
    evidence.push({
      type: 'count',
      value: 'moderate',
      humanReadable: `You actively curate your music library rather than just streaming passively`
    });
  }

  // Comment on library size if notable
  if (savedTrackIds.size >= 500) {
    evidence.push({
      type: 'count',
      value: savedTrackIds.size,
      humanReadable: `${savedTrackIds.size} saved tracks - you've built a substantial curated collection`
    });
  } else if (savedTrackIds.size < 100) {
    evidence.push({
      type: 'count',
      value: savedTrackIds.size,
      humanReadable: `Despite a smaller library, your high saved rate shows selective curation`
    });
  }

  return {
    patternId: 29,
    patternName: 'The Curator',
    confidence,
    evidence,
    psychologicalDimension: 'identity and attachment',
    category: 'identity',
    insightPotential: 0, // Will be calculated by runner
  };
}
