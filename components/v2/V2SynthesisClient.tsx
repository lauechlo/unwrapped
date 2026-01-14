'use client';

import { useState, useEffect, useMemo } from 'react';
import type { SynthesisOutput } from '@/lib/v2/synthesis/types';
import type { SourceOfTruth } from '@/lib/v2/types';
import { Footer } from '@/components/Footer';
import { matchPersona } from '@/lib/v2/personas';
import NPSWidget from '@/components/NPSWidget';
import TabNavigation, { type TabId } from './TabNavigation';
import OverviewTab from './tabs/OverviewTab';
import PatternsTab from './tabs/PatternsTab';
import TemporalTab from './tabs/TemporalTab';
import PersonaTab from './tabs/PersonaTab';

// V2.5 imports
import { isV25Enabled } from '@/lib/v2.5/featureFlags';
import { calculateMusicType } from '@/lib/v2.5/typing';
import type { TypeResult } from '@/lib/v2.5/typing';
import TypeReveal from '@/components/v2.5/TypeReveal';
import DimensionCard from '@/components/v2.5/DimensionCard';

interface V2SynthesisClientProps {
  detectedPatterns: any[];
  stats?: {
    totalPlays: number;
    uniqueTracks: number;
    uniqueArtists: number;
    dateRange: string;
  };
  uploadedData?: any[];
  /** V2.5: Pass SourceOfTruth for type calculation */
  sourceOfTruth?: SourceOfTruth;
}

const CACHE_KEY = 'unwrapped_v2_synthesis_cache_v12'; // Added citations to psych profile
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

interface CacheEntry {
  timestamp: number;
  patternCount: number;
  synthesis: SynthesisOutput;
}

