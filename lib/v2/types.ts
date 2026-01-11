// V2 Type Definitions for Unwrapped
// Extended Streaming History data types

import { z } from 'zod';

// ============================================
// SPOTIFY EXTENDED HISTORY SCHEMA
// ============================================

export const SpotifyStreamingRecordSchema = z.object({
  ts: z.string(),                              // ISO timestamp
  platform: z.string(),
  ms_played: z.number(),
  conn_country: z.string(),
  ip_addr: z.string().optional(),              // Will be stripped
  master_metadata_track_name: z.string().nullable(),
  master_metadata_album_artist_name: z.string().nullable(),
  master_metadata_album_album_name: z.string().nullable(),
  spotify_track_uri: z.string().nullable(),
  episode_name: z.string().nullable(),
  episode_show_name: z.string().nullable(),
  spotify_episode_uri: z.string().nullable(),
  audiobook_title: z.string().nullable().optional(),
  audiobook_uri: z.string().nullable().optional(),
  audiobook_chapter_uri: z.string().nullable().optional(),
  audiobook_chapter_title: z.string().nullable().optional(),
  reason_start: z.string(),
  reason_end: z.string(),
  shuffle: z.boolean(),
  skipped: z.boolean().nullable(),
  offline: z.boolean(),
  offline_timestamp: z.number().optional(),
  incognito_mode: z.boolean(),
});

export type SpotifyStreamingRecord = z.infer<typeof SpotifyStreamingRecordSchema>;

// Sanitized version (no IP address)
export interface SanitizedStreamingRecord extends Omit<SpotifyStreamingRecord, 'ip_addr'> {
  index: number; // Original array index for validation
}

// ============================================
// SOURCE OF TRUTH
// ============================================

export interface SourceOfTruth {
  tracks: Map<string, TrackAggregate>;
  artists: Map<string, ArtistAggregate>;
  temporal: TemporalAggregate;
  meta: DatasetMetadata;
  rawIndices: number[]; // For validation
}

export interface TrackAggregate {
  uri: string;
  name: string;
  artist: string;
  album: string;
  totalPlays: number;
  completedPlays: number;      // reason_end === 'trackdone'
  skippedPlays: number;        // skipped === true
  totalMsPlayed: number;
  avgMsPerPlay: number;
  plays: PlayInstance[];
  firstPlayed: Date;
  lastPlayed: Date;
}

export interface ArtistAggregate {
  name: string;
  totalPlays: number;
  completionRate: number;
  skipRate: number;
  avgPlayDuration: number;
  uniqueTracks: number;
  tracks: Set<string>;
  firstPlayed: Date;
  lastPlayed: Date;
  playsByWeek: Map<string, number>;  // 'YYYY-WW' -> count
  playsByMonth: Map<string, number>; // 'YYYY-MM' -> count
}

export interface PlayInstance {
  timestamp: Date;
  msPlayed: number;
  completed: boolean;
  skipped: boolean;
  shuffle: boolean;
  reasonStart: string;
  reasonEnd: string;
  rawIndex: number;  // Reference to original data for validation
}

export interface TemporalAggregate {
  byHour: Map<number, number>;           // 0-23 -> count
  byDayOfWeek: Map<number, number>;      // 0-6 -> count
  byWeek: Map<string, WeekAggregate>;    // 'YYYY-WW' -> data
  byMonth: Map<string, MonthAggregate>;  // 'YYYY-MM' -> data
  dateRange: { start: Date; end: Date };
}

export interface WeekAggregate {
  weekKey: string;  // 'YYYY-WW'
  playCount: number;
  artists: Set<string>;
  newArtists: Set<string>; // Artists not seen in previous weeks
  skipRate: number;
  avgMsPlayed: number;
}

export interface MonthAggregate {
  monthKey: string;  // 'YYYY-MM'
  playCount: number;
  artists: Set<string>;
  topArtists: Array<{ name: string; plays: number }>;
  skipRate: number;
  avgMsPlayed: number;
}

export interface DatasetMetadata {
  totalPlays: number;
  dateRange: { start: Date; end: Date };
  uniqueTracks: number;
  uniqueArtists: number;
  overallSkipRate: number;
  overallCompletionRate: number;
  totalListeningTimeMs: number;
}

// ============================================
// DETECTION RESULTS
// ============================================

export interface DetectionResult {
  patternId: string;
  patternName: string;
  patternFamily: PatternFamily;
  confidence: number;           // 0-1: How confident in detection
  distinctiveness: number;      // 0-1: How unusual (vs base rate)
  evidence: Evidence[];
  psychologicalBasis: string;   // Saarikallio strategy or research citation
}

export type PatternFamily =
  | 'loyalty_dropoff'    // Ghost Artist, Witness Protection
  | 'loyalty_retention'  // Comfort Rotation, Loyalist
  | 'temporal'           // Ritual, Time-of-Day Patterns
  | 'diversity'          // Explorer, Genre Diversity
  | 'repetition'         // Looper, Coping Song
  | 'behavioral'         // Skip Velocity, Searcher
  | 'evolution';         // Artist Rotation, Taste Shift

export interface Evidence {
  type: 'track' | 'artist' | 'count' | 'ratio' | 'timestamp' | 'duration';
  metric: string;
  value: string | number;
  sourceIndices: number[];  // References to raw data for validation
  humanReadable: string;
  fullValue?: string;  // Optional: Complete data for "Show All" expansion
  truncatedCount?: number;  // Optional: Total count when truncated (e.g., "Showing 10 of 156")
}

// ============================================
// PARSING
// ============================================

export interface ParseOptions {
  sanitize?: boolean;  // Strip IP addresses
  validate?: boolean;  // Run Zod validation
}

export interface ParseResult {
  success: boolean;
  data?: SanitizedStreamingRecord[];
  error?: string;
  stats?: {
    totalRecords: number;
    validRecords: number;
    invalidRecords: number;
    dateRange: { start: Date; end: Date };
  };
}
