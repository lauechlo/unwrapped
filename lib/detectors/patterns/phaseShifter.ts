/**
 * Phase Shifter Detector
 *
 * Detects sudden intensity surges where one artist dominates your current top 10
 * with multiple tracks. Indicates phase-based listening, whether from new discovery
 * or renewed obsession with a familiar artist.
 *
 * Pattern ID: 21
 * Category: identity
 * Psychological Dimension: identity and attachment
 * Priority: V1 - High Priority
 */

import type { UserListeningData, DetectionResult, Evidence } from '../types';

/**
 * Configuration for phase shifter detection
 */
const CONFIG = {
  MIN_SHORT_TERM_TRACKS: 3,   // Need at least 3 tracks in short-term top 10
  MIN_SHORT_TERM_RANK: 10,    // Must be in top 10 short-term
  MAX_LONG_TERM_RANK: 50,     // Must NOT be in long-term top 50 (new obsession)
  HIGH_INTENSITY_TRACKS: 5,   // 5+ tracks = high intensity phase
};

/**
 * Find artists with intensity surges in short-term top 10
 */
function findPhaseShifts(data: UserListeningData): Array<{
  artist: any;
  shortTermTracks: any[];
  shortTermCount: number;
  inMediumTerm: boolean;
  inLongTerm: boolean;
}> {
  // Count tracks per artist in short-term top 10
  const shortTermTop10 = data.topTracks.short.slice(0, CONFIG.MIN_SHORT_TERM_RANK);
  const artistCounts = new Map<string, { artist: any; tracks: any[] }>();

  console.log(`[Phase Shifter] Analyzing top ${CONFIG.MIN_SHORT_TERM_RANK} tracks...`);

  shortTermTop10.forEach(track => {
    const artist = track.artists[0];
    const existing = artistCounts.get(artist.id);

    if (existing) {
      existing.tracks.push(track);
    } else {
      artistCounts.set(artist.id, {
        artist,
        tracks: [track]
      });
    }
  });

  console.log(`[Phase Shifter] Found ${artistCounts.size} unique artists in top 10`);

  // Log all artists and their track counts
  artistCounts.forEach((artistData, artistId) => {
    console.log(`  - ${artistData.artist.name}: ${artistData.tracks.length} tracks`);
  });

  // Find artists with enough tracks in short-term (intensity surge)
  const candidates: Array<{
    artist: any;
    shortTermTracks: any[];
    shortTermCount: number;
    inMediumTerm: boolean;
    inLongTerm: boolean;
  }> = [];

  artistCounts.forEach((artistData, artistId) => {
    const meetsThreshold = artistData.tracks.length >= CONFIG.MIN_SHORT_TERM_TRACKS;

    if (meetsThreshold) {
      // Check if artist appears in medium and long-term
      const inMediumTerm = data.topArtists.medium.some(a => a.id === artistId);
      const inLongTerm = data.topArtists.long.some(a => a.id === artistId);

      console.log(`  → ${artistData.artist.name} has ${artistData.tracks.length} tracks (threshold: ${CONFIG.MIN_SHORT_TERM_TRACKS})`);
      console.log(`    In medium-term top 50: ${inMediumTerm}`);
      console.log(`    In long-term top 50: ${inLongTerm}`);
      console.log(`    ✓ Qualifies as intensity surge!`);

      candidates.push({
        artist: artistData.artist,
        shortTermTracks: artistData.tracks,
        shortTermCount: artistData.tracks.length,
        inMediumTerm,
        inLongTerm,
      });
    } else {
      console.log(`  → ${artistData.artist.name}: ${artistData.tracks.length} tracks (below threshold of ${CONFIG.MIN_SHORT_TERM_TRACKS})`);
    }
  });

  // Sort by track count (most dominant first)
  return candidates.sort((a, b) => b.shortTermCount - a.shortTermCount);
}

/**
 * Detect Phase Shifter pattern
 *
 * Identifies sudden intensity surges where one artist dominates your current
 * top 10 with multiple tracks. This indicates:
 * - New discovery that resonates deeply (if not in long-term history)
 * - Renewed obsession with familiar artist (if in long-term history)
 * - Temporary phase or mood shift
 * - Identity exploration or comfort-seeking behavior
 *
 * @param data - User's complete listening data
 * @returns Detection result or null if pattern not found
 */
