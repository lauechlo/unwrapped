"use client";

import { useEffect, useState } from 'react';
import type { SynthesisOutput } from '@/lib/synthesis/types';

interface SynthesisCacheProps {
  synthesis: SynthesisOutput;
  patternCount: number;
}

const CACHE_KEY = 'unwrapped_synthesis_cache_v2';
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

interface CacheEntry {
  timestamp: number;
  synthesis: SynthesisOutput;
  patternCount: number;
}

/**
 * Client-side component that caches synthesis results
 * Shows a banner when results are from cache
 */
export function SynthesisCache({ synthesis, patternCount }: SynthesisCacheProps) {
  const [isFromCache, setIsFromCache] = useState(false);
  const [cacheAge, setCacheAge] = useState<number>(0);

  useEffect(() => {
    try {
      // Check if current results match cache
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        const entry: CacheEntry = JSON.parse(cached);
        const age = Date.now() - entry.timestamp;

        // If cache is fresh and matches pattern count, this is from cache
        if (age < CACHE_DURATION && entry.patternCount === patternCount) {
          setIsFromCache(true);
          setCacheAge(Math.round(age / 1000 / 60)); // minutes
        }
      }

      // Save current results to cache
      const newEntry: CacheEntry = {
        timestamp: Date.now(),
        synthesis,
        patternCount,
      };
      localStorage.setItem(CACHE_KEY, JSON.stringify(newEntry));
      console.log('[Cache] Synthesis results cached for future use');
    } catch (error) {
      console.error('[Cache] Error managing cache:', error);
    }
  }, [synthesis, patternCount]);

  if (!isFromCache) return null;

  return (
    <div className="fixed top-4 right-4 z-50 bg-green-500/20 border border-green-500/50 backdrop-blur-sm
                    px-4 py-2 rounded-lg text-sm text-green-300 max-w-sm">
      <div className="flex items-center gap-2">
        <span className="text-lg">💾</span>
        <div>
          <div className="font-semibold">Cached Results</div>
          <div className="text-xs text-green-400/80">
            From {cacheAge} min ago • No API charges
          </div>
        </div>
      </div>
    </div>
  );
}
