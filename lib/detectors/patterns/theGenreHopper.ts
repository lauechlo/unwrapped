/**
 * The Genre Hopper Detector
 *
 * Detects frequent cross-genre switching within listening sessions. When you jump
 * from musical theatre to pop to soundtrack within minutes, you're not seeking
 * mood consistency - you're either highly distractible, cognitively flexible, or
 * using music for functional variety rather than emotional immersion.
 *
 * Contrast to Genre Purist. This reveals ADHD-like listening, exploratory behavior,
 * or resistance to sustained emotional states.
 *
 * Pattern ID: 37
 * Category: variety
 * Psychological Dimension: cognitive style
 * Priority: V1 - High Priority
 */

import type { UserListeningData, DetectionResult, Evidence } from '../types';

/**
 * Configuration for genre hopper detection
 */
const CONFIG = {
  MIN_GENRE_SWITCHES: 8,         // 8+ genre switches in recent plays
  MAX_SESSION_GAP_MINUTES: 30,   // Tracks within 30min = same session
  MIN_UNIQUE_GENRES: 5,           // Need 5+ different genres represented
};

/**
 * Extract primary genre from artist genres
 */
function getPrimaryGenre(genres: string[]): string {
  if (genres.length === 0) return 'unknown';
  // Take first genre as primary
  return genres[0];
}

/**
 * Count genre switches in listening history
 */
function countGenreSwitches(data: UserListeningData): {
  switches: number;
  uniqueGenres: Set<string>;
  sessions: Array<{
    startTime: Date;
    endTime: Date;
    genres: string[];
    switches: number;
  }>;
} {
  if (data.recentlyPlayed.length === 0) {
    return { switches: 0, uniqueGenres: new Set(), sessions: [] };
  }

  // Build artist ID -> genres mapping from topArtists (which HAS genre data)
  const artistGenreMap = new Map<string, string[]>();
  [...data.topArtists.short, ...data.topArtists.medium, ...data.topArtists.long].forEach(artist => {
    if (artist.genres && artist.genres.length > 0) {
      artistGenreMap.set(artist.id, artist.genres);
    }
  });

  const chronologicalPlays = [...data.recentlyPlayed].reverse();

  let totalSwitches = 0;
  const uniqueGenres = new Set<string>();
  let lastGenre: string | null = null;

  // Track sessions
  let currentSession: {
    startTime: Date;
    endTime: Date;
    genres: string[];
    switches: number;
  } | null = null;
  const sessions: Array<{
    startTime: Date;
    endTime: Date;
    genres: string[];
    switches: number;
  }> = [];

  chronologicalPlays.forEach((play, index) => {
    const playTime = new Date(play.played_at);

    // Look up artist genres from our enriched map
    const artistId = play.track.artists[0]?.id;
    const artistGenres = artistId ? (artistGenreMap.get(artistId) || []) : [];
    const genre = getPrimaryGenre(artistGenres);

    if (genre !== 'unknown') {
      uniqueGenres.add(genre);
    }

    // Session management
    if (!currentSession) {
      currentSession = {
        startTime: playTime,
        endTime: playTime,
        genres: [genre],
        switches: 0,
      };
    } else {
      const timeSinceLastPlay = (playTime.getTime() - currentSession.endTime.getTime()) / (1000 * 60);

      if (timeSinceLastPlay <= CONFIG.MAX_SESSION_GAP_MINUTES) {
        // Continue session
        currentSession.endTime = playTime;
        currentSession.genres.push(genre);

        // Check for genre switch
        if (lastGenre && genre !== lastGenre && genre !== 'unknown') {
          totalSwitches++;
          currentSession.switches++;
        }
      } else {
        // Save previous session
        if (currentSession.genres.length >= 3) {
          sessions.push({ ...currentSession });
        }

        // Start new session
        currentSession = {
          startTime: playTime,
          endTime: playTime,
          genres: [genre],
          switches: 0,
        };
      }
    }

    // Handle last play
    if (index === chronologicalPlays.length - 1 && currentSession && currentSession.genres.length >= 3) {
      sessions.push({ ...currentSession });
    }

    lastGenre = genre;
  });

  return {
    switches: totalSwitches,
    uniqueGenres,
    sessions: sessions.sort((a, b) => b.switches - a.switches),
  };
}

