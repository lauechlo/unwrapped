// Test script for V2 parser and SourceOfTruth builder
// Run with: npx tsx scripts/test-parser.ts

import * as fs from 'fs';
import * as path from 'path';
import { parseStreamingHistory } from '../lib/v2/parser';
import { buildSourceOfTruth } from '../lib/v2/sourceOfTruth';
import { formatDuration } from '../lib/v2/sourceOfTruth/utils';

async function testParser() {
  console.log('='.repeat(80));
  console.log('V2 PARSER TEST');
  console.log('='.repeat(80));
  console.log();

  // Path to test data file
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

  console.log(`Loading test file: ${testDataPath}`);
  console.log();

  // Read file
  const fileContent = fs.readFileSync(testDataPath, 'utf-8');
  console.log(`File size: ${(fileContent.length / 1024 / 1024).toFixed(2)} MB`);
  console.log();

  // Parse
  console.log('Parsing file...');
  const parseStart = Date.now();
  const parseResult = await parseStreamingHistory(fileContent, {
    sanitize: true,
    validate: false, // Skip Zod validation for speed
  });
  const parseTime = Date.now() - parseStart;

  if (!parseResult.success) {
    console.error('❌ Parse failed:', parseResult.error);
    return;
  }

  console.log(`✅ Parsed in ${parseTime}ms`);
  console.log();

  if (parseResult.stats) {
    console.log('Parse Statistics:');
    console.log(`  Total records: ${parseResult.stats.totalRecords.toLocaleString()}`);
    console.log(`  Valid records: ${parseResult.stats.validRecords.toLocaleString()}`);
    console.log(`  Invalid records: ${parseResult.stats.invalidRecords.toLocaleString()}`);
    console.log(`  Date range: ${parseResult.stats.dateRange.start.toDateString()} - ${parseResult.stats.dateRange.end.toDateString()}`);
    console.log();
  }

  // Build SourceOfTruth
  console.log('Building SourceOfTruth...');
  const sotStart = Date.now();
  const sot = buildSourceOfTruth(parseResult.data!);
  const sotTime = Date.now() - sotStart;

  console.log(`✅ Built in ${sotTime}ms`);
  console.log();

  // Display metadata
  console.log('='.repeat(80));
  console.log('DATASET METADATA');
  console.log('='.repeat(80));
  console.log(`Total plays: ${sot.meta.totalPlays.toLocaleString()}`);
  console.log(`Unique tracks: ${sot.meta.uniqueTracks.toLocaleString()}`);
  console.log(`Unique artists: ${sot.meta.uniqueArtists.toLocaleString()}`);
  console.log(`Skip rate: ${(sot.meta.overallSkipRate * 100).toFixed(1)}%`);
  console.log(`Completion rate: ${(sot.meta.overallCompletionRate * 100).toFixed(1)}%`);
  console.log(`Total listening time: ${formatDuration(sot.meta.totalListeningTimeMs)}`);
  console.log();

  // Display top artists
  console.log('='.repeat(80));
  console.log('TOP 10 ARTISTS');
  console.log('='.repeat(80));
  const topArtists = Array.from(sot.artists.values())
    .sort((a, b) => b.totalPlays - a.totalPlays)
    .slice(0, 10);

  topArtists.forEach((artist, i) => {
    console.log(
      `${(i + 1).toString().padStart(2)}. ${artist.name.padEnd(30)} - ${artist.totalPlays.toString().padStart(5)} plays (${(artist.skipRate * 100).toFixed(1)}% skip rate)`
    );
  });
  console.log();

  // Display top tracks
  console.log('='.repeat(80));
  console.log('TOP 10 TRACKS');
  console.log('='.repeat(80));
  const topTracks = Array.from(sot.tracks.values())
    .sort((a, b) => b.totalPlays - a.totalPlays)
    .slice(0, 10);

  topTracks.forEach((track, i) => {
    console.log(
      `${(i + 1).toString().padStart(2)}. ${track.name.padEnd(40)} - ${track.artist.padEnd(20)} (${track.totalPlays} plays)`
    );
  });
  console.log();

  // Display temporal patterns
  console.log('='.repeat(80));
  console.log('TEMPORAL PATTERNS');
  console.log('='.repeat(80));
  console.log(`Total weeks: ${sot.temporal.byWeek.size}`);
  console.log(`Total months: ${sot.temporal.byMonth.size}`);
  console.log();

  // Top listening hours
  const topHours = Array.from(sot.temporal.byHour.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  console.log('Top 5 listening hours:');
  topHours.forEach(([hour, count]) => {
    const hourStr = hour.toString().padStart(2, '0');
    console.log(`  ${hourStr}:00 - ${count.toLocaleString()} plays`);
  });
  console.log();

  // Monthly breakdown
  console.log('Monthly breakdown:');
  const sortedMonths = Array.from(sot.temporal.byMonth.entries())
    .sort((a, b) => a[0].localeCompare(b[0]));

  sortedMonths.forEach(([month, data]) => {
    console.log(
      `  ${month}: ${data.playCount.toLocaleString().padStart(6)} plays, ${data.artists.size.toString().padStart(4)} artists, ${(data.skipRate * 100).toFixed(1)}% skip rate`
    );
  });
  console.log();

  console.log('='.repeat(80));
  console.log('✅ TEST COMPLETE');
  console.log('='.repeat(80));
}

// Run test
testParser().catch(console.error);
