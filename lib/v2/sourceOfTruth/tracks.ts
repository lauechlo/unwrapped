// Track-level aggregation
import { SanitizedStreamingRecord, TrackAggregate, PlayInstance } from '../types';

/**
 * Build track aggregates from streaming records
 */
export function buildTrackAggregates(
  records: SanitizedStreamingRecord[]
): Map<string, TrackAggregate> {
  const trackMap = new Map<string, TrackAggregate>();

  for (const record of records) {
    const trackName = record.master_metadata_track_name;
    const artistName = record.master_metadata_album_artist_name;
    const albumName = record.master_metadata_album_album_name;
    const uri = record.spotify_track_uri;

    // Skip if missing critical data
    if (!trackName || !artistName || !uri) continue;

    // Get or create track aggregate
    let trackAgg = trackMap.get(uri);
    if (!trackAgg) {
      trackAgg = {
        uri,
        name: trackName,
        artist: artistName,
        album: albumName || 'Unknown Album',
        totalPlays: 0,
        completedPlays: 0,
        skippedPlays: 0,
        totalMsPlayed: 0,
        avgMsPerPlay: 0,
        plays: [],
        firstPlayed: new Date(record.ts),
        lastPlayed: new Date(record.ts),
      };
      trackMap.set(uri, trackAgg);
    }

    // Update aggregate
    const timestamp = new Date(record.ts);
    trackAgg.totalPlays++;
    trackAgg.totalMsPlayed += record.ms_played;

    if (record.reason_end === 'trackdone') {
      trackAgg.completedPlays++;
    }

    if (record.skipped) {
      trackAgg.skippedPlays++;
    }

    // Update first/last played
    if (timestamp < trackAgg.firstPlayed) {
      trackAgg.firstPlayed = timestamp;
    }
    if (timestamp > trackAgg.lastPlayed) {
      trackAgg.lastPlayed = timestamp;
    }

    // Add play instance
    const playInstance: PlayInstance = {
      timestamp,
      msPlayed: record.ms_played,
      completed: record.reason_end === 'trackdone',
      skipped: record.skipped || false,
      shuffle: record.shuffle,
      reasonStart: record.reason_start,
      reasonEnd: record.reason_end,
      rawIndex: record.index,
    };
    trackAgg.plays.push(playInstance);
  }

  // Calculate averages
  for (const trackAgg of trackMap.values()) {
    trackAgg.avgMsPerPlay = trackAgg.totalMsPlayed / trackAgg.totalPlays;
  }

  return trackMap;
}
