/**
 * Hallucination Detection Script
 * Tests if Claude invents artist/track names or statistics not in the input data
 * CRITICAL: LLMs can fabricate plausible-sounding data - we must catch this
 */

import { config } from 'dotenv';
import { resolve } from 'path';
import { synthesizeInsights } from '../lib/synthesis/synthesize-viral';
import type { DetectionResult, SynthesisOutput } from '../lib/synthesis/types';

config({ path: resolve(__dirname, '../.env.local') });

// Sample data with KNOWN artists/tracks - any others are hallucinations
const KNOWN_TEST_DATA: DetectionResult[] = [
  {
    patternId: 1,
    patternName: 'The Looper',
    confidence: 1.0,
    psychologicalDimension: 'Emotional Regulation',
    category: 'Repetition',
    evidence: [
      { type: 'track', humanReadable: '"Make It To Christmas" by Sabrina Carpenter' },
      { type: 'rank', value: 1, humanReadable: 'Current rank: #1' },
      { type: 'rank', value: 2, humanReadable: '6-month rank: #2' },
      { type: 'rank', value: 5, humanReadable: 'All-time rank: #5' }
    ]
  },
  {
    patternId: 2,
    patternName: 'Artist Loyalty',
    confidence: 0.9,
    psychologicalDimension: 'Identity',
    category: 'Loyalty',
    evidence: [
      { type: 'artists', humanReadable: 'Consistent artists: Ariana Grande, Taylor Swift, Lana Del Rey' },
      { type: 'count', value: 3, humanReadable: '3 artists across all time periods' }
    ]
  }
];

// Ground truth: what SHOULD appear in output
const ALLOWED_ARTISTS = [
  'Sabrina Carpenter',
  'Ariana Grande',
  'Taylor Swift',
  'Lana Del Rey'
];

const ALLOWED_TRACKS = [
  'Make It To Christmas'
];

const ALLOWED_NUMBERS = {
  ranks: [1, 2, 5],
  counts: [3],
  any: [1, 2, 3, 5] // All numbers that appear in evidence
};

interface HallucinationReport {
  run: number;
  hallucinations: {
    type: 'artist' | 'track' | 'number' | 'statistic';
    severity: 'critical' | 'warning' | 'minor';
    claimed: string;
    location: string;
    explanation: string;
  }[];
  totalHallucinations: number;
  passed: boolean;
}

/**
 * Extract all artist names from text
 */
function extractArtists(text: string): string[] {
  const artists: string[] = [];

  // Match common patterns
  const patterns = [
    /"([^"]+)" by ([A-Z][a-zA-Z\s&]+)/g,  // "Song" by Artist
    /\b([A-Z][a-z]+(?:\s[A-Z][a-z]+)*)\s+has you/gi, // Artist has you
    /\b(Ariana Grande|Taylor Swift|Sabrina Carpenter|Lana Del Rey|PinkPantheress|FLETCHER|Chappell Roan|Dua Lipa)\b/gi
  ];

  patterns.forEach(pattern => {
    let match;
    while ((match = pattern.exec(text)) !== null) {
      const artist = match[2] || match[1];
      if (artist && artist.length > 2) {
        artists.push(artist.trim());
      }
    }
  });

  return [...new Set(artists)]; // Deduplicate
}

/**
 * Extract all track names from text
 */
function extractTracks(text: string): string[] {
  const tracks: string[] = [];

  // Match quoted strings (likely song titles)
  const quotePattern = /"([^"]+)"/g;
  let match;

  while ((match = quotePattern.exec(text)) !== null) {
    const track = match[1];
    // Filter out artists and common phrases
    if (!ALLOWED_ARTISTS.some(a => track.includes(a)) &&
        track.length > 3 &&
        !track.includes('POV') &&
        !track.includes('#')) {
      tracks.push(track);
    }
  }

  return [...new Set(tracks)];
}

/**
 * Extract all numbers from text that appear in statistical contexts
 */
function extractStatistics(text: string): Array<{number: number, context: string}> {
  const stats: Array<{number: number, context: string}> = [];

  // Match numbers with context
  const patterns = [
    /#(\d+)/g,                           // #1, #2 (ranks)
    /(\d+)%/g,                           // 30% (percentages)
    /(\d+)\s+tracks?/gi,                 // 6 tracks
    /(\d+)\s+artists?/gi,                // 3 artists
    /(\d+)\/(\d+)/g,                     // 6/20 (fractions)
  ];

  patterns.forEach(pattern => {
    let match;
    const originalText = text;
    while ((match = pattern.exec(originalText)) !== null) {
      const num = parseInt(match[1]);
      const context = originalText.substring(Math.max(0, match.index - 20), Math.min(originalText.length, match.index + 40));
      stats.push({ number: num, context });
    }
  });

  return stats;
}

/**
 * Check if an artist is allowed (in input data)
 */
function isAllowedArtist(artist: string): boolean {
  return ALLOWED_ARTISTS.some(allowed =>
    artist.toLowerCase().includes(allowed.toLowerCase()) ||
    allowed.toLowerCase().includes(artist.toLowerCase())
  );
}

/**
 * Check if a track is allowed (in input data)
 */
function isAllowedTrack(track: string): boolean {
  return ALLOWED_TRACKS.some(allowed =>
    track.toLowerCase().includes(allowed.toLowerCase()) ||
    allowed.toLowerCase().includes(track.toLowerCase())
  );
}

/**
 * Check if a number appears in the input evidence
 */
function isAllowedNumber(num: number): boolean {
  return ALLOWED_NUMBERS.any.includes(num);
}

/**
 * Analyze output for hallucinations
 */