export async function detectPhaseShifter(
  data: UserListeningData
): Promise<DetectionResult | null> {
  console.log('[Phase Shifter] Starting detection...');
  const phaseShifts = findPhaseShifts(data);

  console.log(`[Phase Shifter] Found ${phaseShifts.length} potential phase shifts`);
  if (phaseShifts.length > 0) {
    phaseShifts.forEach((shift, i) => {
      console.log(`  ${i + 1}. ${shift.artist.name}: ${shift.shortTermCount} tracks, ` +
        `inMedium: ${shift.inMediumTerm}, inLong: ${shift.inLongTerm}`);
    });
  }

  if (phaseShifts.length === 0) {
    console.log('[Phase Shifter] No phase shifts detected - checking why...');
    return null;
  }

  // Use the most dominant phase shift
  const dominant = phaseShifts[0];

  // Calculate confidence
  // 3 tracks = 0.7, 5+ tracks = 0.9
  let confidence = Math.min(0.5 + (dominant.shortTermCount * 0.1), 0.9);

  // Adjust confidence based on history
  // Higher confidence if NOT in long-term (truly new phase)
  if (!dominant.inLongTerm) {
    confidence = Math.min(confidence + 0.1, 1.0);
  }
  // Slightly lower if established favorite (renewed obsession vs new discovery)
  if (dominant.inLongTerm && dominant.inMediumTerm) {
    confidence = Math.max(confidence - 0.1, 0.7);
  }

  // Build evidence
  const evidence: Evidence[] = [
    {
      type: 'artist',
      value: dominant.artist,
      humanReadable: `${dominant.artist.name}`
    },
    {
      type: 'count',
      value: dominant.shortTermCount,
      humanReadable: `${dominant.shortTermCount} tracks by ${dominant.artist.name} in your top 10 (last 4 weeks)`
    }
  ];

  // Add context based on listening history
  if (!dominant.inLongTerm) {
    evidence.push({
      type: 'timestamp',
      value: 'new',
      humanReadable: `NOT in your all-time top 50 - this is a NEW discovery phase`
    });
  } else {
    evidence.push({
      type: 'timestamp',
      value: 'returning',
      humanReadable: `In your all-time top 50 - this is a RENEWED obsession`
    });
  }

  // Show which tracks
  const topTracks = dominant.shortTermTracks.slice(0, 3).map(t => t.name);
  if (topTracks.length > 0) {
    evidence.push({
      type: 'track',
      value: topTracks,
      humanReadable: `Tracks: "${topTracks.join('", "')}"`
    });
  }

  // Add context about medium-term
  if (!dominant.inLongTerm && !dominant.inMediumTerm) {
    evidence.push({
      type: 'timestamp',
      value: 'very-new',
      humanReadable: `Also NOT in 6-month top 50 - very recent discovery`
    });
  } else if (!dominant.inLongTerm && dominant.inMediumTerm) {
    evidence.push({
      type: 'timestamp',
      value: 'medium',
      humanReadable: `Appeared in 6-month top artists - building momentum`
    });
  }

  // Add interpretation based on intensity and history
  let interpretation = '';
  if (dominant.shortTermCount >= CONFIG.HIGH_INTENSITY_TRACKS) {
    if (!dominant.inLongTerm) {
      interpretation = 'High-intensity new obsession suggests strong emotional resonance with this discovery';
    } else {
      interpretation = 'High-intensity renewed focus on a familiar artist suggests comfort-seeking or rediscovery';
    }
  } else {
    if (!dominant.inLongTerm) {
      interpretation = 'New artist phase indicates exploration beyond your established preferences';
    } else {
      interpretation = 'Renewed focus on a familiar artist suggests phase-based listening or emotional shift';
    }
  }

  return {
    patternId: 21,
    patternName: 'Phase Shifter',
    confidence,
    evidence,
    psychologicalDimension: 'identity and attachment',
    category: 'identity',
    insightPotential: 0, // Will be calculated by runner
  };
}
