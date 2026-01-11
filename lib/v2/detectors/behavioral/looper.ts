// The Looper Detector
// Finds consecutive plays of the same track
// Psychology: Emotional processing, coping mechanism, obsessive attachment

import { SourceOfTruth, DetectionResult, Evidence, TrackAggregate } from '../../types';

const PATTERN_ID = 'the-looper';
const PATTERN_NAME = 'The Looper';
const PATTERN_FAMILY = 'repetition';
const BASE_RATE = 0.80; // ~22% of users have looping behavior

interface LooperCandidate {
  track: TrackAggregate;
  maxConsecutive: number;
  loopStartTime: Date;
  loopEndTime: Date;
  totalLoopDuration: number;
  avgTimeBetweenPlays: number;
  loopInstanceIndices: number[];
}

/**
 * Detect consecutive track looping behavior
 *
 * @param sot - SourceOfTruth index
 * @param maxResults - Maximum number of results to return (default 10)
 * @returns Array of detection results for looping patterns
 */
export function detectLooper(sot: SourceOfTruth, maxResults: number = 10): DetectionResult[] {
  const candidates = findLooperCandidates(sot);

  if (candidates.length === 0) return [];

  // Sort by max consecutive plays (most extreme looping first)
  candidates.sort((a, b) => b.maxConsecutive - a.maxConsecutive);

  // Filter candidates that meet threshold
  const validCandidates = candidates.filter(candidate => {
    // Threshold:
    // - At least 5 consecutive plays (significant looping)
    return candidate.maxConsecutive >= 5;
  });

  if (validCandidates.length === 0) return [];

  // Return top N results
  return validCandidates.slice(0, maxResults).map(candidate => {
    // Calculate confidence based on consecutive count
    const confidence = Math.min(candidate.maxConsecutive / 20, 1.0);

    // Calculate distinctiveness
    const distinctiveness = calculateDistinctiveness(
      candidate.maxConsecutive,
      candidate.avgTimeBetweenPlays,
      BASE_RATE
    );

    // Format time of loop
    const loopTime = formatLoopTime(candidate.loopStartTime);

    // Calculate total duration
    const totalMinutes = Math.round(candidate.totalLoopDuration / 60000);

    // Build evidence
    const evidence: Evidence[] = [
      {
        type: 'track',
        metric: 'looped_track',
        value: candidate.track.name,
        sourceIndices: candidate.loopInstanceIndices,
        humanReadable: `"${candidate.track.name}" by ${candidate.track.artist}`,
      },
      {
        type: 'count',
        metric: 'consecutive_plays',
        value: candidate.maxConsecutive,
        sourceIndices: [],
        humanReadable: `${candidate.maxConsecutive} consecutive plays`,
      },
      {
        type: 'timestamp',
        metric: 'loop_start',
        value: candidate.loopStartTime.toISOString(),
        sourceIndices: [],
        humanReadable: loopTime,
      },
      {
        type: 'duration',
        metric: 'total_loop_duration',
        value: candidate.totalLoopDuration,
        sourceIndices: [],
        humanReadable: `${totalMinutes} minutes of looping`,
      },
    ];

    // Add average time between plays if significant
    if (candidate.avgTimeBetweenPlays > 0) {
      const avgSeconds = Math.round(candidate.avgTimeBetweenPlays / 1000);
      evidence.push({
        type: 'duration',
        metric: 'avg_gap',
        value: candidate.avgTimeBetweenPlays,
        sourceIndices: [],
        humanReadable: `Avg ${avgSeconds}s between plays`,
      });
    }

    // Add detailed loop timeline
    const loopPlays = candidate.loopInstanceIndices
      .map(idx => candidate.track.plays.find(p => p.rawIndex === idx))
      .filter(p => p !== undefined)
      .slice(0, candidate.maxConsecutive);

    if (loopPlays.length > 0) {
      const loopTimeline = loopPlays
        .map((play, i) => {
          const time = play.timestamp.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', second: '2-digit' });
          const duration = Math.round(play.msPlayed / 1000);
          const status = play.completed ? '✓' : play.skipped ? '⏭' : '⏸';
          return `${i + 1}. ${time} - ${duration}s ${status}`;
        })
        .join('\n');

      evidence.push({
        type: 'timestamp',
        metric: 'loop_timeline',
        value: loopTimeline,
        sourceIndices: [],
        humanReadable: `LOOP TIMELINE:\n${loopTimeline}\n(✓=finished, ⏭=skipped, ⏸=paused)`,
      });

      // Calculate loop intensity stats
      const completedCount = loopPlays.filter(p => p.completed).length;
      const skippedCount = loopPlays.filter(p => p.skipped).length;
      const avgDuration = loopPlays.reduce((sum, p) => sum + p.msPlayed, 0) / loopPlays.length / 1000;

      evidence.push({
        type: 'ratio',
        metric: 'loop_intensity',
        value: completedCount / loopPlays.length,
        sourceIndices: [],
        humanReadable: `LOOP BEHAVIOR:\n- Completed: ${completedCount}/${loopPlays.length} plays\n- Skipped: ${skippedCount}/${loopPlays.length} plays\n- Avg play duration: ${Math.round(avgDuration)}s\n- Intensity: ${completedCount / loopPlays.length > 0.7 ? 'Deep immersion (mostly full listens)' : completedCount / loopPlays.length > 0.3 ? 'Mixed engagement (sampling + listening)' : 'Quick sampling (mostly skips)'}`,
      });
    }

    return {
      patternId: PATTERN_ID,
      patternName: PATTERN_NAME,
      patternFamily: PATTERN_FAMILY,
      confidence,
      distinctiveness,
      evidence,
      psychologicalBasis:
        'Repetitive listening as emotional processing. Consecutive track looping indicates intense emotional engagement, coping mechanism, or obsessive attachment (Saarikallio, 2007; DeNora, 2000)',
    };
  });
}

