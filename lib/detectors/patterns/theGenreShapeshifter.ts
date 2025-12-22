/**
 * The Genre Shapeshifter Detector
 *
 * Detects when your dominant genre shifts across time ranges. Different genres
 * dominate in 4-week vs 6-month vs all-time, showing taste evolution, life phase
 * changes, or identity exploration.
 *
 * Example: Pop all-time → K-pop 6-month → Musical theatre current
 *
 * Pattern ID: 49
 * Category: variety
 * Psychological Dimension: identity transition
 * Priority: V1 - High Priority
 */

import type { UserListeningData, DetectionResult, Evidence } from '../types';

/**
 * Configuration for genre shapeshifter detection
 */
const CONFIG = {
  MIN_GENRE_SHIFT: 2,            // Need shifts across at least 2 time ranges
  MIN_DOMINANCE_THRESHOLD: 0.25, // Genre must represent 25%+ of top 10 artists
};

/**
 * Get dominant genre for a time range
 */
function getDominantGenre(artists: any[]): {
  genre: string;
  count: number;
  percentage: number;
} | null {
  const genreCounts = new Map<string, number>();

  // Count genre occurrences in top 10 artists
  artists.slice(0, 10).forEach(artist => {
    if (artist.genres && artist.genres.length > 0) {
      // Use primary genre (first in list)
      const primaryGenre = artist.genres[0];
      genreCounts.set(primaryGenre, (genreCounts.get(primaryGenre) || 0) + 1);
    }
  });

  if (genreCounts.size === 0) return null;

  // Find most common genre
  let maxCount = 0;
  let dominantGenre = '';

  genreCounts.forEach((count, genre) => {
    if (count > maxCount) {
      maxCount = count;
      dominantGenre = genre;
    }
  });

  const percentage = maxCount / 10;

  // Must meet dominance threshold
  if (percentage < CONFIG.MIN_DOMINANCE_THRESHOLD) return null;

  return {
    genre: dominantGenre,
    count: maxCount,
    percentage,
  };
}

/**
 * Analyze genre shifts across time ranges
 */
function analyzeGenreShifts(data: UserListeningData): {
  shortTermGenre: { genre: string; count: number; percentage: number } | null;
  mediumTermGenre: { genre: string; count: number; percentage: number } | null;
  longTermGenre: { genre: string; count: number; percentage: number } | null;
  shiftCount: number;
  trajectory: string[];
} {
  const shortTermGenre = getDominantGenre(data.topArtists.short);
  const mediumTermGenre = getDominantGenre(data.topArtists.medium);
  const longTermGenre = getDominantGenre(data.topArtists.long);

  // Count how many shifts occurred
  const genres = [
    longTermGenre?.genre,
    mediumTermGenre?.genre,
    shortTermGenre?.genre
  ].filter(g => g !== undefined);

  const uniqueGenres = new Set(genres);
  const shiftCount = uniqueGenres.size - 1; // Number of transitions

  const trajectory = [
    longTermGenre?.genre || 'unknown',
    mediumTermGenre?.genre || 'unknown',
    shortTermGenre?.genre || 'unknown'
  ];

  return {
    shortTermGenre,
    mediumTermGenre,
    longTermGenre,
    shiftCount,
    trajectory,
  };
}

/**
 * Detect The Genre Shapeshifter pattern
 *
 * Identifies genre shifts across time ranges. This indicates:
 * - Identity exploration and evolution
 * - Life phase transitions
 * - Mood or circumstance-driven taste changes
 * - Deliberate musical exploration
 *
 * When your dominant genre changes from year to year,
 * music is tracking your personal transformation.
 *
 * @param data - User's complete listening data
 * @returns Detection result or null if pattern not found
 */
