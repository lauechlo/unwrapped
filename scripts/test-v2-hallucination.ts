/**
 * V2 Hallucination Detection Test
 * Tests if Claude invents details not in pattern evidence
 *
 * CRITICAL: V2 synthesis should ONLY narrate detected patterns.
 * Any artists, tracks, times, or statistics not in evidence = HALLUCINATION.
 */

import { config } from 'dotenv';
import { resolve } from 'path';
import { synthesizePatterns } from '../lib/v2/synthesis';
import type { DetectionResult } from '../lib/v2/types';
import type { SynthesisOutput } from '../lib/v2/synthesis/types';

config({ path: resolve(__dirname, '../.env.local') });

// ========================================
// Test Data - Known Ground Truth
// ========================================

const KNOWN_TEST_PATTERNS: DetectionResult[] = [
  {
    patternId: 'the-ritual-1',
    patternName: 'The Ritual',
    patternFamily: 'temporal',
    confidence: 0.75,
    distinctiveness: 1.0,
    evidence: [
      {
        type: 'track',
        metric: 'ritual_track',
        value: 'Sugar Talking',
        sourceIndices: [100, 150, 200],
        humanReadable: '"Sugar Talking" by Sabrina Carpenter',
      },
      {
        type: 'count',
        metric: 'total_plays',
        value: 95,
        sourceIndices: [100, 150, 200],
        humanReadable: '95 plays total',
      },
      {
        type: 'timestamp',
        metric: 'dominant_hour',
        value: 13,
        sourceIndices: [100, 150, 200],
        humanReadable: '1pm',
      },
      {
        type: 'count',
        metric: 'plays_at_hour',
        value: 71,
        sourceIndices: [100, 150, 200],
        humanReadable: '71 of those at 1pm',
      },
      {
        type: 'ratio',
        metric: 'consistency',
        value: 0.75,
        sourceIndices: [],
        humanReadable: '75% time consistency',
      },
    ],
    psychologicalBasis:
      'Temporal anchoring and ritualistic behavior. Music as temporal marker for specific contexts or emotional states (Levitin, 2006; Saarikallio, 2007)',
  },
  {
    patternId: 'life-event-1',
    patternName: 'Life Event Detection',
    patternFamily: 'evolution',
    confidence: 0.91,
    distinctiveness: 1.0,
    evidence: [
      {
        type: 'timestamp',
        metric: 'week_start',
        value: '2025-10-22',
        sourceIndices: [500, 600, 700],
        humanReadable: 'Week of Oct 22, 2025',
      },
      {
        type: 'count',
        metric: 'new_artist_count',
        value: 156,
        sourceIndices: [500, 600, 700],
        humanReadable: '156 new artists',
      },
      {
        type: 'ratio',
        metric: 'new_artist_ratio',
        value: 0.912,
        sourceIndices: [],
        humanReadable: '91% new artists',
      },
      {
        type: 'artist',
        metric: 'sample_new_artists',
        value: 'King Geedorah, Khalid, FLETCHER',
        sourceIndices: [500, 600, 700],
        humanReadable: 'Including: King Geedorah, Khalid, FLETCHER',
      },
    ],
    psychologicalBasis:
      'Sudden shifts in listening behavior correlate with life transitions. Musical exploration as identity reconstruction (North & Hargreaves, 2008)',
  },
  {
    patternId: 'ghost-timeline-1',
    patternName: 'Ghost Timeline',
    patternFamily: 'loyalty_dropoff',
    confidence: 0.54,
    distinctiveness: 1.0,
    evidence: [
      {
        type: 'artist',
        metric: 'ghosted_artist',
        value: 'Brandee Younger',
        sourceIndices: [300, 350],
        humanReadable: 'Brandee Younger',
      },
      {
        type: 'count',
        metric: 'total_plays',
        value: 35,
        sourceIndices: [300, 350],
        humanReadable: '35 plays total',
      },
      {
        type: 'timestamp',
        metric: 'last_played',
        value: '2025-11-11T10:30:00Z',
        sourceIndices: [350],
        humanReadable: 'Last heard: Nov 11, 2025',
      },
      {
        type: 'duration',
        metric: 'days_since_last_play',
        value: 44,
        sourceIndices: [],
        humanReadable: '44 days ago',
      },
    ],
    psychologicalBasis:
      'Emotional disassociation and memory avoidance. Dramatic shifts in artist preference often correlate with life events or relationship changes (North & Hargreaves, 2008)',
  },
];

// ========================================
// Ground Truth Allowlist
// ========================================

const ALLOWED_ARTISTS = new Set([
  'Sabrina Carpenter',
  'King Geedorah',
  'Khalid',
  'FLETCHER',
  'Brandee Younger',
]);

