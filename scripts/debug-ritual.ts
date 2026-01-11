// Debug ritual detection
// Run with: npx tsx scripts/debug-ritual.ts

import * as fs from 'fs';
import * as path from 'path';
import { parseStreamingHistory } from '../lib/v2/parser';
import { buildSourceOfTruth } from '../lib/v2/sourceOfTruth';

async function debugRitual() {
  console.log('Debugging ritual detection...\n');

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

  const fileContent = fs.readFileSync(testDataPath, 'utf-8');
  const parseResult = await parseStreamingHistory(fileContent, {
    sanitize: true,
    validate: false,
  });

  if (!parseResult.success || !parseResult.data) {
    console.error('Parse failed');
    return;
  }

  const sot = buildSourceOfTruth(parseResult.data);

  // Find "Make It To Christmas"
  const makeItToChristmas = Array.from(sot.tracks.values()).find(
    t => t.name.toLowerCase().includes('make it to christmas')
  );

  if (!makeItToChristmas) {
    console.log('Track not found');
    return;
  }

  console.log(`Found: "${makeItToChristmas.name}" by ${makeItToChristmas.artist}`);
  console.log(`Total plays: ${makeItToChristmas.totalPlays}`);
  console.log();

  // Hour distribution
  const hourDist = new Map<number, number>();
  const dayDist = new Map<string, number>();

  for (const play of makeItToChristmas.plays) {
    const hour = play.timestamp.getHours();
    const day = play.timestamp.toISOString().split('T')[0];

    hourDist.set(hour, (hourDist.get(hour) || 0) + 1);
    dayDist.set(day, (dayDist.get(day) || 0) + 1);
  }

  console.log('Hour distribution:');
  const sortedHours = Array.from(hourDist.entries()).sort((a, b) => a[0] - b[0]);
  sortedHours.forEach(([hour, count]) => {
    const pct = ((count / makeItToChristmas.totalPlays) * 100).toFixed(1);
    const bar = '█'.repeat(Math.ceil(count / 3));
    console.log(`  ${hour.toString().padStart(2)}:00 - ${count.toString().padStart(3)} plays (${pct.padStart(5)}%) ${bar}`);
  });
  console.log();

  console.log(`Unique days: ${dayDist.size}`);
  console.log();

  // Find dominant hour
  const dominant = Array.from(hourDist.entries()).sort((a, b) => b[1] - a[1])[0];
  console.log(`Dominant hour: ${dominant[0]}:00 with ${dominant[1]} plays (${((dominant[1] / makeItToChristmas.totalPlays) * 100).toFixed(1)}%)`);

  // Check ±1 hour window
  const adjacentHours = [
    dominant[0] - 1 < 0 ? 23 : dominant[0] - 1,
    dominant[0],
    dominant[0] + 1 > 23 ? 0 : dominant[0] + 1,
  ];

  const playsInWindow = adjacentHours.reduce(
    (sum, hour) => sum + (hourDist.get(hour) || 0),
    0
  );

  const consistency = playsInWindow / makeItToChristmas.totalPlays;
  console.log(`Plays in ±1 hour window: ${playsInWindow} (${(consistency * 100).toFixed(1)}% consistency)`);
  console.log();

  console.log('Thresholds check:');
  console.log(`  Total plays >= 5? ${makeItToChristmas.totalPlays >= 5 ? '✅' : '❌'} (${makeItToChristmas.totalPlays})`);
  console.log(`  Consistency >= 60%? ${consistency >= 0.6 ? '✅' : '❌'} (${(consistency * 100).toFixed(1)}%)`);
  console.log(`  Unique days >= 3? ${dayDist.size >= 3 ? '✅' : '❌'} (${dayDist.size})`);
  console.log(`  Dominant hour plays >= 3? ${dominant[1] >= 3 ? '✅' : '❌'} (${dominant[1]})`);
}

debugRitual().catch(console.error);
