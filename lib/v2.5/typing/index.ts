/**
 * V2.5 Music Type System - Main Export
 *
 * Centralized exports for the type calculation system
 */

// Main calculator
export {
  calculateMusicType,
  calculateMusicTypeWithMetadata,
  calculateTypeCompatibility,
  getMostCompatibleTypes,
  default,
} from './calculator';

// Individual dimension calculators
export {
  calculateTemporal,
  calculateProcessing,
  calculateDiscovery,
  calculateAttachment,
  checkDataSufficiency,
} from './thresholds';

// Dimension definitions
export {
  TEMPORAL_DIMENSION,
  PROCESSING_DIMENSION,
  DISCOVERY_DIMENSION,
  ATTACHMENT_DIMENSION,
  ALL_DIMENSIONS,
  getDimensionLabel,
  getTypeDescription,
  getShortTypeDescription,
} from './dimensions';

// Thresholds
export {
  TEMPORAL_THRESHOLDS,
  PROCESSING_THRESHOLDS,
  DISCOVERY_THRESHOLDS,
  ATTACHMENT_THRESHOLDS,
} from './thresholds';

// Types
export type {
  // Dimension types
  DimensionCategory,
  TemporalType,
  ProcessingType,
  DiscoveryType,
  AttachmentType,
  DimensionCode,
  TypeCode,

  // Results
  DimensionResult,
  TemporalResult,
  ProcessingResult,
  DiscoveryResult,
  AttachmentResult,
  TypeResult,

  // Metadata
  TypeCalculationInput,
  TypeCalculationMetadata,
  DataSufficiencyWarning,

  // Definitions
  DimensionOption,
  DimensionDefinition,
} from './types';
