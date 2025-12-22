/**
 * Core type definitions for the pattern detection engine
 */

import type { SpotifyTrack, SpotifyArtist, PlayHistory } from '@/types/spotify';

/**
 * Evidence supporting a detected pattern
 */
export interface Evidence {
  type: 'track' | 'timestamp' | 'count' | 'ratio' | 'artist' | 'genre';
  value: any;
  humanReadable: string;
}

/**
 * Result from a pattern detector
 */
export interface DetectionResult {
  patternId: number;
  patternName: string;
  confidence: number; // 0-1, minimum 0.6 to be shown
  evidence: Evidence[];
  psychologicalDimension: string;
  category: DetectorCategory;
  insightPotential: number; // Calculated: confidence * specificity
}

/**
 * Categories of pattern detectors
 */
export type DetectorCategory =
  | 'temporal'      // Time-based patterns
  | 'repetition'    // Replay and attachment patterns
  | 'emotional'     // Emotional regulation patterns
  | 'identity'      // Personality and identity markers
  | 'social'        // Social context patterns
  | 'audio'         // Audio feature patterns (V1.5)
  | 'anomaly';      // Specific unusual behaviors

/**
 * Extended user listening data for pattern detection
 * Includes recently played history and time-ranged top tracks/artists
 */
export interface UserListeningData {
  recentlyPlayed: PlayHistory[];
  topTracks: {
    short: SpotifyTrack[];    // Last 4 weeks
    medium: SpotifyTrack[];   // Last 6 months
    long: SpotifyTrack[];     // Several years
  };
  topArtists: {
    short: SpotifyArtist[];   // Last 4 weeks
    medium: SpotifyArtist[];  // Last 6 months
    long: SpotifyArtist[];    // Several years
  };
  savedTracks?: SpotifyTrack[];         // Optional: user's library
  audioFeatures?: Map<string, AudioFeatures>; // V1.5: audio analysis
}

/**
 * Audio features for a track (V1.5)
 */
export interface AudioFeatures {
  key: string;           // Musical key (e.g., "D")
  mode: 'major' | 'minor';
  tempo: number;         // BPM
  valence: number;       // 0-1, happiness
  energy: number;        // 0-1, intensity
  danceability: number;  // 0-1
  acousticness: number;  // 0-1
  confidence: number;    // 0-1, detection confidence
}

/**
 * Function signature for all pattern detectors
 */
export type DetectorFunction = (
  data: UserListeningData
) => Promise<DetectionResult | null>;

/**
 * Metadata about a detector
 */
export interface DetectorMetadata {
  id: number;
  name: string;
  category: DetectorCategory;
  psychologicalDimension: string;
  minimumData: string;  // e.g., "20 plays with timestamps"
  priority: 'V1' | 'V1.5';
  requiresAudioFeatures: boolean;
}
