/**
 * The Franchise Fan Detector
 *
 * Detects when 4+ tracks from the same movie franchise/universe appear in
 * your top tracks. This goes deeper than artist/genre detection - it identifies
 * cultural obsessions with specific fictional worlds (Marvel, Star Wars, Disney, etc.).
 *
 * Pattern ID: 59
 * Category: identity
 * Psychological Dimension: identity and cultural moment
 * Priority: V1 - High Priority
 */

import type { UserListeningData, DetectionResult, Evidence } from '../types';

/**
 * Configuration for franchise detection
 */
const CONFIG = {
  MIN_TRACKS_FROM_FRANCHISE: 4,   // 4+ tracks shows franchise obsession
  HIGH_OBSESSION_TRACKS: 6,       // 6+ tracks = extreme fan
  ANALYZE_TOP_N: 20,              // Check top 20 tracks
};

/**
 * Franchise definitions with pattern matching
 * Each franchise has keywords that appear in album/track names
 */
const FRANCHISES = [
  {
    name: 'Marvel Cinematic Universe',
    shortName: 'MCU',
    keywords: [
      'marvel', 'avengers', 'iron man', 'captain america', 'thor',
      'black panther', 'spider-man', 'spiderman', 'guardians of the galaxy',
      'doctor strange', 'black widow', 'hawkeye', 'loki', 'wandavision',
      'falcon and the winter soldier', 'shang-chi', 'eternals', 'moon knight',
      'ms. marvel', 'she-hulk', 'werewolf by night', 'wakanda forever',
      'multiverse of madness', 'no way home', 'love and thunder', 'quantumania'
    ]
  },
  {
    name: 'Star Wars Universe',
    shortName: 'Star Wars',
    keywords: [
      'star wars', 'the mandalorian', 'ahsoka', 'boba fett',
      'obi-wan', 'andor', 'rogue one', 'solo', 'the force awakens',
      'the last jedi', 'rise of skywalker', 'clone wars', 'rebels',
      'bad batch', 'tales of the jedi'
    ]
  },
  {
    name: 'Harry Potter Universe',
    shortName: 'Wizarding World',
    keywords: [
      'harry potter', 'fantastic beasts', 'wizarding world',
      'philosopher\'s stone', 'chamber of secrets', 'prisoner of azkaban',
      'goblet of fire', 'order of the phoenix', 'half-blood prince',
      'deathly hallows', 'crimes of grindelwald', 'secrets of dumbledore'
    ]
  },
  {
    name: 'Disney Animation',
    shortName: 'Disney',
    keywords: [
      'frozen', 'moana', 'encanto', 'tangled', 'brave', 'coco',
      'raya and the last dragon', 'zootopia', 'big hero 6',
      'wreck-it ralph', 'the lion king', 'aladdin', 'the little mermaid',
      'beauty and the beast', 'mulan', 'pocahontas', 'hercules',
      'tarzan', 'princess and the frog', 'wish', 'strange world'
    ]
  },
  {
    name: 'Pixar Universe',
    shortName: 'Pixar',
    keywords: [
      'toy story', 'finding nemo', 'finding dory', 'the incredibles',
      'cars', 'ratatouille', 'wall-e', 'up', 'inside out', 'turning red',
      'luca', 'soul', 'onward', 'coco', 'brave', 'monsters inc',
      'monsters university', 'a bug\'s life', 'elemental', 'lightyear'
    ]
  },
  {
    name: 'Lord of the Rings Universe',
    shortName: 'Middle-earth',
    keywords: [
      'lord of the rings', 'the hobbit', 'fellowship of the ring',
      'the two towers', 'return of the king', 'an unexpected journey',
      'the desolation of smaug', 'the battle of the five armies',
      'rings of power', 'middle-earth'
    ]
  },
  {
    name: 'DC Extended Universe',
    shortName: 'DC',
    keywords: [
      'batman', 'superman', 'wonder woman', 'aquaman', 'flash',
      'justice league', 'suicide squad', 'shazam', 'black adam',
      'joker', 'birds of prey', 'the batman', 'peacemaker', 'man of steel',
      'batman v superman', 'dark knight'
    ]
  },
  {
    name: 'Barbie Universe',
    shortName: 'Barbie',
    keywords: ['barbie', 'barbieland', 'ken']
  },
  {
    name: 'Wicked Universe',
    shortName: 'Wicked',
    keywords: ['wicked', 'elphaba', 'glinda', 'oz']
  }
];

