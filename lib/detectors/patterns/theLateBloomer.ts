/**
 * The Late Bloomer Detector
 *
 * Detects tracks that are NEW to your short-term top tracks but have many
 * recent plays, suggesting they "clicked" for you recently. Not in your
 * 6-month or all-time favorites, but suddenly dominating recent listening.
 *
 * This is the opposite of Time Capsule - these are tracks whose meaning
 * revealed itself slowly, or life circumstances finally made them relevant.
 *
 * Pattern ID: 45
 * Category: temporal
 * Psychological Dimension: discovery and growth
 * Priority: V1 - Medium Priority
 */

import type { UserListeningData, DetectionResult, Evidence } from '../types';

/**
 * Configuration for late bloomer detection
 */
const CONFIG = {
  MIN_RECENT_PLAYS: 4,           // Need 4+ recent plays
  MIN_SHORT_TERM_RANK: 15,       // Must be in top 15 short-term
  MUST_BE_NEW: true,             // Can't be in medium or long-term
};

/**
 * Find late bloomer tracks
 */
function findLateBloomerTracks(data: UserListeningData): Array<{
  track: any;
  shortTermRank: number;
  recentPlayCount: number;
  isNew: boolean;
}> {
  const lateBloomers: Array<{
    track: any;
    shortTermRank: number;
    recentPlayCount: number;
    isNew: boolean;
  }> = [];

  // Count recent plays
  const recentPlayCounts = new Map<string, number>();
  data.recentlyPlayed.forEach(play => {
    const count = recentPlayCounts.get(play.track.id) || 0;
    recentPlayCounts.set(play.track.id, count + 1);
  });

  // Check top 15 short-term tracks
  data.topTracks.short.slice(0, CONFIG.MIN_SHORT_TERM_RANK).forEach((track, idx) => {
    const shortTermRank = idx + 1;
    const recentPlays = recentPlayCounts.get(track.id) || 0;

    // Is it in medium or long-term?
    const inMediumTerm = data.topTracks.medium.some(t => t.id === track.id);
    const inLongTerm = data.topTracks.long.some(t => t.id === track.id);
    const isNew = !inMediumTerm && !inLongTerm;

    if (isNew && recentPlays >= CONFIG.MIN_RECENT_PLAYS) {
      lateBloomers.push({
        track,
        shortTermRank,
        recentPlayCount: recentPlays,
        isNew,
      });
    }
  });

  // Sort by recent play count
  return lateBloomers.sort((a, b) => b.recentPlayCount - a.recentPlayCount);
}

/**
 * Detect The Late Bloomer pattern
 *
 * Identifies tracks that are new to your favorites but already heavily played.
 * This indicates:
 * - Tracks that "clicked" after slow exposure
 * - Life circumstances making tracks suddenly relevant
 * - Delayed emotional connection
 * - Growth and changing perspectives
 *
 * When a track goes from unknown to top 15 in weeks, something about
 * your life right now makes it finally make sense.
 *
 * @param data - User's complete listening data
 * @returns Detection result or null if pattern not found
 */
export async function detectTheLateBloomer(
  data: UserListeningData
): Promise<DetectionResult | null> {
  console.log('[The Late Bloomer] Starting detection...');

  const lateBloomers = findLateBloomerTracks(data);

  console.log(`[The Late Bloomer] Found ${lateBloomers.length} late bloomer tracks`);
  if (lateBloomers.length > 0) {
    lateBloomers.forEach((bloomer, i) => {
      console.log(`  ${i + 1}. "${bloomer.track.name}": rank #${bloomer.shortTermRank}, ${bloomer.recentPlayCount} recent plays, not in 6mo/all-time`);
    });
  }

  if (lateBloomers.length === 0) {
    console.log('[The Late Bloomer] No late bloomer patterns detected');
    return null;
  }

  // Use the strongest late bloomer
  const theLateBloomer = lateBloomers[0];

  // Calculate confidence based on rank and play count
  // Top 5 = 0.8, top 15 = 0.7
  let confidence = Math.min(0.9 - (theLateBloomer.shortTermRank * 0.02), 0.85);

  // Bonus for high recent play count
  if (theLateBloomer.recentPlayCount >= 6) {
    confidence = Math.min(confidence + 0.05, 1.0);
  }

  // Build evidence
  const evidence: Evidence[] = [
    {
      type: 'track',
      value: theLateBloomer.track,
      humanReadable: `"${theLateBloomer.track.name}" by ${theLateBloomer.track.artists[0].name}`
    },
    {
      type: 'count',
      value: theLateBloomer.shortTermRank,
      humanReadable: `#${theLateBloomer.shortTermRank} in your current top tracks`
    },
    {
      type: 'timestamp',
      value: 'new',
      humanReadable: `NOT in your 6-month or all-time favorites - this is a very recent development`
    },
    {
      type: 'count',
      value: theLateBloomer.recentPlayCount,
      humanReadable: `${theLateBloomer.recentPlayCount} plays in recent listening`
    }
  ];

  // Calculate velocity (how fast it rose)
  const totalRecentTracks = data.recentlyPlayed.length;
  const playPercentage = (theLateBloomer.recentPlayCount / totalRecentTracks) * 100;

  evidence.push({
    type: 'ratio',
    value: playPercentage / 100,
    humanReadable: `${playPercentage.toFixed(1)}% of your recent plays - rapid rise to prominence`
  });

  // Add interpretation based on rank
  if (theLateBloomer.shortTermRank <= 5) {
    evidence.push({
      type: 'count',
      value: 'extreme',
      humanReadable: `Top 5 placement after zero history - something about now made this track finally click`
    });
  } else {
    evidence.push({
      type: 'count',
      value: 'high',
      humanReadable: `This track's meaning revealed itself slowly, or life circumstances made it suddenly relevant`
    });
  }

  // Check if multiple late bloomers exist
  if (lateBloomers.length >= 3) {
    evidence.push({
      type: 'count',
      value: lateBloomers.length,
      humanReadable: `${lateBloomers.length} tracks blooming late - you're in a period of rapid taste evolution`
    });
  }

  // Check if artist is established vs new
  const artistInLongTerm = data.topArtists.long.some(a => a.id === theLateBloomer.track.artists[0].id);

  if (artistInLongTerm) {
    evidence.push({
      type: 'artist',
      value: 'established',
      humanReadable: `Artist in your all-time favorites - you're discovering new depths in a familiar artist`
    });
  } else {
    evidence.push({
      type: 'artist',
      value: 'new',
      humanReadable: `Both track AND artist are new to your rotation - double discovery`
    });
  }

  // Interpretation
  evidence.push({
    type: 'count',
    value: 'growth',
    humanReadable: `Late bloomers reveal personal growth - you're ready to hear things you couldn't hear before`
  });

  return {
    patternId: 45,
    patternName: 'The Late Bloomer',
    confidence,
    evidence,
    psychologicalDimension: 'discovery and growth',
    category: 'temporal',
    insightPotential: 0, // Will be calculated by runner
  };
}
