import { NextRequest, NextResponse } from 'next/server';
import { synthesizePatterns } from '@/lib/v2/synthesis';
import type { DetectionResult } from '@/lib/v2/types';
import { checkRateLimit } from '@/lib/serverRateLimit';

/**
 * V2 Synthesis API Route
 * Uses stricter validation and evidence-based synthesis
 * Rate limited to 3 requests per day per IP
 */
export async function POST(request: NextRequest) {
  try {
    // Check rate limit (3 per day)
    const rateLimitResult = await checkRateLimit(request);

    if (!rateLimitResult.success) {
      const resetDate = new Date(rateLimitResult.reset);
      const hoursUntilReset = Math.ceil((resetDate.getTime() - Date.now()) / (1000 * 60 * 60));

      return NextResponse.json(
        {
          error: 'Rate limit exceeded',
          message: `You've used all 3 daily analyses. Try again in ${hoursUntilReset} hours.`,
          limit: rateLimitResult.limit,
          remaining: rateLimitResult.remaining,
          resetAt: resetDate.toISOString(),
        },
        {
          status: 429,
          headers: {
            'X-RateLimit-Limit': String(rateLimitResult.limit),
            'X-RateLimit-Remaining': String(rateLimitResult.remaining),
            'X-RateLimit-Reset': String(rateLimitResult.reset),
          },
        }
      );
    }

    const body = await request.json();
    const { patterns } = body;

    if (!patterns || !Array.isArray(patterns) || patterns.length === 0) {
      return NextResponse.json(
        { error: 'No patterns provided' },
        { status: 400 }
      );
    }

    console.log(`[API V2 Synthesize] Processing ${patterns.length} patterns`);

    // Run V2 synthesis with evidence validation
    // Request 8 narratives to show 3-4 cards after validation
    // Sequential generation avoids rate limits (~20-25 seconds total)
    const synthesis = await synthesizePatterns(patterns as DetectionResult[], 8);

    console.log(`[API V2 Synthesize] Complete: Generated ${synthesis.narratives.length} narratives`);
    console.log(`[API V2 Synthesize] Hero: "${synthesis.heroInsight.headline}"`);

    return NextResponse.json(synthesis);
  } catch (error) {
    console.error('[API V2 Synthesize] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Synthesis failed' },
      { status: 500 }
    );
  }
}
