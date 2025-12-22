/**
 * The Climber Detector
 *
 * Detects tracks rising across time ranges - starts low in all-time, climbs through
 * 6-month, peaks in 4-week top tracks. Shows evolving taste, tracks "clicking"
 * over time, or life circumstances making songs newly relevant.
 *
 * Example: #45 all-time → #20 6-month → #5 4-week
 *
 * Pattern ID: 46
 * Category: temporal
 * Psychological Dimension: discovery and growth
 * Priority: V1 - High Priority
 */

import type { UserListeningData, DetectionResult, Evidence } from '../types';

/**
 * Configuration for climber detection
 */
const CONFIG = {
  MIN_RANK_IMPROVEMENT: 15,      // Must improve by 15+ positions
  MIN_CURRENT_RANK: 10,          // Must reach top 10 in short-term
  MIN_STARTING_RANK: 25,         // Must start below #25 in long-term
};

/**
 * Find tracks climbing across time ranges
 */
function findClimbingTracks(data: UserListeningData): Array<{
  track: any;
  longTermRank: number | null;
  mediumTermRank: number | null;
  shortTermRank: number;
  totalClimb: number;
  climbRate: number; // positions per time range
}> {
  const climbers: Array<{
    track: any;
    longTermRank: number | null;
    mediumTermRank: number | null;
    shortTermRank: number;
    totalClimb: number;
    climbRate: number;
  }> = [];

  // Check top 10 short-term tracks
  data.topTracks.short.slice(0, CONFIG.MIN_CURRENT_RANK).forEach((track, shortIdx) => {
    const shortTermRank = shortIdx + 1;

    // Find in medium-term
    const mediumIdx = data.topTracks.medium.findIndex(t => t.id === track.id);
    const mediumTermRank = mediumIdx !== -1 ? mediumIdx + 1 : null;

    // Find in long-term
    const longIdx = data.topTracks.long.findIndex(t => t.id === track.id);
    const longTermRank = longIdx !== -1 ? longIdx + 1 : null;

    // Calculate climb
    if (longTermRank !== null && longTermRank >= CONFIG.MIN_STARTING_RANK) {
      const totalClimb = longTermRank - shortTermRank;

      if (totalClimb >= CONFIG.MIN_RANK_IMPROVEMENT) {
        // Calculate climb rate (how many positions per time range)
        let climbRate = 0;
        if (mediumTermRank !== null) {
          // Full climb data: long → medium → short
          const climb1 = longTermRank - mediumTermRank;
          const climb2 = mediumTermRank - shortTermRank;
          climbRate = (climb1 + climb2) / 2; // Average climb per stage
        } else {
          // Partial data: long → short only
          climbRate = totalClimb / 2; // Assume even climb
        }

        climbers.push({
          track,
          longTermRank,
          mediumTermRank,
          shortTermRank,
          totalClimb,
          climbRate,
        });
      }
    }
  });

  // Sort by total climb (most dramatic climbers first)
  return climbers.sort((a, b) => b.totalClimb - a.totalClimb);
}

/**
 * Detect The Climber pattern
 *
 * Identifies tracks rising across time ranges. This indicates:
 * - Evolving taste and growing connection
 * - Track "clicking" after repeated exposure
 * - Life circumstances making track newly relevant
 * - Delayed emotional resonance
 *
 * When a track climbs from #40 to #5, something about your life right now
 * makes it finally resonate in a way it didn't before.
 *
 * @param data - User's complete listening data
 * @returns Detection result or null if pattern not found
 */
export async function detectTheClimber(
  data: UserListeningData
): Promise<DetectionResult | null> {
  console.log('[The Climber] Starting detection...');

  const climbers = findClimbingTracks(data);

  console.log(`[The Climber] Found ${climbers.length} climbing tracks`);
  if (climbers.length > 0) {
    climbers.forEach((climber, i) => {
      console.log(`  ${i + 1}. "${climber.track.name}": #${climber.longTermRank} → #${climber.mediumTermRank || '?'} → #${climber.shortTermRank} (${climber.totalClimb} positions)`);
    });
  }

  if (climbers.length === 0) {
    console.log('[The Climber] No climbing patterns detected');
    return null;
  }

  // Use the most dramatic climber
  const theClimber = climbers[0];

  // Calculate confidence based on climb magnitude and consistency
  // 15 positions = 0.75, 30+ = 0.95
  let confidence = Math.min(0.6 + (theClimber.totalClimb * 0.015), 0.95);

  // Bonus for consistent climb (if we have medium-term data)
  if (theClimber.mediumTermRank !== null) {
    const climb1 = theClimber.longTermRank! - theClimber.mediumTermRank;
    const climb2 = theClimber.mediumTermRank - theClimber.shortTermRank;

    // Consistent climb (both stages positive)
    if (climb1 > 0 && climb2 > 0) {
      confidence = Math.min(confidence + 0.05, 1.0);
    }
  }

  // Build evidence
  const evidence: Evidence[] = [
    {
      type: 'track',
      value: theClimber.track,
      humanReadable: `"${theClimber.track.name}" by ${theClimber.track.artists[0].name}`
    },
    {
      type: 'count',
      value: theClimber.totalClimb,
      humanReadable: `Climbed ${theClimber.totalClimb} positions: #${theClimber.longTermRank} (all-time) → #${theClimber.shortTermRank} (current)`
    }
  ];

  // Show climb trajectory
  if (theClimber.mediumTermRank !== null) {
    evidence.push({
      type: 'count',
      value: 'trajectory',
      humanReadable: `Full trajectory: #${theClimber.longTermRank} → #${theClimber.mediumTermRank} → #${theClimber.shortTermRank}`
    });

    const climb1 = theClimber.longTermRank! - theClimber.mediumTermRank;
    const climb2 = theClimber.mediumTermRank - theClimber.shortTermRank;

    if (climb2 > climb1) {
      evidence.push({
        type: 'count',
        value: 'accelerating',
        humanReadable: `Accelerating climb - rising ${climb2} positions recently vs ${climb1} earlier`
      });
    } else {
      evidence.push({
        type: 'count',
        value: 'steady',
        humanReadable: `Steady climb across both time periods`
      });
    }
  } else {
    evidence.push({
      type: 'count',
      value: 'jump',
      humanReadable: `Not in 6-month top 50 - dramatic jump from all-time to current`
    });
  }

  // Add interpretation based on climb magnitude
  if (theClimber.totalClimb >= 30) {
    evidence.push({
      type: 'count',
      value: 'extreme',
      humanReadable: `${theClimber.totalClimb}-position climb - this track's meaning transformed for you`
    });
  } else {
    evidence.push({
      type: 'count',
      value: 'high',
      humanReadable: `Steadily growing connection - this track clicking deeper over time`
    });
  }

  // Check if multiple climbers exist
  if (climbers.length >= 2) {
    const secondClimber = climbers[1];
    evidence.push({
      type: 'count',
      value: climbers.length,
      humanReadable: `${climbers.length} tracks climbing - you're in a period of evolving taste (also: "${secondClimber.track.name}" +${secondClimber.totalClimb})`
    });
  }

  // Artist context
  const artistInLongTerm = data.topArtists.long.some(a => a.id === theClimber.track.artists[0].id);
  if (artistInLongTerm) {
    evidence.push({
      type: 'artist',
      value: 'familiar',
      humanReadable: `Artist in all-time favorites - discovering new depth in familiar territory`
    });
  }

  return {
    patternId: 46,
    patternName: 'The Climber',
    confidence,
    evidence,
    psychologicalDimension: 'discovery and growth',
    category: 'temporal',
    insightPotential: 0,
  };
}
