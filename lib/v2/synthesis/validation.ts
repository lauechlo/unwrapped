/**
 * V2 Synthesis Validation
 * Prevents Claude from fabricating details not in evidence
 *
 * CRITICAL: All synthesis output must be validated against evidence allowlist
 */

import { DetectionResult, Evidence } from '../types';
import { EvidenceAllowlist, PatternNarrative } from './types';

/**
 * Extract allowlist from detection evidence
 * This is the GROUND TRUTH - anything not here is a hallucination
 */
export function buildEvidenceAllowlist(patterns: DetectionResult[]): EvidenceAllowlist {
  const allowlist: EvidenceAllowlist = {
    artists: new Set(),
    tracks: new Set(),
    numbers: new Set(),
    dates: new Set(),
    hours: new Set(),
    patterns: new Set(),
  };

  for (const pattern of patterns) {
    // Add pattern name
    allowlist.patterns.add(pattern.patternName);

    // Extract from evidence
    for (const evidence of pattern.evidence) {
      switch (evidence.type) {
        case 'artist':
          // Extract artist name from value or humanReadable
          if (typeof evidence.value === 'string') {
            allowlist.artists.add(evidence.value);
          }
          // Also parse from humanReadable (e.g., "Brandee Younger")
          const artistMatch = evidence.humanReadable.match(/^([^(]+?)(?:\s*\(|$)/);
          if (artistMatch) {
            allowlist.artists.add(artistMatch[1].trim());
          }
          break;

        case 'track':
          // Extract track and artist from humanReadable
          // Format: "Track Name" by Artist Name
          const trackMatch = evidence.humanReadable.match(/"([^"]+)"\s+by\s+(.+)/);
          if (trackMatch) {
            allowlist.tracks.add(trackMatch[1]); // Track name
            allowlist.artists.add(trackMatch[2]); // Artist name
          }
          break;

        case 'count':
        case 'duration':
        case 'ratio':
          // Extract numeric value
          if (typeof evidence.value === 'number') {
            allowlist.numbers.add(Math.floor(evidence.value));
            // Also add rounded percentages if it's a ratio
            if (evidence.type === 'ratio') {
              allowlist.numbers.add(Math.round(evidence.value * 100));
            }
          }
          break;

        case 'timestamp':
          // Extract dates, hours, time contexts
          if (typeof evidence.value === 'string') {
            allowlist.dates.add(evidence.value);
          }
          // Parse hour from humanReadable (e.g., "5pm", "12am")
          const hourMatch = evidence.humanReadable.match(/(\d+)(?:am|pm)/i);
          if (hourMatch) {
            allowlist.hours.add(parseInt(hourMatch[1]));
          }
          // Parse month/week from humanReadable
          const datePattern = /(?:Week of|Month of|Last heard:|Peak:)\s+([A-Za-z]+\s+\d{1,2},?\s+\d{4}|[A-Za-z]+\s+\d{4})/;
          const dateMatch = evidence.humanReadable.match(datePattern);
          if (dateMatch) {
            allowlist.dates.add(dateMatch[1]);
          }
          break;
      }

      // Extract all numbers from humanReadable
      const numbers = evidence.humanReadable.match(/\d+/g);
      if (numbers) {
        numbers.forEach(n => allowlist.numbers.add(parseInt(n)));
      }
    }
  }

  return allowlist;
}

/**
 * Extract entities from text
 */
function extractArtists(text: string): string[] {
  const artists: string[] = [];

  // ONLY match "Song" by Artist pattern - most reliable
  const byPattern = /"([^"]+)"\s+by\s+([^,.(]+)/g;
  let match;

  while ((match = byPattern.exec(text)) !== null) {
    const artist = match[2].trim();
    // Filter out common non-artist phrases
    if (artist.length > 2 &&
        !artist.match(/^(The|Your|My|This|That|When|Where|POV|Week|Month|Day|Hour|Time|Pattern|Evidence|Ghost|Identity|Music|New Artists?|One)/i)) {
      artists.push(artist);
    }
  }

  return [...new Set(artists)];
}

