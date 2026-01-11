// Test Life Event Detection detector
// Run with: npx tsx scripts/test-life-event.ts

import * as fs from 'fs';
import * as path from 'path';
import { parseStreamingHistory } from '../lib/v2/parser';
import { buildSourceOfTruth } from '../lib/v2/sourceOfTruth';
import { detectLifeEvent } from '../lib/v2/detectors/temporal/lifeEvent';

async function testLifeEvent() {
  console.log('='.repeat(80));
  console.log('LIFE EVENT DETECTION TEST');
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

  console.log('Loading and parsing data...');
  const fileContent = fs.readFileSync(testDataPath, 'utf-8');
  const parseResult = await parseStreamingHistory(fileContent, {
    sanitize: true,
    validate: false,
  });

  if (!parseResult.success || !parseResult.data) {
    console.error('Parse failed:', parseResult.error);
    return;
  }

  console.log(`✅ Parsed ${parseResult.data.length} records`);
  console.log();

  // Build SourceOfTruth
  console.log('Building SourceOfTruth...');
  const sot = buildSourceOfTruth(parseResult.data);
  console.log('✅ SourceOfTruth built');
  console.log();

  console.log(`Dataset date range: ${sot.meta.dateRange.start.toDateString()} - ${sot.meta.dateRange.end.toDateString()}`);
  console.log(`Total weeks: ${sot.temporal.byWeek.size}`);
  console.log();

  // Show week-by-week artist diversity
  console.log('Week-by-week artist exploration:');
  const sortedWeeks = Array.from(sot.temporal.byWeek.entries()).sort((a, b) =>
    a[0].localeCompare(b[0])
  );

  sortedWeeks.forEach(([weekKey, weekData]) => {
    const newArtistRatio = weekData.newArtists.size / weekData.artists.size;
    const bar = '█'.repeat(Math.ceil(newArtistRatio * 20));
    console.log(
      `  ${weekKey}: ${weekData.playCount.toString().padStart(4)} plays, ${weekData.artists.size.toString().padStart(3)} artists (${weekData.newArtists.size.toString().padStart(3)} new, ${(newArtistRatio * 100).toFixed(1).padStart(5)}%) ${bar}`
    );
  });
  console.log();

  // Run detector
  console.log('Running Life Event detector...');
  const result = detectLifeEvent(sot);

  if (!result) {
    console.log('❌ No life event detected');
    console.log();
    console.log('(This is normal for a 2-month window - life events are more visible in longer timeframes)');
    return;
  }

  console.log('✅ LIFE EVENT DETECTED!');
  console.log();

  // Display results
  console.log('='.repeat(80));
  console.log('DETECTION RESULTS');
  console.log('='.repeat(80));
  console.log(`Pattern ID: ${result.patternId}`);
  console.log(`Pattern Name: ${result.patternName}`);
  console.log(`Pattern Family: ${result.patternFamily}`);
  console.log(`Confidence: ${(result.confidence * 100).toFixed(1)}%`);
  console.log(`Distinctiveness: ${(result.distinctiveness * 100).toFixed(1)}%`);
  console.log();

  console.log('Psychological Basis:');
  console.log(`  ${result.psychologicalBasis}`);
  console.log();

  console.log('='.repeat(80));
  console.log('EVIDENCE');
  console.log('='.repeat(80));
  result.evidence.forEach((e, i) => {
    console.log(`${i + 1}. [${e.type}] ${e.metric}`);
    console.log(`   Value: ${e.value}`);
    console.log(`   Human: ${e.humanReadable}`);
    console.log();
  });

  console.log('='.repeat(80));
  console.log('✅ TEST COMPLETE');
  console.log('='.repeat(80));
}

// Run test
testLifeEvent().catch(console.error);
