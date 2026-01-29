// lib/v2.5/typing/typeNames.ts
// Finalized January 19, 2026 - Gen Z Slang-Forward Names (v2)
// Updated: L→R for Discovery dimension (Loyalist→Rooted)

export interface TypeInfo {
  code: string;
  name: string;
  tagline: string;
  description: string;
  slangTerms: string[]; // Gen Z terms used in name/tagline
}

export const TYPE_NAMES: Record<string, TypeInfo> = {
  // ============================================
  // DIURNAL TYPES (D___)
  // ============================================

  DLRA: {
    code: 'DLRA',
    name: 'The Rewatch Era',
    tagline: 'Same 10 songs since high school, no notes',
    description: 'Daytime replayer, same artists, forever loyal',
    slangTerms: ['era', 'no notes'],
  },

  DLRF: {
    code: 'DLRF',
    name: 'The Seasonal Stan',
    tagline: 'Intense for a few months, then new era',
    description: 'Daytime replayer, same artists, rotating obsessions',
    slangTerms: ['stan', 'era'],
  },

  DLEA: {
    code: 'DLEA',
    name: 'Hoarder Mode',
    tagline: 'Discovers gems, keeps them forever',
    description: 'Daytime replayer, new artists, forever favorites',
    slangTerms: ['mode'],
  },

  DLEF: {
    code: 'DLEF',
    name: 'Chronically Discovering',
    tagline: 'Touch grass? New album just dropped',
    description: 'Daytime replayer, new artists, always moving on',
    slangTerms: ['chronically', 'touch grass'],
  },

  DSRA: {
    code: 'DSRA',
    name: 'NPC Mode',
    tagline: 'Shuffle on, same 5 artists, vibes immaculate',
    description: 'Daytime skimmer, same artists, forever stable',
    slangTerms: ['NPC', 'mode', 'vibes immaculate'],
  },

  DSRF: {
    code: 'DSRF',
    name: 'Cooked by the Algorithm',
    tagline: 'Spotify Radio is my whole personality',
    description: 'Daytime skimmer, same artists, algorithm-controlled',
    slangTerms: ['cooked'],
  },

  DSEA: {
    code: 'DSEA',
    name: 'The Sampler Platter',
    tagline: 'A little bit of everything, why commit?',
    description: 'Daytime skimmer, new artists, keeps some favorites',
    slangTerms: [],
  },

  DSEF: {
    code: 'DSEF',
    name: 'The Skip Button',
    tagline: '30 seconds is a full listen',
    description: 'Daytime skimmer, new artists, nothing sticks',
    slangTerms: [],
  },

  // ============================================
  // NOCTURNAL TYPES (N___)
  // ============================================

  NLRA: {
    code: 'NLRA',
    name: 'Feral for Favorites',
    tagline: 'Late night, same song, unhinged loyalty',
    description: 'Night replayer, same artists, forever devoted',
    slangTerms: ['feral', 'unhinged'],
  },

  NLRF: {
    code: 'NLRF',
    name: 'Devoted (For Now)',
    tagline: 'Intense while it lasts',
    description: 'Night replayer, same artists, rotating obsessions',
    slangTerms: [],
  },

  NLEA: {
    code: 'NLEA',
    name: 'New Favorite Disorder',
    tagline: 'Found another one. This is THE one.',
    description: 'Night replayer, new artists, forever favorites',
    slangTerms: ['disorder'],
  },

  NLEF: {
    code: 'NLEF',
    name: 'Obsession Speedrun',
    tagline: 'Dozens of new artists, forgotten by Tuesday',
    description: 'Night replayer, new artists, always moving on',
    slangTerms: ['speedrun'],
  },

  NSRA: {
    code: 'NSRA',
    name: 'Low Power Mode',
    tagline: 'Same comfort songs on repeat every night',
    description: 'Night skimmer, same artists, forever stable',
    slangTerms: ['mode'],
  },

  NSRF: {
    code: 'NSRF',
    name: 'The Revolving Door',
    tagline: 'Vibes only, no commitment',
    description: 'Night skimmer, same artists, floating preferences',
    slangTerms: [],
  },

  NSEA: {
    code: 'NSEA',
    name: 'Backlog Energy',
    tagline: 'So much to listen to, so little time',
    description: 'Night skimmer, new artists, keeps some favorites',
    slangTerms: ['energy'],
  },

  NSEF: {
    code: 'NSEF',
    name: 'Fully Cooked',
    tagline: 'My Wrapped will be chaos',
    description: 'Night skimmer, new artists, maximum entropy',
    slangTerms: ['fully cooked'],
  },
};

// ============================================
// RARITY SYSTEM: Behavior-Based (Honest)
// ============================================

export interface RarityBadge {
  text: string;
  color: 'gold' | 'purple' | 'blue' | null;
}

