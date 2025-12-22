/**
 * The Day/Night Persona Detector
 *
 * Detects when your morning listening (5AM-2PM) is distinctly different from
 * your evening listening (6PM-2AM) in terms of artists, energy, or mood.
 * Reveals intentional emotional architecture - using different music to support
 * different modes of being across the day.
 *
 * "Morning you" and "evening you" are different people with different needs.
 *
 * Pattern ID: 38
 * Category: temporal
 * Psychological Dimension: emotional regulation
 * Priority: V1 - High Priority
 */

import type { UserListeningData, DetectionResult, Evidence } from '../types';

/**
 * Configuration for day/night persona detection
 */
const CONFIG = {
  MIN_PLAYS_EACH: 5,             // Need 5+ plays in each time period for separation analysis
  MIN_PLAYS_TOTAL: 10,           // OR need 10+ total plays for concentration analysis
  MIN_CONCENTRATION: 0.75,       // 75%+ concentration in one period = strong pattern
  MIN_SEPARATION: 0.6,           // 60%+ of top artists differ between periods
  MORNING_START: 5,              // 5:00 AM
  MORNING_END: 14,               // 2:00 PM
  EVENING_START: 18,             // 6:00 PM
  EVENING_END: 26,               // 2:00 AM (next day)
};

/**
 * Categorize listening by time of day
 */
function analyzeTimeOfDayPatterns(data: UserListeningData): {
  morningArtists: Map<string, { artist: any; count: number }>;
  eveningArtists: Map<string, { artist: any; count: number }>;
  morningTracks: any[];
  eveningTracks: any[];
  totalMorning: number;
  totalEvening: number;
} {
  const morningArtists = new Map<string, { artist: any; count: number }>();
  const eveningArtists = new Map<string, { artist: any; count: number }>();
  const morningTracks: any[] = [];
  const eveningTracks: any[] = [];

  data.recentlyPlayed.forEach(play => {
    const playTime = new Date(play.played_at);
    const hour = playTime.getHours();

    const isMorning = hour >= CONFIG.MORNING_START && hour < CONFIG.MORNING_END;
    const isEvening = hour >= CONFIG.EVENING_START || hour < 2; // 6PM - 2AM

    if (isMorning) {
      morningTracks.push(play);
      const artist = play.track.artists[0];
      const existing = morningArtists.get(artist.id);
      if (existing) {
        existing.count++;
      } else {
        morningArtists.set(artist.id, { artist, count: 1 });
      }
    }

    if (isEvening) {
      eveningTracks.push(play);
      const artist = play.track.artists[0];
      const existing = eveningArtists.get(artist.id);
      if (existing) {
        existing.count++;
      } else {
        eveningArtists.set(artist.id, { artist, count: 1 });
      }
    }
  });

  return {
    morningArtists,
    eveningArtists,
    morningTracks,
    eveningTracks,
    totalMorning: morningTracks.length,
    totalEvening: eveningTracks.length,
  };
}

/**
 * Calculate separation between morning and evening artists
 */
function calculateSeparation(
  morningArtists: Map<string, { artist: any; count: number }>,
  eveningArtists: Map<string, { artist: any; count: number }>
): {
  separation: number;
  morningExclusive: Array<{ artist: any; count: number }>;
  eveningExclusive: Array<{ artist: any; count: number }>;
  shared: Array<{ artist: any; morningCount: number; eveningCount: number }>;
} {
  const morningOnly: Array<{ artist: any; count: number }> = [];
  const eveningOnly: Array<{ artist: any; count: number }> = [];
  const shared: Array<{ artist: any; morningCount: number; eveningCount: number }> = [];

  // Find morning-exclusive artists
  morningArtists.forEach((data, artistId) => {
    if (!eveningArtists.has(artistId)) {
      morningOnly.push(data);
    } else {
      const eveningData = eveningArtists.get(artistId)!;
      shared.push({
        artist: data.artist,
        morningCount: data.count,
        eveningCount: eveningData.count,
      });
    }
  });

  // Find evening-exclusive artists
  eveningArtists.forEach((data, artistId) => {
    if (!morningArtists.has(artistId)) {
      eveningOnly.push(data);
    }
  });

  const totalUniqueArtists = morningArtists.size + eveningArtists.size - shared.length;
  const exclusiveArtists = morningOnly.length + eveningOnly.length;
  const separation = exclusiveArtists / totalUniqueArtists;

  return {
    separation,
    morningExclusive: morningOnly.sort((a, b) => b.count - a.count),
    eveningExclusive: eveningOnly.sort((a, b) => b.count - a.count),
    shared: shared.sort((a, b) => (b.morningCount + b.eveningCount) - (a.morningCount + a.eveningCount)),
  };
}

