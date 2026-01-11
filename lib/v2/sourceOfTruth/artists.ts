// Artist-level aggregation
import { SanitizedStreamingRecord, ArtistAggregate } from '../types';
import { getWeekKey, getMonthKey } from './utils';

/**
 * Build artist aggregates from streaming records
 */
export function buildArtistAggregates(
  records: SanitizedStreamingRecord[]
): Map<string, ArtistAggregate> {
  const artistMap = new Map<string, ArtistAggregate>();

  for (const record of records) {
    const artistName = record.master_metadata_album_artist_name;
    const trackUri = record.spotify_track_uri;

    // Skip if missing data
    if (!artistName || !trackUri) continue;

    // Get or create artist aggregate
    let artistAgg = artistMap.get(artistName);
    if (!artistAgg) {
      artistAgg = {
        name: artistName,
        totalPlays: 0,
        completionRate: 0,
        skipRate: 0,
        avgPlayDuration: 0,
        uniqueTracks: 0,
        tracks: new Set(),
        firstPlayed: new Date(record.ts),
        lastPlayed: new Date(record.ts),
        playsByWeek: new Map(),
        playsByMonth: new Map(),
      };
      artistMap.set(artistName, artistAgg);
    }

    // Update aggregate
    const timestamp = new Date(record.ts);
    artistAgg.totalPlays++;
    artistAgg.tracks.add(trackUri);

    // Update first/last played
    if (timestamp < artistAgg.firstPlayed) {
      artistAgg.firstPlayed = timestamp;
    }
    if (timestamp > artistAgg.lastPlayed) {
      artistAgg.lastPlayed = timestamp;
    }

    // Update temporal aggregates
    const weekKey = getWeekKey(timestamp);
    const monthKey = getMonthKey(timestamp);

    artistAgg.playsByWeek.set(weekKey, (artistAgg.playsByWeek.get(weekKey) || 0) + 1);
    artistAgg.playsByMonth.set(monthKey, (artistAgg.playsByMonth.get(monthKey) || 0) + 1);
  }

  // Calculate derived metrics
  for (const artistAgg of artistMap.values()) {
    artistAgg.uniqueTracks = artistAgg.tracks.size;

    // Calculate completion and skip rates
    let completedCount = 0;
    let skippedCount = 0;
    let totalMsPlayed = 0;

    // Re-scan records for this artist to get completion/skip stats
    for (const record of records) {
      if (record.master_metadata_album_artist_name === artistAgg.name) {
        if (record.reason_end === 'trackdone') completedCount++;
        if (record.skipped) skippedCount++;
        totalMsPlayed += record.ms_played;
      }
    }

    artistAgg.completionRate = completedCount / artistAgg.totalPlays;
    artistAgg.skipRate = skippedCount / artistAgg.totalPlays;
    artistAgg.avgPlayDuration = totalMsPlayed / artistAgg.totalPlays;
  }

  return artistMap;
}
