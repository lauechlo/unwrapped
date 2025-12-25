/**
 * TypeScript types for synthesis system
 */

export interface DetectionEvidence {
  type: string;
  value?: any;
  humanReadable: string;
}

export interface DetectionResult {
  patternId: number;
  patternName: string;
  confidence: number;
  evidence: DetectionEvidence[];
  psychologicalDimension: string;
  category: string;
}

export interface PatternGroup {
  dimension: string;
  patterns: DetectionResult[];
  dominance: number; // 0-1 score for how strong this dimension is
}

export interface SynthesisInput {
  patterns: DetectionResult[];
  userContext?: {
    totalArtists?: number;
    totalTracks?: number;
    topGenres?: string[];
  };
}

export interface PatternCard {
  patternLabel: string;
  core: string;
  supporting: string;
  behavior: string;
  callout: string;
  confidence: number;
}

export interface HeroInsight {
  headline: string;
  subtext: string;
}

export interface ListeningDNA {
  temporalPattern: {
    label: string;
    evidence: string;
  };
  emotionalStrategy: {
    label: string;
    evidence: string;
  };
  discoveryMode: {
    label: string;
    evidence: string;
  };
  attachmentStyle: {
    label: string;
    evidence: string;
  };
}

export interface SynthesisOutput {
  heroInsight: HeroInsight;
  patternCards: PatternCard[];
  listeningDNA: ListeningDNA;
}
