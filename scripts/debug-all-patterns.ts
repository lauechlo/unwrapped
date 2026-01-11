// Debug: Find ALL pattern instances (not just best one)
// Run with: npx tsx scripts/debug-all-patterns.ts

import * as fs from 'fs';
import * as path from 'path';
import { parseStreamingHistory } from '../lib/v2/parser';
import { buildSourceOfTruth } from '../lib/v2/sourceOfTruth';

async function debugAllPatterns() {
  console.log('Finding ALL pattern instances in your data...\n');

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

  // RITUAL CANDIDATES
  console.log('='.repeat(80));
  console.log('ALL RITUAL CANDIDATES');
  console.log('='.repeat(80));

  const ritualCandidates = [];

  for (const track of sot.tracks.values()) {
    if (track.totalPlays < 5) continue;

    const hourDist = new Map<number, number>();
    const uniqueDays = new Set<string>();

    for (const play of track.plays) {
      const hour = play.timestamp.getHours();
      const day = play.timestamp.toISOString().split('T')[0];
      hourDist.set(hour, (hourDist.get(hour) || 0) + 1);
      uniqueDays.add(day);
    }

    let dominantHour = 0;
    let maxPlays = 0;

    for (const [hour, plays] of hourDist) {
      if (plays > maxPlays) {
        maxPlays = plays;
        dominantHour = hour;
      }
    }

    const adjacentHours = [
      dominantHour - 1 < 0 ? 23 : dominantHour - 1,
      dominantHour,
      dominantHour + 1 > 23 ? 0 : dominantHour + 1,
    ];

    const playsInWindow = adjacentHours.reduce(
      (sum, hour) => sum + (hourDist.get(hour) || 0),
      0
    );

    const consistency = playsInWindow / track.totalPlays;

    const hasStrongSignal = maxPlays >= 15 && uniqueDays.size >= 5;
    const hasHighConsistency = consistency >= 0.5 && uniqueDays.size >= 3;

    if (hasStrongSignal || hasHighConsistency) {
      ritualCandidates.push({
        track: track.name,
        artist: track.artist,
        totalPlays: track.totalPlays,
        dominantHour,
        playsAtHour: maxPlays,
        consistency: consistency * 100,
        uniqueDays: uniqueDays.size,
      });
    }
  }

  ritualCandidates.sort((a, b) => b.consistency - a.consistency);

  console.log(`Found ${ritualCandidates.length} ritual candidates:\n`);
  ritualCandidates.slice(0, 10).forEach((r, i) => {
    const hour = r.dominantHour === 0 ? '12am' : r.dominantHour < 12 ? `${r.dominantHour}am` : r.dominantHour === 12 ? '12pm' : `${r.dominantHour - 12}pm`;
    console.log(`${i + 1}. "${r.track}" - ${r.artist}`);
    console.log(`   ${r.totalPlays} plays, ${r.playsAtHour} at ${hour} (${r.consistency.toFixed(1)}% consistency)`);
    console.log();
  });

  // GHOST CANDIDATES
  console.log('='.repeat(80));
  console.log('ALL GHOST ARTIST CANDIDATES');
  console.log('='.repeat(80));

  const now = sot.meta.dateRange.end;
  const ghostCandidates = [];

  for (const artist of sot.artists.values()) {
    if (artist.totalPlays < 30) continue;

    const daysSinceLastPlay = Math.floor(
      (now.getTime() - artist.lastPlayed.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (daysSinceLastPlay < 30) continue;

    let peakMonth = '';
    let peakMonthPlays = 0;

    for (const [month, plays] of artist.playsByMonth) {
      if (plays > peakMonthPlays) {
        peakMonthPlays = plays;
        peakMonth = month;
      }
    }

    if (peakMonthPlays < 15) continue;

    ghostCandidates.push({
      artist: artist.name,
      totalPlays: artist.totalPlays,
      lastPlayed: artist.lastPlayed.toDateString(),
      daysSince: daysSinceLastPlay,
      peakMonth,
      peakPlays: peakMonthPlays,
    });
  }

  ghostCandidates.sort((a, b) => b.totalPlays - a.totalPlays);

  console.log(`Found ${ghostCandidates.length} ghost artist candidates:\n`);
  ghostCandidates.slice(0, 10).forEach((g, i) => {
    console.log(`${i + 1}. ${g.artist}`);
    console.log(`   ${g.totalPlays} plays, last heard ${g.daysSince} days ago`);
    console.log(`   Peak: ${g.peakMonth} (${g.peakPlays} plays)`);
    console.log();
  });

  // LIFE EVENT CANDIDATES
  console.log('='.repeat(80));
  console.log('ALL LIFE EVENT CANDIDATES');
  console.log('='.repeat(80));

  const seenArtists = new Set<string>();
  const lifeEventCandidates = [];

  const sortedWeeks = Array.from(sot.temporal.byWeek.entries()).sort((a, b) =>
    a[0].localeCompare(b[0])
  );

  for (const [weekKey, weekData] of sortedWeeks) {
    const newArtistsThisWeek = new Set<string>();

    for (const artist of weekData.artists) {
      if (!seenArtists.has(artist)) {
        newArtistsThisWeek.add(artist);
        seenArtists.add(artist);
      }
    }

    const newArtistRatio = newArtistsThisWeek.size / weekData.artists.size;

    if (newArtistsThisWeek.size >= 5 && newArtistRatio >= 0.5 && weekData.playCount >= 50) {
      lifeEventCandidates.push({
        weekKey,
        newArtists: newArtistsThisWeek.size,
        totalArtists: weekData.artists.size,
        ratio: newArtistRatio * 100,
        totalPlays: weekData.playCount,
      });
    }
  }

  console.log(`Found ${lifeEventCandidates.length} life event candidates:\n`);
  lifeEventCandidates.forEach((le, i) => {
    console.log(`${i + 1}. ${le.weekKey}`);
    console.log(`   ${le.newArtists} new artists (${le.ratio.toFixed(1)}% of listening)`);
    console.log(`   ${le.totalPlays} plays that week`);
    console.log();
  });

  console.log('='.repeat(80));
  console.log('SUMMARY');
  console.log('='.repeat(80));
  console.log(`Ritual candidates: ${ritualCandidates.length}`);
  console.log(`Ghost candidates: ${ghostCandidates.length}`);
  console.log(`Life event candidates: ${lifeEventCandidates.length}`);
  console.log(`\nCurrently showing: 1 of each (missing ${ritualCandidates.length - 1} rituals, ${ghostCandidates.length - 1} ghosts, ${lifeEventCandidates.length - 1} life events)`);
}

debugAllPatterns().catch(console.error);
