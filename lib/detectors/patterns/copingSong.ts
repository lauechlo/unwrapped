/**
 * Coping Song Detector
 *
 * Detects tracks played multiple times in rapid succession (within minutes).
 * When you play the same song 3+ times back-to-back, it's not about enjoying
 * the music - it's about emotional regulation. This reveals active coping
 * behavior: rumination, processing, or seeking specific emotional states.
 *
 * Pattern ID: 35
 * Category: emotional
 * Psychological Dimension: emotional regulation
 * Priority: V1 - High Priority
 */

import type { UserListeningData, DetectionResult, Evidence } from '../types';

/**
 * Configuration for coping song detection
 */
const CONFIG = {
  MIN_CONSECUTIVE_PLAYS: 3,     // 3+ plays in a row
  MAX_GAP_MINUTES: 10,          // Within 10 minutes = rapid succession
  MIN_REPEAT_SESSIONS: 2,       // Need at least 2 instances of this behavior
};

/**
 * Find tracks played in rapid succession
 */
function findRepeatSessions(data: UserListeningData): Array<{
  track: any;
  sessions: Array<{
    startTime: Date;
    playCount: number;
    duration: number; // minutes
  }>;
  totalRepeats: number;
}> {
  const trackSessions = new Map<string, {
    track: any;
    sessions: Array<{
      startTime: Date;
      playCount: number;
      duration: number;
    }>;
  }>();

  // Process plays in chronological order
  const chronologicalPlays = [...data.recentlyPlayed].reverse();

  let currentTrackId: string | null = null;
  let currentSession: {
    trackId: string;
    track: any;
    startTime: Date;
    lastTime: Date;
    playCount: number;
  } | null = null;

  chronologicalPlays.forEach((play, index) => {
    const playTime = new Date(play.played_at);

    // Check if this is a repeat of the previous track
    if (play.track.id === currentTrackId && currentSession) {
      const timeSinceLastPlay = (playTime.getTime() - currentSession.lastTime.getTime()) / (1000 * 60);

      if (timeSinceLastPlay <= CONFIG.MAX_GAP_MINUTES) {
        // Continue current repeat session
        currentSession.playCount++;
        currentSession.lastTime = playTime;
      } else {
        // Gap too large, end session
        if (currentSession.playCount >= CONFIG.MIN_CONSECUTIVE_PLAYS) {
          const duration = (currentSession.lastTime.getTime() - currentSession.startTime.getTime()) / (1000 * 60);

          const existing = trackSessions.get(currentSession.trackId);
          if (existing) {
            existing.sessions.push({
              startTime: currentSession.startTime,
              playCount: currentSession.playCount,
              duration,
            });
          } else {
            trackSessions.set(currentSession.trackId, {
              track: currentSession.track,
              sessions: [{
                startTime: currentSession.startTime,
                playCount: currentSession.playCount,
                duration,
              }],
            });
          }
        }

        // Start new session with this play
        currentTrackId = play.track.id;
        currentSession = {
          trackId: play.track.id,
          track: play.track,
          startTime: playTime,
          lastTime: playTime,
          playCount: 1,
        };
      }
    } else {
      // Different track - save previous session if it qualifies
      if (currentSession && currentSession.playCount >= CONFIG.MIN_CONSECUTIVE_PLAYS) {
        const duration = (currentSession.lastTime.getTime() - currentSession.startTime.getTime()) / (1000 * 60);

        const existing = trackSessions.get(currentSession.trackId);
        if (existing) {
          existing.sessions.push({
            startTime: currentSession.startTime,
            playCount: currentSession.playCount,
            duration,
          });
        } else {
          trackSessions.set(currentSession.trackId, {
            track: currentSession.track,
            sessions: [{
              startTime: currentSession.startTime,
              playCount: currentSession.playCount,
              duration,
            }],
          });
        }
      }

      // Start new session
      currentTrackId = play.track.id;
      currentSession = {
        trackId: play.track.id,
        track: play.track,
        startTime: playTime,
        lastTime: playTime,
        playCount: 1,
      };
    }

    // Handle last play
    if (index === chronologicalPlays.length - 1 && currentSession && currentSession.playCount >= CONFIG.MIN_CONSECUTIVE_PLAYS) {
      const duration = (currentSession.lastTime.getTime() - currentSession.startTime.getTime()) / (1000 * 60);

      const existing = trackSessions.get(currentSession.trackId);
      if (existing) {
        existing.sessions.push({
          startTime: currentSession.startTime,
          playCount: currentSession.playCount,
          duration,
        });
      } else {
        trackSessions.set(currentSession.trackId, {
          track: currentSession.track,
          sessions: [{
            startTime: currentSession.startTime,
            playCount: currentSession.playCount,
            duration,
          }],
        });
      }
    }
  });

  // Convert to array and filter by minimum sessions
  const copingSongs: Array<{
    track: any;
    sessions: Array<{
      startTime: Date;
      playCount: number;
      duration: number;
    }>;
    totalRepeats: number;
  }> = [];

  trackSessions.forEach((data) => {
    if (data.sessions.length >= CONFIG.MIN_REPEAT_SESSIONS) {
      const totalRepeats = data.sessions.reduce((sum, s) => sum + s.playCount, 0);
      copingSongs.push({
        track: data.track,
        sessions: data.sessions,
        totalRepeats,
      });
    }
  });

  // Sort by total repeat count
  return copingSongs.sort((a, b) => b.totalRepeats - a.totalRepeats);
}

