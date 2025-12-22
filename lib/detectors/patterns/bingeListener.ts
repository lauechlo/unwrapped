/**
 * The Binge Listener Detector
 *
 * Detects concentrated listening sessions where many tracks are consumed in
 * a short time period. Indicates immersive listening behavior - losing yourself
 * in music rather than background listening. Often correlates with emotional
 * processing, procrastination, or deep work sessions.
 *
 * Pattern ID: 33
 * Category: repetition
 * Psychological Dimension: emotional regulation
 * Priority: V1 - High Priority
 */

import type { UserListeningData, DetectionResult, Evidence } from '../types';

/**
 * Configuration for binge listener detection
 */
const CONFIG = {
  MIN_BINGE_SESSIONS: 2,        // Need at least 2 binge sessions
  MIN_TRACKS_PER_BINGE: 10,     // 10+ tracks = binge session
  MAX_TRACK_GAP_MINUTES: 15,    // Tracks within 15min = same session
  HIGH_INTENSITY_TRACKS: 20,    // 20+ tracks = very intense session
};

/**
 * Group plays into listening sessions based on time gaps
 */
function findListeningSessions(data: UserListeningData): Array<{
  startTime: Date;
  endTime: Date;
  tracks: any[];
  duration: number; // in hours
}> {
  if (data.recentlyPlayed.length === 0) return [];

  const sessions: Array<{
    startTime: Date;
    endTime: Date;
    tracks: any[];
    duration: number;
  }> = [];

  let currentSession: {
    startTime: Date;
    endTime: Date;
    tracks: any[];
  } | null = null;

  // Plays are in reverse chronological order, so reverse to process chronologically
  const chronologicalPlays = [...data.recentlyPlayed].reverse();

  chronologicalPlays.forEach((play, index) => {
    const playTime = new Date(play.played_at);

    if (!currentSession) {
      // Start new session
      currentSession = {
        startTime: playTime,
        endTime: playTime,
        tracks: [play.track],
      };
    } else {
      // Check if this play is within gap threshold
      const timeSinceLastPlay = (playTime.getTime() - currentSession.endTime.getTime()) / (1000 * 60); // minutes

      if (timeSinceLastPlay <= CONFIG.MAX_TRACK_GAP_MINUTES) {
        // Continue current session
        currentSession.endTime = playTime;
        currentSession.tracks.push(play.track);
      } else {
        // Session ended, save it if it's long enough
        if (currentSession.tracks.length >= CONFIG.MIN_TRACKS_PER_BINGE) {
          const duration = (currentSession.endTime.getTime() - currentSession.startTime.getTime()) / (1000 * 60 * 60);
          sessions.push({
            ...currentSession,
            duration,
          });
        }

        // Start new session
        currentSession = {
          startTime: playTime,
          endTime: playTime,
          tracks: [play.track],
        };
      }
    }

    // Handle last play
    if (index === chronologicalPlays.length - 1 && currentSession && currentSession.tracks.length >= CONFIG.MIN_TRACKS_PER_BINGE) {
      const duration = (currentSession.endTime.getTime() - currentSession.startTime.getTime()) / (1000 * 60 * 60);
      sessions.push({
        ...currentSession,
        duration,
      });
    }
  });

  return sessions.sort((a, b) => b.tracks.length - a.tracks.length);
}

/**
 * Detect The Binge Listener pattern
 *
 * Identifies concentrated, immersive listening sessions. This indicates:
 * - Deep emotional processing through music
 * - Escapism or avoidance behavior
 * - Flow state during work/creative time
 * - Music as primary activity, not background
 *
 * When you play 15+ tracks in 2 hours, you're not just listening -
 * you're using music to sustain a specific mental/emotional state.
 *
 * @param data - User's complete listening data
 * @returns Detection result or null if pattern not found
 */
