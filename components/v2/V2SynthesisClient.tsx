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
import DimensionDetailCard from '@/components/v2.5/DimensionDetailCard';
import StickyNav from '@/components/v2.5/StickyNav';
import CrossPatternSynthesis from '@/components/v2.5/CrossPatternSynthesis';
import type { ShareStats } from '@/components/v2.5/TypeShareButton';
import type { ScopedAIOutput, SynthesizeResponse, SynthesizeError } from '@/lib/v2.5/ai/types';
import { AI_INSIGHTS_CACHE_KEY, AI_INSIGHTS_CACHE_DURATION, type AIInsightsCache } from '@/lib/v2.5/ai/types';

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
  const [activeSection, setActiveSection] = useState<string>('type'); // For V2.5 scroll-spy

  // V2.5 AI insights state
  const [aiInsights, setAiInsights] = useState<ScopedAIOutput | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  // Check if V2.5 mode is enabled
  const useV25 = isV25Enabled();

  // V2.5: Calculate music type if enabled
  const typeResult = useMemo<TypeResult | null>(() => {
    if (!useV25) {
      console.log('[V2.5] Mode disabled, skipping type calculation');
      return null;
    }
    if (!sourceOfTruth) {
      console.log('[V2.5] No sourceOfTruth provided, skipping type calculation');
      return null;
    }
    try {
      console.log('[V2.5] Calculating music type from sourceOfTruth...');
      const result = calculateMusicType(sourceOfTruth);
      console.log('[V2.5] Type calculation successful:', result);
      return result;
    } catch (err) {
      console.error('[V2.5] Type calculation failed:', err);
      return null;
    }
  }, [useV25, sourceOfTruth]);

  // Calculate persona match from detected patterns
  const personaMatch = useMemo(() => {
    return matchPersona(detectedPatterns);
  }, [detectedPatterns]);

  // V2.5: Calculate share stats for personalized share card
  const shareStats = useMemo<ShareStats | undefined>(() => {
    if (!useV25 || !typeResult || !stats) return undefined;

    // Extract top artist from attachment dimension evidence
    const attachmentDim = typeResult.dimensions.find(d => d.category === 'attachment');
    const topArtistExample = attachmentDim?.evidence?.topExamples?.find(
      e => e.label.toLowerCase().includes('artist') || e.label.toLowerCase().includes('#1')
    );
    const topArtist = topArtistExample?.value?.split('\n')[0]?.replace(/^\d+\.\s*/, '') || undefined;

    // Extract top song from processing dimension evidence
    const processingDim = typeResult.dimensions.find(d => d.category === 'processing');
    const topSongExample = processingDim?.evidence?.topExamples?.find(
      e => e.label.toLowerCase().includes('most played') || e.label.toLowerCase().includes('top song')
    );
    let topSong: { name: string; plays: number } | undefined;
    if (topSongExample?.value) {
      const songName = topSongExample.value.split('\n')[0]?.replace(/^\d+\.\s*/, '');
      // Try to extract play count from detail (e.g., "69 plays")
      const playsMatch = topSongExample.detail?.match(/(\d+)\s*plays?/i);
      const plays = playsMatch ? parseInt(playsMatch[1], 10) : 0;
      if (songName && plays > 0) {
        topSong = { name: songName, plays };
      }
    }

    return {
      topArtist,
      totalPlays: stats.totalPlays,
      topSong,
      timePeriod: stats.dateRange,
    };
  }, [useV25, typeResult, stats]);

  // V2.5: Scroll-spy to track active section
  useEffect(() => {
    if (!useV25) return;

    const sectionIds = ['type', 'about', 'breakdown', 'when'];

    const handleScroll = () => {
      const scrollPosition = window.scrollY + 150; // Offset for better UX

      for (const sectionId of sectionIds) {
        const element = document.getElementById(sectionId);
        if (element) {
          const { offsetTop, offsetHeight } = element;
          if (scrollPosition >= offsetTop && scrollPosition < offsetTop + offsetHeight) {
            setActiveSection(sectionId);
            break;
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll(); // Initial check

    return () => window.removeEventListener('scroll', handleScroll);
  }, [useV25]);

  // V2.5: Fetch AI insights when type is calculated
  useEffect(() => {
    if (!useV25 || !typeResult || !stats) return;

    // Capture values for async function (TypeScript narrowing)
    const currentTypeResult = typeResult;
    const currentStats = stats;

    async function fetchAIInsights() {
      // Check localStorage cache first
      const cached = localStorage.getItem(AI_INSIGHTS_CACHE_KEY);
      if (cached) {
        try {
          const cacheEntry: AIInsightsCache = JSON.parse(cached);
          const age = Date.now() - cacheEntry.timestamp;

          // Use cache if fresh, type matches, and pattern count matches
          if (
            age < AI_INSIGHTS_CACHE_DURATION &&
            cacheEntry.typeCode === currentTypeResult.code &&
            cacheEntry.patternCount === detectedPatterns.length
          ) {
            console.log(`[V2.5 AI] Using cached insights (${Math.round(age / 1000 / 60)} min old)`);
            setAiInsights(cacheEntry.insights);
            return;
          } else {
            console.log('[V2.5 AI] Cache expired or data changed, fetching fresh...');
            localStorage.removeItem(AI_INSIGHTS_CACHE_KEY);
          }
        } catch (e) {
          console.error('[V2.5 AI] Cache parse error:', e);
          localStorage.removeItem(AI_INSIGHTS_CACHE_KEY);
        }
      }

      // Fetch fresh AI insights
      setAiLoading(true);
      setAiError(null);

      try {
        console.log('[V2.5 AI] Fetching AI insights...');

        const response = await fetch('/api/v2.5/synthesize', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            typeResult: currentTypeResult,
            patterns: detectedPatterns,
            stats: {
              totalPlays: currentStats.totalPlays,
              uniqueArtists: currentStats.uniqueArtists,
              uniqueTracks: currentStats.uniqueTracks,
              dateRange: currentStats.dateRange,
            },
          }),
        });

        const result = await response.json();

        if (!response.ok) {
          const errorResult = result as SynthesizeError;
          throw new Error(errorResult.message || errorResult.error || 'AI synthesis failed');
        }

        const successResult = result as SynthesizeResponse;
        console.log('[V2.5 AI] Insights received:', successResult.data.heroInsight.substring(0, 50) + '...');

        setAiInsights(successResult.data);

        // Cache the result
        const cacheEntry: AIInsightsCache = {
          timestamp: Date.now(),
          typeCode: currentTypeResult.code,
          patternCount: detectedPatterns.length,
          insights: successResult.data,
        };
        localStorage.setItem(AI_INSIGHTS_CACHE_KEY, JSON.stringify(cacheEntry));
        console.log('[V2.5 AI] Insights cached for 24 hours');

      } catch (err) {
        console.error('[V2.5 AI] Error fetching insights:', err);
        setAiError(err instanceof Error ? err.message : 'Failed to generate insights');
        // Graceful degradation - app still works without AI insights
      } finally {
        setAiLoading(false);
      }
    }

    fetchAIInsights();
  }, [useV25, typeResult, detectedPatterns, stats]);

  // Define tabs (different for V2.5)
  const tabs = useMemo(() => {
    if (useV25) {
      return [
        { id: 'overview' as TabId, label: 'Type', icon: '✨' },
        { id: 'patterns' as TabId, label: 'Details', icon: '🔍' },
        { id: 'when' as TabId, label: 'When', icon: '🕐' },
        { id: 'persona' as TabId, label: 'About You', icon: '💎' },
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
                  Reading your listening history...
                </h2>
                <p className="text-base md:text-lg text-gray-300 leading-relaxed mb-6 px-4">
                  Looking at <span className="text-purple-400 font-semibold">when</span> and
                  <span className="text-pink-400 font-semibold"> how</span> you listen.
                </p>
                {stats && (
                  <div className="grid grid-cols-2 gap-4 mb-6 px-4">
                    <div className="bg-zinc-900/50 border border-zinc-700 p-4 rounded-lg">
                      <div className="text-2xl font-bold text-white">{stats.totalPlays.toLocaleString()}</div>
                      <div className="text-sm text-gray-300">Total Plays</div>
                    </div>
                    <div className="bg-zinc-900/50 border border-zinc-700 p-4 rounded-lg">
                      <div className="text-2xl font-bold text-white">{stats.uniqueTracks.toLocaleString()}</div>
                      <div className="text-sm text-gray-300">Unique Tracks</div>
                    </div>
                  </div>
                )}
                <div className="inline-block bg-green-500/20 border border-green-500/50 px-4 py-2 rounded-full text-green-400 font-semibold text-sm md:text-base">
                  Found {detectedPatterns.length} patterns
                </div>
              </div>
            )}

            {/* Screen 2: V2 Behavioral Detection */}
            {loadingScreen === 1 && (
              <div className="animate-fadeIn">
                <div className="text-sm text-gray-500 mb-4 font-semibold">Step 2 of 3</div>
                <div className="text-6xl mb-6 animate-pulse">🔍</div>
                <h2 className="text-2xl md:text-3xl font-bold text-white mb-6 px-4">
                  Running 30+ detectors...
                </h2>
                <div className="text-left space-y-3 mb-6 px-4">
                  <p className="text-sm md:text-base text-gray-300 flex items-start gap-2">
                    <span className="text-green-400 font-bold flex-shrink-0">✓</span>
                    <span>Songs you replay vs. skip</span>
                  </p>
                  <p className="text-sm md:text-base text-gray-300 flex items-start gap-2">
                    <span className="text-green-400 font-bold flex-shrink-0">✓</span>
                    <span>Daily and weekly listening rhythms</span>
                  </p>
                  <p className="text-sm md:text-base text-gray-300 flex items-start gap-2">
                    <span className="text-green-400 font-bold flex-shrink-0">✓</span>
                    <span>Artists you've abandoned (and returned to)</span>
                  </p>
                  <p className="text-sm md:text-base text-gray-300 flex items-start gap-2">
                    <span className="text-green-400 font-bold flex-shrink-0">✓</span>
                    <span>How your taste has evolved</span>
                  </p>
                  <p className="text-sm md:text-base text-gray-300 flex items-start gap-2">
                    <span className="text-green-400 font-bold flex-shrink-0">✓</span>
                    <span>Discovery weeks vs. comfort zones</span>
                  </p>
                </div>
              </div>
            )}

            {/* Screen 3: Synthesis */}
            {loadingScreen === 2 && (
              <div className="animate-fadeIn">
                <div className="text-sm text-gray-500 mb-4 font-semibold">Step 3 of 3</div>
                <div className="text-6xl mb-6 animate-pulse">✨</div>
                <h2 className="text-2xl md:text-3xl font-bold text-white mb-6 px-4">
                  Putting it together...
                </h2>
                <div className="text-left space-y-2 mb-6 text-sm md:text-base text-gray-300 px-4">
                  <p>• Your <span className="text-pink-400 font-semibold">actual songs and artists</span></p>
                  <p>• <span className="text-purple-400 font-semibold">Real dates</span> from your history</p>
                  <p>• Patterns unique to <span className="text-blue-400 font-semibold">how you listen</span></p>
                </div>
                <p className="text-yellow-300 font-semibold animate-pulse text-base md:text-lg px-4 mb-6">
                  Almost done...
                </p>
              </div>
            )}

            {/* Navigation Controls: Arrows + Clickable Dots */}
            <div className="flex items-center justify-center gap-4 mt-8">
              {/* Previous Arrow */}
              <button
                type="button"
                onClick={() => setLoadingScreen(Math.max(0, loadingScreen - 1))}
                disabled={loadingScreen === 0}
                className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl transition-all border ${
                  loadingScreen === 0
                    ? 'text-gray-700 border-gray-800 cursor-not-allowed opacity-50'
                    : 'text-gray-300 border-gray-600 hover:text-white hover:border-purple-500 hover:bg-purple-500/20 active:scale-95'
                }`}
                aria-label="Previous screen"
              >
                ←
              </button>

              {/* Dots */}
              <div className="flex gap-3 px-4">
                {[0, 1, 2].map((screen) => (
                  <button
                    type="button"
                    key={screen}
                    onClick={() => setLoadingScreen(screen)}
                    className={`h-3 rounded-full transition-all ${
                      loadingScreen === screen
                        ? 'bg-purple-500 w-8'
                        : 'bg-gray-600 hover:bg-gray-400 w-3'
                    }`}
                    aria-label={`Go to screen ${screen + 1}`}
                  />
                ))}
              </div>

              {/* Next Arrow */}
              <button
                type="button"
                onClick={() => setLoadingScreen(Math.min(2, loadingScreen + 1))}
                disabled={loadingScreen === 2}
                className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl transition-all border ${
                  loadingScreen === 2
                    ? 'text-gray-700 border-gray-800 cursor-not-allowed opacity-50'
                    : 'text-gray-300 border-gray-600 hover:text-white hover:border-purple-500 hover:bg-purple-500/20 active:scale-95'
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
          <p className="text-gray-300 mb-6">{error}</p>

          {isRateLimit ? (
            <div className="space-y-4">
              <p className="text-sm text-gray-500">
                3 per day max. Come back tomorrow!
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

  // V2.5 mode: Check if type calculation failed
  if (useV25 && !typeResult) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center px-4">
        <div className="max-w-2xl text-center">
          <h2 className="text-3xl font-bold mb-4">Need More Data</h2>
          <p className="text-gray-300 mb-6">
            Not enough listening history to calculate your type.
          </p>
          <p className="text-sm text-gray-500 mb-8">
            Try uploading all your files.
          </p>
          <button
            onClick={() => window.location.href = '/extended'}
            className="px-6 py-3 bg-purple-600 hover:bg-purple-500 text-white font-semibold rounded-lg"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // V2.5 mode: Render type-based UI with scrollable sections
  if (useV25 && typeResult) {
    // Define sections for navigation
    // Flow: Type reveal → About You → Data Breakdown (evidence) → When
    const sections = [
      { id: 'type', label: 'Your Type', number: 1 },
      { id: 'about', label: 'About You', number: 2 },
      { id: 'breakdown', label: 'Data Breakdown', number: 3 },
      { id: 'when', label: 'When You Listen', number: 4 },
    ];

    // Handle section navigation
    const handleSectionClick = (sectionId: string) => {
      if (sectionId === 'share') {
        // Open share modal - for now scroll to type section where share button is
        document.getElementById('type')?.scrollIntoView({ behavior: 'smooth' });
        return;
      }
      if (sectionId === 'compare') {
        // Navigate to compare page with user's type
        window.location.href = `/compare?type=${typeResult.code}`;
        return;
      }
      // Scroll to section
      const element = document.getElementById(sectionId);
      if (element) {
        const offset = 80; // Account for mobile sticky nav
        const elementPosition = element.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.pageYOffset - offset;
        window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
      }
    };

    return (
      <div className="min-h-screen bg-black text-white">
        {/* Sticky Navigation */}
        <StickyNav
          sections={sections}
          activeSection={activeSection}
          onSectionClick={handleSectionClick}
          typeCode={typeResult.code}
          typeName={typeResult.description}
        />

        {/* Scrollable Content - All sections on one page */}
        <div className="lg:pr-72"> {/* Make room for desktop sidebar */}
          {/* Section 1: Your Type */}
          <section id="type" className="scroll-mt-20">
            <TypeReveal
              typeResult={typeResult}
              shareStats={shareStats}
              heroInsight={aiInsights?.heroInsight}
              isAiLoading={aiLoading}
            />

            {/* Cross-Pattern Synthesis - only shown when AI insights available */}
            {aiInsights?.crossPatternSynthesis && (
              <CrossPatternSynthesis synthesis={aiInsights.crossPatternSynthesis} />
            )}
          </section>

          {/* Section 2: About You */}
          <section id="about" className="scroll-mt-20 py-16 bg-zinc-950/50">
            <div className="max-w-5xl mx-auto px-4">
              <div className="text-center mb-8">
                <h2 className="text-3xl md:text-4xl font-bold text-white mb-3">
                  About You
                </h2>
                <p className="text-gray-400 max-w-xl mx-auto">
                  Your listening personality and patterns
                </p>
              </div>
              <PersonaTab
                personaMatch={personaMatch}
                psychologicalSummary={aiInsights?.psychologicalSummary}
              />
            </div>
          </section>

          {/* Section 3: Your Data Breakdown */}
          <section id="breakdown" className="scroll-mt-20 py-16">
            <div className="max-w-5xl mx-auto px-4">
              <div className="text-center mb-10">
                <h2 className="text-3xl md:text-4xl font-bold text-white mb-3">
                  Your Data Breakdown
                </h2>
                <p className="text-gray-400 max-w-xl mx-auto">
                  The evidence behind each dimension of your type
                </p>
              </div>
              <div className="space-y-6">
                {typeResult.dimensions.map((dimension, index) => (
                  <DimensionDetailCard key={`${dimension.code}-${index}`} dimension={dimension} />
                ))}
              </div>
            </div>
          </section>

          {/* Section 4: When You Listen */}
          <section id="when" className="scroll-mt-20 py-16 bg-zinc-950/50">
            {uploadedData && <TemporalTab plays={uploadedData} />}
          </section>

          {/* Privacy Reminder */}
          <section className="py-12 px-8 bg-zinc-950">
            <div className="max-w-4xl mx-auto text-center">
              <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-6">
                <h4 className="text-lg font-bold text-green-400 mb-2 flex items-center justify-center gap-2">
                  <span>🔒</span>
                  Private
                </h4>
                <p className="text-sm text-gray-300">
                  Everything happens in your browser. We never see your data.
                </p>
              </div>
            </div>
          </section>

          {/* NPS Widget */}
          <NPSWidget />

          {/* Footer */}
          <Footer />
        </div>
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
