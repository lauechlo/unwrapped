// Sanitization - Strip sensitive fields from streaming history
import { SpotifyStreamingRecord, SanitizedStreamingRecord } from '../types';

/**
 * Removes sensitive fields (IP address) from streaming records
 * Also adds index for validation purposes
 */
export function sanitizeRecord(
  record: SpotifyStreamingRecord,
  index: number
): SanitizedStreamingRecord {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { ip_addr, ...sanitized } = record;

  return {
    ...sanitized,
    index,
  };
}

/**
 * Sanitize entire dataset
 */
export function sanitizeStreamingHistory(
  records: SpotifyStreamingRecord[]
): SanitizedStreamingRecord[] {
  return records.map((record, index) => sanitizeRecord(record, index));
}

/**
 * Filter out non-music content (podcasts, audiobooks)
 */
export function filterMusicOnly(
  records: SanitizedStreamingRecord[]
): SanitizedStreamingRecord[] {
  return records.filter(record => {
    // Keep only records with track metadata (not podcasts/audiobooks)
    return (
      record.master_metadata_track_name !== null &&
      record.master_metadata_album_artist_name !== null &&
      !record.episode_name &&
      !record.audiobook_title
    );
  });
}

/**
 * Filter out very short plays (< 3 seconds) that are likely accidental
 */
export function filterMinimumDuration(
  records: SanitizedStreamingRecord[],
  minMs: number = 3000
): SanitizedStreamingRecord[] {
  return records.filter(record => record.ms_played >= minMs);
}
