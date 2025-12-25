/**
 * The Wicked Obsession Detector
 *
 * Detects when 5+ tracks from "Wicked: For Good – The Soundtrack" appear in
 * your top 20 tracks. This is a specific, timely pattern detector that captures
 * cultural moment engagement (movie releases, viral soundtracks, etc.).
 *
 * This is a template that can be adapted for other soundtrack/album events.
 *
 * Pattern ID: 57
 * Category: identity
 * Psychological Dimension: identity and cultural moment
 * Priority: V1 - High Priority (Timely - Wicked movie release Dec 2024)
 */

import type { UserListeningData, DetectionResult, Evidence } from '../types';

/**
 * Configuration for Wicked obsession detection
 */
const CONFIG = {
  TARGET_ALBUM_ID: '7vZvw9WMWtiiPdPBDoKV2n', // Wicked: For Good soundtrack
  TARGET_ALBUM_NAME: 'Wicked: For Good',
  MIN_TRACKS_FROM_ALBUM: 5,   // 5+ tracks shows real obsession
  HIGH_OBSESSION_TRACKS: 7,   // 7+ tracks = extreme
  ANALYZE_TOP_N: 20,          // Check top 20 tracks
};

/**
 * Find Wicked tracks in top favorites
 */
function findWickedTracks(data: UserListeningData): {
  wickedTracks: any[];
  totalAnalyzed: number;
} {
  const wickedTracks: any[] = [];

  // Check top tracks for Wicked soundtrack
  data.topTracks.short.slice(0, CONFIG.ANALYZE_TOP_N).forEach(track => {
    // Check if track is from Wicked album (by album ID or name)
    if (track.album.id === CONFIG.TARGET_ALBUM_ID ||
        track.album.name.includes(CONFIG.TARGET_ALBUM_NAME)) {
      wickedTracks.push(track);
    }
  });

  return {
    wickedTracks,
    totalAnalyzed: CONFIG.ANALYZE_TOP_N,
  };
}

/**
 * Detect The Wicked Obsession pattern
 *
 * Identifies users caught up in the Wicked moment. This indicates:
 * - Engagement with cultural moments (movie releases, viral events)
 * - Soundtrack as emotional experience
 * - Musical theater appreciation
 * - Timely cultural participation
 *
 * @param data - User's complete listening data
 * @returns Detection result or null if pattern not found
 */
export async function detectTheWickedObsession(
  data: UserListeningData
): Promise<DetectionResult | null> {
  console.log('[The Wicked Obsession] Starting detection...');

  const { wickedTracks, totalAnalyzed } = findWickedTracks(data);

  console.log(`[The Wicked Obsession] Found ${wickedTracks.length} Wicked tracks in top ${totalAnalyzed}`);
  if (wickedTracks.length > 0) {
    wickedTracks.forEach((track, i) => {
      console.log(`  ${i + 1}. "${track.name}"`);
    });
  }

  // Check if meets minimum threshold
  if (wickedTracks.length < CONFIG.MIN_TRACKS_FROM_ALBUM) {
    console.log(`[The Wicked Obsession] Only ${wickedTracks.length} tracks, below threshold of ${CONFIG.MIN_TRACKS_FROM_ALBUM}`);
    return null;
  }

  // Calculate confidence based on track count
  // 5 tracks = 0.85, 7+ tracks = 0.95
  let confidence = Math.min(0.75 + (wickedTracks.length * 0.05), 0.98);

  // Bonus for extreme obsession
  if (wickedTracks.length >= CONFIG.HIGH_OBSESSION_TRACKS) {
    confidence = Math.min(confidence + 0.1, 1.0);
  }

  // Build evidence
  const evidence: Evidence[] = [
    {
      type: 'count',
      value: wickedTracks.length,
      humanReadable: `${wickedTracks.length} tracks from "${CONFIG.TARGET_ALBUM_NAME}" in your top ${totalAnalyzed}`
    }
  ];

  // Show specific tracks
  const trackNames = wickedTracks.slice(0, 5).map(t => t.name);
  evidence.push({
    type: 'track',
    value: trackNames,
    humanReadable: `Tracks: "${trackNames.join('", "')}"`
  });

  // Check if Wicked tracks dominate top 10
  const wickedInTop10 = data.topTracks.short.slice(0, 10).filter(track =>
    track.album.id === CONFIG.TARGET_ALBUM_ID ||
    track.album.name.includes(CONFIG.TARGET_ALBUM_NAME)
  ).length;

  if (wickedInTop10 >= 3) {
    evidence.push({
      type: 'count',
      value: 'top-10-dominance',
      humanReadable: `${wickedInTop10} Wicked tracks in your top 10 - serious obsession`
    });
    confidence = Math.min(confidence + 0.05, 1.0);
  }

  // Interpret based on count
  if (wickedTracks.length >= CONFIG.HIGH_OBSESSION_TRACKS) {
    evidence.push({
      type: 'count',
      value: 'extreme',
      humanReadable: `${wickedTracks.length} tracks from one soundtrack shows you're LIVING in that world right now`
    });
  } else if (wickedTracks.length >= 6) {
    evidence.push({
      type: 'count',
      value: 'high',
      humanReadable: `You're not just watching Wicked - you're experiencing it through the music`
    });
  } else {
    evidence.push({
      type: 'count',
      value: 'moderate',
      humanReadable: `${wickedTracks.length} Wicked tracks shows the soundtrack captured you`
    });
  }

  // Check if this is new vs established
  const wickedInMedium = data.topTracks.medium.filter(track =>
    track.album.id === CONFIG.TARGET_ALBUM_ID ||
    track.album.name.includes(CONFIG.TARGET_ALBUM_NAME)
  ).length;

  const wickedInLong = data.topTracks.long.filter(track =>
    track.album.id === CONFIG.TARGET_ALBUM_ID ||
    track.album.name.includes(CONFIG.TARGET_ALBUM_NAME)
  ).length;

  if (wickedInMedium === 0 && wickedInLong === 0) {
    evidence.push({
      type: 'timestamp',
      value: 'new-obsession',
      humanReadable: `This is a NEW obsession - not in your 6-month or all-time favorites. The movie hit you HARD.`
    });
  } else if (wickedInLong > 0) {
    evidence.push({
      type: 'timestamp',
      value: 'established',
      humanReadable: `You were already a Wicked fan before the movie - this just intensified it`
    });
  }

  // Cultural moment context
  evidence.push({
    type: 'timestamp',
    value: 'cultural-moment',
    humanReadable: `Wicked movie release (Nov 2024) - you're participating in a cultural moment`
  });

  return {
    patternId: 57,
    patternName: 'The Wicked Obsession',
    confidence,
    evidence,
    psychologicalDimension: 'identity and cultural moment',
    category: 'identity',
    insightPotential: 0, // Will be calculated by runner
  };
}
