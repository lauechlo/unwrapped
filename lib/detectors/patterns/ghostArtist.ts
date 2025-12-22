/**
 * Ghost Artist Detector
 *
 * Detects users who are dominated by a single artist in their listening.
 * One artist accounts for 40%+ of top tracks, indicating deep attachment,
 * identity formation around artist, or phase obsession.
 *
 * Pattern ID: 20
 * Category: identity
 * Psychological Dimension: identity and attachment
 * Priority: V1 - High Priority
 */

import type { UserListeningData, DetectionResult, Evidence } from '../types';

/**
 * Configuration for ghost artist detection
 */
const CONFIG = {
  MIN_ARTIST_RATIO: 0.4,     // Minimum 40% of top tracks from one artist
  HIGH_RATIO: 0.6,           // 60%+ is considered extreme dominance
  MIN_TRACKS_COUNT: 3,       // Need at least 3 tracks from artist
  PERSISTENCE_BONUS: 0.15,   // Confidence bonus for appearing across time ranges
};

/**
 * Count tracks per artist in a track list
 */
function countTracksByArtist(tracks: any[]): Map<string, { artist: any; trackCount: number; tracks: any[] }> {
  const artistCounts = new Map<string, { artist: any; trackCount: number; tracks: any[] }>();

  tracks.forEach(track => {
    // Use primary artist (first in array)
    const artist = track.artists[0];
    const existing = artistCounts.get(artist.id);

    if (existing) {
      existing.trackCount++;
      existing.tracks.push(track);
    } else {
      artistCounts.set(artist.id, {
        artist,
        trackCount: 1,
        tracks: [track]
      });
    }
  });

  return artistCounts;
}

/**
 * Find dominant artist across time ranges
 */
function findDominantArtist(data: UserListeningData): {
  artist: any;
  shortTermRatio: number;
  shortTermTracks: any[];
  mediumTermCount: number;
  longTermCount: number;
} | null {
  // Analyze short-term (4 weeks) for primary detection
  const shortTermCounts = countTracksByArtist(data.topTracks.short);

  // Find artist with most tracks
  let dominantArtistId: string | null = null;
  let maxCount = 0;

  shortTermCounts.forEach((data, artistId) => {
    if (data.trackCount > maxCount) {
      maxCount = data.trackCount;
      dominantArtistId = artistId;
    }
  });

  if (!dominantArtistId) return null;

  const dominantData = shortTermCounts.get(dominantArtistId)!;
  const shortTermRatio = dominantData.trackCount / data.topTracks.short.length;

  // Check if meets threshold
  if (shortTermRatio < CONFIG.MIN_ARTIST_RATIO || dominantData.trackCount < CONFIG.MIN_TRACKS_COUNT) {
    return null;
  }

  // Check persistence in medium and long-term
  const mediumTermCounts = countTracksByArtist(data.topTracks.medium);
  const longTermCounts = countTracksByArtist(data.topTracks.long);

  const mediumTermCount = mediumTermCounts.get(dominantArtistId)?.trackCount || 0;
  const longTermCount = longTermCounts.get(dominantArtistId)?.trackCount || 0;

  return {
    artist: dominantData.artist,
    shortTermRatio,
    shortTermTracks: dominantData.tracks,
    mediumTermCount,
    longTermCount,
  };
}

/**
 * Detect Ghost Artist pattern
 *
 * Identifies users whose listening is dominated by a single artist.
 * High artist concentration indicates identity attachment, obsessive phase,
 * or using one artist's music as primary emotional regulation tool.
 *
 * @param data - User's complete listening data
 * @returns Detection result or null if pattern not found
 */
export async function detectGhostArtist(
  data: UserListeningData
): Promise<DetectionResult | null> {
  // Find dominant artist
  const result = findDominantArtist(data);

  if (!result) {
    return null;
  }

  // Calculate confidence
  // 40% = 0.7, 50% = 0.8, 60%+ = 0.9 base
  let confidence = Math.min(0.5 + (result.shortTermRatio * 0.8), 0.95);

  // Add persistence bonus
  if (result.mediumTermCount >= 3) {
    confidence = Math.min(confidence + CONFIG.PERSISTENCE_BONUS, 1.0);
  }
  if (result.longTermCount >= 3) {
    confidence = Math.min(confidence + CONFIG.PERSISTENCE_BONUS, 1.0);
  }

  // Build evidence
  const evidence: Evidence[] = [
    {
      type: 'artist',
      value: result.artist,
      humanReadable: `${result.artist.name}`
    },
    {
      type: 'ratio',
      value: result.shortTermRatio,
      humanReadable: `${Math.round(result.shortTermRatio * 100)}% of your top tracks (last 4 weeks) are by this artist`
    },
    {
      type: 'count',
      value: result.shortTermTracks.length,
      humanReadable: `${result.shortTermTracks.length} tracks by ${result.artist.name} in your top 50`
    }
  ];

  // Show which tracks
  const topTracks = result.shortTermTracks.slice(0, 3).map(t => t.name);
  if (topTracks.length > 0) {
    evidence.push({
      type: 'track',
      value: topTracks,
      humanReadable: `Top tracks: "${topTracks.join('", "')}"`
    });
  }

  // Add persistence evidence
  if (result.mediumTermCount >= 3) {
    evidence.push({
      type: 'timestamp',
      value: result.mediumTermCount,
      humanReadable: `${result.mediumTermCount} tracks also in your top 50 (last 6 months) - sustained obsession`
    });
  }

  if (result.longTermCount >= 3) {
    evidence.push({
      type: 'timestamp',
      value: result.longTermCount,
      humanReadable: `${result.longTermCount} tracks also in your all-time top 50 - long-term attachment`
    });
  }

  // Add interpretation based on ratio
  let interpretation = '';
  if (result.shortTermRatio >= CONFIG.HIGH_RATIO) {
    interpretation = 'Extreme artist dominance suggests identity formation or deep emotional resonance';
  } else {
    interpretation = 'Strong preference indicates consistent emotional regulation through this artist';
  }

  return {
    patternId: 20,
    patternName: 'Ghost Artist',
    confidence,
    evidence,
    psychologicalDimension: 'identity and attachment',
    category: 'identity',
    insightPotential: 0, // Will be calculated by runner
  };
}
