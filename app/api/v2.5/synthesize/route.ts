import { NextRequest, NextResponse } from 'next/server';
import { synthesizeScoped, generateFallback } from '@/lib/v2.5/ai/synthesize';
import { checkRateLimit } from '@/lib/serverRateLimit';
import type { TypeResult } from '@/lib/v2.5/typing/types';
import type { DetectionResult } from '@/lib/v2/types';
import type { SynthesizeRequest, SynthesizeResponse, SynthesizeError, SynthesisStats } from '@/lib/v2.5/ai/types';

/**
 * V2.5 AI Synthesis API Route
 *
 * Generates personalized insights using Claude Haiku
 * Rate limited to 3 requests per day per IP (shared with V2)
 *
 * POST /api/v2.5/synthesize
 *
 * Request body:
 * {
 *   typeResult: TypeResult,
 *   patterns: DetectionResult[],
 *   stats: { totalPlays, uniqueArtists, uniqueTracks, dateRange }
 * }
 *
 * Response:
 * {
 *   success: true,
 *   data: {
 *     heroInsight: string,
 *     crossPatternSynthesis: string,
 *     psychologicalSummary: string
 *   }
 * }
 */
export async function POST(request: NextRequest) {
  try {
    // Check rate limit (3 per day, shared with V2)
    const rateLimitResult = await checkRateLimit(request);

    if (!rateLimitResult.success) {
      const resetDate = new Date(rateLimitResult.reset);
      const hoursUntilReset = Math.ceil((resetDate.getTime() - Date.now()) / (1000 * 60 * 60));

      const errorResponse: SynthesizeError = {
        success: false,
        error: 'Rate limit exceeded',
        message: `You've used all 3 daily analyses. Try again in ${hoursUntilReset} hours.`,
        limit: rateLimitResult.limit,
        remaining: rateLimitResult.remaining,
        resetAt: resetDate.toISOString(),
      };

      return NextResponse.json(errorResponse, {
        status: 429,
        headers: {
          'X-RateLimit-Limit': String(rateLimitResult.limit),
          'X-RateLimit-Remaining': String(rateLimitResult.remaining),
          'X-RateLimit-Reset': String(rateLimitResult.reset),
        },
      });
    }

    // Parse request body
    const body = await request.json() as SynthesizeRequest;
    const { typeResult, patterns, stats } = body;

    // Validate required fields
    if (!typeResult || !typeResult.code || !typeResult.dimensions) {
      return NextResponse.json(
        { success: false, error: 'Invalid typeResult provided' } as SynthesizeError,
        { status: 400 }
      );
    }

    if (!patterns || !Array.isArray(patterns)) {
      return NextResponse.json(
        { success: false, error: 'Invalid patterns array provided' } as SynthesizeError,
        { status: 400 }
      );
    }

    if (!stats || typeof stats.totalPlays !== 'number') {
      return NextResponse.json(
        { success: false, error: 'Invalid stats provided' } as SynthesizeError,
        { status: 400 }
      );
    }

    console.log(`[API V2.5 Synthesize] Processing type ${typeResult.code} with ${patterns.length} patterns`);

    // Synthesize insights
    const insights = await synthesizeScoped(
      typeResult as TypeResult,
      patterns as DetectionResult[],
      stats as SynthesisStats
    );

    console.log(`[API V2.5 Synthesize] Complete: Generated ${insights.heroInsight.length} char hero insight`);

    const response: SynthesizeResponse = {
      success: true,
      data: insights,
    };

    return NextResponse.json(response, {
      headers: {
        'X-RateLimit-Remaining': String(rateLimitResult.remaining - 1),
      },
    });

  } catch (error) {
    console.error('[API V2.5 Synthesize] Error:', error);

    // Try to generate fallback if we have type result
    try {
      const body = await request.clone().json() as SynthesizeRequest;
      if (body.typeResult) {
        console.log('[API V2.5 Synthesize] Generating fallback response...');
        const fallback = generateFallback(body.typeResult as TypeResult);
        return NextResponse.json({
          success: true,
          data: fallback,
          fallback: true, // Indicate this is a fallback response
        });
      }
    } catch {
      // Ignore fallback errors
    }

    const errorResponse: SynthesizeError = {
      success: false,
      error: error instanceof Error ? error.message : 'Synthesis failed',
    };

    return NextResponse.json(errorResponse, { status: 500 });
  }
}