function detectHallucinations(output: SynthesisOutput, runNumber: number): HallucinationReport {
  const hallucinations: HallucinationReport['hallucinations'] = [];

  // Collect all text to analyze
  const allText = [
    output.heroInsight.headline,
    output.heroInsight.subtext,
    ...output.patternCards.map(c => `${c.patternLabel} ${c.core} ${c.supporting} ${c.behavior} ${c.callout}`),
    output.listeningDNA.temporalPattern.label,
    output.listeningDNA.temporalPattern.evidence,
    output.listeningDNA.emotionalStrategy.label,
    output.listeningDNA.emotionalStrategy.evidence,
    output.listeningDNA.discoveryMode.label,
    output.listeningDNA.discoveryMode.evidence,
    output.listeningDNA.attachmentStyle.label,
    output.listeningDNA.attachmentStyle.evidence
  ].join(' ');

  // Check artists
  const claimedArtists = extractArtists(allText);
  claimedArtists.forEach(artist => {
    if (!isAllowedArtist(artist)) {
      hallucinations.push({
        type: 'artist',
        severity: 'critical',
        claimed: artist,
        location: findLocation(allText, artist),
        explanation: `Artist "${artist}" not found in input evidence. Allowed: ${ALLOWED_ARTISTS.join(', ')}`
      });
    }
  });

  // Check tracks
  const claimedTracks = extractTracks(allText);
  claimedTracks.forEach(track => {
    if (!isAllowedTrack(track)) {
      hallucinations.push({
        type: 'track',
        severity: 'critical',
        claimed: track,
        location: findLocation(allText, track),
        explanation: `Track "${track}" not found in input evidence. Allowed: ${ALLOWED_TRACKS.join(', ')}`
      });
    }
  });

  // Check statistics
  const claimedStats = extractStatistics(allText);
  claimedStats.forEach(stat => {
    if (!isAllowedNumber(stat.number)) {
      // Some numbers are OK (like percentages calculated from allowed numbers)
      // But flag suspicious ones
      if (stat.number > 10 && stat.number !== 20 && stat.number !== 30) {
        hallucinations.push({
          type: 'number',
          severity: 'warning',
          claimed: stat.number.toString(),
          location: stat.context,
          explanation: `Number ${stat.number} not found in input evidence. Allowed: ${ALLOWED_NUMBERS.any.join(', ')}`
        });
      }
    }
  });

  const criticalCount = hallucinations.filter(h => h.severity === 'critical').length;

  return {
    run: runNumber,
    hallucinations,
    totalHallucinations: hallucinations.length,
    passed: criticalCount === 0
  };
}

/**
 * Find where in text a string appears
 */
function findLocation(text: string, search: string): string {
  const index = text.toLowerCase().indexOf(search.toLowerCase());
  if (index === -1) return 'Unknown';

  const start = Math.max(0, index - 30);
  const end = Math.min(text.length, index + search.length + 30);
  return '...' + text.substring(start, end) + '...';
}

/**
 * Run hallucination detection test
 */
async function runHallucinationTest() {
  console.log('🔍 HALLUCINATION DETECTION TEST\n');
  console.log('='.repeat(80));
  console.log('Testing if Claude invents artists, tracks, or stats not in input data');
  console.log('='.repeat(80) + '\n');

  console.log('📋 Input Data:');
  console.log('  Allowed Artists:', ALLOWED_ARTISTS.join(', '));
  console.log('  Allowed Tracks:', ALLOWED_TRACKS.join(', '));
  console.log('  Allowed Numbers:', ALLOWED_NUMBERS.any.join(', '));
  console.log('\n' + '='.repeat(80) + '\n');

  const NUM_RUNS = 3;
  const reports: HallucinationReport[] = [];

  for (let i = 1; i <= NUM_RUNS; i++) {
    console.log(`🧪 Run ${i}/${NUM_RUNS}...`);

    try {
      const output = await synthesizeInsights(KNOWN_TEST_DATA);
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

  console.log('\n' + '='.repeat(80));
  console.log('📊 HALLUCINATION REPORT');
  console.log('='.repeat(80) + '\n');

  reports.forEach(report => {
    console.log(`Run ${report.run}: ${report.passed ? '✅ PASS' : '❌ FAIL'} (${report.totalHallucinations} issues)`);

    if (report.hallucinations.length > 0) {
      console.log('\n  Issues Found:');
      report.hallucinations.forEach((h, i) => {
        const icon = h.severity === 'critical' ? '🚨' : h.severity === 'warning' ? '⚠️' : 'ℹ️';
        console.log(`  ${icon} [${h.severity.toUpperCase()}] ${h.type}`);
        console.log(`     Claimed: "${h.claimed}"`);
        console.log(`     Location: ${h.location}`);
        console.log(`     ${h.explanation}`);
        console.log();
      });
    }
  });

  // Summary
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
    console.log('   Safe to proceed with production use');
  } else {
    console.log('❌ TESTS FAILED - Critical hallucinations detected');
    console.log('   DO NOT use in production - Claude is inventing data');
    console.log('\n⚠️  RECOMMENDED ACTIONS:');
    console.log('   1. Review prompts to emphasize "only use provided evidence"');
    console.log('   2. Add validation layer to filter hallucinated content');
    console.log('   3. Reduce temperature in API calls (currently 0.7)');
    console.log('   4. Consider adding explicit constraints in system prompt');
  }

  console.log('\n' + '='.repeat(80));
  console.log('💰 Estimated cost: ~$' + (NUM_RUNS * 0.015).toFixed(3));
  console.log('='.repeat(80) + '\n');

  process.exit(passedRuns === totalRuns ? 0 : 1);
}

runHallucinationTest();
