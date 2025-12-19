/**
 * Internal analysis types for pattern detection and insights
 */

import { SpotifyTrack, SpotifyArtist, PlayHistory } from './spotify';

export interface AudioFeatures {
  key: string; // e.g., "D"
  scale: 'major' | 'minor';
  bpm: number;
  key_confidence: number; // 0-1
  bpm_confidence: number; // 0-1
}

export interface TrackWithAudioFeatures {
  track: SpotifyTrack;
  features: AudioFeatures | null;
}

export interface CopingSong {
  track: SpotifyTrack;
  totalPlays: number;
  nighttimePlays: number;
  nighttimePercent: number;
  peakHour: number;
  avgGapBetweenPlays: number; // hours
}

export interface BreakupCycle {
  artist: SpotifyArtist;
  peakPlays: number;
  peakStart: Date;
  peakEnd: Date;
  afterPlays: number;
}

export interface ThreeAmSong {
  track: SpotifyTrack;
  totalPlays: number;
  lateNightPlays: number;
  lateNightPercent: number;
  avgPlayTime: string; // HH:MM format
}

export interface ComfortLoop {
  track: SpotifyTrack;
  consecutivePlays: number;
  timestamp: Date;
}

export type PatternType = 'coping' | 'breakup' | '3am' | 'loop';

export interface Pattern {
  type: PatternType;
  data: CopingSong | BreakupCycle | ThreeAmSong | ComfortLoop;
}

export interface BehavioralMetrics {
  nocturnalIndex: number; // % plays 10pm-4am
  replayIntensity: number; // avg plays per unique track
  artistLoyalty: number; // % overlap short/long term
  popularityComfort: number; // avg track popularity 0-100
}

export interface AudioMetrics {
  minorKeyPct: number; // % tracks in minor keys
  avgBpm: number;
  bpmVariance: number;
  modeConsistency: number; // variance in major/minor
}

export interface AllMetrics extends BehavioralMetrics, AudioMetrics {
  tracksAnalyzed: number;
}

export interface Baselines {
  minorKeyAvg: number;
  bpmAvg: number;
  nocturnalAvg: number;
  replayIntensityAvg: number;
  artistLoyaltyAvg: number;
  popularityComfortAvg: number;
}

export interface DimensionInsight {
  dimension: string;
  userValue: number;
  baseline: number;
  percentile: number;
  text: string;
}

export interface PatternInsight {
  type: PatternType;
  text: string;
}

export interface GeneratedInsights {
  primaryInsight: string;
  dimensionInsights: DimensionInsight[];
  patternInsights: PatternInsight[];
}

export interface AnalysisResult {
  patterns: Pattern[];
  metrics: AllMetrics;
  insights: GeneratedInsights;
}
