// Test The Ritual detector
// Run with: npx tsx scripts/test-ritual-detector.ts

import * as fs from 'fs';
import * as path from 'path';
import { parseStreamingHistory } from '../lib/v2/parser';
import { buildSourceOfTruth } from '../lib/v2/sourceOfTruth';
import { detectRitual } from '../lib/v2/detectors/temporal/ritual';

async function testRitualDetector() {
  console.log('='.repeat(80));
  console.log('THE RITUAL DETECTOR TEST');
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

  // Run detector
  console.log('Running The Ritual detector...');
  const result = detectRitual(sot);

  if (!result) {
    console.log('❌ No ritual detected');
    return;
  }

  console.log('✅ RITUAL DETECTED!');
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
    console.log(`   Source indices: ${e.sourceIndices.length} records`);
    console.log();
  });

  // Show detailed breakdown
  const trackName = result.evidence.find(e => e.type === 'track')?.value as string;
  const track = Array.from(sot.tracks.values()).find(t => t.name === trackName);

  if (track) {
    console.log('='.repeat(80));
    console.log('DETAILED BREAKDOWN');
    console.log('='.repeat(80));
    console.log(`Track: "${track.name}" by ${track.artist}`);
    console.log(`Total plays: ${track.totalPlays}`);
    console.log(`First played: ${track.firstPlayed.toDateString()}`);
    console.log(`Last played: ${track.lastPlayed.toDateString()}`);
    console.log();

    // Hour distribution
    const hourDist = new Map<number, number>();
    for (const play of track.plays) {
      const hour = play.timestamp.getHours();
      hourDist.set(hour, (hourDist.get(hour) || 0) + 1);
    }

    console.log('Plays by hour:');
    const sortedHours = Array.from(hourDist.entries()).sort((a, b) => b[1] - a[1]);
    sortedHours.forEach(([hour, count]) => {
      const hourStr = hour.toString().padStart(2, '0');
      const bar = '█'.repeat(Math.ceil(count / 2));
      console.log(`  ${hourStr}:00 - ${count.toString().padStart(3)} plays ${bar}`);
    });
    console.log();

    // Day distribution
    const dayDist = new Map<string, number>();
    for (const play of track.plays) {
      const day = play.timestamp.toISOString().split('T')[0];
      dayDist.set(day, (dayDist.get(day) || 0) + 1);
    }

    console.log(`Played on ${dayDist.size} unique days`);
    console.log();
  }

  console.log('='.repeat(80));
  console.log('✅ TEST COMPLETE');
  console.log('='.repeat(80));
}

// Run test
testRitualDetector().catch(console.error);
