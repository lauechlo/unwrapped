'use client';

import { useState, useEffect, useMemo } from 'react';
import type { SynthesisOutput } from '@/lib/v2/synthesis/types';
import V2NarrativeCards from './V2NarrativeCards';
import { Footer } from '@/components/Footer';
import CollapsiblePsychologicalSummary from './CollapsiblePsychologicalSummary';
import PersonaCard from './PersonaCard';
import { matchPersona } from '@/lib/v2/personas';
import NPSWidget from '@/components/NPSWidget';
import ListeningJourneyTimeline from './ListeningJourneyTimeline';
import TemporalHeatmap from './TemporalHeatmap';

interface V2SynthesisClientProps {
  detectedPatterns: any[];
  stats?: {
    totalPlays: number;
    uniqueTracks: number;
    uniqueArtists: number;
    dateRange: string;
  };
  uploadedData?: any[];
}

const CACHE_KEY = 'unwrapped_v2_synthesis_cache_v12'; // Added citations to psych profile
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

interface CacheEntry {
  timestamp: number;
  patternCount: number;
  synthesis: SynthesisOutput;
}

export function V2SynthesisClient({ detectedPatterns, stats, uploadedData }: V2SynthesisClientProps) {
  const [synthesis, setSynthesis] = useState<SynthesisOutput | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isFromCache, setIsFromCache] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadingScreen, setLoadingScreen] = useState(0); // 0, 1, 2
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  // Calculate persona match from detected patterns
  const personaMatch = useMemo(() => {
    return matchPersona(detectedPatterns);
  }, [detectedPatterns]);

  useEffect(() => {
    async function loadSynthesis() {
      // Check cache first
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        try {
          const entry: CacheEntry = JSON.parse(cached);
          const age = Date.now() - entry.timestamp;

          // Use cache if fresh and pattern count matches
          if (age < CACHE_DURATION && entry.patternCount === detectedPatterns.length) {
            console.log(`[V2 Synthesis] Using cached results (${Math.round(age / 1000 / 60)} min old)`);
            setSynthesis(entry.synthesis);
            setIsFromCache(true);
            setIsLoading(false);
            return;
          } else {
            console.log('[V2 Synthesis] Cache expired or pattern count changed, regenerating...');
            localStorage.removeItem(CACHE_KEY);
          }
        } catch (e) {
          console.error('[V2 Synthesis] Cache parse error:', e);
          localStorage.removeItem(CACHE_KEY);
        }
      }

      // No cache - run synthesis via API
      try {
        console.log('[V2 Synthesis] Running fresh synthesis...');

        const response = await fetch('/api/v2/synthesize', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ patterns: detectedPatterns }),
        });

        if (!response.ok) {
          // Handle rate limit (429) specially
          if (response.status === 429) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Rate limit exceeded. Try again later.');
          }
          throw new Error(`Synthesis failed: ${response.statusText}`);
        }

        const result: SynthesisOutput = await response.json();
        console.log('[V2 Synthesis Client] Received synthesis:', {
          narratives: result.narratives?.length,
          heroHeadline: result.heroInsight?.headline,
          hasSummary: !!result.psychologicalSummary
        });
        console.log(`✅ ${result.narratives?.length || 0} narrative cards will be displayed`);

        setSynthesis(result);
        setIsFromCache(false);

        // Cache the result
        const cacheEntry: CacheEntry = {
          timestamp: Date.now(),
          patternCount: detectedPatterns.length,
          synthesis: result,
        };
        localStorage.setItem(CACHE_KEY, JSON.stringify(cacheEntry));
        console.log('[V2 Synthesis] Results cached for 24 hours');

        console.log('[V2 Synthesis Client] Setting isLoading to false');
        setIsLoading(false);
      } catch (err) {
        console.error('[V2 Synthesis] Error:', err);
        setError(err instanceof Error ? err.message : 'Synthesis failed');
        setIsLoading(false);
      }
    }

    loadSynthesis();
  }, [detectedPatterns]);

  // Auto-advance loading screens every 20 seconds
  useEffect(() => {
    if (!isLoading) return;

    const timer1 = setTimeout(() => setLoadingScreen(1), 20000);
    const timer2 = setTimeout(() => setLoadingScreen(2), 40000);
    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, [isLoading]);

  // Swipe gesture handlers for mobile
  const minSwipeDistance = 50;

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;

    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe && loadingScreen < 2) {
      setLoadingScreen(loadingScreen + 1);
    }
    if (isRightSwipe && loadingScreen > 0) {
      setLoadingScreen(loadingScreen - 1);
    }
  };

  // Loading state - Progressive 3-screen experience
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900/20 via-black to-black">
        {/* Progress Bar at Top */}
        <div className="fixed top-0 left-0 right-0 z-50 bg-zinc-900/80 backdrop-blur-sm">
          <div className="h-1 bg-purple-600/30">
            <div
              className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-1000 ease-out"
              style={{ width: `${((loadingScreen + 1) / 3) * 100}%` }}
            />
          </div>
        </div>

        {/* Main Loading Content */}
        <div
          className="flex flex-col items-center pt-20 md:pt-32 px-8 pb-8"
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
        >
          <div className="max-w-2xl text-center">
            {/* Screen 1: Processing Extended History */}
            {loadingScreen === 0 && (
              <div className="animate-fadeIn">
                <div className="text-sm text-gray-500 mb-4 font-semibold">Step 1 of 3</div>
                <div className="text-6xl mb-6 animate-pulse">📊</div>
                <h2 className="text-2xl md:text-3xl font-bold text-white mb-6 px-4">
                  Analyzing your Extended Streaming History...
                </h2>
                <p className="text-base md:text-lg text-gray-300 leading-relaxed mb-4 px-4">
                  Extended History unlocks <span className="text-purple-400 font-semibold">temporal patterns</span> that
                  Spotify Wrapped can't see.
                </p>
                <p className="text-base md:text-lg text-gray-300 leading-relaxed mb-6 px-4">
                  Your data contains <span className="text-blue-400 font-semibold">real timestamps</span> and
                  <span className="text-pink-400 font-semibold"> behavioral evidence</span> - not just API snapshots.
                </p>
                {stats && (
                  <div className="grid grid-cols-2 gap-4 mb-6 px-4">
                    <div className="bg-zinc-900/50 border border-zinc-700 p-4 rounded-lg">
                      <div className="text-2xl font-bold text-white">{stats.totalPlays.toLocaleString()}</div>
                      <div className="text-sm text-gray-400">Total Plays</div>
                    </div>
                    <div className="bg-zinc-900/50 border border-zinc-700 p-4 rounded-lg">
                      <div className="text-2xl font-bold text-white">{stats.uniqueTracks.toLocaleString()}</div>
                      <div className="text-sm text-gray-400">Unique Tracks</div>
                    </div>
                  </div>
                )}
                <div className="inline-block bg-green-500/20 border border-green-500/50 px-4 py-2 rounded-full text-green-400 font-semibold text-sm md:text-base">
                  Detected: {detectedPatterns.length} patterns
                </div>
              </div>
            )}

            {/* Screen 2: V2 Behavioral Detection */}
            {loadingScreen === 1 && (
              <div className="animate-fadeIn">
                <div className="text-sm text-gray-500 mb-4 font-semibold">Step 2 of 3</div>
                <div className="text-6xl mb-6 animate-pulse">🔍</div>
                <h2 className="text-2xl md:text-3xl font-bold text-white mb-6 px-4">
                  Running 9 advanced behavioral detectors...
                </h2>
                <div className="text-left space-y-2 mb-6 px-4">
                  <p className="text-sm md:text-base text-gray-300 flex items-start gap-2">
                    <span className="text-green-400 font-bold flex-shrink-0">✓</span>
                    <span><strong className="text-white">The Looper</strong> - Consecutive play analysis</span>
                  </p>
                  <p className="text-sm md:text-base text-gray-300 flex items-start gap-2">
                    <span className="text-green-400 font-bold flex-shrink-0">✓</span>
                    <span><strong className="text-white">Skip Velocity</strong> - Instant rejection patterns</span>
                  </p>
                  <p className="text-sm md:text-base text-gray-300 flex items-start gap-2">
                    <span className="text-green-400 font-bold flex-shrink-0">✓</span>
                    <span><strong className="text-white">The Ritual</strong> - Time-anchored behaviors</span>
                  </p>
                  <p className="text-sm md:text-base text-gray-300 flex items-start gap-2">
                    <span className="text-green-400 font-bold flex-shrink-0">✓</span>
                    <span><strong className="text-white">Life Event Detection</strong> - Musical taste shifts</span>
                  </p>
                  <p className="text-sm md:text-base text-gray-300 flex items-start gap-2">
                    <span className="text-green-400 font-bold flex-shrink-0">✓</span>
                    <span><strong className="text-white">Ghost Timeline</strong> - Artist abandonment tracking</span>
                  </p>
                  <p className="text-sm md:text-base text-gray-300 flex items-start gap-2">
                    <span className="text-green-400 font-bold flex-shrink-0">✓</span>
                    <span><strong className="text-white">The Searcher</strong> - Intentional listening analysis</span>
                  </p>
                  <p className="text-sm md:text-base text-gray-300 flex items-start gap-2">
                    <span className="text-green-400 font-bold flex-shrink-0">✓</span>
                    <span><strong className="text-white">Completion Loyalist</strong> - Sustained engagement</span>
                  </p>
                  <p className="text-sm md:text-base text-gray-300 flex items-start gap-2">
                    <span className="text-green-400 font-bold flex-shrink-0">✓</span>
                    <span><strong className="text-white">The Explorer</strong> - Discovery velocity</span>
                  </p>
                  <p className="text-sm md:text-base text-gray-300 flex items-start gap-2">
                    <span className="text-green-400 font-bold flex-shrink-0">✓</span>
                    <span><strong className="text-white">The Loyalist</strong> - Artist devotion</span>
                  </p>
                </div>
                <p className="text-xs md:text-sm text-gray-500 italic px-4">
                  All patterns validated against source data
                </p>
              </div>
            )}

            {/* Screen 3: Claude AI Synthesis */}
            {loadingScreen === 2 && (
              <div className="animate-fadeIn">
                <div className="text-sm text-gray-500 mb-4 font-semibold">Step 3 of 3</div>
                <div className="text-6xl mb-6 animate-pulse">✨</div>
                <h2 className="text-2xl md:text-3xl font-bold text-white mb-6 px-4">
                  Generating research-grounded insights...
                </h2>
                <p className="text-base md:text-lg text-gray-300 leading-relaxed mb-4 px-4">
                  Claude AI is creating narratives with:
                </p>
                <div className="text-left space-y-2 mb-6 text-sm md:text-base text-gray-300 px-4">
                  <p>• <span className="text-pink-400 font-semibold">Exact track names</span> from your evidence</p>
                  <p>• <span className="text-purple-400 font-semibold">Real timestamps</span> (weeks, hours, dates)</p>
                  <p>• <span className="text-blue-400 font-semibold">Psychological research</span> citations (Saarikallio, Levitin)</p>
                  <p>• <span className="text-green-400 font-semibold">Formal analysis</span> grounded in music cognition</p>
                </div>
                <p className="text-yellow-300 font-semibold animate-pulse text-base md:text-lg px-4 mb-6">
                  Validating narratives against evidence...
                </p>
                <p className="text-sm text-purple-400 font-semibold px-4">
                  ↓ Scroll down after loading to see psychological summary
                </p>
              </div>
            )}

            {/* Navigation Controls: Arrows + Clickable Dots */}
            <div className="flex items-center justify-center gap-6 mt-8">
              {/* Previous Arrow */}
              <button
                onClick={() => setLoadingScreen(Math.max(0, loadingScreen - 1))}
                disabled={loadingScreen === 0}
                className={`text-2xl transition-all ${
                  loadingScreen === 0 ? 'text-gray-700 cursor-not-allowed' : 'text-gray-400 hover:text-white'
                }`}
                aria-label="Previous screen"
              >
                ←
              </button>

              {/* Dots */}
              <div className="flex gap-2">
                {[0, 1, 2].map((screen) => (
                  <button
                    key={screen}
                    onClick={() => setLoadingScreen(screen)}
                    className={`w-2 h-2 rounded-full transition-all ${
                      loadingScreen === screen
                        ? 'bg-purple-500 w-6'
                        : 'bg-gray-600 hover:bg-gray-400'
                    }`}
                    aria-label={`Go to screen ${screen + 1}`}
                  />
                ))}
              </div>

              {/* Next Arrow */}
              <button
                onClick={() => setLoadingScreen(Math.min(2, loadingScreen + 1))}
                disabled={loadingScreen === 2}
                className={`text-2xl transition-all ${
                  loadingScreen === 2 ? 'text-gray-700 cursor-not-allowed' : 'text-gray-400 hover:text-white'
                }`}
                aria-label="Next screen"
              >
                →
              </button>
            </div>

            {/* Swipe Hint (Mobile) */}
            <p className="text-xs text-gray-600 mt-4 md:hidden">
              Swipe left/right to navigate
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    const isRateLimit = error.includes('daily analyses') || error.includes('Try again in');

    return (
      <div className="min-h-screen flex items-center justify-center bg-black p-8">
        <div className="max-w-md text-center">
          <div className="text-5xl mb-4">{isRateLimit ? '🕐' : '😵‍💫'}</div>
          <h2 className="text-2xl font-bold text-white mb-2">
            {isRateLimit ? 'Rate Limit Reached' : 'Oops! Synthesis Failed'}
          </h2>
          <p className="text-gray-400 mb-6">{error}</p>

          {isRateLimit ? (
            <div className="space-y-4">
              <p className="text-sm text-gray-500">
                To prevent abuse, we limit each user to 3 analyses per day. This keeps costs sustainable and ensures everyone gets a fair turn.
              </p>
              <button
                onClick={() => window.location.href = '/extended'}
                className="px-6 py-3 bg-zinc-700 hover:bg-zinc-600 text-white font-semibold rounded-lg"
              >
                Back to Upload
              </button>
            </div>
          ) : (
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-3 bg-purple-600 hover:bg-purple-500 text-white font-semibold rounded-lg"
            >
              Try Again
            </button>
          )}
        </div>
      </div>
    );
  }

  // No synthesis
  if (!synthesis) {
    return null;
  }

  return (
    <>
      {/* Hero Insight */}
      <section className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#1DB954]/20 via-black to-black px-4 md:px-8 py-12 md:py-20">
        <div className="max-w-6xl mx-auto w-full text-center">
          <div className="inline-block bg-[#1DB954]/10 border border-[#1DB954]/30 px-4 py-2 md:px-6 md:py-3 rounded-full text-xs md:text-sm text-[#1DB954] mb-6 md:mb-8 backdrop-blur-sm">
            Your Extended History Analysis
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-6 md:mb-8 leading-tight px-4 md:px-8 break-words text-white">
            {synthesis.heroInsight.headline}
          </h1>
          <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-gray-300 leading-relaxed max-w-4xl mx-auto px-4 md:px-8">
            {synthesis.heroInsight.subtext}
          </p>

          <div className="mt-8 md:mt-12">
            <p className="text-gray-500 text-sm">
              Scroll to see your patterns ↓
            </p>
          </div>
        </div>
      </section>

      {/* Listening Journey Timeline */}
      <ListeningJourneyTimeline patterns={detectedPatterns} />

      {/* Temporal Heatmap */}
      {uploadedData && uploadedData.length > 0 && (
        <TemporalHeatmap uploadedData={uploadedData} />
      )}

      {/* Narrative Cards */}
      {synthesis.narratives.length > 0 && (
        <V2NarrativeCards narratives={synthesis.narratives} />
      )}

      {/* Persona Match - "People Like Me" */}
      <section className="py-12 px-8 bg-gradient-to-b from-black to-zinc-950">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-3">
              People Like You
            </h2>
            <p className="text-gray-400">
              Based on your listening patterns, here's your archetype
            </p>
          </div>
          <PersonaCard personaMatch={personaMatch} />
        </div>
      </section>

      {/* Data Range Info */}
      {stats && (
        <section className="py-12 px-8 bg-zinc-950">
          <div className="max-w-4xl mx-auto text-center">
            <div className="bg-zinc-900/50 border border-zinc-700 rounded-xl p-6">
              <p className="text-sm text-gray-400 mb-2">Analyzed Data Range</p>
              <p className="text-lg md:text-xl font-semibold text-[#1DB954]">
                {stats.dateRange}
              </p>
              <div className="mt-4 flex flex-wrap justify-center gap-4 md:gap-8 text-sm text-gray-400">
                <span>{stats.totalPlays.toLocaleString()} total plays</span>
                <span>•</span>
                <span>{stats.uniqueTracks.toLocaleString()} unique tracks</span>
                <span>•</span>
                <span>{stats.uniqueArtists.toLocaleString()} unique artists</span>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Psychological Summary - Collapsible */}
      <CollapsiblePsychologicalSummary summary={synthesis.psychologicalSummary} />

      {/* Privacy Reminder */}
      <section className="py-12 px-8 bg-zinc-950">
        <div className="max-w-4xl mx-auto text-center">
          <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-6">
            <h4 className="text-lg font-bold text-green-400 mb-2 flex items-center justify-center gap-2">
              <span>🔒</span>
              100% Private Analysis
            </h4>
            <p className="text-sm text-gray-300 mb-4">
              All synthesis happened server-side but your data was never stored.
              Results are cached in your browser for 24 hours.
            </p>
            {isFromCache && (
              <button
                onClick={() => {
                  localStorage.removeItem(CACHE_KEY);
                  window.location.reload();
                }}
                className="text-xs text-green-400 hover:text-green-300 underline"
              >
                Clear cache & regenerate
              </button>
            )}
          </div>
        </div>
      </section>

      {/* NPS Widget - appears after user spends time on page */}
      <NPSWidget />

      <Footer />
    </>
  );
}
