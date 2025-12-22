/**
 * The First Verse Addict Detector
 *
 * Detects when tracks that are track #1, #2, or #3 on their albums appear
 * disproportionately in your listening compared to later tracks from the same
 * albums. This reveals:
 * - Impatience / short attention span
 * - Novelty-seeking behavior (front-loading excitement)
 * - Album drop-off patterns
 * - Playlist fatigue
 *
 * You start strong but rarely finish what you start.
 *
 * Pattern ID: 43
 * Category: repetition
 * Psychological Dimension: attention and persistence
 * Priority: V1 - Medium Priority
 */

import type { UserListeningData, DetectionResult, Evidence } from '../types';

/**
 * Configuration for first verse addict detection
 */
const CONFIG = {
  EARLY_TRACK_THRESHOLD: 3,      // First 3 tracks = "early"
  MIN_EARLY_RATIO: 0.6,          // 60%+ of plays from early tracks
  MIN_ALBUMS_WITH_PATTERN: 2,    // Need pattern across multiple albums
};

/**
 * Analyze track position patterns
 */
function analyzeTrackPositions(data: UserListeningData): {
  earlyTracks: any[];
  lateTracks: any[];
  earlyRatio: number;
  albumsWithEarlyBias: Map<string, {
    album: any;
    earlyPlayCount: number;
    latePlayCount: number;
  }>;
} {
  const earlyTracks: any[] = [];
  const lateTracks: any[] = [];

  const albumStats = new Map<string, {
    album: any;
    earlyPlayCount: number;
    latePlayCount: number;
  }>();

  // Analyze top 20 tracks
  data.topTracks.short.slice(0, 20).forEach(track => {
    const trackNumber = track.track_number || 0;
    const album = track.album;

    // Initialize album stats if needed
    if (!albumStats.has(album.id)) {
      albumStats.set(album.id, {
        album,
        earlyPlayCount: 0,
        latePlayCount: 0,
      });
    }

    const stats = albumStats.get(album.id)!;

    if (trackNumber <= CONFIG.EARLY_TRACK_THRESHOLD) {
      earlyTracks.push(track);
      stats.earlyPlayCount++;
    } else {
      lateTracks.push(track);
      stats.latePlayCount++;
    }
  });

  const totalTracksAnalyzed = earlyTracks.length + lateTracks.length;
  const earlyRatio = totalTracksAnalyzed > 0 ? earlyTracks.length / totalTracksAnalyzed : 0;

  // Find albums with clear early bias
  const albumsWithEarlyBias = new Map<string, {
    album: any;
    earlyPlayCount: number;
    latePlayCount: number;
  }>();

  albumStats.forEach((stats, albumId) => {
    const totalPlays = stats.earlyPlayCount + stats.latePlayCount;
    if (totalPlays >= 2 && stats.earlyPlayCount > stats.latePlayCount) {
      albumsWithEarlyBias.set(albumId, stats);
    }
  });

  return {
    earlyTracks,
    lateTracks,
    earlyRatio,
    albumsWithEarlyBias,
  };
}

/**
 * Detect The First Verse Addict pattern
 *
 * Identifies disproportionate listening to early album tracks. This indicates:
 * - Short attention span / impatience
 * - Novelty-seeking (front-loading excitement)
 * - Album drop-off behavior
 * - Decision fatigue (easier to hit play on track 1)
 *
 * When your favorites cluster at the beginning of albums, you're drawn to
 * fresh starts more than sustained engagement.
 *
 * @param data - User's complete listening data
 * @returns Detection result or null if pattern not found
 */
