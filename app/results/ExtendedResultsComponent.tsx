'use client';

import { useEffect, useState } from 'react';
import { buildSourceOfTruth } from '@/lib/v2/sourceOfTruth';
import { detectExplorer } from '@/lib/v2/detectors/behavioral/explorer';
import { detectLoyalist } from '@/lib/v2/detectors/behavioral/loyalist';
import { detectSkipVelocity } from '@/lib/v2/detectors/behavioral/skipVelocity';
import { detectSearcher } from '@/lib/v2/detectors/behavioral/searcher';
import { detectLooper } from '@/lib/v2/detectors/behavioral/looper';
import { detectCompletionLoyalist } from '@/lib/v2/detectors/behavioral/completionLoyalist';
import { detectLifeEvent } from '@/lib/v2/detectors/temporal/lifeEvent';
import { detectRitual } from '@/lib/v2/detectors/temporal/ritual';
import { detectGhostTimeline } from '@/lib/v2/detectors/temporal/ghostTimeline';
import { V2SynthesisClient } from '@/components/v2/V2SynthesisClient';

type DetectionResult = {
  patternId: string;
  patternName: string;
  patternFamily: string;
  confidence: number;
  distinctiveness: number;
  evidence: any[];
  psychologicalBasis: string;
};

interface ExtendedResultsComponentProps {
  uploadedData: any[];
}

