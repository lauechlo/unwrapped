/**
 * Album Devotee Detector
 *
 * Detects when multiple tracks from the same album appear in your top favorites.
 * Indicates album-oriented listening rather than single-track consumption,
 * suggesting deeper engagement with artists' complete works.
 *
 * Pattern ID: 27
 * Category: identity
 * Psychological Dimension: identity and attachment
 * Priority: V1 - High Priority
 */

import type { UserListeningData, DetectionResult, Evidence } from '../types';

/**
 * Configuration for album devotee detection
 */
const CONFIG = {
  MIN_TRACKS_FROM_ALBUM: 3,  // 3+ tracks from one album
  ANALYZE_TOP_N: 20,         // Check top 20 tracks
  HIGH_DEVOTION: 5,          // 5+ tracks = very high album devotion
};

/**
 * Find albums with multiple tracks in top favorites
 */
function findDominantAlbums(data: UserListeningData): Array<{
  album: any;
  tracks: any[];
  trackCount: number;
}> {
  const albumCounts = new Map<string, { album: any; tracks: any[] }>();

  // Count tracks per album in short-term top tracks
  data.topTracks.short.slice(0, CONFIG.ANALYZE_TOP_N).forEach(track => {
    const album = track.album;
    const existing = albumCounts.get(album.id);

    if (existing) {
      existing.tracks.push(track);
    } else {
      albumCounts.set(album.id, {
        album,
        tracks: [track],
      });
    }
  });

  // Find albums with enough tracks
  const dominantAlbums: Array<{
    album: any;
    tracks: any[];
    trackCount: number;
  }> = [];

  albumCounts.forEach((albumData, albumId) => {
    if (albumData.tracks.length >= CONFIG.MIN_TRACKS_FROM_ALBUM) {
      dominantAlbums.push({
        album: albumData.album,
        tracks: albumData.tracks,
        trackCount: albumData.tracks.length,
      });
    }
  });

  // Sort by track count (most tracks first)
  return dominantAlbums.sort((a, b) => b.trackCount - a.trackCount);
}

/**
 * Detect Album Devotee pattern
 *
 * Identifies users who listen to multiple tracks from the same album.
 * This indicates:
 * - Album-oriented rather than playlist-oriented listening
 * - Deeper engagement with artists' creative vision
 * - Appreciation for cohesive musical narratives
 * - Less fragmented listening behavior
 *
 * @param data - User's complete listening data
 * @returns Detection result or null if pattern not found
 */
export async function detectAlbumDevotee(
  data: UserListeningData
): Promise<DetectionResult | null> {
  console.log('[Album Devotee] Starting detection...');
  const dominantAlbums = findDominantAlbums(data);

  console.log(`[Album Devotee] Found ${dominantAlbums.length} albums with ${CONFIG.MIN_TRACKS_FROM_ALBUM}+ tracks`);
  if (dominantAlbums.length > 0) {
    dominantAlbums.forEach((album, i) => {
      console.log(`  ${i + 1}. "${album.album.name}": ${album.trackCount} tracks`);
    });
  }

  if (dominantAlbums.length === 0) {
    console.log('[Album Devotee] No dominant albums detected');
    return null;
  }

  // Use the most dominant album
  const primary = dominantAlbums[0];

  // Calculate confidence based on track count
  // 3 tracks = 0.7, 5+ tracks = 0.9
  let confidence = Math.min(0.5 + (primary.trackCount * 0.1), 0.95);

  // Bonus if multiple albums show this pattern
  if (dominantAlbums.length >= 2) {
    confidence = Math.min(confidence + 0.1, 1.0);
  }

  // Build evidence
  const evidence: Evidence[] = [
    {
      type: 'count',
      value: primary.trackCount,
      humanReadable: `${primary.trackCount} tracks from "${primary.album.name}" in your top ${CONFIG.ANALYZE_TOP_N}`
    }
  ];

  // Show which tracks
  const trackNames = primary.tracks.slice(0, 4).map(t => t.name);
  evidence.push({
    type: 'track',
    value: trackNames,
    humanReadable: `Tracks: "${trackNames.join('", "')}"`
  });

  // Add artist context
  if (primary.album.artists && primary.album.artists.length > 0) {
    evidence.push({
      type: 'artist',
      value: primary.album.artists[0],
      humanReadable: `by ${primary.album.artists[0].name}`
    });
  }

  // Add interpretation based on devotion level
  if (primary.trackCount >= CONFIG.HIGH_DEVOTION) {
    evidence.push({
      type: 'count',
      value: 'high',
      humanReadable: `${primary.trackCount} tracks from one album shows deep engagement with complete works`
    });
  } else {
    evidence.push({
      type: 'count',
      value: 'moderate',
      humanReadable: `Album-oriented listening suggests appreciation for cohesive musical narratives`
    });
  }

  // If multiple albums detected
  if (dominantAlbums.length >= 2) {
    const secondAlbum = dominantAlbums[1];
    evidence.push({
      type: 'count',
      value: dominantAlbums.length,
      humanReadable: `${dominantAlbums.length} albums with multiple tracks - consistent album-listening behavior`
    });
  }

  return {
    patternId: 27,
    patternName: 'Album Devotee',
    confidence,
    evidence,
    psychologicalDimension: 'identity and attachment',
    category: 'identity',
    insightPotential: 0, // Will be calculated by runner
  };
}