export async function detectTheFirstVerseAddict(
  data: UserListeningData
): Promise<DetectionResult | null> {
  console.log('[First Verse Addict] Starting detection...');

  const { earlyTracks, lateTracks, earlyRatio, albumsWithEarlyBias } =
    analyzeTrackPositions(data);

  console.log(`[First Verse Addict] ${earlyTracks.length} early tracks (≤3), ${lateTracks.length} late tracks (${(earlyRatio * 100).toFixed(0)}% early)`);
  console.log(`  ${albumsWithEarlyBias.size} albums show early-track bias`);

  if (earlyRatio < CONFIG.MIN_EARLY_RATIO ||
      albumsWithEarlyBias.size < CONFIG.MIN_ALBUMS_WITH_PATTERN) {
    console.log(`[First Verse Addict] Below threshold (need ${CONFIG.MIN_EARLY_RATIO * 100}% ratio and ${CONFIG.MIN_ALBUMS_WITH_PATTERN} albums)`);
    return null;
  }

  // Calculate confidence based on early ratio and album count
  // 60% = 0.7, 80%+ = 0.9
  let confidence = Math.min(0.5 + (earlyRatio * 0.5), 0.9);

  // Bonus for pattern across many albums
  if (albumsWithEarlyBias.size >= 4) {
    confidence = Math.min(confidence + 0.1, 1.0);
  }

  // Build evidence
  const evidence: Evidence[] = [
    {
      type: 'ratio',
      value: earlyRatio,
      humanReadable: `${Math.round(earlyRatio * 100)}% of your top tracks are from the first 3 tracks of their albums`
    },
    {
      type: 'count',
      value: earlyTracks.length,
      humanReadable: `${earlyTracks.length} early tracks vs ${lateTracks.length} late tracks in your top 20`
    },
    {
      type: 'count',
      value: albumsWithEarlyBias.size,
      humanReadable: `Pattern appears across ${albumsWithEarlyBias.size} different albums`
    }
  ];

  // Show sample early tracks with their positions
  const sampleEarlyTracks = earlyTracks.slice(0, 3).map(t =>
    `"${t.name}" (track #${t.track_number})`
  );

  if (sampleEarlyTracks.length > 0) {
    evidence.push({
      type: 'track',
      value: sampleEarlyTracks,
      humanReadable: `Examples: ${sampleEarlyTracks.join(', ')}`
    });
  }

  // Show albums with strongest early bias
  const sortedAlbums = Array.from(albumsWithEarlyBias.entries())
    .sort((a, b) => b[1].earlyPlayCount - a[1].earlyPlayCount)
    .slice(0, 2);

  if (sortedAlbums.length > 0) {
    const albumList = sortedAlbums.map(([_, stats]) =>
      `${stats.album.name} (${stats.earlyPlayCount} early, ${stats.latePlayCount} late)`
    );

    evidence.push({
      type: 'count',
      value: 'albums',
      humanReadable: `Strongest bias: ${albumList.join('; ')}`
    });
  }

  // Add interpretation based on ratio
  if (earlyRatio >= 0.8) {
    evidence.push({
      type: 'ratio',
      value: 'extreme',
      humanReadable: `${Math.round(earlyRatio * 100)}% early-track preference - you start albums strong but rarely finish`
    });
  } else {
    evidence.push({
      type: 'ratio',
      value: 'high',
      humanReadable: `Clear front-loading pattern - drawn to fresh starts and opening energy`
    });
  }

  // Check if this contradicts Album Devotee
  const albumDevoteeExists = albumsWithEarlyBias.size >= 1 &&
    Array.from(albumsWithEarlyBias.values()).some(stats =>
      (stats.earlyPlayCount + stats.latePlayCount) >= 4
    );

  if (albumDevoteeExists) {
    evidence.push({
      type: 'count',
      value: 'contrast',
      humanReadable: `You love certain albums deeply, but even then you favor the opening tracks`
    });
  } else {
    evidence.push({
      type: 'count',
      value: 'interpretation',
      humanReadable: `This suggests novelty-seeking behavior and shorter attention span for musical narratives`
    });
  }

  return {
    patternId: 43,
    patternName: 'The First Verse Addict',
    confidence,
    evidence,
    psychologicalDimension: 'attention and persistence',
    category: 'repetition',
    insightPotential: 0, // Will be calculated by runner
  };
}
