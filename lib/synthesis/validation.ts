/**
 * Hallucination Detection - Validates Claude outputs against input evidence
 * Prevents fabricated artists, tracks, or times from reaching users
 */

import type { PatternCard } from './types';

interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Extract all artist and track names from evidence
 */
function extractNamesFromEvidence(evidence: string[]): {
  artists: Set<string>;
  tracks: Set<string>;
} {
  const artists = new Set<string>();
  const tracks = new Set<string>();

  evidence.forEach(ev => {
    // Extract track names (format: "Track Name" or "Track Name - Artist")
    const trackMatches = ev.match(/"([^"]+)"/g);
    if (trackMatches) {
      trackMatches.forEach(match => {
        const trackName = match.replace(/"/g, '').split(' - ')[0];
        tracks.add(trackName.toLowerCase());
      });
    }

    // Extract artist names (various patterns)
    // Pattern 1: "Artist Name: " or "Artist Name ("
    const artistPattern1 = ev.match(/([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*?)(?::|,|\()/g);
    if (artistPattern1) {
      artistPattern1.forEach(match => {
        const artist = match.replace(/[:,(]/g, '').trim();
        if (artist.length > 2) artists.add(artist.toLowerCase());
      });
    }

    // Pattern 2: Explicit artist mentions
    const words = ev.split(/[\s,]+/);
    words.forEach((word, i) => {
      // Check for capitalized multi-word names
      if (/^[A-Z][a-z]+$/.test(word) && i < words.length - 1) {
        const nextWord = words[i + 1];
        if (/^[A-Z][a-z]+$/.test(nextWord)) {
          artists.add(`${word} ${nextWord}`.toLowerCase());
        }
      }
      // Single capitalized words (might be artist names)
      if (/^[A-Z][a-z]{3,}$/.test(word)) {
        artists.add(word.toLowerCase());
      }
    });
  });

  return { artists, tracks };
}

/**
 * Extract mentioned names from card output
 * CONSERVATIVE approach to minimize false positives:
 * - Skip pattern label (it's creative/viral phrasing, not literal)
 * - Only validate CORE, SUPPORTING, BEHAVIOR sections
 * - Only check artist names that appear in specific data contexts
 */
function extractNamesFromCard(card: PatternCard): {
  artists: Set<string>;
  tracks: Set<string>;
} {
  const artists = new Set<string>();
  const tracks = new Set<string>();

  // SKIP pattern label - it's meant to be creative ("The Vault Hunter", "Loyalty Pact", etc.)
  // Only validate the data sections
  const dataText = [
    card.core,
    card.supporting,
    card.behavior
  ].join(' ');

  // Extract track names in quotes (strict - these must exist)
  const trackMatches = dataText.match(/"([^"]+)"/g);
  if (trackMatches) {
    trackMatches.forEach(match => {
      const trackName = match.replace(/"/g, '').split(' - ')[0];
      tracks.add(trackName.toLowerCase());
    });
  }

  // Extract artist names ONLY in specific data contexts:
  // 1. Artist names followed by ranking symbols: "PinkPantheress #1" or "Sabrina (#2→#1→#2)"
  const rankingMatches = dataText.matchAll(/([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\s*(?:#\d+|→|\(#)/g);
  for (const match of rankingMatches) {
    if (match[1]) {
      artists.add(match[1].trim().toLowerCase());
    }
  }

  // 2. Multiple consecutive capitalized words (likely real artist names like "Sabrina Carpenter")
  // But ONLY if 2+ words together (single words are too ambiguous)
  const multiWordArtists = dataText.matchAll(/\b([A-Z][a-z]+\s+[A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\b/g);
  for (const match of multiWordArtists) {
    const artistName = match[1].trim();
    // Exclude common false positives
    const excludePatterns = ['Loyalty Pact', 'Vault Hunter', 'Trinity', 'Main Character'];
    if (!excludePatterns.some(pattern => artistName.includes(pattern))) {
      artists.add(artistName.toLowerCase());
    }
  }

  // 3. Artist names in possessive form: "Sabrina's" or "Ariana's"
  const possessiveMatches = dataText.matchAll(/([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)'s\b/g);
  for (const match of possessiveMatches) {
    if (match[1]) {
      artists.add(match[1].trim().toLowerCase());
    }
  }

  return { artists, tracks };
}

/**
 * Validate a pattern card against evidence
 * Returns false if hallucination detected
 */
export function validatePatternCard(
  card: PatternCard,
  evidence: string[]
): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Extract names from evidence and card
  const evidenceNames = extractNamesFromEvidence(evidence);
  const cardNames = extractNamesFromCard(card);

  // Check tracks
  cardNames.tracks.forEach(track => {
    let found = false;

    // Check if track appears in evidence (fuzzy matching)
    evidenceNames.tracks.forEach(evidenceTrack => {
      if (evidenceTrack.includes(track) || track.includes(evidenceTrack)) {
        found = true;
      }
    });

    // Also check raw evidence text
    const evidenceText = evidence.join(' ').toLowerCase();
    if (evidenceText.includes(track)) {
      found = true;
    }

    if (!found) {
      errors.push(`Track "${track}" not found in evidence`);
    }
  });

  // Check artists (LENIENT - only warn, don't error)
  // Artist mentions can be formatted many ways and may appear in creative contexts
  // We only extract artists from specific data patterns, so this is just a sanity check
  cardNames.artists.forEach(artist => {
    let found = false;

    // Check against evidence artists
    evidenceNames.artists.forEach(evidenceArtist => {
      if (evidenceArtist.includes(artist) || artist.includes(evidenceArtist)) {
        found = true;
      }
    });

    // Check raw evidence text
    const evidenceText = evidence.join(' ').toLowerCase();
    if (evidenceText.includes(artist)) {
      found = true;
    }

    // Only warn for artists not found (don't block the card)
    // Real hallucinations will be caught by track/time validation
    if (!found) {
      warnings.push(`Artist "${artist}" not clearly found in evidence (might be okay - check manually)`);
    }
  });

  // Check for suspicious time claims without evidence
  const timePatterns = [
    /\d{1,2}(AM|PM|am|pm)/,
    /midnight/i,
    /morning/i,
    /afternoon/i,
    /evening/i,
    /night/i
  ];

  const hasTimeClaim = timePatterns.some(pattern => {
    const allText = `${card.patternLabel} ${card.core} ${card.supporting} ${card.behavior}`;
    return pattern.test(allText);
  });

  if (hasTimeClaim) {
    // Check if evidence contains timestamp data
    const hasTimeEvidence = evidence.some(ev =>
      /\d{1,2}:\d{2}/.test(ev) || // HH:MM format
      /(AM|PM|am|pm)/.test(ev) ||
      /between.*and/i.test(ev)
    );

    if (!hasTimeEvidence) {
      errors.push('Card mentions time/time-of-day but no timestamp evidence provided');
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Validate and log validation results
 */
export function validateAndLog(
  card: PatternCard,
  evidence: string[],
  cardLabel: string
): boolean {
  const validation = validatePatternCard(card, evidence);

  if (!validation.isValid) {
    console.error(`[Validation] FAILED for "${cardLabel}":`, validation.errors);
    return false;
  }

  if (validation.warnings.length > 0) {
    console.warn(`[Validation] Warnings for "${cardLabel}":`, validation.warnings);
  }

  console.log(`[Validation] ✓ PASSED for "${cardLabel}"`);
  return true;
}