export async function detectBingeListener(
  data: UserListeningData
): Promise<DetectionResult | null> {
  console.log('[Binge Listener] Starting detection...');

  const sessions = findListeningSessions(data);

  console.log(`[Binge Listener] Found ${sessions.length} binge sessions with ${CONFIG.MIN_TRACKS_PER_BINGE}+ tracks`);
  if (sessions.length > 0) {
    sessions.forEach((session, i) => {
      console.log(`  ${i + 1}. ${session.tracks.length} tracks in ${session.duration.toFixed(1)}h (${session.startTime.toLocaleString()})`);
    });
  }

  if (sessions.length < CONFIG.MIN_BINGE_SESSIONS) {
    console.log(`[Binge Listener] Only ${sessions.length} sessions, below threshold of ${CONFIG.MIN_BINGE_SESSIONS}`);
    return null;
  }

  // Use the most intense session
  const biggestSession = sessions[0];

  // Calculate confidence based on session intensity and frequency
  // 10 tracks = 0.7, 20+ tracks = 0.9
  let confidence = Math.min(0.5 + (biggestSession.tracks.length * 0.02), 0.95);

  // Bonus for multiple binge sessions (pattern, not anomaly)
  if (sessions.length >= 3) {
    confidence = Math.min(confidence + 0.1, 1.0);
  }

  // Build evidence
  const evidence: Evidence[] = [
    {
      type: 'count',
      value: sessions.length,
      humanReadable: `${sessions.length} intense listening sessions detected`
    },
    {
      type: 'count',
      value: biggestSession.tracks.length,
      humanReadable: `Biggest session: ${biggestSession.tracks.length} tracks in ${biggestSession.duration.toFixed(1)} hours`
    }
  ];

  // Show session details
  const formatTime = (date: Date) => {
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const displayHour = hours > 12 ? hours - 12 : (hours === 0 ? 12 : hours);
    return `${displayHour}:${minutes.toString().padStart(2, '0')}${ampm}`;
  };

  const sessionDate = biggestSession.startTime.toLocaleDateString();
  const startTime = formatTime(biggestSession.startTime);
  const endTime = formatTime(biggestSession.endTime);

  evidence.push({
    type: 'timestamp',
    value: [biggestSession.startTime, biggestSession.endTime],
    humanReadable: `${sessionDate}: ${startTime} - ${endTime}`
  });

  // Show sample tracks from session
  const sampleTracks = biggestSession.tracks
    .filter((track, index, self) =>
      index === self.findIndex(t => t.id === track.id)
    ) // Unique tracks only
    .slice(0, 3)
    .map(t => t.name);

  if (sampleTracks.length > 0) {
    evidence.push({
      type: 'track',
      value: sampleTracks,
      humanReadable: `Sample tracks: "${sampleTracks.join('", "')}"`
    });
  }

  // Calculate average tracks per session
  const avgTracksPerSession = sessions.reduce((sum, s) => sum + s.tracks.length, 0) / sessions.length;
  evidence.push({
    type: 'ratio',
    value: avgTracksPerSession,
    humanReadable: `Average: ${avgTracksPerSession.toFixed(0)} tracks per session`
  });

  // Add interpretation based on intensity
  if (biggestSession.tracks.length >= CONFIG.HIGH_INTENSITY_TRACKS) {
    evidence.push({
      type: 'count',
      value: 'extreme',
      humanReadable: `${biggestSession.tracks.length} tracks in ${biggestSession.duration.toFixed(1)}h - you don't just listen, you immerse`
    });
  } else {
    evidence.push({
      type: 'count',
      value: 'high',
      humanReadable: `Concentrated sessions suggest music as emotional processing tool, not just background`
    });
  }

  // Check time of day patterns
  const sessionHours = sessions.map(s => s.startTime.getHours());
  const nightSessions = sessionHours.filter(h => h >= 20 || h < 4).length;

  if (nightSessions >= sessions.length / 2) {
    evidence.push({
      type: 'timestamp',
      value: 'night',
      humanReadable: `Most sessions at night - using music to process the day or as company`
    });
  }

  return {
    patternId: 33,
    patternName: 'The Binge Listener',
    confidence,
    evidence,
    psychologicalDimension: 'emotional regulation',
    category: 'repetition',
    insightPotential: 0, // Will be calculated by runner
  };
}