/**
 * Detect The Genre Hopper pattern
 *
 * Identifies frequent cross-genre switching in listening sessions. This indicates:
 * - High cognitive flexibility
 * - ADHD-like attention patterns
 * - Functional music use (context-driven) vs. mood immersion
 * - Resistance to sustained emotional states
 * - Exploratory listening style
 *
 * When you jump genres every few tracks, you're not settling into a mood -
 * you're either chasing variety or matching music to rapidly changing contexts.
 *
 * @param data - User's complete listening data
 * @returns Detection result or null if pattern not found
 */
export async function detectTheGenreHopper(
  data: UserListeningData
): Promise<DetectionResult | null> {
  console.log('[The Genre Hopper] Starting detection...');

  const { switches, uniqueGenres, sessions } = countGenreSwitches(data);

  console.log(`[The Genre Hopper] ${switches} genre switches across ${uniqueGenres.size} unique genres`);
  if (sessions.length > 0) {
    console.log(`  Found ${sessions.length} diverse sessions`);
    sessions.slice(0, 3).forEach((session, i) => {
      console.log(`    ${i + 1}. ${session.switches} switches, ${new Set(session.genres).size} genres (${session.genres.length} tracks)`);
    });
  }

  if (switches < CONFIG.MIN_GENRE_SWITCHES || uniqueGenres.size < CONFIG.MIN_UNIQUE_GENRES) {
    console.log(`[The Genre Hopper] Only ${switches} switches and ${uniqueGenres.size} genres, below thresholds`);
    return null;
  }

  // Calculate confidence based on switch frequency and genre diversity
  // 8 switches = 0.7, 15+ = 0.9
  let confidence = Math.min(0.5 + (switches * 0.03), 0.9);

  // Bonus for high genre diversity
  if (uniqueGenres.size >= 8) {
    confidence = Math.min(confidence + 0.1, 1.0);
  }

  // Build evidence
  const evidence: Evidence[] = [
    {
      type: 'count',
      value: switches,
      humanReadable: `${switches} genre switches in recent listening history`
    },
    {
      type: 'count',
      value: uniqueGenres.size,
      humanReadable: `${uniqueGenres.size} different genres in rotation`
    }
  ];

  // Show genre variety
  const genreList = Array.from(uniqueGenres)
    .filter(g => g !== 'unknown')
    .slice(0, 5);

  if (genreList.length > 0) {
    evidence.push({
      type: 'genre',
      value: genreList,
      humanReadable: `Genres include: ${genreList.join(', ')}`
    });
  }

  // Show most diverse session
  if (sessions.length > 0) {
    const topSession = sessions[0];
    const sessionGenres = new Set(topSession.genres.filter(g => g !== 'unknown'));

    evidence.push({
      type: 'count',
      value: topSession.switches,
      humanReadable: `Most diverse session: ${topSession.switches} genre switches across ${sessionGenres.size} genres`
    });
  }

  // Calculate switch rate
  const totalTracks = data.recentlyPlayed.length;
  const switchRate = switches / totalTracks;

  evidence.push({
    type: 'ratio',
    value: switchRate,
    humanReadable: `Genre switches every ${Math.round(totalTracks / switches)} tracks on average`
  });

  // Add interpretation based on intensity
  if (switches >= 15) {
    evidence.push({
      type: 'count',
      value: 'extreme',
      humanReadable: `${switches} switches - you resist settling into any single emotional space`
    });
  } else {
    evidence.push({
      type: 'count',
      value: 'high',
      humanReadable: `This isn't background listening - you're actively seeking variety and stimulation`
    });
  }

  // Contrast with Genre Purist if applicable
  const genrePuristExists = data.topArtists.short.slice(0, 10)
    .map(a => a.genres || [])
    .flat()
    .length < uniqueGenres.size * 3; // Rough heuristic

  if (!genrePuristExists) {
    evidence.push({
      type: 'count',
      value: 'contrast',
      humanReadable: `Strong contrast to genre consistency - you value cognitive flexibility over mood coherence`
    });
  }

  return {
    patternId: 37,
    patternName: 'The Genre Hopper',
    confidence,
    evidence,
    psychologicalDimension: 'cognitive style',
    category: 'variety',
    insightPotential: 0, // Will be calculated by runner
  };
}
