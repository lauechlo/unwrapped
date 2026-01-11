// Zod Schema Validation for Extended Streaming History
import { z } from 'zod';
import { SpotifyStreamingRecordSchema } from '../types';

// Extended History file is an array of streaming records
export const ExtendedHistoryFileSchema = z.array(SpotifyStreamingRecordSchema);

// Validation helper
export function validateStreamingHistory(data: unknown): {
  success: boolean;
  data?: z.infer<typeof ExtendedHistoryFileSchema>;
  error?: string;
} {
  try {
    const validated = ExtendedHistoryFileSchema.parse(data);
    return { success: true, data: validated };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: `Validation failed: ${error.issues.map(e => e.message).join(', ')}`,
      };
    }
    return {
      success: false,
      error: 'Unknown validation error',
    };
  }
}

// Partial validation - validates up to first N records
export function validatePartial(data: unknown, maxRecords: number = 100): {
  success: boolean;
  sampleValid: boolean;
  error?: string;
} {
  if (!Array.isArray(data)) {
    return { success: false, sampleValid: false, error: 'Data is not an array' };
  }

  const sample = data.slice(0, maxRecords);
  const result = validateStreamingHistory(sample);

  return {
    success: result.success,
    sampleValid: result.success,
    error: result.error,
  };
}
