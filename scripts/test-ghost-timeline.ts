// Test Ghost Timeline detector
// Run with: npx tsx scripts/test-ghost-timeline.ts

import * as fs from 'fs';
import * as path from 'path';
import { parseStreamingHistory } from '../lib/v2/parser';
import { buildSourceOfTruth } from '../lib/v2/sourceOfTruth';
import { detectGhostTimeline } from '../lib/v2/detectors/temporal/ghostTimeline';

async function testGhostTimeline() {
  console.log('='.repeat(80));
  console.log('GHOST TIMELINE DETECTOR TEST');
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
  console.log();

  // Run detector
  console.log('Running Ghost Timeline detector...');
  const result = detectGhostTimeline(sot);

  if (!result) {
    console.log('❌ No ghost detected');
    console.log();

    // Show potential candidates that didn't meet threshold
    console.log('Checking for near-miss candidates...');
    const now = sot.meta.dateRange.end;
    const potentialGhosts = Array.from(sot.artists.values())
      .map(artist => ({
        name: artist.name,
        plays: artist.totalPlays,
        lastPlayed: artist.lastPlayed,
        daysSince: Math.floor((now.getTime() - artist.lastPlayed.getTime()) / (1000 * 60 * 60 * 24)),
      }))
      .filter(a => a.daysSince > 20 && a.plays > 20)
      .sort((a, b) => b.plays - a.plays)
      .slice(0, 5);

    if (potentialGhosts.length > 0) {
      console.log('Top candidates (didn\'t meet threshold):');
      potentialGhosts.forEach((ghost, i) => {
        console.log(`  ${i + 1}. ${ghost.name}`);
        console.log(`     ${ghost.plays} plays, last heard ${ghost.daysSince} days ago`);
        console.log(`     Last: ${ghost.lastPlayed.toDateString()}`);
        console.log();
      });
    }
    return;
  }

  console.log('✅ GHOST DETECTED!');
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
  const artistName = result.evidence.find(e => e.type === 'artist')?.value as string;
  const artist = sot.artists.get(artistName);

  if (artist) {
    console.log('='.repeat(80));
    console.log('DETAILED BREAKDOWN');
    console.log('='.repeat(80));
    console.log(`Artist: ${artist.name}`);
    console.log(`Total plays: ${artist.totalPlays}`);
    console.log(`First played: ${artist.firstPlayed.toDateString()}`);
    console.log(`Last played: ${artist.lastPlayed.toDateString()}`);
    console.log(`Skip rate: ${(artist.skipRate * 100).toFixed(1)}%`);
    console.log(`Completion rate: ${(artist.completionRate * 100).toFixed(1)}%`);
    console.log();

    // Monthly breakdown
    console.log('Monthly breakdown:');
    const sortedMonths = Array.from(artist.playsByMonth.entries())
      .sort((a, b) => a[0].localeCompare(b[0]));

    sortedMonths.forEach(([month, plays]) => {
      const bar = '█'.repeat(Math.ceil(plays / 5));
      console.log(`  ${month}: ${plays.toString().padStart(3)} plays ${bar}`);
    });
    console.log();
  }

  console.log('='.repeat(80));
  console.log('✅ TEST COMPLETE');
  console.log('='.repeat(80));
}

// Run test
testGhostTimeline().catch(console.error);
