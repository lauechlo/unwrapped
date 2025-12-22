/**
 * The Vault Track Hunter Detector
 *
 * Detects specific tracks in all-time top 20 that are NOT in current 4-week top 50.
 * Different from The Fader (which tracks artists) - this reveals individual songs
 * you've shelved, often because they're tied to specific memories or emotions
 * you're not ready to revisit.
 *
 * These are your emotional vault tracks.
 *
 * Pattern ID: 50
 * Category: temporal
 * Psychological Dimension: memory and avoidance
 * Priority: V1 - High Priority
 */

import type { UserListeningData, DetectionResult, Evidence } from '../types';

/**
 * Configuration for vault track detection
 */
const CONFIG = {
  MIN_LONG_TERM_RANK: 20,        // Check top 20 all-time
  NOT_IN_SHORT_TERM: true,       // Must be absent from current
  MIN_VAULT_TRACKS: 3,           // Need at least 3 vault tracks
};

/**
 * Find vault tracks
 */
function findVaultTracks(data: UserListeningData): Array<{
  track: any;
  longTermRank: number;
  inMediumTerm: boolean;
  mediumTermRank: number | null;
  fadePattern: string;
}> {
  const vaultTracks: Array<{
    track: any;
    longTermRank: number;
    inMediumTerm: boolean;
    mediumTermRank: number | null;
    fadePattern: string;
  }> = [];

  // Check top 20 all-time tracks
  data.topTracks.long.slice(0, CONFIG.MIN_LONG_TERM_RANK).forEach((track, longIdx) => {
    const longTermRank = longIdx + 1;

    // Check if in current rotation
    const inShortTerm = data.topTracks.short.some(t => t.id === track.id);

    if (!inShortTerm) {
      // This is a vault track
      const mediumIdx = data.topTracks.medium.findIndex(t => t.id === track.id);
      const inMediumTerm = mediumIdx !== -1;
      const mediumTermRank = inMediumTerm ? mediumIdx + 1 : null;

      let fadePattern: string;
      if (inMediumTerm) {
        fadePattern = 'recent-fade'; // Was in 6-month, now gone
      } else {
        fadePattern = 'long-fade'; // Gone since 6+ months ago
      }

      vaultTracks.push({
        track,
        longTermRank,
        inMediumTerm,
        mediumTermRank,
        fadePattern,
      });
    }
  });

  return vaultTracks;
}

/**
 * Detect The Vault Track Hunter pattern
 *
 * Identifies tracks shelved from your all-time favorites. This indicates:
 * - Memory avoidance (tracks tied to past experiences)
 * - Emotional protection (too painful/nostalgic to revisit)
 * - Life phase separation (belongs to "old you")
 * - Intentional distancing
 *
 * When a top 10 all-time track disappears from current rotation,
 * it's not that you don't love it - it's that it means too much.
 *
 * @param data - User's complete listening data
 * @returns Detection result or null if pattern not found
 */
