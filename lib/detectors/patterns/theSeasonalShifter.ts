/**
 * The Seasonal Shifter Detector
 *
 * Detects when an artist surges into your current top 10 with 3+ tracks,
 * but wasn't in your medium or long-term favorites. This captures cultural
 * moment engagement: movie soundtracks, album releases, viral moments, etc.
 *
 * Unlike Phase Shifter (which detects artists present but surging), this
 * detects NEW artists that appeared suddenly.
 *
 * Pattern ID: 58
 * Category: temporal
 * Psychological Dimension: identity and cultural moment
 * Priority: V1 - High Priority
 */

import type { UserListeningData, DetectionResult, Evidence } from '../types';

/**
 * Configuration for seasonal shifter detection
 */
const CONFIG = {
  MIN_TRACKS_IN_TOP_10: 3,    // Need 3+ tracks from artist in current top 10
  ANALYZE_TOP_N: 10,          // Check top 10 tracks
};

/**
 * Find artists with sudden surge
 */
function findSeasonalShifts(data: UserListeningData): Array<{
  artist: any;
  tracks: any[];
  trackCount: number;
  inMediumTerm: boolean;
  inLongTerm: boolean;
}> {
  const artistTracksMap = new Map<string, { artist: any; tracks: any[] }>();

  // Count tracks per artist in top 10
  data.topTracks.short.slice(0, CONFIG.ANALYZE_TOP_N).forEach(track => {
    const artist = track.artists[0]; // Primary artist
    const existing = artistTracksMap.get(artist.id);

    if (existing) {
      existing.tracks.push(track);
    } else {
      artistTracksMap.set(artist.id, {
        artist,
        tracks: [track],
      });
    }
  });

  // Find artists with enough tracks for a "shift"
  const shifts: Array<{
    artist: any;
    tracks: any[];
    trackCount: number;
    inMediumTerm: boolean;
    inLongTerm: boolean;
  }> = [];

  artistTracksMap.forEach((artistData) => {
    if (artistData.tracks.length >= CONFIG.MIN_TRACKS_IN_TOP_10) {
      const artist = artistData.artist;

      // Check if artist was in medium or long-term
      const inMediumTerm = data.topArtists.medium.some(a => a.id === artist.id);
      const inLongTerm = data.topArtists.long.some(a => a.id === artist.id);

      // Only count as "seasonal shift" if it's NEW (not in medium or long)
      if (!inMediumTerm && !inLongTerm) {
        shifts.push({
          artist,
          tracks: artistData.tracks,
          trackCount: artistData.tracks.length,
          inMediumTerm,
          inLongTerm,
        });
      }
    }
  });

  // Sort by track count (most tracks first)
  return shifts.sort((a, b) => b.trackCount - a.trackCount);
}

/**
 * Detect The Seasonal Shifter pattern
 *
 * Identifies sudden artist obsessions triggered by cultural moments.
 * This indicates:
 * - Responsive to cultural events (movies, releases, viral moments)
 * - Immersive listening when something captures attention
 * - Temporary but intense engagement
 * - Capturing a specific life moment
 *
 * @param data - User's complete listening data
 * @returns Detection result or null if pattern not found
 */
export async function detectTheSeasonalShifter(
  data: UserListeningData
): Promise<DetectionResult | null> {
  console.log('[The Seasonal Shifter] Starting detection...');

  const shifts = findSeasonalShifts(data);

  console.log(`[The Seasonal Shifter] Found ${shifts.length} seasonal shifts`);
  if (shifts.length > 0) {
    shifts.forEach((shift, i) => {
      console.log(`  ${i + 1}. ${shift.artist.name}: ${shift.trackCount} tracks in top 10, NOT in 6-month or all-time`);
    });
  }

  if (shifts.length === 0) {
    console.log('[The Seasonal Shifter] No seasonal shifts detected');
    return null;
  }

  // Use the most dominant shift
  const primaryShift = shifts[0];

  // Calculate confidence based on track count and newness
  // 3 tracks = 0.8, 5+ tracks = 0.95
  let confidence = Math.min(0.7 + (primaryShift.trackCount * 0.08), 0.98);

  // Build evidence
  const evidence: Evidence[] = [
    {
      type: 'artist',
      value: primaryShift.artist,
      humanReadable: `${primaryShift.artist.name}: ${primaryShift.trackCount} tracks in your current top 10`
    },
    {
      type: 'timestamp',
      value: 'new-artist',
      humanReadable: `This artist wasn't in your 6-month or all-time favorites - this is a NEW obsession`
    }
  ];

  // Show specific tracks
  const trackNames = primaryShift.tracks.slice(0, 4).map(t => t.name);
  evidence.push({
    type: 'track',
    value: trackNames,
    humanReadable: `Tracks: "${trackNames.join('", "')}"`
  });

  // Check if tracks are from same album (indicates soundtrack/album drop)
  const albumIds = new Set(primaryShift.tracks.map(t => t.album.id));
  if (albumIds.size === 1) {
    const album = primaryShift.tracks[0].album;
    evidence.push({
      type: 'count',
      value: 'album-focused',
      humanReadable: `All from "${album.name}" - this is about the ALBUM, not just the artist`
    });
    confidence = Math.min(confidence + 0.05, 1.0);
  }

  // Interpret based on track count
  if (primaryShift.trackCount >= 5) {
    evidence.push({
      type: 'count',
      value: 'extreme',
      humanReadable: `${primaryShift.trackCount} tracks shows complete immersion - you're LIVING in this music right now`
    });
  } else if (primaryShift.trackCount === 4) {
    evidence.push({
      type: 'count',
      value: 'high',
      humanReadable: `4 tracks in top 10 from a new artist - something specific triggered this`
    });
  } else {
    evidence.push({
      type: 'count',
      value: 'moderate',
      humanReadable: `${primaryShift.trackCount} tracks shows this artist captured your attention recently`
    });
  }

  // Try to identify the trigger
  const currentYear = new Date().getFullYear();
  const albumReleaseYear = primaryShift.tracks[0].album.release_date ?
    new Date(primaryShift.tracks[0].album.release_date).getFullYear() : null;

  if (albumReleaseYear === currentYear) {
    evidence.push({
      type: 'timestamp',
      value: 'recent-release',
      humanReadable: `Album released in ${currentYear} - you're catching a cultural moment as it happens`
    });
  }

  // If multiple shifts detected, note them
  if (shifts.length >= 2) {
    const otherShifts = shifts.slice(1, 3).map(s => s.artist.name);
    evidence.push({
      type: 'artist',
      value: 'multiple-shifts',
      humanReadable: `You also have shifts for: ${otherShifts.join(', ')} - you're very responsive to new music`
    });
  }

  return {
    patternId: 58,
    patternName: 'The Seasonal Shifter',
    confidence,
    evidence,
    psychologicalDimension: 'identity and cultural moment',
    category: 'temporal',
    insightPotential: 0, // Will be calculated by runner
  };
}
