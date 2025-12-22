/**
 * The Momentum Builder Detector
 *
 * Detects when your listening sessions show progressive intensification -
 * starting with a few tracks, then ramping up to extended listening. This
 * reveals music as a tool for entering flow states, building energy, or
 * transitioning into deeper work/emotional processing modes.
 *
 * Different from Binge Listener - this is about the RAMP-UP pattern,
 * not just session length.
 *
 * Pattern ID: 39
 * Category: temporal
 * Psychological Dimension: cognitive state transition
 * Priority: V1 - Medium Priority
 */

import type { UserListeningData, DetectionResult, Evidence } from '../types';

/**
 * Configuration for momentum builder detection
 */
const CONFIG = {
  MIN_SESSIONS: 2,               // Need at least 2 momentum sessions
  MIN_SESSION_LENGTH: 8,         // Session must have 8+ tracks
  MAX_TRACK_GAP_MINUTES: 20,     // Tracks within 20min = same session
  RAMP_THRESHOLD: 1.5,           // Second half must be 1.5x longer than first half
};

/**
 * Analyze listening sessions for momentum patterns
 */
function findMomentumSessions(data: UserListeningData): Array<{
  startTime: Date;
  endTime: Date;
  trackCount: number;
  firstHalfDuration: number;  // in minutes
  secondHalfDuration: number; // in minutes
  rampRatio: number;
  tracks: any[];
}> {
  if (data.recentlyPlayed.length === 0) return [];

  const chronologicalPlays = [...data.recentlyPlayed].reverse();

  let currentSession: {
    tracks: any[];
    times: Date[];
  } | null = null;

  const allSessions: Array<{
    tracks: any[];
    times: Date[];
  }> = [];

  // Group plays into sessions
  chronologicalPlays.forEach((play, index) => {
    const playTime = new Date(play.played_at);

    if (!currentSession) {
      currentSession = {
        tracks: [play.track],
        times: [playTime],
      };
    } else {
      const lastTime = currentSession.times[currentSession.times.length - 1];
      const timeSinceLastPlay = (playTime.getTime() - lastTime.getTime()) / (1000 * 60);

      if (timeSinceLastPlay <= CONFIG.MAX_TRACK_GAP_MINUTES) {
        // Continue session
        currentSession.tracks.push(play.track);
        currentSession.times.push(playTime);
      } else {
        // Save session if long enough
        if (currentSession.tracks.length >= CONFIG.MIN_SESSION_LENGTH) {
          allSessions.push({ ...currentSession });
        }

        // Start new session
        currentSession = {
          tracks: [play.track],
          times: [playTime],
        };
      }
    }

    // Handle last play
    if (index === chronologicalPlays.length - 1 &&
        currentSession &&
        currentSession.tracks.length >= CONFIG.MIN_SESSION_LENGTH) {
      allSessions.push({ ...currentSession });
    }
  });

  // Analyze each session for momentum pattern
  const momentumSessions: Array<{
    startTime: Date;
    endTime: Date;
    trackCount: number;
    firstHalfDuration: number;
    secondHalfDuration: number;
    rampRatio: number;
    tracks: any[];
  }> = [];

  allSessions.forEach(session => {
    const startTime = session.times[0];
    const endTime = session.times[session.times.length - 1];
    const totalDuration = (endTime.getTime() - startTime.getTime()) / (1000 * 60); // minutes

    // Split session in half by track count
    const midpoint = Math.floor(session.times.length / 2);
    const firstHalfEnd = session.times[midpoint];
    const secondHalfStart = firstHalfEnd;

    const firstHalfDuration = (firstHalfEnd.getTime() - startTime.getTime()) / (1000 * 60);
    const secondHalfDuration = (endTime.getTime() - secondHalfStart.getTime()) / (1000 * 60);

    // Check if second half is significantly longer (shows ramp-up)
    const rampRatio = secondHalfDuration / firstHalfDuration;

    if (rampRatio >= CONFIG.RAMP_THRESHOLD) {
      momentumSessions.push({
        startTime,
        endTime,
        trackCount: session.tracks.length,
        firstHalfDuration,
        secondHalfDuration,
        rampRatio,
        tracks: session.tracks,
      });
    }
  });

  return momentumSessions.sort((a, b) => b.rampRatio - a.rampRatio);
}

/**
 * Detect The Momentum Builder pattern
 *
 * Identifies sessions where listening progressively intensifies. This indicates:
 * - Using music to enter flow states
 * - Building energy for work/creative sessions
 * - Progressive emotional deepening
 * - Music as transition tool into altered states
 *
 * When your sessions show ramp-up patterns, you're not just listening -
 * you're using music to build and sustain a specific cognitive/emotional state.
 *
 * @param data - User's complete listening data
 * @returns Detection result or null if pattern not found
 */
