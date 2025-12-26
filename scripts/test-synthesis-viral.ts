/**
 * Test Viral Synthesis End-to-End
 * Tests the complete synthesis pipeline with viral labels
 */

import { config } from 'dotenv';
import { resolve } from 'path';
import { synthesizeInsights } from '../lib/synthesis/synthesize-viral';
import type { DetectionResult } from '../lib/synthesis/types';

config({ path: resolve(__dirname, '../.env.local') });

const SAMPLE_PATTERNS: DetectionResult[] = [
  {
    patternId: 1,
    patternName: 'The Looper',
    confidence: 1.0,
    psychologicalDimension: 'Emotional Regulation',
    category: 'Repetition',
    evidence: [
      { type: 'rank', value: 1, humanReadable: '"Make It To Christmas" by Sabrina Carpenter - Current #1' },
      { type: 'rank', value: 2, humanReadable: '"Make It To Christmas" - 6-month #2' },
      { type: 'rank', value: 5, humanReadable: '"Make It To Christmas" - All-time #5' },
      { type: 'stat', humanReadable: 'Average rank across time periods: 2.7' }
    ]
  },
  {
    patternId: 2,
    patternName: 'The Wicked Fan',
    confidence: 1.0,
    psychologicalDimension: 'Identity and Memory',
    category: 'Artist Loyalty',
    evidence: [
      { type: 'count', value: 6, humanReadable: '6 tracks from Wicked soundtrack in your top 20 (30%)' },
      { type: 'tracks', humanReadable: 'Tracks: "No Good Deed", "As Long As You\'re Mine", "For Good", "Defying Gravity", "Popular", "I\'m Not That Girl"' }
    ]
  },
  {
    patternId: 3,
    patternName: 'The Consistency Champion',
    confidence: 0.95,
    psychologicalDimension: 'Identity Transition',
    category: 'Artist Loyalty',
    evidence: [
      { type: 'artists', humanReadable: '6 artists appear in ALL time ranges: Ariana Grande, Sabrina Carpenter, PinkPantheress, Lana Del Rey, Taylor Swift, FLETCHER' },
      { type: 'stat', humanReadable: 'These artists maintain top 10 positions across 4-week, 6-month, and all-time charts' }
    ]
  },
  {
    patternId: 4,
    patternName: 'Ghost Artist',
    confidence: 0.92,
    psychologicalDimension: 'Memory and Avoidance',
    category: 'Avoidance',
    evidence: [
      { type: 'count', value: 17, humanReadable: '17 tracks from all-time top 20 completely absent from current rotation' },
      { type: 'tracks', humanReadable: 'Including: "Guilty as Sin?" by Taylor Swift (#1 all-time), "Good Luck, Babe!" by Chappell Roan, "Training Season" by Dua Lipa' }
    ]
  },
  {
    patternId: 5,
    patternName: 'Sunday Ritual',
    confidence: 0.88,
    psychologicalDimension: 'Temporal Patterns',
    category: 'Temporal',
    evidence: [
      { type: 'stat', humanReadable: '4 out of 4 recent Sunday sessions detected' },
      { type: 'time', humanReadable: 'Sunday plays: 7:04am, 7:42am, 8:15am, 9:30am' },
      { type: 'stat', humanReadable: '82% of recent plays occur during 6am-12pm window' }
    ]
  }
];

async function testViralSynthesis() {
  console.log('🧪 TESTING VIRAL SYNTHESIS PIPELINE\n');
  console.log('='.repeat(80));
  console.log(`Testing with ${SAMPLE_PATTERNS.length} sample patterns`);
  console.log('='.repeat(80) + '\n');

  try {
    const startTime = Date.now();

    const result = await synthesizeInsights(SAMPLE_PATTERNS);

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);

    console.log('\n' + '='.repeat(80));
    console.log('✅ SYNTHESIS COMPLETE');
    console.log('='.repeat(80) + '\n');

    console.log('⏱️  Duration:', duration + 's\n');

    console.log('━'.repeat(80));
    console.log('🎯 HERO INSIGHT');
    console.log('━'.repeat(80));
    console.log('Headline:', result.heroInsight.headline);
    console.log('Subtext:', result.heroInsight.subtext);
    console.log();

    console.log('━'.repeat(80));
    console.log('🎴 PATTERN CARDS');
    console.log('━'.repeat(80));
    result.patternCards.forEach((card, i) => {
      console.log(`\n[${i + 1}] ${card.patternLabel}`);
      console.log('   Core:', card.core);
      console.log('   Supporting:', card.supporting);
      console.log('   Behavior:', card.behavior);
      console.log('   Callout:', card.callout);
      console.log('   Confidence:', card.confidence);
    });
    console.log();

    console.log('━'.repeat(80));
    console.log('🧬 LISTENING DNA');
    console.log('━'.repeat(80));
    console.log('Temporal:', result.listeningDNA.temporalPattern.label);
    console.log('  →', result.listeningDNA.temporalPattern.evidence);
    console.log();
    console.log('Emotional:', result.listeningDNA.emotionalStrategy.label);
    console.log('  →', result.listeningDNA.emotionalStrategy.evidence);
    console.log();
    console.log('Discovery:', result.listeningDNA.discoveryMode.label);
    console.log('  →', result.listeningDNA.discoveryMode.evidence);
    console.log();
    console.log('Attachment:', result.listeningDNA.attachmentStyle.label);
    console.log('  →', result.listeningDNA.attachmentStyle.evidence);
    console.log();

    console.log('='.repeat(80));
    console.log('📊 VIRAL LABEL CHECK');
    console.log('='.repeat(80));

    const labels = result.patternCards.map(c => c.patternLabel);

    console.log('\n✓ Checking for artist/track names...');
    labels.forEach((label, i) => {
      const hasArtistTrack = /[A-Z][a-z]+( [A-Z][a-z]+)+/.test(label) || /["'][^"']+["']/.test(label);
      console.log(`  ${hasArtistTrack ? '✅' : '❌'} [${i + 1}] ${label}`);
    });

    console.log('\n✓ Checking for Gen Z slang...');
    const genZTerms = ['chokehold', 'era', 'hyperfixation', 'disorder', 'POV', 'brain chemistry', 'witness protection', 'main character', 'emotional support'];
    labels.forEach((label, i) => {
      const hasSlang = genZTerms.some(term => label.toLowerCase().includes(term.toLowerCase()));
      console.log(`  ${hasSlang ? '✅' : '❌'} [${i + 1}] ${label}`);
    });

    console.log('\n✓ Checking for numbers...');
    labels.forEach((label, i) => {
      const hasNumbers = /\d+/.test(label);
      console.log(`  ${hasNumbers ? '✅' : '❌'} [${i + 1}] ${label}`);
    });

    console.log('\n' + '='.repeat(80));
    console.log('💰 Estimated cost: ~$0.015-0.020');
    console.log('='.repeat(80) + '\n');

  } catch (error) {
    console.error('\n❌ SYNTHESIS FAILED\n');
    console.error(error);
    process.exit(1);
  }
}

testViralSynthesis();
