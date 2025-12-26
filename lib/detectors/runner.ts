/**
 * Pattern Detection Engine Runner
 * Executes all detectors in parallel and aggregates results
 */

import type { UserListeningData, DetectionResult, DetectorFunction } from './types';

/**
 * Configuration for the detection engine
 */
const CONFIG = {
  MIN_CONFIDENCE: 0.6,        // Minimum confidence to include result
  SPECIFICITY_WEIGHT: 0.8,    // Weight for evidence specificity in scoring
};

/**
 * Calculate insight potential score for a detection result
 *
 * Formula: confidence * (1 + specificity_bonus)
 * Specificity bonus based on evidence quality and quantity
 */
function calculateInsightPotential(result: DetectionResult): number {
  const baseScore = result.confidence;

  // More evidence = higher specificity
  const evidenceCount = result.evidence.length;
  const evidenceBonus = Math.min(evidenceCount * 0.1, 0.5);

  // Certain evidence types are more specific
  const specificTypes = ['track', 'timestamp', 'artist'];
  const specificEvidence = result.evidence.filter(e =>
    specificTypes.includes(e.type)
  ).length;
  const specificityBonus = (specificEvidence / evidenceCount) * CONFIG.SPECIFICITY_WEIGHT;

  return baseScore * (1 + evidenceBonus + specificityBonus);
}

/**
 * Run all pattern detectors on user data
 *
 * @param userData - User's complete listening data
 * @param detectors - Array of detector functions to run (optional, defaults to all)
 * @returns Sorted array of detected patterns
 */
export async function runAllDetectors(
  userData: UserListeningData,
  detectors?: DetectorFunction[]
): Promise<DetectionResult[]> {
  // Get detectors to run
  const detectorsToRun = detectors || getAllDetectors();

  if (detectorsToRun.length === 0) {
    console.warn('[Detection Runner] No detectors registered');
    return [];
  }

  console.log(`[Detection Runner] Running ${detectorsToRun.length} detectors...`);

  try {
    // Run all detectors in parallel
    const startTime = Date.now();
    const results = await Promise.all(
      detectorsToRun.map(detector => detector(userData))
    );
    const duration = Date.now() - startTime;

    // Filter out null results and low confidence patterns
    const validResults = results.filter(
      (result): result is DetectionResult =>
        result !== null && result.confidence >= CONFIG.MIN_CONFIDENCE
    );

    console.log(
      `[Detection Runner] Found ${validResults.length}/${detectorsToRun.length} patterns ` +
      `(${duration}ms)`
    );

    // Calculate insight potential for each result
    const scoredResults = validResults.map(result => ({
      ...result,
      insightPotential: calculateInsightPotential(result)
    }));

    // Sort by insight potential (descending)
    const sortedResults = scoredResults.sort(
      (a, b) => b.insightPotential - a.insightPotential
    );

    // Return all results (no limit - show all valid patterns)
    const topResults = sortedResults;

    if (topResults.length > 0) {
      console.log('[Detection Runner] Top patterns:',
        topResults.map(r => `${r.patternName} (${r.confidence.toFixed(2)})`).join(', ')
      );
    }

    return topResults;

  } catch (error) {
    console.error('[Detection Runner] Error running detectors:', error);
    throw new Error('Pattern detection failed');
  }
}

/**
 * Run detectors by category
 *
 * @param userData - User's listening data
 * @param category - Category to filter by
 * @returns Detected patterns in specified category
 */
export async function runDetectorsByCategory(
  userData: UserListeningData,
  category: DetectionResult['category']
): Promise<DetectionResult[]> {
  const allDetectors = getAllDetectors();

  // Filter would require metadata - for now run all and filter results
  const results = await runAllDetectors(userData, allDetectors);

  return results.filter(r => r.category === category);
}

/**
 * Get statistics about detection results
 */
