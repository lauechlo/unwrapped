/**
 * Synthesis API Route
 * Generates hero insight, deep analysis, and listening DNA from pattern data
 */

import { NextRequest, NextResponse } from 'next/server';
import { synthesizeInsights } from '@/lib/synthesis/synthesize';
import type { DetectionResult } from '@/lib/detectors/types';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    console.log('[Synthesis API] Starting synthesis...');

    const body = await request.json();
    const { patterns } = body as { patterns: DetectionResult[] };

    if (!patterns || patterns.length === 0) {
      return NextResponse.json(
        { error: 'No patterns provided' },
        { status: 400 }
      );
    }

    const result = await synthesizeInsights(patterns);

    return NextResponse.json(result);

  } catch (error) {
    console.error('[Synthesis API] Error:', error);

    return NextResponse.json(
      {
        error: 'Synthesis failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