export default function ExtendedResultsComponent({ uploadedData }: ExtendedResultsComponentProps) {
  const [status, setStatus] = useState<'loading' | 'analyzing' | 'complete' | 'error'>('loading');
  const [patterns, setPatterns] = useState<DetectionResult[]>([]);
  const [stats, setStats] = useState({
    totalPlays: 0,
    uniqueTracks: 0,
    uniqueArtists: 0,
    dateRange: '',
  });
  const [error, setError] = useState('');
  const [sourceOfTruth, setSourceOfTruth] = useState<any>(null); // Store SOT for V2.5
  const [loadingScreen, setLoadingScreen] = useState(0); // 0, 1, 2 for 3-screen experience

  // Manual navigation helpers
  const goToPrevScreen = () => setLoadingScreen(prev => Math.max(0, prev - 1));
  const goToNextScreen = () => setLoadingScreen(prev => Math.min(2, prev + 1));

  useEffect(() => {
    const analyze = async () => {
      try {
        if (!Array.isArray(uploadedData) || uploadedData.length === 0) {
          setError('Invalid data format');
          setStatus('error');
          return;
        }

        // Allow loading screen to render before heavy computation
        await new Promise(resolve => setTimeout(resolve, 100));

        // Build SourceOfTruth
        setStatus('analyzing');
        const sot = buildSourceOfTruth(uploadedData);

        // Store for V2.5
        setSourceOfTruth(sot);

        // Calculate stats
        const timestamps = uploadedData
          .map((p: any) => new Date(p.timestamp || p.ts || p.endTime))
          .filter((d: Date) => !isNaN(d.getTime()))
          .sort((a: Date, b: Date) => a.getTime() - b.getTime());

        const firstDate = timestamps[0];
        const lastDate = timestamps[timestamps.length - 1];

        setStats({
          totalPlays: sot.meta.totalPlays,
          uniqueTracks: sot.tracks.size,
          uniqueArtists: sot.artists.size,
          dateRange: firstDate && lastDate
            ? `${firstDate.toLocaleDateString()} - ${lastDate.toLocaleDateString()}`
            : 'Unknown date range',
        });

        // Run all 9 V2 detectors
        console.log('[V2 Detectors] Running all detectors...');
        const explorerResults = detectExplorer(sot, 10);
        const loyalistResults = detectLoyalist(sot, 10);
        const skipVelocityResults = detectSkipVelocity(sot, 10);
        const searcherResults = detectSearcher(sot, 10);
        const looperResults = detectLooper(sot, 10);
        const completionLoyalistResults = detectCompletionLoyalist(sot, 10);
        const lifeEventResults = detectLifeEvent(sot, 10);
        const ritualResults = detectRitual(sot, 10);
        const ghostTimelineResults = detectGhostTimeline(sot, 10);

        console.log('[V2 Detectors] Results:');
        console.log(`  Explorer: ${explorerResults.length}`);
        console.log(`  Loyalist: ${loyalistResults.length}`);
        console.log(`  Skip Velocity: ${skipVelocityResults.length}`);
        console.log(`  Searcher: ${searcherResults.length}`);
        console.log(`  Looper: ${looperResults.length}`);
        console.log(`  Completion Loyalist: ${completionLoyalistResults.length}`);
        console.log(`  Life Event: ${lifeEventResults.length}`);
        console.log(`  Ritual: ${ritualResults.length}`);
        console.log(`  Ghost Timeline: ${ghostTimelineResults.length}`);

        const allPatterns: DetectionResult[] = [
          ...explorerResults,
          ...loyalistResults,
          ...skipVelocityResults,
          ...searcherResults,
          ...looperResults,
          ...completionLoyalistResults,
          ...lifeEventResults,
          ...ritualResults,
          ...ghostTimelineResults,
        ];

        // Map V2 pattern families to V1 psychological dimensions for UI consistency
        const patternsWithDimensions = allPatterns.map(p => ({
          ...p,
          psychologicalDimension: mapFamilyToDimension(p.patternFamily),
          category: p.patternFamily,
        }));

        // Sort by confidence * distinctiveness
        patternsWithDimensions.sort((a, b) => {
          const scoreA = a.confidence * a.distinctiveness;
          const scoreB = b.confidence * b.distinctiveness;
          return scoreB - scoreA;
        });

        console.log('[V2 Detectors] Top 10 patterns by score:');
        patternsWithDimensions.slice(0, 10).forEach((p, i) => {
          console.log(`  ${i + 1}. [${p.patternFamily}] ${p.patternName} - confidence: ${p.confidence.toFixed(2)}, distinctiveness: ${p.distinctiveness.toFixed(2)}, score: ${(p.confidence * p.distinctiveness).toFixed(3)}`);
        });

        setPatterns(patternsWithDimensions);
        setStatus('complete');
      } catch (err) {
        console.error('Analysis error:', err);
        setError(err instanceof Error ? err.message : 'Failed to analyze data');
        setStatus('error');
      }
    };

    analyze();
  }, [uploadedData]);

  // Map V2 pattern families to V1 psychological dimensions
  function mapFamilyToDimension(family: string): string {
    const mapping: Record<string, string> = {
      'diversity': 'discovery and exploration',
      'loyalty_retention': 'identity and attachment',
      'engagement': 'attention and persistence',
      'repetition': 'ritual and repetition',
      'evolution': 'temporal patterns',
      'temporal': 'temporal patterns',
      'loyalty_dropoff': 'memory and avoidance',
    };
    return mapping[family] || 'cognitive patterns';
  }

  if (status === 'loading' || status === 'analyzing') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900/20 via-black to-black text-white">
        {/* Progress Bar */}
        <div className="fixed top-0 left-0 right-0 z-50 bg-zinc-900/80 backdrop-blur-sm">
          <div className="h-1 bg-purple-600/30">
            <div
              className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-1000 ease-out"
              style={{ width: `${((loadingScreen + 1) / 3) * 100}%` }}
            />
          </div>
        </div>

        <div className="flex flex-col items-center justify-center min-h-screen px-6 py-16">
          <div className="max-w-2xl w-full text-center">

            {/* Screen 1: What We're Looking For */}
            {loadingScreen === 0 && (
              <div className="animate-fadeIn">
                <div className="text-xs uppercase tracking-widest text-gray-500 mb-6">Step 1 of 3</div>
                <div className="text-6xl mb-6 animate-pulse">🔍</div>
                <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
                  Analyzing your listening DNA
                </h2>
                <p className="text-gray-400 mb-8 max-w-md mx-auto">
                  We're looking at <span className="text-purple-400">how</span> you listen, not just <span className="text-pink-400">what</span> you listen to.
                </p>

                <div className="space-y-3 text-left max-w-sm mx-auto text-sm">
                  <div className="flex items-start gap-3 text-gray-300">
                    <span className="text-green-400 mt-0.5">✓</span>
                    <span>Songs you replay vs. skip after 30 seconds</span>
                  </div>
                  <div className="flex items-start gap-3 text-gray-300">
                    <span className="text-green-400 mt-0.5">✓</span>
                    <span>Whether you listen more at 2am or 2pm</span>
                  </div>
                  <div className="flex items-start gap-3 text-gray-300">
                    <span className="text-green-400 mt-0.5">✓</span>
                    <span>Artists you've stayed loyal to for years</span>
                  </div>
                  <div className="flex items-start gap-3 text-gray-300">
                    <span className="text-green-400 mt-0.5">✓</span>
                    <span>How often you discover new music</span>
                  </div>
                </div>
              </div>
            )}

            {/* Screen 2: Your 4-Letter Type */}
            {loadingScreen === 1 && (
              <div className="animate-fadeIn">
                <div className="text-xs uppercase tracking-widest text-gray-500 mb-6">Step 2 of 3</div>
                <div className="text-6xl mb-6 animate-pulse">🧬</div>
                <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
                  You'll get a 4-letter Music Type
                </h2>
                <p className="text-gray-400 mb-8 max-w-md mx-auto">
                  Like a personality type, but for how you experience music.
                </p>

                <div className="grid grid-cols-2 gap-3 max-w-sm mx-auto text-left">
                  <div className="bg-zinc-900/50 border border-purple-500/30 rounded-lg p-3">
                    <div className="text-purple-400 font-bold mb-1">D or N</div>
                    <div className="text-xs text-gray-400">Diurnal vs Nocturnal</div>
                  </div>
                  <div className="bg-zinc-900/50 border border-blue-500/30 rounded-lg p-3">
                    <div className="text-blue-400 font-bold mb-1">S or L</div>
                    <div className="text-xs text-gray-400">Skimmer vs Looper</div>
                  </div>
                  <div className="bg-zinc-900/50 border border-green-500/30 rounded-lg p-3">
                    <div className="text-green-400 font-bold mb-1">R or E</div>
                    <div className="text-xs text-gray-400">Rooted vs Explorer</div>
                  </div>
                  <div className="bg-zinc-900/50 border border-orange-500/30 rounded-lg p-3">
                    <div className="text-orange-400 font-bold mb-1">F or A</div>
                    <div className="text-xs text-gray-400">Fluid vs Anchored</div>
                  </div>
                </div>
              </div>
            )}

            {/* Screen 3: Almost Ready */}
            {loadingScreen === 2 && (
              <div className="animate-fadeIn">
                <div className="text-xs uppercase tracking-widest text-gray-500 mb-6">Step 3 of 3</div>
                <div className="text-6xl mb-6 animate-pulse">✨</div>
                <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
                  Almost there...
                </h2>
                <p className="text-gray-400 mb-8 max-w-md mx-auto">
                  Creating your shareable results card and personalized insights.
                </p>

                <div className="space-y-3 text-sm text-gray-400 max-w-sm mx-auto">
                  <div className="flex items-center gap-3">
                    <span className="text-green-400">🔒</span>
                    <span>100% private — everything runs in your browser</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-purple-400">📱</span>
                    <span>Share your type with friends when you're done</span>
                  </div>
                </div>

                <div className="mt-8 flex justify-center gap-1">
                  <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            )}

            {/* Navigation Arrows + Dots */}
            <div className="flex items-center justify-center gap-4 mt-10">
              {/* Left Arrow */}
              <button
                onClick={goToPrevScreen}
                disabled={loadingScreen === 0}
                className={`p-2 rounded-full transition-all ${
                  loadingScreen === 0
                    ? 'text-zinc-700 cursor-not-allowed'
                    : 'text-gray-400 hover:text-white hover:bg-zinc-800'
                }`}
                aria-label="Previous"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>

              {/* Progress Dots */}
              <div className="flex gap-2">
                {[0, 1, 2].map((screen) => (
                  <button
                    key={screen}
                    onClick={() => setLoadingScreen(screen)}
                    className={`h-2 rounded-full transition-all duration-300 ${
                      loadingScreen === screen
                        ? 'w-8 bg-purple-500'
                        : 'w-2 bg-zinc-700 hover:bg-zinc-600'
                    }`}
                    aria-label={`Go to screen ${screen + 1}`}
                  />
                ))}
              </div>

              {/* Right Arrow */}
              <button
                onClick={goToNextScreen}
                disabled={loadingScreen === 2}
                className={`p-2 rounded-full transition-all ${
                  loadingScreen === 2
                    ? 'text-zinc-700 cursor-not-allowed'
                    : 'text-gray-400 hover:text-white hover:bg-zinc-800'
                }`}
                aria-label="Next"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="max-w-2xl mx-auto text-center p-8">
          <div className="text-6xl mb-4">❌</div>
          <h2 className="text-3xl font-bold mb-4 text-red-400">Analysis Failed</h2>
          <p className="text-gray-400 mb-8">{error}</p>
          <button
            onClick={() => window.location.href = '/'}
            className="px-6 py-3 bg-zinc-700 hover:bg-zinc-600 rounded-lg transition-colors"
          >
            ← Back to Upload
          </button>
        </div>
      </div>
    );
  }

  // Pass patterns to V2 synthesis for narrative generation
  if (patterns.length === 0) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="max-w-2xl mx-auto text-center p-8">
          <div className="text-6xl mb-4">🔍</div>
          <h2 className="text-3xl font-bold mb-4">Need More Data</h2>
          <p className="text-gray-400 mb-8">
            Not enough listening history to find patterns. Try uploading more files.
          </p>
          <button
            onClick={() => window.location.href = '/'}
            className="px-6 py-3 bg-zinc-700 hover:bg-zinc-600 rounded-lg transition-colors"
          >
            ← Back to Upload
          </button>
        </div>
      </div>
    );
  }

  return <V2SynthesisClient detectedPatterns={patterns} stats={stats} uploadedData={uploadedData} sourceOfTruth={sourceOfTruth} />;
}