export function getDetectionStats(results: DetectionResult[]) {
  const byCategory = results.reduce((acc, result) => {
    acc[result.category] = (acc[result.category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const byDimension = results.reduce((acc, result) => {
    acc[result.psychologicalDimension] = (acc[result.psychologicalDimension] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const avgConfidence = results.length > 0
    ? results.reduce((sum, r) => sum + r.confidence, 0) / results.length
    : 0;

  return {
    totalPatterns: results.length,
    byCategory,
    byDimension,
    avgConfidence,
    topPattern: results[0] || null
  };
}

/**
 * Registry of all available detectors
 * Detectors are imported and registered here as they're implemented
 */
function getAllDetectors(): DetectorFunction[] {
  // Import all detectors from patterns registry
  const {
    // DISABLED: Invalid temporal detectors (only 3.6 days of timestamp data - statistically unsound)
    // detectNightOwlProcessor,
    // detectEarlyBirdProcessor,
    // detectWeekendWarrior,
    // detectThe2amSong,
    // detectEmotionalBookender,
    // detectTheDayNightPersona,
    // detectTheMorningPerson,
    // Re-enable when: User imports Spotify privacy export with 12 months of timestamped data

    detectTheLooper,
    detectGhostArtist,
    detectPhaseShifter,
    detectTheLoyalist,
    detectTheExplorer,
    detectTheTrendy,
    detectTimeCapsule,
    detectComfortRotation,
    detectAlbumDevotee,
    detectGenrePurist,
    detectTheCurator,
    detectOneTrackWonder,
    detectBingeListener,
    detectSundayRitual,
    detectCopingSong,
    detectTheRediscovery,
    // detectTheGenreHopper, // DISABLED: Returns only genre counts, no artist/track names for viral synthesis
    detectTheMomentumBuilder,
    detectTheSkipProofTrack,
    detectTheTransitionRitual,
    detectTheFeaturedArtistHunter,
    detectTheFirstVerseAddict,
    detectThePerfectionist,
    detectTheLateBloomer,
    detectTheClimber,
    detectTheFader,
    detectTheConsistencyChampion,
    detectTheGenreShapeshifter,
    detectTheVaultTrackHunter,
    // detectTheWickedObsession, // REPLACED by The Franchise Fan (more general)
    detectTheSeasonalShifter,
    detectTheFranchiseFan,
    // Additional detectors will be imported as they're implemented
  } = require('./patterns');

  const detectors: DetectorFunction[] = [
    // DISABLED: Invalid temporal detectors (see import section above)
    // detectNightOwlProcessor,
    // detectEarlyBirdProcessor,
    // detectWeekendWarrior,
    // detectThe2amSong,
    // detectEmotionalBookender,
    // detectTheDayNightPersona,
    // detectTheMorningPerson,

    detectTheLooper,
    detectGhostArtist,
    detectPhaseShifter,
    detectTheLoyalist,
    detectTheExplorer,
    detectTheTrendy,
    detectTimeCapsule,
    detectComfortRotation,
    detectAlbumDevotee,
    detectGenrePurist,
    detectTheCurator,
    detectOneTrackWonder,
    detectBingeListener,
    detectSundayRitual,
    detectCopingSong,
    detectTheRediscovery,
    // detectTheGenreHopper, // DISABLED: Returns only genre counts, no artist/track names for viral synthesis
    detectTheMomentumBuilder,
    detectTheSkipProofTrack,
    detectTheTransitionRitual,
    detectTheFeaturedArtistHunter,
    detectTheFirstVerseAddict,
    detectThePerfectionist,
    detectTheLateBloomer,
    detectTheClimber,
    detectTheFader,
    detectTheConsistencyChampion,
    detectTheGenreShapeshifter,
    detectTheVaultTrackHunter,
    // detectTheWickedObsession, // REPLACED by The Franchise Fan (more general)
    detectTheSeasonalShifter,
    detectTheFranchiseFan,
    // Add new detectors here as they're built
  ];

  return detectors;
}

/**
 * Manually register detectors (useful for testing)
 */
export function registerDetectors(detectors: DetectorFunction[]): void {
  // This would update the internal registry
  // For now, pass detectors directly to runAllDetectors
  console.log(`[Detection Runner] Registered ${detectors.length} detectors`);
}