export async function detectTheMomentumBuilder(
  data: UserListeningData
): Promise<DetectionResult | null> {
  console.log('[Momentum Builder] Starting detection...');

  const momentumSessions = findMomentumSessions(data);

  console.log(`[Momentum Builder] Found ${momentumSessions.length} momentum-building sessions`);
  if (momentumSessions.length > 0) {
    momentumSessions.forEach((session, i) => {
      console.log(`  ${i + 1}. ${session.trackCount} tracks, ramp ratio: ${session.rampRatio.toFixed(1)}x (${session.firstHalfDuration.toFixed(0)}min → ${session.secondHalfDuration.toFixed(0)}min)`);
    });
  }

  if (momentumSessions.length < CONFIG.MIN_SESSIONS) {
    console.log(`[Momentum Builder] Only ${momentumSessions.length} sessions, below threshold of ${CONFIG.MIN_SESSIONS}`);
    return null;
  }

  // Use the strongest momentum session
  const topSession = momentumSessions[0];

  // Calculate confidence based on ramp ratio and session count
  // 1.5x = 0.7, 2.5x+ = 0.9
  let confidence = Math.min(0.5 + (topSession.rampRatio * 0.2), 0.9);

  // Bonus for multiple momentum sessions (pattern, not anomaly)
  if (momentumSessions.length >= 3) {
    confidence = Math.min(confidence + 0.1, 1.0);
  }

  // Build evidence
  const evidence: Evidence[] = [
    {
      type: 'count',
      value: momentumSessions.length,
      humanReadable: `${momentumSessions.length} sessions with progressive intensification detected`
    },
    {
      type: 'ratio',
      value: topSession.rampRatio,
      humanReadable: `Strongest session: ${topSession.rampRatio.toFixed(1)}x ramp-up (${topSession.trackCount} tracks)`
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

  const sessionDate = topSession.startTime.toLocaleDateString();
  const startTime = formatTime(topSession.startTime);
  const midTime = new Date(topSession.startTime.getTime() + topSession.firstHalfDuration * 60 * 1000);
  const midTimeStr = formatTime(midTime);

  evidence.push({
    type: 'timestamp',
    value: [topSession.startTime, midTime],
    humanReadable: `${sessionDate}: Started at ${startTime}, ramped up after ${midTimeStr}`
  });

  evidence.push({
    type: 'count',
    value: topSession.firstHalfDuration,
    humanReadable: `First half: ${Math.round(topSession.firstHalfDuration)}min for ${Math.floor(topSession.trackCount / 2)} tracks`
  });

  evidence.push({
    type: 'count',
    value: topSession.secondHalfDuration,
    humanReadable: `Second half: ${Math.round(topSession.secondHalfDuration)}min for ${Math.ceil(topSession.trackCount / 2)} tracks`
  });

  // Add interpretation based on ramp intensity
  if (topSession.rampRatio >= 2.5) {
    evidence.push({
      type: 'ratio',
      value: 'extreme',
      humanReadable: `${topSession.rampRatio.toFixed(1)}x ramp - you use music to build and sustain deep focus or emotional states`
    });
  } else {
    evidence.push({
      type: 'ratio',
      value: 'moderate',
      humanReadable: `Progressive intensification - music helps you transition into deeper engagement`
    });
  }

  // Average ramp ratio across all sessions
  const avgRampRatio = momentumSessions.reduce((sum, s) => sum + s.rampRatio, 0) / momentumSessions.length;
  evidence.push({
    type: 'ratio',
    value: avgRampRatio,
    humanReadable: `Average ramp-up: ${avgRampRatio.toFixed(1)}x across ${momentumSessions.length} sessions`
  });

  // Check time of day pattern
  const sessionHours = momentumSessions.map(s => s.startTime.getHours());
  const workHours = sessionHours.filter(h => h >= 9 && h <= 17).length;

  if (workHours >= momentumSessions.length / 2) {
    evidence.push({
      type: 'timestamp',
      value: 'work-hours',
      humanReadable: `Most momentum sessions during work hours - using music to enter productive flow states`
    });
  }

  return {
    patternId: 39,
    patternName: 'The Momentum Builder',
    confidence,
    evidence,
    psychologicalDimension: 'cognitive state transition',
    category: 'temporal',
    insightPotential: 0, // Will be calculated by runner
  };
}