/**
 * Find consecutive looping instances
 */
function findLooperCandidates(sot: SourceOfTruth): LooperCandidate[] {
  const candidates: LooperCandidate[] = [];

  // Gather all plays from all tracks with their track info
  const allPlays: Array<{ track: TrackAggregate; play: any }> = [];
  for (const track of sot.tracks.values()) {
    for (const play of track.plays) {
      allPlays.push({ track, play });
    }
  }

  // Sort all plays chronologically
  const sortedPlays = allPlays.sort(
    (a, b) => a.play.timestamp.getTime() - b.play.timestamp.getTime()
  );

  if (sortedPlays.length === 0) return [];

  // Track current loop
  let currentTrack = sortedPlays[0].track;
  let currentTrackKey = `${currentTrack.name}|${currentTrack.artist}`;
  let currentConsecutive = 1;
  let currentLoopStart = sortedPlays[0].play.timestamp;
  let currentLoopIndices = [sortedPlays[0].play.rawIndex];
  let currentTimestamps = [sortedPlays[0].play.timestamp];

  // Track max loop for each track
  const trackMaxLoops = new Map<
    string,
    {
      track: TrackAggregate;
      maxConsecutive: number;
      loopStartTime: Date;
      loopEndTime: Date;
      loopIndices: number[];
      timestamps: Date[];
    }
  >();

  for (let i = 1; i < sortedPlays.length; i++) {
    const { track, play } = sortedPlays[i];
    const trackKey = `${track.name}|${track.artist}`;

    if (trackKey === currentTrackKey) {
      // Same track, continue loop
      currentConsecutive++;
      currentLoopIndices.push(play.rawIndex);
      currentTimestamps.push(play.timestamp);
    } else {
      // Different track, check if current loop is significant
      if (currentConsecutive >= 3) {
        const existing = trackMaxLoops.get(currentTrackKey);
        if (!existing || currentConsecutive > existing.maxConsecutive) {
          trackMaxLoops.set(currentTrackKey, {
            track: currentTrack,
            maxConsecutive: currentConsecutive,
            loopStartTime: currentLoopStart,
            loopEndTime: currentTimestamps[currentTimestamps.length - 1],
            loopIndices: [...currentLoopIndices],
            timestamps: [...currentTimestamps],
          });
        }
      }

      // Reset for new track
      currentTrack = track;
      currentTrackKey = trackKey;
      currentConsecutive = 1;
      currentLoopStart = play.timestamp;
      currentLoopIndices = [play.rawIndex];
      currentTimestamps = [play.timestamp];
    }
  }

  // Check final loop
  if (currentConsecutive >= 3) {
    const existing = trackMaxLoops.get(currentTrackKey);
    if (!existing || currentConsecutive > existing.maxConsecutive) {
      trackMaxLoops.set(currentTrackKey, {
        track: currentTrack,
        maxConsecutive: currentConsecutive,
        loopStartTime: currentLoopStart,
        loopEndTime: currentTimestamps[currentTimestamps.length - 1],
        loopIndices: [...currentLoopIndices],
        timestamps: [...currentTimestamps],
      });
    }
  }

  // Convert to candidates
  for (const loop of trackMaxLoops.values()) {
    // Calculate average time between plays
    let totalGap = 0;
    for (let i = 1; i < loop.timestamps.length; i++) {
      const gap = loop.timestamps[i].getTime() - loop.timestamps[i - 1].getTime();
      totalGap += gap;
    }
    const avgTimeBetweenPlays =
      loop.timestamps.length > 1 ? totalGap / (loop.timestamps.length - 1) : 0;

    // Calculate total loop duration
    const totalLoopDuration =
      loop.loopEndTime.getTime() - loop.loopStartTime.getTime();

    candidates.push({
      track: loop.track,
      maxConsecutive: loop.maxConsecutive,
      loopStartTime: loop.loopStartTime,
      loopEndTime: loop.loopEndTime,
      totalLoopDuration,
      avgTimeBetweenPlays,
      loopInstanceIndices: loop.loopIndices,
    });
  }

  return candidates;
}

/**
 * Format loop time for display
 */
function formatLoopTime(date: Date): string {
  const monthNames = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
  ];

  const month = monthNames[date.getMonth()];
  const day = date.getDate();
  const year = date.getFullYear();
  const hour = date.getHours();
  const minute = date.getMinutes();

  const hourDisplay = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  const ampm = hour >= 12 ? 'pm' : 'am';
  const minuteDisplay = minute.toString().padStart(2, '0');

  return `${month} ${day}, ${year} at ${hourDisplay}:${minuteDisplay}${ampm}`;
}

/**
 * Calculate distinctiveness
 */
function calculateDistinctiveness(
  maxConsecutive: number,
  avgTimeBetweenPlays: number,
  baseRate: number
): number {
  // More consecutive plays + shorter gaps = more distinctive
  const consecutiveScore = Math.min(maxConsecutive / 15, 1.0);

  // Shorter time between plays = more obsessive
  const gapScore = avgTimeBetweenPlays < 300000 ? 1.0 : 0.5; // <5 min = obsessive

  const score = (consecutiveScore * 0.8) + (gapScore * 0.2);
  return Math.min(score / baseRate, 1.0);
}