/**
 * Find tracks matching franchise keywords
 */
function findFranchiseTracks(data: UserListeningData): Array<{
  franchise: typeof FRANCHISES[0];
  tracks: any[];
  trackCount: number;
  albums: Set<string>;
}> {
  const franchiseMatches = new Map<string, {
    franchise: typeof FRANCHISES[0];
    tracks: any[];
    albums: Set<string>;
  }>();

  // Check top tracks for franchise matches
  data.topTracks.short.slice(0, CONFIG.ANALYZE_TOP_N).forEach(track => {
    const albumName = track.album.name.toLowerCase();
    const trackName = track.name.toLowerCase();
    const artistName = track.artists[0].name.toLowerCase();

    // Check against each franchise
    FRANCHISES.forEach(franchise => {
      const matches = franchise.keywords.some(keyword =>
        albumName.includes(keyword.toLowerCase()) ||
        trackName.includes(keyword.toLowerCase()) ||
        artistName.includes(keyword.toLowerCase())
      );

      if (matches) {
        const existing = franchiseMatches.get(franchise.name);
        if (existing) {
          existing.tracks.push(track);
          existing.albums.add(track.album.id);
        } else {
          franchiseMatches.set(franchise.name, {
            franchise,
            tracks: [track],
            albums: new Set([track.album.id])
          });
        }
      }
    });
  });

  // Convert to array and calculate counts
  const results = Array.from(franchiseMatches.values()).map(match => ({
    franchise: match.franchise,
    tracks: match.tracks,
    trackCount: match.tracks.length,
    albums: match.albums
  }));

  // Sort by track count (most tracks first)
  return results.sort((a, b) => b.trackCount - a.trackCount);
}

/**
 * Detect The Franchise Fan pattern
 *
 * Identifies obsession with fictional universe soundtracks. This indicates:
 * - Deep engagement with specific fictional worlds
 * - Using music to maintain connection to beloved stories
 * - Cultural participation beyond passive viewing
 * - Identity expression through franchise affiliation
 *
 * @param data - User's complete listening data
 * @returns Detection result or null if pattern not found
 */