export async function detectTheGenreShapeshifter(
  data: UserListeningData
): Promise<DetectionResult | null> {
  console.log('[Genre Shapeshifter] Starting detection...');

  const analysis = analyzeGenreShifts(data);

  console.log('[Genre Shapeshifter] Genre trajectory:', analysis.trajectory.join(' → '));
  console.log(`  Short-term: ${analysis.shortTermGenre?.genre || 'none'} (${analysis.shortTermGenre?.count || 0}/10)`);
  console.log(`  Medium-term: ${analysis.mediumTermGenre?.genre || 'none'} (${analysis.mediumTermGenre?.count || 0}/10)`);
  console.log(`  Long-term: ${analysis.longTermGenre?.genre || 'none'} (${analysis.longTermGenre?.count || 0}/10)`);

  if (analysis.shiftCount < CONFIG.MIN_GENRE_SHIFT) {
    console.log(`[Genre Shapeshifter] Only ${analysis.shiftCount} shifts, below threshold of ${CONFIG.MIN_GENRE_SHIFT}`);
    return null;
  }

  // Calculate confidence based on shift count and dominance strength
  // 2 shifts = 0.75, 2 shifts with strong dominance = 0.85
  let confidence = 0.65 + (analysis.shiftCount * 0.1);

  // Bonus for strong dominance (40%+ in each period)
  const avgDominance = [
    analysis.shortTermGenre?.percentage || 0,
    analysis.mediumTermGenre?.percentage || 0,
    analysis.longTermGenre?.percentage || 0
  ].reduce((sum, p) => sum + p, 0) / 3;

  if (avgDominance >= 0.4) {
    confidence = Math.min(confidence + 0.1, 0.95);
  }

  // Build evidence
  const evidence: Evidence[] = [];

  // Show trajectory
  const trajectoryStr = analysis.trajectory
    .map((g, i) => {
      if (g === 'unknown') return null;
      const labels = ['all-time', '6-month', 'current'];
      return `${g} (${labels[i]})`;
    })
    .filter(Boolean)
    .join(' → ');

  evidence.push({
    type: 'genre',
    value: analysis.trajectory,
    humanReadable: `Genre evolution: ${trajectoryStr}`
  });

  // Detail each period
  if (analysis.longTermGenre) {
    evidence.push({
      type: 'genre',
      value: 'long-term',
      humanReadable: `All-time: ${Math.round(analysis.longTermGenre.percentage * 100)}% ${analysis.longTermGenre.genre} (${analysis.longTermGenre.count}/10 artists)`
    });
  }

  if (analysis.mediumTermGenre) {
    evidence.push({
      type: 'genre',
      value: 'medium-term',
      humanReadable: `6-month: ${Math.round(analysis.mediumTermGenre.percentage * 100)}% ${analysis.mediumTermGenre.genre} (${analysis.mediumTermGenre.count}/10 artists)`
    });
  }

  if (analysis.shortTermGenre) {
    evidence.push({
      type: 'genre',
      value: 'short-term',
      humanReadable: `Current: ${Math.round(analysis.shortTermGenre.percentage * 100)}% ${analysis.shortTermGenre.genre} (${analysis.shortTermGenre.count}/10 artists)`
    });
  }

  // Interpret shift pattern
  if (analysis.shiftCount === 2) {
    // Complete transformation across all three ranges
    evidence.push({
      type: 'count',
      value: 'complete',
      humanReadable: `Complete genre transformation across all time periods - major identity shift`
    });
  } else if (analysis.shiftCount === 1) {
    // One shift between ranges
    const oldGenre = analysis.longTermGenre?.genre || analysis.mediumTermGenre?.genre;
    const newGenre = analysis.shortTermGenre?.genre || analysis.mediumTermGenre?.genre;

    if (oldGenre && newGenre && oldGenre !== newGenre) {
      evidence.push({
        type: 'count',
        value: 'transition',
        humanReadable: `Transitioning from ${oldGenre} to ${newGenre} - taste evolution in progress`
      });
    }
  }

  // Check for recent acceleration
  if (analysis.longTermGenre && analysis.mediumTermGenre &&
      analysis.longTermGenre.genre === analysis.mediumTermGenre.genre &&
      analysis.shortTermGenre &&
      analysis.shortTermGenre.genre !== analysis.mediumTermGenre.genre) {
    evidence.push({
      type: 'timestamp',
      value: 'recent',
      humanReadable: `Recent shift - ${analysis.shortTermGenre.genre} is a new development in last 4 weeks`
    });
  }

  // Overall interpretation
  if (avgDominance >= 0.4) {
    evidence.push({
      type: 'ratio',
      value: avgDominance,
      humanReadable: `Strong genre focus in each period (avg ${Math.round(avgDominance * 100)}%) - deliberate musical identity shifts`
    });
  } else {
    evidence.push({
      type: 'ratio',
      value: avgDominance,
      humanReadable: `Genre shifts reflect evolving taste and life circumstances`
    });
  }

  return {
    patternId: 49,
    patternName: 'The Genre Shapeshifter',
    confidence,
    evidence,
    psychologicalDimension: 'identity transition',
    category: 'variety',
    insightPotential: 0,
  };
}
