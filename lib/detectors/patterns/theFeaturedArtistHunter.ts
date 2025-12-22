/**
 * The Featured Artist Hunter Detector
 *
 * Detects when you disproportionately listen to tracks with featured artists
 * (ft., with, &, etc.). This reveals attraction to collaboration, variety within
 * familiarity, or chasing specific featured artist appearances across different
 * primary artists' work.
 *
 * You're not just following main artists - you're tracking collaborators.
 *
 * Pattern ID: 42
 * Category: variety
 * Psychological Dimension: discovery and exploration
 * Priority: V1 - Low Priority
 */

import type { UserListeningData, DetectionResult, Evidence } from '../types';

/**
 * Configuration for featured artist hunter detection
 */
const CONFIG = {
  MIN_FEATURED_RATIO: 0.4,       // 40%+ of top tracks have features
  MIN_FEATURED_COUNT: 8,          // Need at least 8 featured tracks
};

/**
 * Check if track has featured artists
 */
function hasFeaturedArtist(track: any): boolean {
  // Check track name for common feature indicators
  const trackName = track.name.toLowerCase();
  const hasFeatureInName = /\(feat\.|ft\.|featuring|with\)/.test(trackName);

  // Check if multiple artists (strong indicator of features)
  const multipleArtists = track.artists && track.artists.length > 1;

  return hasFeatureInName || multipleArtists;
}

/**
 * Analyze featured artist presence
 */
function analyzeFeaturedArtists(data: UserListeningData): {
  featuredTracks: any[];
  totalTracks: number;
  featuredRatio: number;
  topFeaturedArtists: Map<string, number>;
} {
  const top20Tracks = data.topTracks.short.slice(0, 20);
  const featuredTracks: any[] = [];
  const featuredArtistCounts = new Map<string, number>();

  top20Tracks.forEach(track => {
    if (hasFeaturedArtist(track)) {
      featuredTracks.push(track);

      // Count featured artists (artists beyond the primary)
      if (track.artists.length > 1) {
        track.artists.slice(1).forEach((artist: any) => {
          const count = featuredArtistCounts.get(artist.name) || 0;
          featuredArtistCounts.set(artist.name, count + 1);
        });
      }
    }
  });

  const featuredRatio = featuredTracks.length / top20Tracks.length;

  return {
    featuredTracks,
    totalTracks: top20Tracks.length,
    featuredRatio,
    topFeaturedArtists: featuredArtistCounts,
  };
}

/**
 * Detect The Featured Artist Hunter pattern
 *
 * Identifies disproportionate listening to collaborative tracks. This indicates:
 * - Attraction to variety within structure
 * - Following specific featured artists across contexts
 * - Appreciation for creative collaboration
 * - Seeking novelty through combinations
 *
 * When your top tracks are heavy on features, you're not just following
 * main artists - you're drawn to the chemistry of collaboration.
 *
 * @param data - User's complete listening data
 * @returns Detection result or null if pattern not found
 */
export async function detectTheFeaturedArtistHunter(
  data: UserListeningData
): Promise<DetectionResult | null> {
  console.log('[Featured Artist Hunter] Starting detection...');

  const { featuredTracks, totalTracks, featuredRatio, topFeaturedArtists } =
    analyzeFeaturedArtists(data);

  console.log(`[Featured Artist Hunter] ${featuredTracks.length}/${totalTracks} top tracks have featured artists (${(featuredRatio * 100).toFixed(0)}%)`);

  if (featuredTracks.length < CONFIG.MIN_FEATURED_COUNT ||
      featuredRatio < CONFIG.MIN_FEATURED_RATIO) {
    console.log(`[Featured Artist Hunter] Below threshold (need ${CONFIG.MIN_FEATURED_COUNT} tracks and ${CONFIG.MIN_FEATURED_RATIO * 100}% ratio)`);
    return null;
  }

  // Calculate confidence based on featured ratio
  // 40% = 0.7, 60%+ = 0.9
  let confidence = Math.min(0.5 + (featuredRatio * 0.7), 0.95);

  // Bonus for high absolute count
  if (featuredTracks.length >= 12) {
    confidence = Math.min(confidence + 0.05, 1.0);
  }

  // Build evidence
  const evidence: Evidence[] = [
    {
      type: 'ratio',
      value: featuredRatio,
      humanReadable: `${Math.round(featuredRatio * 100)}% of your top 20 tracks have featured artists`
    },
    {
      type: 'count',
      value: featuredTracks.length,
      humanReadable: `${featuredTracks.length} out of ${totalTracks} tracks are collaborations`
    }
  ];

  // Show sample featured tracks
  const sampleTracks = featuredTracks.slice(0, 3).map(t => {
    if (t.artists.length > 1) {
      return `"${t.name}" - ${t.artists.map((a: any) => a.name).join(' & ')}`;
    }
    return `"${t.name}"`;
  });

  if (sampleTracks.length > 0) {
    evidence.push({
      type: 'track',
      value: sampleTracks,
      humanReadable: `Examples: ${sampleTracks.join('; ')}`
    });
  }

  // Show recurring featured artists if any
  const recurringFeatured = Array.from(topFeaturedArtists.entries())
    .filter(([_, count]) => count >= 2)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);

  if (recurringFeatured.length > 0) {
    const featuredList = recurringFeatured.map(([name, count]) => `${name} (${count}x)`);
    evidence.push({
      type: 'artist',
      value: recurringFeatured.map(([name]) => name),
      humanReadable: `Recurring featured artists: ${featuredList.join(', ')}`
    });

    evidence.push({
      type: 'count',
      value: 'tracking',
      humanReadable: `You're actively tracking specific featured artists across different primary artists' work`
    });
  }

  // Add interpretation based on ratio
  if (featuredRatio >= 0.6) {
    evidence.push({
      type: 'ratio',
      value: 'extreme',
      humanReadable: `${Math.round(featuredRatio * 100)}% is unusually high - you're specifically drawn to collaborative chemistry`
    });
  } else {
    evidence.push({
      type: 'ratio',
      value: 'high',
      humanReadable: `You seek variety through collaboration rather than completely different artists`
    });
  }

  // Contrast with The Loyalist if applicable
  const topArtistDominance = data.topTracks.short.slice(0, 10)
    .filter(t => t.artists[0].id === data.topArtists.short[0]?.id)
    .length;

  if (topArtistDominance <= 3) {
    evidence.push({
      type: 'count',
      value: 'contrast',
      humanReadable: `Your top artist isn't dominant - you prefer seeing artists in different collaborative contexts`
    });
  }

  return {
    patternId: 42,
    patternName: 'The Featured Artist Hunter',
    confidence,
    evidence,
    psychologicalDimension: 'discovery and exploration',
    category: 'variety',
    insightPotential: 0, // Will be calculated by runner
  };
}
