import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';
import { NextRequest } from 'next/server';

// Create Redis client
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL || '',
  token: process.env.UPSTASH_REDIS_REST_TOKEN || '',
});

// Create rate limiter: 3 requests per day (24 hours)
export const ratelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(3, '24 h'),
  analytics: true,
  prefix: 'unwrapped:synthesis',
});

/**
 * Extract IP address from Next.js request
 * Tries multiple headers in order of priority
 */
export function getClientIP(request: NextRequest): string {
  // Try x-forwarded-for (most common for proxies/load balancers)
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) {
    // x-forwarded-for can be a comma-separated list, take the first one
    return forwardedFor.split(',')[0].trim();
  }

  // Try x-real-ip (used by some reverse proxies)
  const realIP = request.headers.get('x-real-ip');
  if (realIP) {
    return realIP;
  }

  // Try CF-Connecting-IP (Cloudflare)
  const cfIP = request.headers.get('cf-connecting-ip');
  if (cfIP) {
    return cfIP;
  }

  // Fallback to 'unknown' (should rarely happen in production)
  return 'unknown';
}

/**
 * Check if rate limit allows request
 * Returns { success: boolean, limit: number, remaining: number, reset: Date }
 */
export async function checkRateLimit(request: NextRequest) {
  // Skip rate limiting if Redis is not configured (development)
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
    console.warn('[Server Rate Limit] Upstash not configured, skipping rate limit check');
    return {
      success: true,
      limit: 3,
      remaining: 3,
      reset: new Date(Date.now() + 24 * 60 * 60 * 1000),
    };
  }

  const ip = getClientIP(request);
  console.log(`[Server Rate Limit] Checking limit for IP: ${ip}`);

  try {
    const result = await ratelimit.limit(ip);

    console.log(`[Server Rate Limit] Result:`, {
      success: result.success,
      limit: result.limit,
      remaining: result.remaining,
      reset: new Date(result.reset),
    });

    return result;
  } catch (error) {
    console.error('[Server Rate Limit] Error checking rate limit:', error);
    // On error, allow the request (fail open)
    return {
      success: true,
      limit: 3,
      remaining: 0,
      reset: new Date(Date.now() + 24 * 60 * 60 * 1000),
    };
  }
}
