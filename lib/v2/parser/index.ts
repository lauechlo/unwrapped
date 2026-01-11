// Main Parser for Extended Streaming History
import { ParseOptions, ParseResult, SanitizedStreamingRecord } from '../types';
import { validateStreamingHistory } from './schema';
import { sanitizeStreamingHistory, filterMusicOnly, filterMinimumDuration } from './sanitize';

/**
 * Parse Extended Streaming History JSON file
 *
 * @param fileContent - Raw JSON string from uploaded file
 * @param options - Parsing options
 * @returns ParseResult with sanitized data or error
 */
export async function parseStreamingHistory(
  fileContent: string,
  options: ParseOptions = { sanitize: true, validate: true }
): Promise<ParseResult> {
  try {
    // Step 1: Parse JSON
    let data: unknown;
    try {
      data = JSON.parse(fileContent);
    } catch (error) {
      return {
        success: false,
        error: `Invalid JSON: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }

    // Step 2: Validate structure (if enabled)
    if (options.validate) {
      const validation = validateStreamingHistory(data);
      if (!validation.success) {
        return {
          success: false,
          error: validation.error,
        };
      }
      data = validation.data;
    }

    // At this point we know data is an array of streaming records
    const records = data as any[];

    // Step 3: Sanitize (strip IP addresses, add indices)
    let sanitized: SanitizedStreamingRecord[];
    if (options.sanitize) {
      sanitized = sanitizeStreamingHistory(records);
    } else {
      sanitized = records.map((record, index) => ({ ...record, index }));
    }

    // Step 4: Filter music only (remove podcasts, audiobooks)
    const musicOnly = filterMusicOnly(sanitized);

    // Step 5: Filter minimum duration (>3 seconds)
    const filtered = filterMinimumDuration(musicOnly, 3000);

    // Step 6: Calculate stats
    const timestamps = filtered
      .map(r => new Date(r.ts))
      .filter(d => !isNaN(d.getTime()));

    const stats = {
      totalRecords: records.length,
      validRecords: filtered.length,
      invalidRecords: records.length - filtered.length,
      dateRange: {
        start: new Date(Math.min(...timestamps.map(d => d.getTime()))),
        end: new Date(Math.max(...timestamps.map(d => d.getTime()))),
      },
    };

    return {
      success: true,
      data: filtered,
      stats,
    };
  } catch (error) {
    return {
      success: false,
      error: `Parser error: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

/**
 * Parse from File object (browser upload)
 */
export async function parseFromFile(
  file: File,
  options?: ParseOptions
): Promise<ParseResult> {
  return new Promise((resolve) => {
    const reader = new FileReader();

    reader.onload = async (e) => {
      const content = e.target?.result as string;
      const result = await parseStreamingHistory(content, options);
      resolve(result);
    };

    reader.onerror = () => {
      resolve({
        success: false,
        error: 'Failed to read file',
      });
    };

    reader.readAsText(file);
  });
}
