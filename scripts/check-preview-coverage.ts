/**
 * Script to check preview URL coverage in user's Spotify data
 * Run with: npx tsx scripts/check-preview-coverage.ts
 */

import { fetchUserData } from '../lib/spotify';

async function checkCoverage() {
  const accessToken = process.env.SPOTIFY_ACCESS_TOKEN;

  if (!accessToken) {
    console.error('Set SPOTIFY_ACCESS_TOKEN env var first');
    process.exit(1);
  }

  console.log('Fetching your Spotify data...\n');

  const data = await fetchUserData(accessToken);

  // Check top tracks (short term)
  const shortTracks = data.topTracks.short;
  const shortWithPreview = shortTracks.filter(t => t.preview_url).length;
  const shortPct = (shortWithPreview / shortTracks.length * 100).toFixed(1);

  console.log('TOP TRACKS (Last 4 Weeks):');
  console.log(`  Total: ${shortTracks.length}`);
  console.log(`  With preview: ${shortWithPreview} (${shortPct}%)`);
  console.log(`  Without preview: ${shortTracks.length - shortWithPreview}\n`);

  // Check top tracks (medium term)
  const mediumTracks = data.topTracks.medium;
  const mediumWithPreview = mediumTracks.filter(t => t.preview_url).length;
  const mediumPct = (mediumWithPreview / mediumTracks.length * 100).toFixed(1);

  console.log('TOP TRACKS (Last 6 Months):');
  console.log(`  Total: ${mediumTracks.length}`);
  console.log(`  With preview: ${mediumWithPreview} (${mediumPct}%)`);
  console.log(`  Without preview: ${mediumTracks.length - mediumWithPreview}\n`);

  // Check recently played
  const recentTracks = data.recentlyPlayed.map(p => p.track);
  const uniqueRecent = Array.from(new Map(recentTracks.map(t => [t.id, t])).values());
  const recentWithPreview = uniqueRecent.filter(t => t.preview_url).length;
  const recentPct = (recentWithPreview / uniqueRecent.length * 100).toFixed(1);

  console.log('RECENTLY PLAYED (Unique tracks):');
  console.log(`  Total: ${uniqueRecent.length}`);
  console.log(`  With preview: ${recentWithPreview} (${recentPct}%)`);
  console.log(`  Without preview: ${uniqueRecent.length - recentWithPreview}\n`);

  // Overall
  const allTracks = [...shortTracks, ...mediumTracks, ...uniqueRecent];
  const uniqueAll = Array.from(new Map(allTracks.map(t => [t.id, t])).values());
  const allWithPreview = uniqueAll.filter(t => t.preview_url).length;
  const allPct = (allWithPreview / uniqueAll.length * 100).toFixed(1);

  console.log('OVERALL (All unique tracks):');
  console.log(`  Total: ${uniqueAll.length}`);
  console.log(`  With preview: ${allWithPreview} (${allPct}%)`);
  console.log(`  Without preview: ${uniqueAll.length - allWithPreview}\n`);

  // Verdict
  console.log('VERDICT:');
  if (parseFloat(allPct) >= 70) {
    console.log(`  ✓ ${allPct}% coverage is acceptable for Essentia approach`);
    console.log('  → Proceed with backend audio analysis (Days 15-21)');
  } else if (parseFloat(allPct) >= 50) {
    console.log(`  ⚠ ${allPct}% coverage is borderline`);
    console.log('  → Consider hybrid: Spotify Audio Features + Essentia');
  } else {
    console.log(`  ✗ ${allPct}% coverage is too low`);
    console.log('  → PIVOT: Use Spotify Audio Features API instead');
  }
}

checkCoverage().catch(console.error);
