/**
 * Synthesis Result Caching
 * Caches synthesis results in localStorage to avoid re-running expensive API calls
 */

import type { SynthesisOutput } from './types';

const CACHE_KEY = 'unwrapped_synthesis_cache';
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

interface CacheEntry {
  timestamp: number;
  userId: string;
  synthesis: SynthesisOutput;
  patternCount: number;
}

/**
 * Generate a cache key based on user's Spotify data
 * Uses pattern count as a simple fingerprint
 */
function getCacheKey(patternCount: number, userId?: string): string {
  return `${userId || 'unknown'}_${patternCount}`;
}

/**
 * Get cached synthesis if available and not expired
 */
export function getCachedSynthesis(patternCount: number, userId?: string): SynthesisOutput | null {
  if (typeof window === 'undefined') return null; // Server-side, no cache

  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (!cached) return null;

    const entry: CacheEntry = JSON.parse(cached);
    const key = getCacheKey(patternCount, userId);

    // Check if cache matches current user and patterns
    if (entry.userId !== (userId || 'unknown') || entry.patternCount !== patternCount) {
      console.log('[Cache] Cache miss: different user or pattern count');
      return null;
    }

    // Check if cache is expired
    const age = Date.now() - entry.timestamp;
    if (age > CACHE_DURATION) {
      console.log('[Cache] Cache expired:', Math.round(age / 1000 / 60), 'minutes old');
      localStorage.removeItem(CACHE_KEY);
      return null;
    }

    console.log('[Cache] Cache hit! Using cached synthesis');
    return entry.synthesis;
  } catch (error) {
    console.error('[Cache] Error reading cache:', error);
    return null;
  }
}

/**
 * Save synthesis to cache
 */
export function cacheSynthesis(synthesis: SynthesisOutput, patternCount: number, userId?: string): void {
  if (typeof window === 'undefined') return; // Server-side, no cache

  try {
    const entry: CacheEntry = {
      timestamp: Date.now(),
      userId: userId || 'unknown',
      synthesis,
      patternCount,
    };

    localStorage.setItem(CACHE_KEY, JSON.stringify(entry));
    console.log('[Cache] Synthesis cached successfully');
  } catch (error) {
    console.error('[Cache] Error saving cache:', error);
  }
}

/**
 * Clear synthesis cache (useful for debugging)
 */
export function clearSynthesisCache(): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.removeItem(CACHE_KEY);
    console.log('[Cache] Cache cleared');
  } catch (error) {
    console.error('[Cache] Error clearing cache:', error);
  }
}