const ALLOWED_TRACKS = new Set([
  'Sugar Talking',
]);

const ALLOWED_NUMBERS = new Set([
  95, 71, 75, // Ritual pattern
  156, 91, 22, 10, 2025, // Life event
  35, 44, 11, // Ghost
  1, 13, // Hours/misc
]);

// ========================================
// Hallucination Detection
// ========================================

interface HallucinationReport {
  run: number;
  hallucinations: {
    type: 'artist' | 'track' | 'number' | 'temporal' | 'fabrication';
    severity: 'critical' | 'warning';
    claimed: string;
    location: string;
    explanation: string;
  }[];
  totalHallucinations: number;
  passed: boolean;
}

function extractEntities(text: string): {
  artists: string[];
  tracks: string[];
  numbers: number[];
} {
  const artists: string[] = [];
  const tracks: string[] = [];
  const numbers: number[] = [];

  // Extract artists
  const artistPatterns = [
    /"([^"]+)"\s+by\s+([A-Z][a-zA-Z\s&]+)/g, // "Song" by Artist
    /\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)\b/g, // Capitalized names
  ];

  artistPatterns.forEach(pattern => {
    let match;
    while ((match = pattern.exec(text)) !== null) {
      const candidate = match[2] || match[1];
      if (candidate && candidate.length > 2 && !candidate.match(/^(The|Your|My|POV|Week|Month)$/)) {
        artists.push(candidate.trim());
      }
    }
  });

  // Extract tracks (quoted strings)
  const trackPattern = /"([^"]+)"/g;
  let trackMatch;
  while ((trackMatch = trackPattern.exec(text)) !== null) {
    const track = trackMatch[1];
    if (track.length > 2 && !track.match(/^(POV|The Way|Week of)/)) {
      tracks.push(track);
    }
  }

  // Extract numbers
  const numberPatterns = [
    /(\d+)%/g,
    /#(\d+)/g,
    /(\d+)\s+(?:plays?|artists?|tracks?|days?)/gi,
  ];

  numberPatterns.forEach(pattern => {
    let match;
    while ((match = pattern.exec(text)) !== null) {
      numbers.push(parseInt(match[1]));
    }
  });

  return { artists, tracks, numbers };
}

function detectHallucinations(output: SynthesisOutput, runNumber: number): HallucinationReport {
  const hallucinations: HallucinationReport['hallucinations'] = [];

  // Collect all text
  const allText = [
    output.heroInsight.headline,
    output.heroInsight.subtext,
    ...output.narratives.map(n => `${n.title} ${n.finding} ${n.context} ${n.callout}`),
    output.psychologicalSummary,
  ].join(' ');

  // Extract entities from output
  const { artists, tracks, numbers } = extractEntities(allText);

  // Check artists
  for (const artist of artists) {
    let isAllowed = false;
    for (const allowed of ALLOWED_ARTISTS) {
      if (artist.includes(allowed) || allowed.includes(artist)) {
        isAllowed = true;
        break;
      }
    }

    if (!isAllowed) {
      hallucinations.push({
        type: 'artist',
        severity: 'critical',
        claimed: artist,
        location: findLocation(allText, artist),
        explanation: `Artist "${artist}" not in evidence. Allowed: ${Array.from(ALLOWED_ARTISTS).join(', ')}`,
      });
    }
  }

  // Check tracks
  for (const track of tracks) {
    let isAllowed = false;
    for (const allowed of ALLOWED_TRACKS) {
      if (track.includes(allowed) || allowed.includes(track)) {
        isAllowed = true;
        break;
      }
    }

    if (!isAllowed) {
      hallucinations.push({
        type: 'track',
        severity: 'critical',
        claimed: track,
        location: findLocation(allText, track),
        explanation: `Track "${track}" not in evidence. Allowed: ${Array.from(ALLOWED_TRACKS).join(', ')}`,
      });
    }
  }

  // Check numbers (allow some flexibility for derived values)
  for (const num of numbers) {
    if (num <= 2 || num > 2000) continue; // Skip trivial or year numbers

    let isAllowed = ALLOWED_NUMBERS.has(num);

    // Allow derived percentages, rounded values
    if (!isAllowed) {
      for (const allowed of ALLOWED_NUMBERS) {
        if (Math.abs(num - allowed) <= 2 || Math.abs(num - Math.round(allowed)) <= 1) {
          isAllowed = true;
          break;
        }
      }
    }

    if (!isAllowed && num > 10) {
      hallucinations.push({
        type: 'number',
        severity: 'warning',
        claimed: num.toString(),
        location: findLocation(allText, num.toString()),
        explanation: `Number ${num} not in evidence. Allowed: ${Array.from(ALLOWED_NUMBERS).slice(0, 15).join(', ')}`,
      });
    }
  }

  const criticalCount = hallucinations.filter(h => h.severity === 'critical').length;

  return {
    run: runNumber,
    hallucinations,
    totalHallucinations: hallucinations.length,
    passed: criticalCount === 0,
  };
}

