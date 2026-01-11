// Test Ambient/Lock-In detector
// Run with: npx tsx scripts/test-ambient.ts

import * as fs from 'fs';
import * as path from 'path';
import { parseStreamingHistory } from '../lib/v2/parser';
import { buildSourceOfTruth } from '../lib/v2/sourceOfTruth';
import { detectAmbient } from '../lib/v2/detectors/behavioral/ambient';
import { formatDuration } from '../lib/v2/sourceOfTruth/utils';

async function testAmbient() {
  console.log('='.repeat(80));
  console.log('AMBIENT/LOCK-IN DETECTOR TEST');
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

  // Show tracks with longest average duration
  console.log('Tracks with longest average play duration:');
  const longTracks = Array.from(sot.tracks.values())
    .sort((a, b) => b.avgMsPerPlay - a.avgMsPerPlay)
    .slice(0, 10);

  longTracks.forEach((track, i) => {
    console.log(
      `  ${(i + 1).toString().padStart(2)}. ${track.name.substring(0, 40).padEnd(40)} - ${formatDuration(track.avgMsPerPlay)} avg (${track.totalPlays} plays)`
    );
  });
  console.log();

  // Run detector
  console.log('Running Ambient detector...');
  const result = detectAmbient(sot);

  if (!result) {
    console.log('❌ No ambient pattern detected');
    console.log();
    console.log('This is normal if your listening is primarily music (not ambient sounds).');
    console.log('Ambient detection looks for:');
    console.log('  - Long play durations (>30 min avg)');
    console.log('  - Multiple sessions');
    console.log('  - Track names with: rain, fireplace, white noise, lo-fi, etc.');
    return;
  }

  console.log('✅ AMBIENT PATTERN DETECTED!');
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

  // Show detailed breakdown
  const trackName = result.evidence.find(e => e.type === 'track')?.value as string;
  const track = Array.from(sot.tracks.values()).find(t => t.name === trackName);

  if (track) {
    console.log('='.repeat(80));
    console.log('DETAILED BREAKDOWN');
    console.log('='.repeat(80));
    console.log(`Track: "${track.name}" by ${track.artist}`);
    console.log(`Total plays: ${track.totalPlays}`);
    console.log(`Total listening time: ${formatDuration(track.totalMsPlayed)}`);
    console.log(`Average per session: ${formatDuration(track.avgMsPerPlay)}`);
    console.log(`Skip rate: ${(track.skippedPlays / track.totalPlays * 100).toFixed(1)}%`);
    console.log();

    // Hour distribution
    const hourDist = new Map<number, number>();
    for (const play of track.plays) {
      const hour = play.timestamp.getHours();
      hourDist.set(hour, (hourDist.get(hour) || 0) + 1);
    }

    console.log('Listening times:');
    const sortedHours = Array.from(hourDist.entries()).sort((a, b) => b[1] - a[1]);
    sortedHours.slice(0, 5).forEach(([hour, count]) => {
      const hourStr = hour.toString().padStart(2, '0');
      const bar = '█'.repeat(Math.ceil(count / Math.max(...Array.from(hourDist.values())) * 20));
      console.log(`  ${hourStr}:00 - ${count.toString().padStart(2)} plays ${bar}`);
    });
    console.log();
  }

  console.log('='.repeat(80));
  console.log('✅ TEST COMPLETE');
  console.log('='.repeat(80));
}

// Run test
testAmbient().catch(console.error);
