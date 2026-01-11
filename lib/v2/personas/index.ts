// Persona Matching System for Unwrapped V2
// Maps detected patterns to relatable listener archetypes

import type { DetectionResult, PatternFamily } from '../types';

export interface PersonaDefinition {
  id: string;
  name: string;
  tagline: string;
  description: string;
  icon: string;
  dominantPatterns: PatternFamily[];
  traits: string[];
  researchBasis: string;
  famousExample?: string;
}

export interface PersonaMatch {
  persona: PersonaDefinition;
  matchScore: number;  // 0-100
  matchingPatterns: string[];  // Which detected patterns contributed
  reasoning: string;  // Why this persona was chosen
}

// Define persona archetypes
export const PERSONAS: PersonaDefinition[] = [
  {
    id: 'the-loyalist',
    name: 'The Loyalist',
    tagline: 'You found your people, and you\'re never letting go',
    description: 'You build deep, sustained relationships with artists over time. High completion rates and low skip rates reveal intentional, devoted listening. You don\'t chase trends—you commit to artists who resonate.',
    icon: '💎',
    dominantPatterns: ['loyalty_retention', 'repetition'],
    traits: [
      'High artist completion rates (>75%)',
      'Low skip velocity',
      'Repeated plays over extended periods',
      'Deep catalog exploration of favorite artists'
    ],
    researchBasis: 'Rentfrow & Gosling (2003) - High agreeableness correlates with sustained artist loyalty',
    famousExample: 'The fan who\'s seen their favorite band in concert 23 times'
  },
  {
    id: 'the-explorer',
    name: 'The Explorer',
    tagline: 'Discovery is the destination',
    description: 'You have a high new artist discovery velocity and love genre-hopping. Constantly seeking novelty, you use music to build a diverse sonic identity rather than settling into comfort.',
    icon: '🔍',
    dominantPatterns: ['diversity', 'behavioral'],
    traits: [
      'High new artist discovery rate',
      'Wide genre distribution',
      'Active search behavior',
      'Lower repeat play counts per track'
    ],
    researchBasis: 'Rentfrow & Gosling (2003) - High openness to experience drives musical exploration',
    famousExample: 'The friend with 47 genre playlists and counting'
  },
  {
    id: 'the-ritualist',
    name: 'The Ritualist',
    tagline: 'Music as temporal anchor',
    description: 'You have consistent time-of-day or context-based listening patterns. Music marks transitions in your day—commute, work focus, wind-down rituals. You build routines around sound.',
    icon: '⏰',
    dominantPatterns: ['temporal', 'repetition'],
    traits: [
      'Concentrated listening at specific hours',
      'Consistent day-of-week patterns',
      'Context-driven play behavior',
      'High completion in ritual contexts'
    ],
    researchBasis: 'DeNora (2000) - Music as temporal and emotional scaffolding in daily life',
    famousExample: 'The person who literally can\'t fall asleep without their 11pm playlist'
  },
  {
    id: 'the-emotional-processor',
    name: 'The Emotional Processor',
    tagline: 'You loop to understand',
    description: 'Extreme track repetition (consecutive loops) reveals active emotional engagement. You don\'t just listen—you immerse, using music to process, reflect, and regulate emotional states.',
    icon: '🔁',
    dominantPatterns: ['repetition', 'behavioral'],
    traits: [
      'High consecutive play counts (10+ loops)',
      'Very high completion rates (>90%)',
      'Deep immersion sessions',
      'Emotional regulation through music'
    ],
    researchBasis: 'Saarikallio (2007) - Music for emotional work, discharge, and solace',
    famousExample: 'The person who played the same breakup song 73 times in one night'
  },
  {
    id: 'the-curator',
    name: 'The Curator',
    tagline: 'Intentional listening as identity work',
    description: 'Low skip rates and high search intent reveal deliberate music selection. You craft your listening experience carefully, using music to construct and express identity.',
    icon: '🎨',
    dominantPatterns: ['behavioral', 'diversity'],
    traits: [
      'High clickrow/search start rate',
      'Low skip velocity',
      'Intentional track selection',
      'Sustained artist exploration'
    ],
    researchBasis: 'DeNora (2000) - Music as active identity construction and self-narrative',
    famousExample: 'The friend who makes Spotify playlists like they\'re applying to art school'
  },
  {
    id: 'the-nostalgist',
    name: 'The Nostalgist',
    tagline: 'You can\'t go back, but you can press play',
    description: 'You have sharp dropoffs in artist listening (witness protection), followed by occasional returns. Music serves as a time machine, marked by temporal boundaries and life transitions.',
    icon: '📼',
    dominantPatterns: ['loyalty_dropoff', 'evolution'],
    traits: [
      'Sharp artist listening dropoffs',
      'Sudden returns to old favorites',
      'Music tied to life events',
      'Temporal listening boundaries'
    ],
    researchBasis: 'Levitin (2006) - Music as temporal memory marker and autobiographical anchor',
    famousExample: 'The person who hasn\'t listened to their high school playlist in years but knows every word'
  }
];