/**
 * Detect The Day/Night Persona pattern
 *
 * Identifies distinct listening patterns between morning and evening. This indicates:
 * - Intentional emotional regulation across day phases
 * - Different modes of being (productive vs. reflective)
 * - Music as functional tool for state management
 * - High self-awareness of temporal mood patterns
 *
 * When morning you and evening you listen to different artists, you're not
 * just responding to moods - you're actively architecting your emotional day.
 *
 * @param data - User's complete listening data
 * @returns Detection result or null if pattern not found
 */
export async function detectTheDayNightPersona(
  data: UserListeningData
): Promise<DetectionResult | null> {
  console.log('[Day/Night Persona] Starting detection...');

  const timePatterns = analyzeTimeOfDayPatterns(data);

  console.log(`[Day/Night Persona] ${timePatterns.totalMorning} morning plays, ${timePatterns.totalEvening} evening plays`);
  console.log(`  ${timePatterns.morningArtists.size} morning artists, ${timePatterns.eveningArtists.size} evening artists`);

  const totalPlays = timePatterns.totalMorning + timePatterns.totalEvening;
  const morningConcentration = totalPlays > 0 ? timePatterns.totalMorning / totalPlays : 0;
  const eveningConcentration = totalPlays > 0 ? timePatterns.totalEvening / totalPlays : 0;

  // Check for strong concentration in ONE period (e.g., 82% morning)
  const hasStrongConcentration = totalPlays >= CONFIG.MIN_PLAYS_TOTAL &&
    (morningConcentration >= CONFIG.MIN_CONCENTRATION || eveningConcentration >= CONFIG.MIN_CONCENTRATION);

  // Check for distinct separation when BOTH periods have data
  const hasBothPeriods = timePatterns.totalMorning >= CONFIG.MIN_PLAYS_EACH &&
    timePatterns.totalEvening >= CONFIG.MIN_PLAYS_EACH;

  if (hasStrongConcentration) {
    // Strong concentration pattern detected
    const dominantPeriod = morningConcentration > eveningConcentration ? 'morning' : 'evening';
    const concentration = Math.max(morningConcentration, eveningConcentration);
    console.log(`[Day/Night Persona] Strong ${dominantPeriod} concentration: ${(concentration * 100).toFixed(0)}%`);

    // Calculate confidence based on concentration
    let confidence = Math.min(0.6 + (concentration * 0.4), 0.95);

    // Build evidence for concentration pattern
    const evidence: Evidence[] = [
      {
        type: 'ratio',
        value: concentration,
        humanReadable: `${Math.round(concentration * 100)}% of your listening happens in ${dominantPeriod} hours`
      },
      {
        type: 'count',
        value: dominantPeriod === 'morning' ? timePatterns.totalMorning : timePatterns.totalEvening,
        humanReadable: `${dominantPeriod === 'morning' ? timePatterns.totalMorning : timePatterns.totalEvening} ${dominantPeriod} plays vs ${dominantPeriod === 'morning' ? timePatterns.totalEvening : timePatterns.totalMorning} ${dominantPeriod === 'morning' ? 'evening' : 'morning'} plays`
      },
      {
        type: 'timestamp',
        value: dominantPeriod,
        humanReadable: dominantPeriod === 'morning'
          ? `Morning hours (5AM-2PM) - you're a daytime listener`
          : `Evening hours (6PM-2AM) - you're a nighttime listener`
      }
    ];

    if (concentration >= 0.85) {
      evidence.push({
        type: 'ratio',
        value: 'extreme',
        humanReadable: `${Math.round(concentration * 100)}% concentration - music is deeply tied to your ${dominantPeriod} routine`
      });
    } else {
      evidence.push({
        type: 'ratio',
        value: 'high',
        humanReadable: `Strong ${dominantPeriod} preference reveals when you most need music`
      });
    }

    return {
      patternId: 38,
      patternName: dominantPeriod === 'morning' ? 'The Morning Person' : 'The Night Owl',
      confidence,
      evidence,
      psychologicalDimension: 'emotional regulation',
      category: 'temporal',
      insightPotential: 0,
    };
  }

  if (!hasBothPeriods) {
    console.log('[Day/Night Persona] Insufficient plays in one or both time periods for separation analysis');
    return null;
  }

  // Analyze separation between periods
  const { separation, morningExclusive, eveningExclusive, shared } =
    calculateSeparation(timePatterns.morningArtists, timePatterns.eveningArtists);

  console.log(`[Day/Night Persona] Separation: ${(separation * 100).toFixed(0)}% (${morningExclusive.length} morning-only, ${eveningExclusive.length} evening-only)`);

  if (separation < CONFIG.MIN_SEPARATION) {
    console.log(`[Day/Night Persona] Separation ${(separation * 100).toFixed(0)}% below threshold of ${CONFIG.MIN_SEPARATION * 100}%`);
    return null;
  }

  // Calculate confidence based on separation
  // 60% = 0.75, 80%+ = 0.95
  let confidence = Math.min(0.6 + (separation * 0.5), 0.95);

  // Bonus for strong representation in both periods
  if (timePatterns.totalMorning >= 10 && timePatterns.totalEvening >= 10) {
    confidence = Math.min(confidence + 0.05, 1.0);
  }

  // Build evidence
  const evidence: Evidence[] = [
    {
      type: 'ratio',
      value: separation,
      humanReadable: `${Math.round(separation * 100)}% of your artists are exclusive to either morning or evening`
    },
    {
      type: 'count',
      value: timePatterns.totalMorning,
      humanReadable: `${timePatterns.totalMorning} tracks played in morning hours (5AM-2PM)`
    },
    {
      type: 'count',
      value: timePatterns.totalEvening,
      humanReadable: `${timePatterns.totalEvening} tracks played in evening hours (6PM-2AM)`
    }
  ];

  // Show morning-exclusive artists
  if (morningExclusive.length > 0) {
    const topMorning = morningExclusive.slice(0, 3).map(a => a.artist.name);
    evidence.push({
      type: 'artist',
      value: topMorning,
      humanReadable: `Morning-only artists: ${topMorning.join(', ')}`
    });
  }

  // Show evening-exclusive artists
  if (eveningExclusive.length > 0) {
    const topEvening = eveningExclusive.slice(0, 3).map(a => a.artist.name);
    evidence.push({
      type: 'artist',
      value: topEvening,
      humanReadable: `Evening-only artists: ${topEvening.join(', ')}`
    });
  }

  // Add interpretation based on separation intensity
  if (separation >= 0.8) {
    evidence.push({
      type: 'ratio',
      value: 'extreme',
      humanReadable: `${Math.round(separation * 100)}% separation - morning you and evening you are different people`
    });
  } else {
    evidence.push({
      type: 'ratio',
      value: 'strong',
      humanReadable: `Distinct temporal personas - you use music to support different modes of being across the day`
    });
  }

  // Show shared artists if any exist
  if (shared.length > 0) {
    const topShared = shared[0];
    evidence.push({
      type: 'artist',
      value: topShared.artist.name,
      humanReadable: `Only ${shared.length} artists span both periods - most notable: ${topShared.artist.name} (${topShared.morningCount} morning, ${topShared.eveningCount} evening)`
    });
  }

  // Add functional interpretation
  evidence.push({
    type: 'count',
    value: 'functional',
    humanReadable: `This reveals intentional emotional architecture - you're actively managing your state through music`
  });

  return {
    patternId: 38,
    patternName: 'The Day/Night Persona',
    confidence,
    evidence,
    psychologicalDimension: 'emotional regulation',
    category: 'temporal',
    insightPotential: 0, // Will be calculated by runner
  };
}
