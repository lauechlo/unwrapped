/**
 * V2.5 Music Type System - TypeScript Types
 *
 * Defines the core types for the 4-dimensional music typing system:
 * - Temporal (D/N): Diurnal vs Nocturnal
 * - Processing (L/S): Looper vs Skimmer
 * - Discovery (E/R): Explorer vs Rooted
 * - Attachment (A/F): Anchored vs Fluid
 */

import type { SourceOfTruth } from '@/lib/v2/types';

// ============================================================================
// Dimension Types
// ============================================================================

/**
 * The 4 dimensions of music type
 */
export type DimensionCategory = 'temporal' | 'processing' | 'discovery' | 'attachment';

/**
 * Temporal dimension: When you listen
 */
export type TemporalType = 'D' | 'N'; // Diurnal or Nocturnal

/**
 * Processing dimension: How you listen
 */
export type ProcessingType = 'L' | 'S'; // Looper or Skimmer

/**
 * Discovery dimension: What you seek
 */
export type DiscoveryType = 'E' | 'R'; // Explorer or Rooted

/**
 * Attachment dimension: How you bond
 */
export type AttachmentType = 'A' | 'F'; // Anchored or Fluid

/**
 * Union of all dimension codes
 */
export type DimensionCode = TemporalType | ProcessingType | DiscoveryType | AttachmentType;

/**
 * 4-letter type code (e.g., "NLEA", "DSRA")
 */
export type TypeCode = `${TemporalType}${ProcessingType}${DiscoveryType}${AttachmentType}`;

// ============================================================================
// Dimension Results
// ============================================================================

/**
 * Concrete example for evidence display
 */
export interface ConcreteExample {
  label: string;      // "Peak Hour", "Most Replayed"
  value: string;      // "11pm", "we can't be friends"
  detail: string;     // "1,247 plays", "53× plays"
  emphasis?: string;  // Optional emphasis text
}

/**
 * Evidence data for dimension
 */
export interface DimensionEvidence {
  topExamples: ConcreteExample[];
  insights?: string[];
}

/**
 * Base dimension result with metadata
 */
export interface DimensionResult {
  /** Dimension category */
  category: DimensionCategory;

  /** Single-letter code (e.g., "N", "L") */
  code: DimensionCode;

  /** Full label (e.g., "Nocturnal", "Looper") */
  label: string;

  /** Calculated value (e.g., 0.73 for 73% night listening) */
  value: number;

  /** Human-readable metric (e.g., "73% after 9pm") */
  metric: string;

  /** Comparison to baseline (e.g., "vs 34% average") */
  comparison: string;

  /** Confidence score (0-1) based on data quality */
  confidence: number;

  /** Whether there was sufficient data to calculate */
  hasSufficientData: boolean;

  /** Concrete evidence examples (optional, populated by evidence extractor) */
  evidence?: DimensionEvidence;
}

/**
 * Temporal dimension result
 */
export interface TemporalResult extends DimensionResult {
  category: 'temporal';
  code: TemporalType;
  /** Percentage of plays after 9pm */
  nightPercentage: number;
  /** Total plays analyzed */
  totalPlays: number;
}

/**
 * Processing dimension result
 */
export interface ProcessingResult extends DimensionResult {
  category: 'processing';
  code: ProcessingType;
  /** Average replay multiplier (1.0 = baseline) */
  replayMultiplier: number;
  /** Average skip rate */
  skipRate: number;
}

/**
 * Discovery dimension result
 */
export interface DiscoveryResult extends DimensionResult {
  category: 'discovery';
  code: DiscoveryType;
  /** Percentage of unique artists */
  uniqueArtistPercentage: number;
  /** Total unique artists */
  uniqueArtists: number;
}

/**
 * Attachment dimension result
 */
export interface AttachmentResult extends DimensionResult {
  category: 'attachment';
  code: AttachmentType;
  /** Months of top artist loyalty */
  topArtistMonths: number;
  /** Top artist name */
  topArtistName: string;
}

// ============================================================================
// Type Result
// ============================================================================

/**
 * Complete type calculation result
 */
export interface TypeResult {
  /** 4-letter type code (e.g., "NLEA") */
  code: TypeCode;

  /** Array of 4 dimension results in order: T, P, D, A */
  dimensions: [TemporalResult, ProcessingResult, DiscoveryResult, AttachmentResult];

  /** One-line type description (e.g., "Comfort Zone Champion") */
  description: string;

  /** Overall confidence (0-1) - average of dimension confidences */
  confidence: number;

  /** Whether all dimensions had sufficient data */
  isComplete: boolean;

  /** Timestamp of calculation */
  calculatedAt: number;
}

// ============================================================================
// Calculation Context
// ============================================================================

/**
 * Input data for type calculation
 */
export interface TypeCalculationInput {
  /** Source of truth from pattern detection */
  sot: SourceOfTruth;

  /** Raw play data for additional analysis */
  plays?: any[];
}

/**
 * Data sufficiency warnings
 */
export interface DataSufficiencyWarning {
  /** Dimension that lacks data */
  dimension: DimensionCategory;

  /** Required minimum */
  required: string;

  /** What user needs to do */
  action: string;
}

/**
 * Type calculation metadata
 */
export interface TypeCalculationMetadata {
  /** Total plays analyzed */
  totalPlays: number;

  /** Date range of data */
  dateRange: {
    start: string;
    end: string;
    months: number;
  };

  /** Warnings about data quality */
  warnings: DataSufficiencyWarning[];

  /** Whether calculation used partial data */
  isPartial: boolean;
}

// ============================================================================
// Dimension Definitions
// ============================================================================

/**
 * Definition of a dimension type option
 */
export interface DimensionOption {
  /** Single-letter code */
  code: DimensionCode;

  /** Full label */
  label: string;

  /** Description of this type */
  description: string;

  /** Threshold for detection */
  threshold: number;

  /** Baseline/average value */
  baseline: number;
}

/**
 * Complete dimension definition
 */
export interface DimensionDefinition {
  /** Dimension category */
  category: DimensionCategory;

  /** Display name */
  name: string;

  /** What this dimension measures */
  measures: string;

  /** Two options for this dimension */
  options: [DimensionOption, DimensionOption];

  /** Minimum data required */
  minimumData: {
    metric: string;
    value: number;
  };
}