function extractTracks(text: string): string[] {
  const tracks: string[] = [];

  // Match quoted strings (likely track names)
  const quotePattern = /"([^"]+)"/g;
  let match;

  while ((match = quotePattern.exec(text)) !== null) {
    const track = match[1];
    // Filter out non-track quotes (pattern names, phrases, etc.)
    const isNonTrack = track.match(/^(POV|The Way|You|I|My|Week of|Month of|Diversion|Revival|Solace|Entertainment|Mental Work|Ghost Timeline|Life Event|The Ritual|Ambient)/i);
    if (track.length > 2 && !isNonTrack) {
      tracks.push(track);
    }
  }

  return [...new Set(tracks)];
}

function extractNumbers(text: string): number[] {
  const numbers: number[] = [];

  // Match numbers in various contexts
  const patterns = [
    /#(\d+)/g,           // #1, #5
    /(\d+)%/g,           // 67%
    /(\d+)\s+plays?/gi,  // 47 plays
    /(\d+)\s+(?:artists?|tracks?|sessions?|days?)/gi,
  ];

  patterns.forEach(pattern => {
    let match;
    while ((match = pattern.exec(text)) !== null) {
      numbers.push(parseInt(match[1]));
    }
  });

  return [...new Set(numbers)];
}

/**
 * Validate narrative against evidence allowlist
 * Returns true if valid, false if hallucination detected
 */
export function validateNarrative(
  narrative: PatternNarrative,
  allowlist: EvidenceAllowlist
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Combine all narrative text
  const allText = [
    narrative.title,
    narrative.finding,
    narrative.context,
    narrative.callout,
    ...narrative.evidenceSummary,
  ].join(' ');

  // Check artists
  const claimedArtists = extractArtists(allText);
  for (const artist of claimedArtists) {
    if (!allowlist.artists.has(artist)) {
      // Check for partial match (e.g., "Sabrina" vs "Sabrina Carpenter")
      const hasPartialMatch = Array.from(allowlist.artists).some(allowed =>
        artist.includes(allowed) || allowed.includes(artist)
      );

      if (!hasPartialMatch) {
        errors.push(`Artist "${artist}" not found in evidence. Allowed: ${Array.from(allowlist.artists).join(', ')}`);
      }
    }
  }

  // Check tracks
  const claimedTracks = extractTracks(allText);
  for (const track of claimedTracks) {
    if (!allowlist.tracks.has(track)) {
      // Check for partial match
      const hasPartialMatch = Array.from(allowlist.tracks).some(allowed =>
        track.includes(allowed) || allowed.includes(track)
      );

      if (!hasPartialMatch) {
        errors.push(`Track "${track}" not found in evidence. Allowed: ${Array.from(allowlist.tracks).join(', ')}`);
      }
    }
  }

  // Check numbers (allow some flexibility for derived percentages)
  const claimedNumbers = extractNumbers(allText);
  for (const num of claimedNumbers) {
    // Skip very small numbers (likely not significant)
    if (num <= 2) continue;

    // Allow if exact match OR if could be derived from allowed numbers
    const exactMatch = allowlist.numbers.has(num);
    const couldBeDerived = Array.from(allowlist.numbers).some(allowed => {
      // Allow percentage conversions, rounded values, etc.
      return Math.abs(num - allowed) <= 2 ||
             Math.abs(num - Math.round(allowed)) <= 1 ||
             (num > 50 && num < 100); // Likely a percentage
    });

    if (!exactMatch && !couldBeDerived && num > 10) {
      errors.push(`Number ${num} not found in evidence. Allowed: ${Array.from(allowlist.numbers).slice(0, 20).join(', ')}`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validate and log results
 */
export function validateAndLog(
  narrative: PatternNarrative,
  allowlist: EvidenceAllowlist,
  label: string
): boolean {
  const result = validateNarrative(narrative, allowlist);

  if (!result.valid) {
    console.error(`[Validation] ⚠️ HALLUCINATION DETECTED in "${label}"`);
    result.errors.forEach(error => console.error(`  - ${error}`));
    return false;
  }

  console.log(`[Validation] ✅ "${label}" passed validation`);
  return true;
}