export function V2SynthesisClient({ detectedPatterns, stats, uploadedData, sourceOfTruth }: V2SynthesisClientProps) {
  const [synthesis, setSynthesis] = useState<SynthesisOutput | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isFromCache, setIsFromCache] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadingScreen, setLoadingScreen] = useState(0); // 0, 1, 2
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<TabId>('overview');

  // Check if V2.5 mode is enabled
  const useV25 = isV25Enabled();

  // V2.5: Calculate music type if enabled
  const typeResult = useMemo<TypeResult | null>(() => {
    if (!useV25 || !sourceOfTruth) return null;
    try {
      return calculateMusicType(sourceOfTruth);
    } catch (err) {
      console.error('[V2.5] Type calculation failed:', err);
      return null;
    }
  }, [useV25, sourceOfTruth]);

  // Calculate persona match from detected patterns
  const personaMatch = useMemo(() => {
    return matchPersona(detectedPatterns);
  }, [detectedPatterns]);

  // Define tabs (different for V2.5)
  const tabs = useMemo(() => {
    if (useV25) {
      return [
        { id: 'overview' as TabId, label: 'Your Type', icon: '✨' },
        { id: 'patterns' as TabId, label: 'Deep Dive', icon: '🔍' },
        { id: 'when' as TabId, label: 'When You Listen', icon: '🕐' },
        { id: 'persona' as TabId, label: 'Insights', icon: '💎' },
      ];
    }

    return [
      { id: 'overview' as TabId, label: 'Overview', icon: '🎯' },
      { id: 'patterns' as TabId, label: 'Patterns', icon: '🔍', badge: synthesis?.narratives?.length || 0 },
      { id: 'when' as TabId, label: 'When You Listen', icon: '🕐' },
      { id: 'persona' as TabId, label: 'Your Persona', icon: '💎' },
    ];
  }, [useV25, synthesis]);

  useEffect(() => {
    async function loadSynthesis() {
      // V2.5 mode: Skip synthesis API, use client-side type calculation
      if (useV25) {
        console.log('[V2.5 Mode] Skipping synthesis API, using client-side type calculation');
        setIsLoading(false);
        return;
      }

      // V2 mode: Check cache first
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
  }, [detectedPatterns, useV25]);

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

  // No synthesis (V2 mode only)
  if (!useV25 && !synthesis) {
    return null;
  }

  // V2.5 mode: Render type-based UI
  if (useV25 && typeResult) {
    return (
      <div className="min-h-screen bg-black text-white">
        {/* Tab Navigation */}
        <TabNavigation
          activeTab={activeTab}
          onTabChange={setActiveTab}
          tabs={tabs}
        />

        {/* Tab Content */}
        <div className="min-h-screen">
          {activeTab === 'overview' && (
            <>
              <TypeReveal typeResult={typeResult} />

              {/* Dimension Cards Grid */}
              <div className="max-w-7xl mx-auto px-4 py-8">
                <h2 className="text-3xl font-bold mb-6 text-center">Your Four Dimensions</h2>
                <div className="grid md:grid-cols-2 gap-6">
                  {typeResult.dimensions.map((dimension) => (
                    <DimensionCard key={dimension.code} dimension={dimension} />
                  ))}
                </div>
              </div>
            </>
          )}

          {activeTab === 'patterns' && (
            <div className="max-w-7xl mx-auto px-4 py-12">
              <h2 className="text-3xl font-bold mb-6">Deep Dive</h2>
              <div className="grid md:grid-cols-2 gap-6">
                {typeResult.dimensions.map((dimension) => (
                  <DimensionCard key={dimension.code} dimension={dimension} showDetails={true} />
                ))}
              </div>
              <div className="mt-8 bg-zinc-900/50 border border-zinc-700 rounded-2xl p-6">
                <p className="text-gray-400">
                  More detailed metrics and visualizations coming soon!
                </p>
              </div>
            </div>
          )}

          {activeTab === 'when' && uploadedData && (
            <TemporalTab plays={uploadedData} />
          )}

          {activeTab === 'persona' && (
            <div className="max-w-5xl mx-auto px-4 py-12">
              <h2 className="text-3xl font-bold mb-6">Behavioral Insights</h2>
              <PersonaTab
                personaMatch={personaMatch}
                psychologicalSummary={undefined}
              />
            </div>
          )}
        </div>

        {/* Privacy Reminder */}
        <section className="py-12 px-8 bg-zinc-950">
          <div className="max-w-4xl mx-auto text-center">
            <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-6">
              <h4 className="text-lg font-bold text-green-400 mb-2 flex items-center justify-center gap-2">
                <span>🔒</span>
                100% Private Analysis
              </h4>
              <p className="text-sm text-gray-300">
                Your music type was calculated entirely in your browser.
                No data was sent to any server.
              </p>
            </div>
          </div>
        </section>

        {/* NPS Widget */}
        <NPSWidget />

        {/* Footer */}
        <Footer />
      </div>
    );
  }

  // V2 mode: Render narrative-based UI
  if (!synthesis) {
    return null;
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Tab Navigation */}
      <TabNavigation
        activeTab={activeTab}
        onTabChange={setActiveTab}
        tabs={tabs}
      />

      {/* Tab Content */}
      <div className="min-h-screen">
        {activeTab === 'overview' && (
          <OverviewTab
            mainNarrative={{
              title: synthesis.heroInsight.headline,
              summary: synthesis.heroInsight.subtext,
            }}
            stats={stats || {
              totalPlays: 0,
              uniqueTracks: 0,
              uniqueArtists: 0,
              dateRange: '',
            }}
            personaPreview={personaMatch ? {
              name: personaMatch.persona.name,
              icon: personaMatch.persona.icon,
              tagline: personaMatch.persona.tagline,
            } : undefined}
            onNavigate={(tab) => setActiveTab(tab)}
          />
        )}

        {activeTab === 'patterns' && (
          <PatternsTab narratives={synthesis.narratives} />
        )}

        {activeTab === 'when' && uploadedData && (
          <TemporalTab plays={uploadedData} />
        )}

        {activeTab === 'persona' && (
          <PersonaTab
            personaMatch={personaMatch}
            psychologicalSummary={synthesis.psychologicalSummary}
          />
        )}
      </div>

      {/* Privacy Reminder - appears at bottom of all tabs */}
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

      {/* NPS Widget */}
      <NPSWidget />

      {/* Footer */}
      <Footer />
    </div>
  );
}
