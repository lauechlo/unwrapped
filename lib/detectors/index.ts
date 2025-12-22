/**
 * Pattern Detection Engine
 *
 * Main exports for the detection system
 */

export { runAllDetectors, runDetectorsByCategory, getDetectionStats } from './runner';
export type {
  DetectionResult,
  Evidence,
  DetectorFunction,
  UserListeningData,
  AudioFeatures,
  DetectorCategory,
  DetectorMetadata,
} from './types';
