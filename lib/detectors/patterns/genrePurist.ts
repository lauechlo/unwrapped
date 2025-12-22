/**
 * Genre Purist Detector
 *
 * Detects focused genre preferences where listening is dominated by a small
 * set of related genres. The opposite of The Explorer - indicates strong
 * musical identity and preference for familiar sonic territories.
 *
 * Pattern ID: 28
 * Category: identity
 * Psychological Dimension: identity and attachment
 * Priority: V1 - High Priority
 */

import type { UserListeningData, DetectionResult, Evidence } from '../types';

/**
 * Configuration for genre purist detection
 */
const CONFIG = {
  MAX_UNIQUE_GENRES: 8,      // 8 or fewer genres = focused
  HIGH_FOCUS: 5,             // 5 or fewer = very high focus
  MIN_TOP_GENRE_RATIO: 0.4,  // Top 3 genres must account for 40%+ of all genre occurrences
  ANALYZE_TOP_N: 20,         // Analyze top 20 artists
};

/**
 * Extract genres from artists
 */
function extractGenres(data: UserListeningData): {
  uniqueGenres: Set<string>;
  genreCounts: Map<string, number>;
  artistsWithGenres: number;
} {
  const uniqueGenres = new Set<string>();
  const genreCounts = new Map<string, number>();
  let artistsWithGenres = 0;

  // Analyze short-term top artists for current focus
  const topArtists = data.topArtists.short.slice(0, CONFIG.ANALYZE_TOP_N);
  const seenArtists = new Set<string>();

  topArtists.forEach(artist => {
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
 * Detect Genre Purist pattern
 *
 * Identifies users with focused genre preferences. This indicates:
 * - Strong musical identity tied to specific genres
 * - Preference for familiar sonic territories
 * - Less openness to musical exploration
 * - Deep knowledge within specific genres
 *
 * @param data - User's complete listening data
 * @returns Detection result or null if pattern not found
 */
export async function detectGenrePurist(
  data: UserListeningData
): Promise<DetectionResult | null> {
  console.log('[Genre Purist] Starting detection...');

  const { uniqueGenres, genreCounts, artistsWithGenres } = extractGenres(data);
  const genreCount = uniqueGenres.size;

  console.log(`[Genre Purist] Found ${genreCount} unique genres from ${artistsWithGenres} artists`);

  // Check if user has genre data
  if (artistsWithGenres === 0) {
    console.log('[Genre Purist] No genre data available from artists');
    return null;
  }

  // Need focused genre set
  if (genreCount > CONFIG.MAX_UNIQUE_GENRES) {
    console.log(`[Genre Purist] ${genreCount} genres - above threshold of ${CONFIG.MAX_UNIQUE_GENRES}`);
    return null;
  }

  // Check if genres are dominated by top few
  const topGenres = Array.from(genreCounts.entries())
    .sort((a, b) => b[1] - a[1]);

  const topGenreCount = topGenres.slice(0, 3).reduce((sum, [, count]) => sum + count, 0);
  const totalGenreOccurrences = Array.from(genreCounts.values()).reduce((sum, count) => sum + count, 0);
  const dominanceRatio = topGenreCount / totalGenreOccurrences;

  console.log(`  Top 3 genres account for ${(dominanceRatio * 100).toFixed(0)}% of listening`);

  // Need strong dominance by top genres
  if (dominanceRatio < CONFIG.MIN_TOP_GENRE_RATIO) {
    console.log(`[Genre Purist] Dominance ratio ${(dominanceRatio * 100).toFixed(0)}% below threshold`);
    return null;
  }

  // Calculate confidence based on focus level
  // 8 genres = 0.7, 5 or fewer = 0.9
  let confidence = Math.min(0.95 - (genreCount * 0.05), 0.95);

  // Bonus for very high dominance ratio
  if (dominanceRatio >= 0.6) {
    confidence = Math.min(confidence + 0.1, 1.0);
  }

  // Build evidence
  const evidence: Evidence[] = [
    {
      type: 'count',
      value: genreCount,
      humanReadable: `Only ${genreCount} genres in your top artists - focused musical identity`
    }
  ];

  // Show dominant genres
  const dominantGenreNames = topGenres.slice(0, 3).map(([genre]) => genre);
  evidence.push({
    type: 'genre',
    value: dominantGenreNames,
    humanReadable: `Dominated by: ${dominantGenreNames.join(', ')}`
  });

  // Show dominance ratio
  evidence.push({
    type: 'ratio',
    value: dominanceRatio,
    humanReadable: `${Math.round(dominanceRatio * 100)}% of your listening centers on these ${Math.min(3, topGenres.length)} genres`
  });

  // Add interpretation based on focus level
  if (genreCount <= CONFIG.HIGH_FOCUS) {
    evidence.push({
      type: 'count',
      value: 'high',
      humanReadable: `${genreCount} genres shows exceptionally focused taste - you know what you like`
    });
  } else {
    evidence.push({
      type: 'count',
      value: 'moderate',
      humanReadable: `Focused genre preference suggests strong musical identity`
    });
  }

  return {
    patternId: 28,
    patternName: 'Genre Purist',
    confidence,
    evidence,
    psychologicalDimension: 'identity and attachment',
    category: 'identity',
    insightPotential: 0, // Will be calculated by runner
  };
}