/**
 * Detect Coping Song pattern
 *
 * Identifies tracks played in rapid succession. This indicates:
 * - Active emotional processing through repetition
 * - Rumination or obsessive thought patterns
 * - Seeking specific emotional state or catharsis
 * - Music as immediate coping tool during stress
 *
 * Playing the same song 3+ times in a row isn't about enjoying it -
 * it's about what the song is doing *for* you in that moment.
 *
 * @param data - User's complete listening data
 * @returns Detection result or null if pattern not found
 */
export async function detectCopingSong(
  data: UserListeningData
): Promise<DetectionResult | null> {
  console.log('[Coping Song] Starting detection...');

  const copingSongs = findRepeatSessions(data);

  console.log(`[Coping Song] Found ${copingSongs.length} tracks with ${CONFIG.MIN_REPEAT_SESSIONS}+ repeat sessions`);
  if (copingSongs.length > 0) {
    copingSongs.forEach((song, i) => {
      console.log(`  ${i + 1}. "${song.track.name}": ${song.sessions.length} sessions, ${song.totalRepeats} total repeats`);
    });
  }

  if (copingSongs.length === 0) {
    console.log('[Coping Song] No rapid repeat patterns detected');
    return null;
  }

  // Use the song with most repeat behavior
  const theCopingSong = copingSongs[0];

  // Calculate confidence based on repeat frequency and session count
  // 2 sessions = 0.75, 4+ sessions = 0.95
  let confidence = Math.min(0.6 + (theCopingSong.sessions.length * 0.1), 0.95);

  // Bonus for high repeat counts
  const maxRepeats = Math.max(...theCopingSong.sessions.map(s => s.playCount));
  if (maxRepeats >= 5) {
    confidence = Math.min(confidence + 0.1, 1.0);
  }

  // Build evidence
  const evidence: Evidence[] = [
    {
      type: 'track',
      value: theCopingSong.track,
      humanReadable: `"${theCopingSong.track.name}" by ${theCopingSong.track.artists[0].name}`
    },
    {
      type: 'count',
      value: theCopingSong.sessions.length,
      humanReadable: `Played on repeat ${theCopingSong.sessions.length} different times`
    },
    {
      type: 'count',
      value: maxRepeats,
      humanReadable: `Up to ${maxRepeats} consecutive plays in a single session`
    }
  ];

  // Show most intense session
  const mostIntenseSession = theCopingSong.sessions.sort((a, b) => b.playCount - a.playCount)[0];

  const formatTime = (date: Date) => {
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const displayHour = hours > 12 ? hours - 12 : (hours === 0 ? 12 : hours);
    return `${displayHour}:${minutes.toString().padStart(2, '0')}${ampm}`;
  };

  const sessionDate = mostIntenseSession.startTime.toLocaleDateString();
  const sessionTime = formatTime(mostIntenseSession.startTime);

  evidence.push({
    type: 'timestamp',
    value: mostIntenseSession.startTime,
    humanReadable: `Most intense: ${mostIntenseSession.playCount} times on ${sessionDate} starting at ${sessionTime}`
  });

  // Add interpretation based on intensity
  if (maxRepeats >= 5) {
    evidence.push({
      type: 'count',
      value: 'extreme',
      humanReadable: `${maxRepeats} consecutive plays - this is active emotional processing, not casual listening`
    });
  } else {
    evidence.push({
      type: 'count',
      value: 'strong',
      humanReadable: `Rapid repetition reveals this song serves an immediate coping function`
    });
  }

  // Check if it's a late-night pattern
  const nightSessions = theCopingSong.sessions.filter(s => {
    const hour = s.startTime.getHours();
    return hour >= 22 || hour < 4;
  }).length;

  if (nightSessions >= theCopingSong.sessions.length / 2) {
    evidence.push({
      type: 'timestamp',
      value: 'night',
      humanReadable: `Often happens late at night - processing difficult emotions when alone`
    });
  }

  // Check if track is in top tracks
  const inTopTracks = data.topTracks.short.some(t => t.id === theCopingSong.track.id);
  if (inTopTracks) {
    evidence.push({
      type: 'track',
      value: 'top',
      humanReadable: `Also in your top tracks - this is a consistent coping tool, not a one-time thing`
    });
  }

  return {
    patternId: 35,
    patternName: 'Coping Song',
    confidence,
    evidence,
    psychologicalDimension: 'emotional regulation',
    category: 'emotional',
    insightPotential: 0, // Will be calculated by runner
  };
}
