"use client";

import { useState, useEffect } from 'react';
import type { DetectionResult, SynthesisOutput } from '@/lib/synthesis/types';
import { selectShareableCards } from '@/lib/synthesis/select-shareable';
import { incrementUsage } from '@/lib/rateLimit';
import PatternCards from './PatternCards';
import { DownloadButton } from './DownloadButton';
import { DisclaimerBanner } from './DisclaimerBanner';

interface SynthesisClientProps {
  detectedPatterns: DetectionResult[];
}

const CACHE_KEY = 'unwrapped_synthesis_cache';
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

interface CacheEntry {
  timestamp: number;
  patternCount: number;
  synthesis: SynthesisOutput;
}

/**
 * Client-side synthesis handler with localStorage caching
 * Prevents expensive API calls on page refresh
 */
export function SynthesisClient({ detectedPatterns }: SynthesisClientProps) {
  const [synthesis, setSynthesis] = useState<SynthesisOutput | null>(null);
  const [shareableCards, setShareableCards] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFromCache, setIsFromCache] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadingScreen, setLoadingScreen] = useState(0);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

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
            console.log(`[Synthesis] Using cached results (${Math.round(age / 1000 / 60)} min old) - NO API CHARGES`);
            setSynthesis(entry.synthesis);
            setIsFromCache(true);

            // Select shareable cards from cache
            if (entry.synthesis.patternCards.length > 0) {
              const cards = selectShareableCards(entry.synthesis.patternCards);
              setShareableCards(cards);
            }

            // Track cached view analytics
            try {
              const analytics = JSON.parse(localStorage.getItem('unwrapped_analytics') || '{}');
              analytics.cacheViews = (analytics.cacheViews || 0) + 1;
              analytics.lastCacheView = new Date().toISOString();
              localStorage.setItem('unwrapped_analytics', JSON.stringify(analytics));
            } catch (e) {
              console.error('[Analytics] Error tracking cache view:', e);
            }

            setIsLoading(false);
            return;
          } else {
            console.log('[Synthesis] Cache expired or pattern count changed, regenerating...');
            localStorage.removeItem(CACHE_KEY);
          }
        } catch (e) {
          console.error('[Synthesis] Cache parse error:', e);
          localStorage.removeItem(CACHE_KEY);
        }
      }

      // No cache - run synthesis via API
      try {
        console.log('[Synthesis] Running fresh synthesis...');

        // Increment usage counter ONLY for new API calls (not cached results)
        incrementUsage();

        const response = await fetch('/api/synthesize', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ patterns: detectedPatterns }),
        });

        if (!response.ok) {
          throw new Error(`Synthesis failed: ${response.statusText}`);
        }

        const result: SynthesisOutput = await response.json();
        setSynthesis(result);
        setIsFromCache(false);

        // Cache the result
        const cacheEntry: CacheEntry = {
          timestamp: Date.now(),
          patternCount: detectedPatterns.length,
          synthesis: result,
        };
        localStorage.setItem(CACHE_KEY, JSON.stringify(cacheEntry));
        console.log('[Synthesis] Results cached for 24 hours');

        // Select shareable cards
        if (result.patternCards.length > 0) {
          const cards = selectShareableCards(result.patternCards);
          setShareableCards(cards);
        }

        // Track pattern analytics (for V2 planning)
        try {
          const analytics = JSON.parse(localStorage.getItem('unwrapped_analytics') || '{}');
          analytics.sessions = analytics.sessions || [];
          analytics.sessions.push({
            timestamp: new Date().toISOString(),
            patternsDetected: detectedPatterns.map(p => ({
              name: p.patternName,
              confidence: p.confidence,
              category: p.category
            })),
            patternCount: detectedPatterns.length,
            fromCache: false
          });
          localStorage.setItem('unwrapped_analytics', JSON.stringify(analytics));
          console.log('[Analytics] Pattern detection tracked');
        } catch (e) {
          console.error('[Analytics] Error tracking patterns:', e);
        }

        setIsLoading(false);
      } catch (err) {
        console.error('[Synthesis] Error:', err);
        setError(err instanceof Error ? err.message : 'Synthesis failed');
        setIsLoading(false);
      }
    }

    loadSynthesis();
  }, [detectedPatterns]);

  // Auto-advance loading screens every 10 seconds
  useEffect(() => {
    if (!isLoading) return;

    const timer1 = setTimeout(() => setLoadingScreen(1), 10000);
    const timer2 = setTimeout(() => setLoadingScreen(2), 20000);
    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, [isLoading]);

  // Swipe gesture handlers
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

  // Loading state with progressive screens
  if (isLoading) {
    // Calculate progress percentage (0-100%)
    const progressPercentage = ((loadingScreen + 1) / 3) * 100;

    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900/20 via-black to-black">
        {/* Progress Bar at Top */}
        <div className="w-full h-2 bg-gray-800">
          <div
            className="h-full bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 transition-all duration-500 ease-out"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>

        {/* Main Loading Content */}
        <div
          className="flex flex-col items-center pt-20 md:pt-32 px-8 pb-8"
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
        >
          <div className="max-w-2xl text-center">
          {/* Screen 1: Origin Story */}
          {loadingScreen === 0 && (
            <div className="animate-fadeIn">
              {/* Step Indicator */}
              <div className="text-sm text-gray-500 mb-4 font-semibold">Step 1 of 3</div>
              <div className="text-6xl mb-6 animate-pulse">🎵</div>
              <h2 className="text-2xl md:text-3xl font-bold text-white mb-6 px-4">
                Analyzing your musical fingerprint...
              </h2>
              <p className="text-base md:text-lg text-gray-300 leading-relaxed mb-4 px-4">
                Spotify Wrapped shows <span className="text-pink-400 font-semibold">static data</span> - top songs, play counts.
                I built this to find the <span className="text-purple-400 font-semibold">behavioral insights</span> hidden
                underneath.
              </p>
              <p className="text-base md:text-lg text-gray-300 leading-relaxed mb-6 px-4">
                Using <span className="text-blue-400 font-semibold">music cognition research</span>,
                we decode <em>why</em> you listen, not just what.
              </p>
              <div className="inline-block bg-green-500/20 border border-green-500/50 px-4 py-2 rounded-full text-green-400 font-semibold text-sm md:text-base">
                Detected: {detectedPatterns.length} patterns
              </div>
            </div>
          )}

          {/* Screen 2: Research Methods */}
          {loadingScreen === 1 && (
            <div className="animate-fadeIn">
              {/* Step Indicator */}
              <div className="text-sm text-gray-500 mb-4 font-semibold">Step 2 of 3</div>
              <div className="text-6xl mb-6 animate-pulse">🧬</div>
              <h2 className="text-2xl md:text-3xl font-bold text-white mb-6 px-4">
                Decoding 7 psychological dimensions...
              </h2>
              <div className="text-left space-y-2 mb-6 px-4">
                <p className="text-sm md:text-base text-gray-300 flex items-start gap-2">
                  <span className="text-green-400 font-bold flex-shrink-0">✓</span>
                  <span><strong className="text-white">Temporal rhythms</strong> (4AM vibes? Weekend warrior?)</span>
                </p>
                <p className="text-sm md:text-base text-gray-300 flex items-start gap-2">
                  <span className="text-green-400 font-bold flex-shrink-0">✓</span>
                  <span><strong className="text-white">Emotional regulation</strong> (comfort vs. chaos)</span>
                </p>
                <p className="text-sm md:text-base text-gray-300 flex items-start gap-2">
                  <span className="text-green-400 font-bold flex-shrink-0">✓</span>
                  <span><strong className="text-white">Attachment styles</strong> (loyalty vs. commitment issues)</span>
                </p>
                <p className="text-sm md:text-base text-gray-300 flex items-start gap-2">
                  <span className="text-green-400 font-bold flex-shrink-0">✓</span>
                  <span><strong className="text-white">Memory patterns</strong> (vault hunter tendencies)</span>
                </p>
              </div>
              <p className="text-xs md:text-sm text-gray-500 italic px-4">
                Based on music psychology research
              </p>
            </div>
          )}

          {/* Screen 3: AI Synthesis */}
          {loadingScreen === 2 && (
            <div className="animate-fadeIn">
              {/* Step Indicator */}
              <div className="text-sm text-gray-500 mb-4 font-semibold">Step 3 of 3</div>
              <div className="text-6xl mb-6 animate-pulse">✨</div>
              <h2 className="text-2xl md:text-3xl font-bold text-white mb-6 px-4">
                Generating your viral callouts...
              </h2>
              <p className="text-base md:text-lg text-gray-300 leading-relaxed mb-4 px-4">
                Claude AI is creating Instagram-worthy insights with:
              </p>
              <div className="text-left space-y-2 mb-6 text-sm md:text-base text-gray-300 px-4">
                <p>• <span className="text-pink-400 font-semibold">Specific tracks/artists</span> as receipts</p>
                <p>• <span className="text-purple-400 font-semibold">Real numbers</span> from your data</p>
                <p>• <span className="text-blue-400 font-semibold">Gen Z slang + psychology</span></p>
                <p>• <span className="text-green-400 font-semibold">Playful "diagnoses"</span> for fun</p>
              </div>
              <p className="text-yellow-300 font-semibold animate-pulse text-base md:text-lg px-4">
                Almost ready to roast you (lovingly)...
              </p>
              <p className="text-sm text-purple-400 mt-6 font-semibold px-4">
                ↓ Scroll down after loading to explore your full data breakdown
              </p>
            </div>
          )}

          {/* Navigation Controls: Arrows + Clickable Dots */}
          <div className="flex items-center justify-center gap-6 mt-8">
            {/* Previous Arrow */}
            <button
              onClick={() => setLoadingScreen(Math.max(0, loadingScreen - 1))}
              disabled={loadingScreen === 0}
              className={`text-2xl ${loadingScreen === 0 ? 'text-gray-700 cursor-not-allowed' : 'text-purple-400 hover:text-purple-300 cursor-pointer'}`}
              aria-label="Previous screen"
            >
              ←
            </button>

            {/* Clickable Progress Dots */}
            <div className="flex gap-2">
              <button
                onClick={() => setLoadingScreen(0)}
                className={`w-3 h-3 rounded-full transition-all cursor-pointer ${loadingScreen === 0 ? 'bg-purple-400 scale-125' : 'bg-gray-600 hover:bg-gray-500'}`}
                aria-label="Go to step 1"
              />
              <button
                onClick={() => setLoadingScreen(1)}
                className={`w-3 h-3 rounded-full transition-all cursor-pointer ${loadingScreen === 1 ? 'bg-purple-400 scale-125' : 'bg-gray-600 hover:bg-gray-500'}`}
                aria-label="Go to step 2"
              />
              <button
                onClick={() => setLoadingScreen(2)}
                className={`w-3 h-3 rounded-full transition-all cursor-pointer ${loadingScreen === 2 ? 'bg-purple-400 scale-125' : 'bg-gray-600 hover:bg-gray-500'}`}
                aria-label="Go to step 3"
              />
            </div>

            {/* Next Arrow */}
            <button
              onClick={() => setLoadingScreen(Math.min(2, loadingScreen + 1))}
              disabled={loadingScreen === 2}
              className={`text-2xl ${loadingScreen === 2 ? 'text-gray-700 cursor-not-allowed' : 'text-purple-400 hover:text-purple-300 cursor-pointer'}`}
              aria-label="Next screen"
            >
              →
            </button>
          </div>

          {/* Helper Text */}
          <p className="text-xs text-gray-600 mt-4">Use arrows or swipe to navigate • Auto-advancing while processing</p>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black p-8">
        <div className="max-w-md text-center">
          <div className="text-5xl mb-4">😵‍💫</div>
          <h2 className="text-2xl font-bold text-white mb-2">Oops! Synthesis Failed</h2>
          <p className="text-gray-400 mb-6">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-purple-600 hover:bg-purple-500 text-white font-semibold rounded-lg"
          >
            Try Again
          </button>
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
      {/* Hero Insight - Full Screen */}
      <section className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-900/40 via-black to-black px-4 md:px-8 py-12 md:py-20">
        <div className="max-w-6xl mx-auto w-full text-center">
          <div className="inline-block bg-green-500/10 border border-green-500/30 px-4 py-2 md:px-6 md:py-3 rounded-full text-xs md:text-sm text-green-400 mb-6 md:mb-8 backdrop-blur-sm">
            Your Listening DNA
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-6 md:mb-8 leading-tight px-4 md:px-8 break-words">
            {synthesis.heroInsight.headline}
          </h1>
          <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-gray-300 leading-relaxed max-w-4xl mx-auto px-4 md:px-8">
            {synthesis.heroInsight.subtext}
          </p>

          {/* Jump to Share Cards Button */}
          <div className="mt-8 md:mt-12 flex flex-col items-center gap-4">
            <button
              onClick={() => {
                const element = document.getElementById('share-cards');
                if (element) {
                  element.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
              }}
              className="px-6 md:px-8 py-3 md:py-4 bg-gradient-to-r from-pink-500 to-purple-500 text-white rounded-full
                         font-semibold text-base md:text-lg hover:opacity-90 transition-all
                         shadow-lg hover:shadow-xl hover:shadow-pink-500/30"
            >
              📲 Jump to Share Cards
            </button>
            <p className="text-gray-500 text-xs md:text-sm">
              or scroll to see your patterns ↓
            </p>
          </div>
        </div>
      </section>

      {/* Disclaimer Banner */}
      <DisclaimerBanner />

      {/* Pattern Cards */}
      {synthesis.patternCards.length > 0 && (
        <PatternCards cards={synthesis.patternCards} />
      )}

      {/* Listening DNA - 5 Dimensions */}
      <section className="py-12 md:py-20 px-4 md:px-8 bg-gradient-to-b from-black to-zinc-900">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold mb-3 md:mb-4 text-center px-2">Your Listening DNA</h2>
          <p className="text-sm md:text-base text-gray-400 text-center mb-8 md:mb-12 px-4">
            Five dimensions that define how you use music
          </p>

          <div className="grid md:grid-cols-2 gap-4 md:gap-10">
            {/* Temporal Pattern */}
            <div className="bg-zinc-900 border border-zinc-800 p-4 md:p-10 rounded-lg md:rounded-xl">
              <div className="flex items-center gap-2 md:gap-3 mb-3 md:mb-4">
                <span className="text-3xl md:text-4xl flex-shrink-0">⏰</span>
                <div className="min-w-0">
                  <p className="text-xs md:text-sm text-gray-500 uppercase tracking-wide">Temporal Pattern</p>
                  <h3 className="text-lg md:text-xl font-bold text-green-400 leading-tight break-words">
                    {synthesis.listeningDNA.temporalPattern.label}
                  </h3>
                </div>
              </div>
              <p className="text-sm md:text-base text-gray-300 leading-relaxed">
                {synthesis.listeningDNA.temporalPattern.evidence}
              </p>
              <p className="text-xs text-gray-500 mt-3 italic">
                Based on your last 50 recently played tracks
              </p>
            </div>

            {/* Emotional Strategy */}
            <div className="bg-zinc-900 border border-zinc-800 p-4 md:p-10 rounded-lg md:rounded-xl">
              <div className="flex items-center gap-2 md:gap-3 mb-3 md:mb-4">
                <span className="text-3xl md:text-4xl flex-shrink-0">💭</span>
                <div className="min-w-0">
                  <p className="text-xs md:text-sm text-gray-500 uppercase tracking-wide">Emotional Strategy</p>
                  <h3 className="text-lg md:text-xl font-bold text-blue-400 leading-tight break-words">
                    {synthesis.listeningDNA.emotionalStrategy.label}
                  </h3>
                </div>
              </div>
              <p className="text-sm md:text-base text-gray-300 leading-relaxed">
                {synthesis.listeningDNA.emotionalStrategy.evidence}
              </p>
            </div>

            {/* Discovery Mode */}
            <div className="bg-zinc-900 border border-zinc-800 p-4 md:p-10 rounded-lg md:rounded-xl">
              <div className="flex items-center gap-2 md:gap-3 mb-3 md:mb-4">
                <span className="text-3xl md:text-4xl flex-shrink-0">🔍</span>
                <div className="min-w-0">
                  <p className="text-xs md:text-sm text-gray-500 uppercase tracking-wide">Discovery Mode</p>
                  <h3 className="text-lg md:text-xl font-bold text-purple-400 leading-tight break-words">
                    {synthesis.listeningDNA.discoveryMode.label}
                  </h3>
                </div>
              </div>
              <p className="text-sm md:text-base text-gray-300 leading-relaxed">
                {synthesis.listeningDNA.discoveryMode.evidence}
              </p>
            </div>

            {/* Attachment Style */}
            <div className="bg-zinc-900 border border-zinc-800 p-4 md:p-10 rounded-lg md:rounded-xl">
              <div className="flex items-center gap-2 md:gap-3 mb-3 md:mb-4">
                <span className="text-3xl md:text-4xl flex-shrink-0">🎯</span>
                <div className="min-w-0">
                  <p className="text-xs md:text-sm text-gray-500 uppercase tracking-wide">Attachment Style</p>
                  <h3 className="text-lg md:text-xl font-bold text-orange-400 leading-tight break-words">
                    {synthesis.listeningDNA.attachmentStyle.label}
                  </h3>
                </div>
              </div>
              <p className="text-sm md:text-base text-gray-300 leading-relaxed">
                {synthesis.listeningDNA.attachmentStyle.evidence}
              </p>
            </div>

            {/* Genre Profile */}
            <div className="bg-zinc-900 border border-zinc-800 p-4 md:p-10 rounded-lg md:rounded-xl">
              <div className="flex items-center gap-2 md:gap-3 mb-3 md:mb-4">
                <span className="text-3xl md:text-4xl flex-shrink-0">🎵</span>
                <div className="min-w-0">
                  <p className="text-xs md:text-sm text-gray-500 uppercase tracking-wide">Genre Profile</p>
                  <h3 className="text-lg md:text-xl font-bold text-pink-400 leading-tight break-words">
                    {synthesis.listeningDNA.genreProfile.label}
                  </h3>
                </div>
              </div>
              <p className="text-sm md:text-base text-gray-300 leading-relaxed">
                {synthesis.listeningDNA.genreProfile.evidence}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Share CTA - Download Cards */}
      {shareableCards.length > 0 && (
        <section id="share-cards" className="py-20 px-8 bg-black scroll-mt-4">
          <div className="max-w-4xl mx-auto">
            <DownloadButton cards={shareableCards} />
          </div>
        </section>
      )}

      {/* Waitlist & Feedback CTA */}
      <section className="py-16 px-8 bg-gradient-to-b from-black to-zinc-950">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            What's Next?
          </h2>
          <p className="text-gray-400 mb-8 text-sm md:text-base">
            Unwrapped v2 is coming soon with unlimited analyses, more insights, and new features!
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {/* Waitlist Button */}
            <a
              href="https://forms.gle/djCs4NFUBnwFCLBr7"
              target="_blank"
              rel="noopener noreferrer"
              className="px-8 py-4 bg-gradient-to-r from-pink-500 to-purple-500 text-white font-semibold rounded-lg
                       hover:opacity-90 transition-all shadow-lg hover:shadow-pink-500/50 text-center"
            >
              🎉 Join the v2 Waitlist
            </a>

            {/* Feedback Button */}
            <a
              href="https://forms.gle/bo1K5tWekj2uPTow8"
              target="_blank"
              rel="noopener noreferrer"
              className="px-8 py-4 bg-zinc-800 text-white font-semibold rounded-lg
                       hover:bg-zinc-700 transition-all border border-zinc-700 text-center"
            >
              💬 Share Feedback
            </a>
          </div>
        </div>
      </section>
    </>
  );
}
