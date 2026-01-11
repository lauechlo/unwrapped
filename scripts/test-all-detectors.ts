// Test all V2 detectors together
// Run with: npx tsx scripts/test-all-detectors.ts

import * as fs from 'fs';
import * as path from 'path';
import { parseStreamingHistory } from '../lib/v2/parser';
import { buildSourceOfTruth } from '../lib/v2/sourceOfTruth';
import { detectLifeEvent } from '../lib/v2/detectors/temporal/lifeEvent';
import { detectRitual } from '../lib/v2/detectors/temporal/ritual';
import { detectGhostTimeline } from '../lib/v2/detectors/temporal/ghostTimeline';
import { detectAmbient } from '../lib/v2/detectors/behavioral/ambient';
import { formatDuration } from '../lib/v2/sourceOfTruth/utils';

async function testAllDetectors() {
  console.log('='.repeat(80));
  console.log('UNWRAPPED V2: COMPLETE DETECTOR SUITE TEST');
  console.log('='.repeat(80));
  console.log();

  // Load test data
  const testDataPath = path.join(
    'C:',
    'Users',
    'lauec',
    'Desktop',
    'Princeton',
    'Side Quests',
    'My Spotify History',
    'Streaming_History_Audio_2025_9.json'
  );

  console.log('Loading Extended Streaming History...');
  const fileContent = fs.readFileSync(testDataPath, 'utf-8');

  console.log(`File size: ${(fileContent.length / 1024 / 1024).toFixed(2)} MB`);
  console.log();

  // Parse
  console.log('Parsing and validating...');
  const parseStart = Date.now();
  const parseResult = await parseStreamingHistory(fileContent, {
    sanitize: true,
    validate: false,
  });
  const parseTime = Date.now() - parseStart;

  if (!parseResult.success || !parseResult.data) {
    console.error('❌ Parse failed:', parseResult.error);
    return;
  }

  console.log(`✅ Parsed in ${parseTime}ms`);
  console.log(`   ${parseResult.data.length.toLocaleString()} valid music plays`);
  console.log();

  // Build SourceOfTruth
  console.log('Building SourceOfTruth index...');
  const sotStart = Date.now();
  const sot = buildSourceOfTruth(parseResult.data);
  const sotTime = Date.now() - sotStart;

  console.log(`✅ Built in ${sotTime}ms`);
  console.log();

  // Display dataset summary
  console.log('='.repeat(80));
  console.log('DATASET SUMMARY');
  console.log('='.repeat(80));
  console.log(`Period: ${sot.meta.dateRange.start.toDateString()} - ${sot.meta.dateRange.end.toDateString()}`);
  console.log(`Total plays: ${sot.meta.totalPlays.toLocaleString()}`);
  console.log(`Unique tracks: ${sot.meta.uniqueTracks.toLocaleString()}`);
  console.log(`Unique artists: ${sot.meta.uniqueArtists.toLocaleString()}`);
  console.log(`Listening time: ${formatDuration(sot.meta.totalListeningTimeMs)}`);
  console.log(`Skip rate: ${(sot.meta.overallSkipRate * 100).toFixed(1)}%`);
  console.log();

  // Run all detectors
  console.log('='.repeat(80));
  console.log('RUNNING PATTERN DETECTION');
  console.log('='.repeat(80));
  console.log();

  const detectors = [
    { name: 'Life Event Detection', fn: detectLifeEvent, icon: '🌟' },
    { name: 'The Ritual', fn: detectRitual, icon: '🕔' },
    { name: 'Ghost Timeline', fn: detectGhostTimeline, icon: '👻' },
    { name: 'Ambient/Lock-In', fn: detectAmbient, icon: '🔥' },
  ];

  const detectedPatterns = [];

  for (const detector of detectors) {
    process.stdout.write(`${detector.icon} ${detector.name}... `);
    const results = detector.fn(sot);

    if (results && results.length > 0) {
      console.log(`✅ DETECTED ${results.length} instances (${(results[0].confidence * 100).toFixed(1)}% confidence)`);
      detectedPatterns.push({ detector: detector.name, result: results, icon: detector.icon });
    } else {
      console.log('○ Not detected');
    }
  }

  console.log();
  console.log(`Found ${detectedPatterns.length} of 4 patterns`);
  console.log();

  if (detectedPatterns.length === 0) {
    console.log('No patterns detected in this dataset.');
    console.log('This could mean:');
    console.log('  - Timeframe too short (2 months vs ideal 6+ months)');
    console.log('  - Stable listening habits (not a bad thing!)');
    console.log('  - Different patterns not yet implemented');
    return;
  }

  // Display detected patterns
  console.log('='.repeat(80));
  console.log('YOUR LISTENING PATTERNS');
  console.log('='.repeat(80));
  console.log();

  detectedPatterns.forEach((pattern, i) => {
    console.log(`${pattern.icon} ${pattern.detector.toUpperCase()}`);
    console.log('─'.repeat(80));

    // Display results (showing top 3)
    const results = pattern.result;
    const topResults = results.slice(0, 3);

    topResults.forEach((result, idx) => {
      if (idx > 0) console.log(`\n  Instance ${idx + 1}:`);

      // Display key evidence
      result.evidence.forEach(e => {
        if (e.type === 'track' || e.type === 'artist' || e.type === 'timestamp') {
          console.log(`  ${e.humanReadable}`);
        }
      });

      console.log();
      console.log(`  Confidence: ${(result.confidence * 100).toFixed(1)}%`);
      console.log(`  Distinctiveness: ${(result.distinctiveness * 100).toFixed(1)}%`);
    });

    if (results.length > 3) {
      console.log(`\n  ... and ${results.length - 3} more instances`);
    }

    console.log();
  });

  console.log('='.repeat(80));
  console.log('✅ ANALYSIS COMPLETE');
  console.log('='.repeat(80));
  console.log();
  console.log(`Total processing time: ${parseTime + sotTime}ms`);
  console.log();
}

// Run test
testAllDetectors().catch(console.error);
