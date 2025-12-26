import { NextRequest, NextResponse } from 'next/server';
import { synthesizeInsights } from '@/lib/synthesis/synthesize-viral';
import type { DetectionResult } from '@/lib/synthesis/types';

/**
 * Synthesis API Route
 * Runs pattern synthesis and returns insights
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { patterns } = body;

    if (!patterns || !Array.isArray(patterns) || patterns.length === 0) {
      return NextResponse.json(
        { error: 'No patterns provided' },
        { status: 400 }
      );
    }

    console.log(`[API Synthesize] Processing ${patterns.length} patterns`);

    // Run synthesis
    const synthesis = await synthesizeInsights(patterns as DetectionResult[]);

    console.log('[API Synthesize] Complete:', synthesis.heroInsight.headline);

    return NextResponse.json(synthesis);
  } catch (error) {
    console.error('[API Synthesize] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Synthesis failed' },
      { status: 500 }
    );
  }
}