// Calculate persona match based on detected patterns
export function matchPersona(patterns: DetectionResult[]): PersonaMatch {
  if (patterns.length === 0) {
    // Default fallback if no patterns detected
    return {
      persona: PERSONAS[1], // The Explorer as default
      matchScore: 0,
      matchingPatterns: [],
      reasoning: 'Not enough data to determine listening persona'
    };
  }

  // Count pattern families
  const familyCounts = new Map<PatternFamily, number>();
  const patternNames = new Map<PatternFamily, string[]>();

  patterns.forEach(pattern => {
    const count = familyCounts.get(pattern.patternFamily) || 0;
    familyCounts.set(pattern.patternFamily, count + 1);

    const names = patternNames.get(pattern.patternFamily) || [];
    names.push(pattern.patternName);
    patternNames.set(pattern.patternFamily, names);
  });

  // Score each persona based on pattern alignment
  let bestMatch: PersonaMatch = {
    persona: PERSONAS[0],
    matchScore: 0,
    matchingPatterns: [],
    reasoning: ''
  };

  PERSONAS.forEach(persona => {
    let score = 0;
    const matchingPatterns: string[] = [];

    // Check if detected pattern families match persona's dominant patterns
    persona.dominantPatterns.forEach(dominantFamily => {
      const count = familyCounts.get(dominantFamily) || 0;
      if (count > 0) {
        // Weight by how many patterns of this family were detected
        score += count * 25; // Up to 50 points per dominant family (if 2 patterns detected)

        // Add pattern names
        const names = patternNames.get(dominantFamily) || [];
        matchingPatterns.push(...names);
      }
    });

    // Bonus: More patterns overall = higher confidence
    const totalPatterns = patterns.length;
    const confidenceBonus = Math.min(totalPatterns * 5, 20); // Cap at 20 points
    score += confidenceBonus;

    // Normalize score to 0-100
    const normalizedScore = Math.min(score, 100);

    if (normalizedScore > bestMatch.matchScore) {
      bestMatch = {
        persona,
        matchScore: normalizedScore,
        matchingPatterns,
        reasoning: generateReasoning(persona, matchingPatterns, familyCounts)
      };
    }
  });

  return bestMatch;
}

// Generate human-readable reasoning for persona match
function generateReasoning(
  persona: PersonaDefinition,
  matchingPatterns: string[],
  familyCounts: Map<PatternFamily, number>
): string {
  if (matchingPatterns.length === 0) {
    return 'Your listening patterns suggest this archetype';
  }

  const familyNames = persona.dominantPatterns
    .map(family => {
      const count = familyCounts.get(family) || 0;
      if (count === 0) return null;

      // Human-readable family names
      const familyLabels: Record<PatternFamily, string> = {
        'loyalty_retention': 'sustained artist devotion',
        'loyalty_dropoff': 'artist cycle boundaries',
        'temporal': 'time-based rituals',
        'diversity': 'genre exploration',
        'repetition': 'deep track immersion',
        'behavioral': 'intentional listening',
        'evolution': 'taste evolution'
      };

      return familyLabels[family];
    })
    .filter(Boolean);

  if (familyNames.length === 0) {
    return `We detected ${matchingPatterns.length} pattern${matchingPatterns.length > 1 ? 's' : ''} that match this archetype`;
  }

  if (familyNames.length === 1) {
    return `Your ${familyNames[0]} patterns strongly suggest this listening style`;
  }

  const last = familyNames.pop();
  return `Your ${familyNames.join(', ')} and ${last} patterns reveal this archetype`;
}
