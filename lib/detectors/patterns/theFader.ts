/**
 * The Fader Detector
 *
 * Detects artists in all-time top 10 who are NOT in current 4-week top 50.
 * Shows abandoned favorites, outgrown artists, or associations you've moved past.
 * The inverse of Phase Shifter - this is about what you've left behind.
 *
 * "You used to love them. What changed?"
 *
 * Pattern ID: 47
 * Category: temporal
 * Psychological Dimension: identity transition
 * Priority: V1 - High Priority
 */

import type { UserListeningData, DetectionResult, Evidence } from '../types';

/**
 * Configuration for fader detection
 */
const CONFIG = {
  MIN_LONG_TERM_RANK: 10,        // Must be top 10 all-time
  NOT_IN_SHORT_TERM: true,       // Must be absent from 4-week
  MIN_FADE_SIGNIFICANCE: 1,      // At least 1 faded artist
};

/**
 * Find faded artists
 */
function findFadedArtists(data: UserListeningData): Array<{
  artist: any;
  longTermRank: number;
  inMediumTerm: boolean;
  mediumTermRank: number | null;
  lastKnownPosition: string;
}> {
  const fadedArtists: Array<{
    artist: any;
    longTermRank: number;
    inMediumTerm: boolean;
    mediumTermRank: number | null;
    lastKnownPosition: string;
  }> = [];

  // Check top 10 all-time artists
  data.topArtists.long.slice(0, CONFIG.MIN_LONG_TERM_RANK).forEach((artist, longIdx) => {
    const longTermRank = longIdx + 1;

    // Check if in current rotation
    const inShortTerm = data.topArtists.short.some(a => a.id === artist.id);

    if (!inShortTerm) {
      // This is a faded artist
      const mediumIdx = data.topArtists.medium.findIndex(a => a.id === artist.id);
      const inMediumTerm = mediumIdx !== -1;
      const mediumTermRank = inMediumTerm ? mediumIdx + 1 : null;

      let lastKnownPosition: string;
      if (inMediumTerm) {
        lastKnownPosition = `6-month rank #${mediumTermRank}`;
      } else {
        lastKnownPosition = 'not in 6-month';
      }

      fadedArtists.push({
        artist,
        longTermRank,
        inMediumTerm,
        mediumTermRank,
        lastKnownPosition,
      });
    }
  });

  return fadedArtists;
}

/**
 * Detect The Fader pattern
 *
 * Identifies artists you've moved away from. This indicates:
 * - Identity transition and growth
 * - Outgrowing past associations
 * - Life phase changes
 * - Emotional distance from previous experiences
 *
 * When a top 5 all-time artist disappears from current rotation,
 * it's not about the music - it's about who you're no longer.
 *
 * @param data - User's complete listening data
 * @returns Detection result or null if pattern not found
 */
export async function detectTheFader(
  data: UserListeningData
): Promise<DetectionResult | null> {
  console.log('[The Fader] Starting detection...');

  const fadedArtists = findFadedArtists(data);

  console.log(`[The Fader] Found ${fadedArtists.length} faded artists from top 10 all-time`);
  if (fadedArtists.length > 0) {
    fadedArtists.forEach((fader, i) => {
      console.log(`  ${i + 1}. ${fader.artist.name}: all-time #${fader.longTermRank}, ${fader.lastKnownPosition}, not in current top 50`);
    });
  }

  if (fadedArtists.length < CONFIG.MIN_FADE_SIGNIFICANCE) {
    console.log('[The Fader] No faded artists detected');
    return null;
  }

  // Use the highest-ranked faded artist
  const theFader = fadedArtists[0];

  // Calculate confidence based on rank and fade completeness
  // Top 5 all-time = 0.85, Top 10 = 0.75
  let confidence = 1.0 - (theFader.longTermRank * 0.03);
  confidence = Math.max(confidence, 0.7);

  // Higher confidence if completely absent (not even in 6-month)
  if (!theFader.inMediumTerm) {
    confidence = Math.min(confidence + 0.1, 1.0);
  }

  // Build evidence
  const evidence: Evidence[] = [
    {
      type: 'artist',
      value: theFader.artist,
      humanReadable: `${theFader.artist.name}`
    },
    {
      type: 'count',
      value: theFader.longTermRank,
      humanReadable: `#${theFader.longTermRank} in your all-time top artists`
    },
    {
      type: 'timestamp',
      value: 'absent',
      humanReadable: `Not in your current top 50 artists (last 4 weeks)`
    }
  ];

  // Show fade trajectory
  if (theFader.inMediumTerm) {
    evidence.push({
      type: 'count',
      value: 'gradual',
      humanReadable: `Gradual fade: all-time #${theFader.longTermRank} → 6-month #${theFader.mediumTermRank} → absent from current`
    });
  } else {
    evidence.push({
      type: 'count',
      value: 'complete',
      humanReadable: `Complete fade: not even in 6-month top 50 - this separation is intentional`
    });
  }

  // Add interpretation based on rank
  if (theFader.longTermRank <= 3) {
    evidence.push({
      type: 'count',
      value: 'extreme',
      humanReadable: `Top 3 all-time artist now absent - major identity shift`
    });
  } else if (theFader.longTermRank <= 5) {
    evidence.push({
      type: 'count',
      value: 'high',
      humanReadable: `Top 5 all-time, now gone - you've moved past whatever this artist represented`
    });
  } else {
    evidence.push({
      type: 'count',
      value: 'moderate',
      humanReadable: `This artist no longer fits who you're becoming`
    });
  }

  // Check if multiple faders exist
  if (fadedArtists.length >= 2) {
    const otherFaders = fadedArtists.slice(1, 3).map(f => f.artist.name);
    evidence.push({
      type: 'count',
      value: fadedArtists.length,
      humanReadable: `${fadedArtists.length} top-10 artists faded - major taste shift (also: ${otherFaders.join(', ')})`
    });
  }

  // Check current top artist for contrast
  const currentTopArtist = data.topArtists.short[0];
  if (currentTopArtist) {
    const currentInLongTerm = data.topArtists.long.findIndex(a => a.id === currentTopArtist.id);
    if (currentInLongTerm === -1 || currentInLongTerm > 10) {
      evidence.push({
        type: 'artist',
        value: 'new',
        humanReadable: `Current top artist (${currentTopArtist.name}) is new - you're actively rebuilding your identity`
      });
    }
  }

  return {
    patternId: 47,
    patternName: 'The Fader',
    confidence,
    evidence,
    psychologicalDimension: 'identity transition',
    category: 'temporal',
    insightPotential: 0,
  };
}