export async function detectTheVaultTrackHunter(
  data: UserListeningData
): Promise<DetectionResult | null> {
  console.log('[Vault Track Hunter] Starting detection...');

  const vaultTracks = findVaultTracks(data);

  console.log(`[Vault Track Hunter] Found ${vaultTracks.length} vault tracks from all-time top 20`);
  if (vaultTracks.length > 0) {
    vaultTracks.slice(0, 5).forEach((vault, i) => {
      console.log(`  ${i + 1}. "${vault.track.name}": all-time #${vault.longTermRank}, ${vault.inMediumTerm ? `6-month #${vault.mediumTermRank}` : 'not in 6-month'}, not in current`);
    });
  }

  if (vaultTracks.length < CONFIG.MIN_VAULT_TRACKS) {
    console.log(`[Vault Track Hunter] Only ${vaultTracks.length} vault tracks, below threshold of ${CONFIG.MIN_VAULT_TRACKS}`);
    return null;
  }

  // Use the highest-ranked vault track
  const topVault = vaultTracks[0];

  // Calculate confidence based on vault size and pattern
  // 3 tracks = 0.7, 8+ tracks = 0.9
  let confidence = Math.min(0.6 + (vaultTracks.length * 0.04), 0.9);

  // Bonus for high-ranked vault (top 10 all-time)
  if (topVault.longTermRank <= 10) {
    confidence = Math.min(confidence + 0.05, 1.0);
  }

  // Build evidence
  const evidence: Evidence[] = [
    {
      type: 'count',
      value: vaultTracks.length,
      humanReadable: `${vaultTracks.length} tracks from all-time top 20 absent from current rotation`
    },
    {
      type: 'track',
      value: topVault.track,
      humanReadable: `Highest-ranked vault: "${topVault.track.name}" by ${topVault.track.artists[0].name} (#${topVault.longTermRank} all-time)`
    }
  ];

  // Show vault trajectory
  if (topVault.inMediumTerm) {
    evidence.push({
      type: 'timestamp',
      value: 'recent-fade',
      humanReadable: `Recent vault: Was #${topVault.mediumTermRank} in 6-month, now absent - recently shelved`
    });
  } else {
    evidence.push({
      type: 'timestamp',
      value: 'long-fade',
      humanReadable: `Long vault: Not in 6-month either - shelved for 6+ months`
    });
  }

  // Analyze fade patterns
  const recentFades = vaultTracks.filter(v => v.fadePattern === 'recent-fade').length;
  const longFades = vaultTracks.filter(v => v.fadePattern === 'long-fade').length;

  if (recentFades >= vaultTracks.length * 0.6) {
    evidence.push({
      type: 'count',
      value: 'recent-pattern',
      humanReadable: `${recentFades} recently vaulted - you're actively distancing from past favorites`
    });
  } else if (longFades >= vaultTracks.length * 0.6) {
    evidence.push({
      type: 'count',
      value: 'established-pattern',
      humanReadable: `${longFades} long-term vaults - these have been shelved for 6+ months`
    });
  } else {
    evidence.push({
      type: 'count',
      value: 'mixed-pattern',
      humanReadable: `Mix of recent and long-term vaults - ongoing separation from past`
    });
  }

  // Show additional vault tracks
  if (vaultTracks.length >= 2) {
    const otherVaults = vaultTracks.slice(1, 4).map(v => `"${v.track.name}"`);
    evidence.push({
      type: 'track',
      value: otherVaults,
      humanReadable: `Other vaults: ${otherVaults.join(', ')}`
    });
  }

  // Interpret vault count
  if (vaultTracks.length >= 8) {
    evidence.push({
      type: 'count',
      value: 'extreme',
      humanReadable: `${vaultTracks.length} vault tracks - major separation from your listening history`
    });
  } else if (vaultTracks.length >= 5) {
    evidence.push({
      type: 'count',
      value: 'high',
      humanReadable: `Significant vault - these tracks mean too much to listen casually`
    });
  } else {
    evidence.push({
      type: 'count',
      value: 'moderate',
      humanReadable: `Selective vaulting - certain favorites shelved for emotional protection`
    });
  }

  // Check if vault tracks share common themes
  const vaultArtists = new Set(vaultTracks.map(v => v.track.artists[0].id));
  const vaultAlbums = new Set(vaultTracks.map(v => v.track.album.id));

  if (vaultArtists.size <= 2 && vaultTracks.length >= 4) {
    evidence.push({
      type: 'artist',
      value: 'concentrated',
      humanReadable: `Most vaults from ${vaultArtists.size} artists - specific associations being avoided`
    });
  }

  if (vaultAlbums.size === 1 && vaultTracks.length >= 3) {
    evidence.push({
      type: 'count',
      value: 'album-vault',
      humanReadable: `All from same album - entire album shelved, likely tied to specific memory`
    });
  }

  return {
    patternId: 50,
    patternName: 'The Vault Track Hunter',
    confidence,
    evidence,
    psychologicalDimension: 'memory and avoidance',
    category: 'temporal',
    insightPotential: 0,
  };
}