/**
 * Returns a rarity badge based on genuinely unusual behavioral combinations.
 * No fake percentages - only highlights what's actually rare about the type.
 */
export function getRarityBadge(typeCode: string): RarityBadge | null {
  const [temporal, processing, discovery, attachment] = typeCode.split('');

  // Looper + Explorer is genuinely rare
  // (Most explorers skim; most deep listeners are rooted)
  if (processing === 'L' && discovery === 'E') {
    return {
      text: 'Rare combo: Deep listener who actively discovers',
      color: 'purple',
    };
  }

  // Nocturnal + Anchored is unusual
  // (Night listeners tend toward fluid attachments)
  if (temporal === 'N' && attachment === 'A') {
    return {
      text: 'Unusual: Night owl with lasting attachments',
      color: 'blue',
    };
  }

  // Skimmer + Anchored is interesting
  // (Surface listeners usually rotate)
  if (processing === 'S' && attachment === 'A') {
    return {
      text: 'Interesting: Casual listener with forever favorites',
      color: 'blue',
    };
  }

  // Full chaos types (NSEF, DSEF)
  if (typeCode === 'NSEF' || typeCode === 'DSEF') {
    return {
      text: 'Chaotic energy detected',
      color: 'purple',
    };
  }

  // Full stability types (DLRA, DSRA)
  if (typeCode === 'DLRA') {
    return {
      text: 'Maximum comfort zone energy',
      color: 'blue',
    };
  }

  // No badge for types without genuinely rare combinations
  // We don't label anyone as "common" or "basic"
  return null;
}

// ============================================
// HELPER FUNCTIONS
// ============================================

export function getTypeInfo(code: string): TypeInfo {
  return TYPE_NAMES[code] || {
    code,
    name: 'Unknown Type',
    tagline: 'Something went wrong',
    description: 'Type not found',
    slangTerms: [],
  };
}

export function getTypeName(code: string): string {
  return TYPE_NAMES[code]?.name || 'Unknown Type';
}

export function getTypeTagline(code: string): string {
  return TYPE_NAMES[code]?.tagline || '';
}

// For share cards - short version of name
export function getShortName(code: string): string {
  const name = TYPE_NAMES[code]?.name || 'Unknown';
  // Remove "The " prefix if present for compact display
  return name.replace(/^The /, '');
}

// ============================================
// DIMENSION LABELS
// ============================================

export const DIMENSION_LABELS = {
  // Temporal
  D: { code: 'D', name: 'Diurnal', description: 'Listens during the day' },
  N: { code: 'N', name: 'Nocturnal', description: 'Listens at night' },

  // Processing
  L: { code: 'L', name: 'Looper', description: 'Replays songs on repeat' },
  S: { code: 'S', name: 'Skimmer', description: 'Moves through quickly' },

  // Discovery
  E: { code: 'E', name: 'Explorer', description: 'Seeks new artists' },
  R: { code: 'R', name: 'Rooted', description: 'Sticks with favorites' },

  // Attachment
  A: { code: 'A', name: 'Anchored', description: 'Favorites stay the same' },
  F: { code: 'F', name: 'Fluid', description: 'Favorites change often' },
};

export function getDimensionLabel(code: string, position: number): string {
  // Position 0: Temporal (D/N)
  // Position 1: Processing (L/S)
  // Position 2: Discovery (E/R)
  // Position 3: Attachment (A/F)

  const labels: Record<number, Record<string, string>> = {
    0: { D: 'Diurnal', N: 'Nocturnal' },
    1: { L: 'Looper', S: 'Skimmer' },
    2: { E: 'Explorer', R: 'Rooted' },
    3: { A: 'Anchored', F: 'Fluid' },
  };

  return labels[position]?.[code] || code;
}

export function getFullDimensionString(typeCode: string): string {
  const labels = typeCode.split('').map((char, i) => getDimensionLabel(char, i));
  return labels.join(' · ');
}

// ============================================
// SHARE TEMPLATES
// ============================================

export function getShareText(
  typeCode: string, 
  platform: 'instagram' | 'twitter' | 'dm'
): string {
  const info = getTypeInfo(typeCode);
  const rarity = getRarityBadge(typeCode);
  
  switch (platform) {
    case 'instagram':
      return `Just discovered I'm a ${typeCode} 🎵

"${info.name}"
${info.tagline}

What's your Music Type?
unwrapped.fm`;

    case 'twitter':
      return `I'm a ${typeCode} — ${info.name} 🎵

${info.tagline}

${rarity ? rarity.text + '. ' : ''}What's yours?

unwrapped.fm`;

    case 'dm':
      return `Just found out my Music Type — I'm a ${typeCode} (${info.name})

${info.tagline}

Try it and compare with me:`;

    default:
      return `I'm a ${typeCode} — ${info.name}`;
  }
}
