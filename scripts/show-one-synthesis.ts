/**
 * Generate one synthesis output for manual review
 */

import { config } from 'dotenv';
import { resolve } from 'path';
import { synthesizeInsights } from '../lib/synthesis/synthesize-viral';
import type { DetectionResult } from '../lib/synthesis/types';

config({ path: resolve(__dirname, '../.env.local') });

const TEST_DATA: DetectionResult[] = [
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

async function showSynthesis() {
  console.log('📋 INPUT DATA:');
  console.log('='.repeat(80));
  console.log(JSON.stringify(TEST_DATA, null, 2));
  console.log('\n' + '='.repeat(80) + '\n');

  const result = await synthesizeInsights(TEST_DATA);

  console.log('📤 OUTPUT:');
  console.log('='.repeat(80));
  console.log(JSON.stringify(result, null, 2));
  console.log('\n' + '='.repeat(80));
}

showSynthesis();