function findLocation(text: string, search: string): string {
  const index = text.toLowerCase().indexOf(search.toLowerCase());
  if (index === -1) return 'Unknown';

  const start = Math.max(0, index - 30);
  const end = Math.min(text.length, index + search.length + 30);
  return '...' + text.substring(start, end) + '...';
}

// ========================================
// Run Test
// ========================================

async function runHallucinationTest() {
  console.log('🔍 V2 HALLUCINATION DETECTION TEST\n');
  console.log('='.repeat(80));
  console.log('Testing if Claude invents details not in pattern evidence');
  console.log('='.repeat(80) + '\n');

  console.log('📋 Ground Truth:');
  console.log('  Allowed Artists:', Array.from(ALLOWED_ARTISTS).join(', '));
  console.log('  Allowed Tracks:', Array.from(ALLOWED_TRACKS).join(', '));
  console.log('  Allowed Numbers (sample):', Array.from(ALLOWED_NUMBERS).slice(0, 10).join(', '), '...');
  console.log('\n' + '='.repeat(80) + '\n');

  const NUM_RUNS = 3;
  const reports: HallucinationReport[] = [];

  for (let i = 1; i <= NUM_RUNS; i++) {
    console.log(`🧪 Run ${i}/${NUM_RUNS}...`);

    try {
      const output = await synthesizePatterns(KNOWN_TEST_PATTERNS, 3);
      const report = detectHallucinations(output, i);
      reports.push(report);

      if (report.passed) {
        console.log(`  ✅ PASSED - No critical hallucinations`);
      } else {
        console.log(`  ❌ FAILED - ${report.hallucinations.filter(h => h.severity === 'critical').length} critical hallucinations`);
      }

      if (report.hallucinations.length > 0) {
        console.log(`  ⚠️  Total issues: ${report.totalHallucinations}`);
      }

      await new Promise(r => setTimeout(r, 2000)); // Rate limit
    } catch (error) {
      console.error(`  ❌ Error in run ${i}:`, error);
    }
  }

  // ========================================
  // Report Results
  // ========================================

  console.log('\n' + '='.repeat(80));
  console.log('📊 HALLUCINATION REPORT');
  console.log('='.repeat(80) + '\n');

  reports.forEach(report => {
    console.log(`Run ${report.run}: ${report.passed ? '✅ PASS' : '❌ FAIL'} (${report.totalHallucinations} issues)`);

    if (report.hallucinations.length > 0) {
      console.log('\n  Issues Found:');
      report.hallucinations.forEach(h => {
        const icon = h.severity === 'critical' ? '🚨' : '⚠️';
        console.log(`  ${icon} [${h.severity.toUpperCase()}] ${h.type}`);
        console.log(`     Claimed: "${h.claimed}"`);
        console.log(`     Location: ${h.location}`);
        console.log(`     ${h.explanation}`);
        console.log();
      });
    }
  });

  const totalRuns = reports.length;
  const passedRuns = reports.filter(r => r.passed).length;
  const criticalHallucinations = reports.reduce((sum, r) =>
    sum + r.hallucinations.filter(h => h.severity === 'critical').length, 0
  );

  console.log('='.repeat(80));
  console.log('📈 SUMMARY');
  console.log('='.repeat(80));
  console.log(`Runs: ${passedRuns}/${totalRuns} passed`);
  console.log(`Critical Hallucinations: ${criticalHallucinations}`);
  console.log(`Pass Rate: ${((passedRuns / totalRuns) * 100).toFixed(1)}%`);
  console.log();

  if (passedRuns === totalRuns) {
    console.log('✅ ALL TESTS PASSED - No critical hallucinations detected');
    console.log('   Safe to proceed with V2 synthesis');
  } else {
    console.log('❌ TESTS FAILED - Critical hallucinations detected');
    console.log('   DO NOT use in production - Claude is inventing data');
    console.log('\n⚠️  RECOMMENDED ACTIONS:');
    console.log('   1. Review prompts - strengthen "ONLY use provided evidence" constraints');
    console.log('   2. Lower temperature (currently 0.3)');
    console.log('   3. Add more validation checks');
    console.log('   4. Consider rejecting hallucinated narratives entirely');
  }

  console.log('\n' + '='.repeat(80));
  console.log(`💰 Estimated cost: ~$${(NUM_RUNS * 0.01).toFixed(3)} (Haiku model)`);
  console.log('='.repeat(80) + '\n');

  process.exit(passedRuns === totalRuns ? 0 : 1);
}

runHallucinationTest();