export async function detectTheFranchiseFan(
  data: UserListeningData
): Promise<DetectionResult | null> {
  console.log('[The Franchise Fan] Starting detection...');

  const franchiseMatches = findFranchiseTracks(data);

  console.log(`[The Franchise Fan] Found ${franchiseMatches.length} franchises with matches`);
  if (franchiseMatches.length > 0) {
    franchiseMatches.forEach((match, i) => {
      console.log(`  ${i + 1}. ${match.franchise.shortName}: ${match.trackCount} tracks from ${match.albums.size} albums`);
    });
  }

  // Filter to franchises meeting minimum threshold
  const validMatches = franchiseMatches.filter(
    match => match.trackCount >= CONFIG.MIN_TRACKS_FROM_FRANCHISE
  );

  if (validMatches.length === 0) {
    console.log('[The Franchise Fan] No franchises meet minimum threshold');
    return null;
  }

  // Use the most dominant franchise
  const primaryFranchise = validMatches[0];

  // Calculate confidence based on track count
  // 4 tracks = 0.75, 6+ tracks = 0.90
  let confidence = Math.min(0.65 + (primaryFranchise.trackCount * 0.08), 0.98);

  // Bonus for extreme obsession
  if (primaryFranchise.trackCount >= CONFIG.HIGH_OBSESSION_TRACKS) {
    confidence = Math.min(confidence + 0.1, 1.0);
  }

  // Build evidence
  const evidence: Evidence[] = [
    {
      type: 'count',
      value: primaryFranchise.trackCount,
      humanReadable: `${primaryFranchise.trackCount} tracks from ${primaryFranchise.franchise.name} in your top ${CONFIG.ANALYZE_TOP_N}`
    }
  ];

  // Show specific tracks
  const trackNames = primaryFranchise.tracks.slice(0, 5).map(t => t.name);
  evidence.push({
    type: 'track',
    value: trackNames,
    humanReadable: `Tracks: "${trackNames.join('", "')}"`
  });

  // Album diversity
  if (primaryFranchise.albums.size === 1) {
    const albumName = primaryFranchise.tracks[0].album.name;
    evidence.push({
      type: 'count',
      value: 'single-album',
      humanReadable: `All from "${albumName}" - you're focused on ONE ${primaryFranchise.franchise.shortName} story`
    });
  } else {
    evidence.push({
      type: 'count',
      value: 'multi-album',
      humanReadable: `From ${primaryFranchise.albums.size} different albums - you're exploring the whole ${primaryFranchise.franchise.shortName} universe`
    });
    confidence = Math.min(confidence + 0.05, 1.0);
  }

  // Check if in top 10
  const inTop10 = data.topTracks.short.slice(0, 10).filter(track =>
    primaryFranchise.tracks.some(ft => ft.id === track.id)
  ).length;

  if (inTop10 >= 3) {
    evidence.push({
      type: 'count',
      value: 'top-10-dominance',
      humanReadable: `${inTop10} ${primaryFranchise.franchise.shortName} tracks in your top 10 - serious fan behavior`
    });
    confidence = Math.min(confidence + 0.05, 1.0);
  }

  // Interpret based on count
  if (primaryFranchise.trackCount >= CONFIG.HIGH_OBSESSION_TRACKS) {
    evidence.push({
      type: 'count',
      value: 'extreme',
      humanReadable: `${primaryFranchise.trackCount} tracks from one universe - you're not just a fan, you're LIVING in ${primaryFranchise.franchise.shortName}`
    });
  } else if (primaryFranchise.trackCount >= 5) {
    evidence.push({
      type: 'count',
      value: 'high',
      humanReadable: `${primaryFranchise.trackCount} tracks shows deep connection to the ${primaryFranchise.franchise.shortName} world`
    });
  } else {
    evidence.push({
      type: 'count',
      value: 'moderate',
      humanReadable: `${primaryFranchise.trackCount} tracks shows ${primaryFranchise.franchise.shortName} has captured your imagination`
    });
  }

  // Check if this is new vs established
  const inMedium = data.topTracks.medium.filter(track =>
    primaryFranchise.tracks.some(ft => ft.id === track.id)
  ).length;

  const inLong = data.topTracks.long.filter(track =>
    primaryFranchise.tracks.some(ft => ft.id === track.id)
  ).length;

  if (inMedium === 0 && inLong === 0) {
    evidence.push({
      type: 'timestamp',
      value: 'new-obsession',
      humanReadable: `This is NEW - not in your 6-month or all-time favorites. A recent ${primaryFranchise.franchise.shortName} release got you hooked.`
    });
  } else if (inLong > 3) {
    evidence.push({
      type: 'timestamp',
      value: 'established',
      humanReadable: `Also in all-time favorites - ${primaryFranchise.franchise.shortName} is a core part of your music identity`
    });
  }

  // If multiple franchises detected, note them
  if (validMatches.length >= 2) {
    const otherFranchises = validMatches.slice(1, 3).map(m => m.franchise.shortName);
    evidence.push({
      type: 'count',
      value: 'multi-franchise',
      humanReadable: `You also have ${otherFranchises.join(' & ')} in your top tracks - you're a cross-franchise soundtrack enthusiast`
    });
  }

  return {
    patternId: 59,
    patternName: `The ${primaryFranchise.franchise.shortName} Fan`,
    confidence,
    evidence,
    psychologicalDimension: 'identity and cultural moment',
    category: 'identity',
    insightPotential: 0, // Will be calculated by runner
  };
}
