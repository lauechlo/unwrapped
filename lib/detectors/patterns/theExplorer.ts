/**
 * The Explorer Detector
 *
 * Detects genre diversity in listening habits. Identifies users who listen
 * to a wide variety of genres vs those who stay within specific musical
 * territories. Indicates openness to experience and musical curiosity.
 *
 * Pattern ID: 23
 * Category: identity
 * Psychological Dimension: identity and attachment
 * Priority: V1 - High Priority
 */

import type { UserListeningData, DetectionResult, Evidence } from '../types';

/**
 * Configuration for explorer detection
 */
const CONFIG = {
  MIN_UNIQUE_GENRES: 7,      // 7+ unique genres = diverse
  HIGH_DIVERSITY: 10,        // 10+ genres = very high diversity
  ANALYZE_TOP_N: 20,         // Analyze top 20 artists for genre spread
};

/**
 * Extract genres from artists
 * Note: Spotify provides genres at artist level, not track level
 */
function extractGenres(data: UserListeningData): {
  uniqueGenres: Set<string>;
  genreCounts: Map<string, number>;
  artistsWithGenres: number;
} {
  const uniqueGenres = new Set<string>();
  const genreCounts = new Map<string, number>();
  let artistsWithGenres = 0;

  // Combine artists from all time ranges for comprehensive view
  const allArtists = [
    ...data.topArtists.short.slice(0, CONFIG.ANALYZE_TOP_N),
    ...data.topArtists.medium.slice(0, CONFIG.ANALYZE_TOP_N),
    ...data.topArtists.long.slice(0, CONFIG.ANALYZE_TOP_N),
  ];

  // Use Set to avoid double-counting same artist
  const seenArtists = new Set<string>();

  allArtists.forEach(artist => {
    if (seenArtists.has(artist.id)) return;
    seenArtists.add(artist.id);

    if (artist.genres && artist.genres.length > 0) {
      artistsWithGenres++;
      artist.genres.forEach((genre: string) => {
        uniqueGenres.add(genre);
        genreCounts.set(genre, (genreCounts.get(genre) || 0) + 1);
      });
    }
  });

  return { uniqueGenres, genreCounts, artistsWithGenres };
}

/**
 * Detect The Explorer pattern
 *
 * Identifies users with diverse genre preferences. This indicates:
 * - High openness to musical experience
 * - Curiosity and exploration behavior
 * - Flexible identity not tied to single genre
 * - Broad emotional regulation strategies
 *
 * @param data - User's complete listening data
 * @returns Detection result or null if pattern not found
 */
export async function detectTheExplorer(
  data: UserListeningData
): Promise<DetectionResult | null> {
  console.log('[The Explorer] Starting detection...');

  const { uniqueGenres, genreCounts, artistsWithGenres } = extractGenres(data);
  const genreCount = uniqueGenres.size;

  console.log(`[The Explorer] Found ${genreCount} unique genres from ${artistsWithGenres} artists`);
  if (genreCount > 0) {
    // Show top 5 most common genres
    const topGenres = Array.from(genreCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
    console.log('  Top genres:', topGenres.map(([genre, count]) => `${genre} (${count})`).join(', '));
  }

  // Check if user has genre data
  if (artistsWithGenres === 0) {
    console.log('[The Explorer] No genre data available from artists');
    return null;
  }

  // Need sufficient diversity
  if (genreCount < CONFIG.MIN_UNIQUE_GENRES) {
    console.log(`[The Explorer] Only ${genreCount} genres - below threshold of ${CONFIG.MIN_UNIQUE_GENRES}`);
    return null;
  }

  // Calculate confidence based on genre diversity
  // 7 genres = 0.7, 10+ = 0.9
  let confidence = Math.min(0.5 + (genreCount * 0.04), 0.95);

  // Bonus for very high diversity
  if (genreCount >= CONFIG.HIGH_DIVERSITY) {
    confidence = Math.min(confidence + 0.1, 1.0);
  }

  // Check if diversity is spread evenly or dominated by few genres
  const topGenres = Array.from(genreCounts.entries())
    .sort((a, b) => b[1] - a[1]);

  const topGenreCount = topGenres.slice(0, 3).reduce((sum, [, count]) => sum + count, 0);
  const totalGenreOccurrences = Array.from(genreCounts.values()).reduce((sum, count) => sum + count, 0);
  const dominanceRatio = topGenreCount / totalGenreOccurrences;

  // Build evidence
  const evidence: Evidence[] = [
    {
      type: 'count',
      value: genreCount,
      humanReadable: `${genreCount} unique genres in your music library`
    }
  ];

  // Show top genres
  const topGenreNames = topGenres.slice(0, 5).map(([genre]) => genre);
  evidence.push({
    type: 'genre',
    value: topGenreNames,
    humanReadable: `Most common: ${topGenreNames.slice(0, 3).join(', ')}`
  });

  // Add interpretation based on diversity level
  if (genreCount >= CONFIG.HIGH_DIVERSITY) {
    evidence.push({
      type: 'count',
      value: 'high',
      humanReadable: `${genreCount} genres shows exceptional musical curiosity and openness`
    });
  } else {
    evidence.push({
      type: 'count',
      value: 'moderate',
      humanReadable: `Genre diversity suggests you explore beyond a single musical identity`
    });
  }

  // Comment on diversity spread
  if (dominanceRatio < 0.4) {
    // Genres are well-distributed
    evidence.push({
      type: 'genre',
      value: 'balanced',
      humanReadable: `Your genre distribution is balanced - true eclecticism`
    });
    confidence = Math.min(confidence + 0.05, 1.0);
  } else if (dominanceRatio > 0.7) {
    // Heavily dominated by top genres
    evidence.push({
      type: 'genre',
      value: 'focused',
      humanReadable: `While diverse, your listening centers on a few core genres`
    });
    confidence = Math.max(confidence - 0.1, 0.6);
  }

  return {
    patternId: 23,
    patternName: 'The Explorer',
    confidence,
    evidence,
    psychologicalDimension: 'identity and attachment',
    category: 'identity',
    insightPotential: 0, // Will be calculated by runner
  };
}
