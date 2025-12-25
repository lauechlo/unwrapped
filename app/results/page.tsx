/**
 * Results Page - V3 Viral Labels
 * Displays user analysis with viral, screenshot-worthy insights
 */

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { fetchUserData } from '@/lib/spotify';
import { runAllDetectors, type UserListeningData } from '@/lib/detectors';
import { synthesizeInsights } from '@/lib/synthesis/synthesize-viral';
import type { SynthesisOutput } from '@/lib/synthesis/types';

export default async function ResultsPage() {
  // Check authentication
  const cookieStore = await cookies();
  const accessToken = cookieStore.get('spotify_access_token')?.value;

  if (!accessToken) {
    redirect('/?error=not_authenticated');
  }

  // Fetch Spotify data
  let userData;
  try {
    console.log('[Results] Fetching Spotify data...');
    userData = await fetchUserData(accessToken);
  } catch (error) {
    console.error('[Results] Error fetching data:', error);
    redirect('/?error=fetch_failed');
  }

  // Run pattern detection
  let detectedPatterns;
  try {
    console.log('[Results] Running pattern detection...');
    const listeningData: UserListeningData = userData as UserListeningData;
    detectedPatterns = await runAllDetectors(listeningData);
    console.log(`[Results] Detected ${detectedPatterns.length} patterns`);
  } catch (error) {
    console.error('[Results] Pattern detection error:', error);
    detectedPatterns = [];
  }

  // Generate viral synthesis
  let synthesis: SynthesisOutput | null = null;
  const ENABLE_SYNTHESIS = true; // Enable viral synthesis

  if (detectedPatterns.length > 0 && ENABLE_SYNTHESIS) {
    try {
      console.log('[Results] Generating viral synthesis...');
      synthesis = await synthesizeInsights(detectedPatterns);
      console.log('[Results] Synthesis complete:', synthesis.heroInsight.headline);
    } catch (error) {
      console.error('[Results] Synthesis error:', error);
    }
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Hero Insight - Full Screen */}
      {synthesis && (
        <section className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-900/40 via-black to-black p-8">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-block bg-green-500/10 border border-green-500/30 px-6 py-3 rounded-full text-sm text-green-400 mb-8 backdrop-blur-sm">
              Your Listening DNA
            </div>
            <h1 className="text-6xl md:text-7xl font-bold mb-8 leading-tight">
              {synthesis.heroInsight.headline}
            </h1>
            <p className="text-2xl md:text-3xl text-gray-300 leading-relaxed max-w-3xl mx-auto">
              {synthesis.heroInsight.subtext}
            </p>
            <div className="mt-12 text-gray-500 text-sm">
              Scroll to see your patterns ↓
            </div>
          </div>
        </section>
      )}

      {/* Pattern Cards - Viral Labels */}
      {synthesis && synthesis.patternCards.length > 0 && (
        <section className="py-20 px-8 bg-black">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-4xl font-bold mb-12 text-center">Your Listening Patterns</h2>

            <div className="grid gap-8">
              {synthesis.patternCards.map((card, idx) => (
                <div
                  key={idx}
                  className="bg-gradient-to-br from-zinc-900 to-black border-2 border-zinc-800 p-8 rounded-2xl hover:border-green-500/30 transition-all"
                >
                  {/* Pattern Label - Viral */}
                  <div className="mb-6">
                    <div className="inline-block bg-green-500/10 border border-green-500/30 px-4 py-2 rounded-full text-xs text-green-400 mb-4">
                      {Math.round(card.confidence * 100)}% confidence
                    </div>
                    <h3 className="text-3xl font-bold text-white mb-4">
                      {card.patternLabel}
                    </h3>
                  </div>

                  {/* Evidence Tree */}
                  <div className="space-y-3 mb-6 pl-4 border-l-2 border-zinc-700">
                    <div className="flex items-start gap-3">
                      <span className="text-green-400 text-sm font-mono">├─ CORE:</span>
                      <p className="text-gray-300 text-lg">{card.core}</p>
                    </div>
                    <div className="flex items-start gap-3">
                      <span className="text-blue-400 text-sm font-mono">├─ SUPPORTING:</span>
                      <p className="text-gray-300 text-lg">{card.supporting}</p>
                    </div>
                    <div className="flex items-start gap-3">
                      <span className="text-purple-400 text-sm font-mono">└─ BEHAVIOR:</span>
                      <p className="text-gray-300 text-lg">{card.behavior}</p>
                    </div>
                  </div>

                  {/* Callout - Gen Z language */}
                  <div className="bg-zinc-950/50 border border-zinc-800 p-6 rounded-xl">
                    <p className="text-xl italic text-gray-400">
                      {card.callout}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Listening DNA - 4 Dimensions */}
      {synthesis && (
        <section className="py-20 px-8 bg-gradient-to-b from-black to-zinc-900">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-4xl font-bold mb-4 text-center">Your Listening DNA</h2>
            <p className="text-gray-400 text-center mb-12">
              Four dimensions that define how you use music
            </p>

            <div className="grid md:grid-cols-2 gap-8">
              {/* Temporal Pattern */}
              <div className="bg-zinc-900 border border-zinc-800 p-8 rounded-xl">
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-4xl">⏰</span>
                  <div>
                    <p className="text-sm text-gray-500 uppercase tracking-wide">Temporal Pattern</p>
                    <h3 className="text-2xl font-bold text-green-400">
                      {synthesis.listeningDNA.temporalPattern.label}
                    </h3>
                  </div>
                </div>
                <p className="text-gray-300 text-lg">
                  {synthesis.listeningDNA.temporalPattern.evidence}
                </p>
              </div>

              {/* Emotional Strategy */}
              <div className="bg-zinc-900 border border-zinc-800 p-8 rounded-xl">
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-4xl">💭</span>
                  <div>
                    <p className="text-sm text-gray-500 uppercase tracking-wide">Emotional Strategy</p>
                    <h3 className="text-2xl font-bold text-blue-400">
                      {synthesis.listeningDNA.emotionalStrategy.label}
                    </h3>
                  </div>
                </div>
                <p className="text-gray-300 text-lg">
                  {synthesis.listeningDNA.emotionalStrategy.evidence}
                </p>
              </div>

              {/* Discovery Mode */}
              <div className="bg-zinc-900 border border-zinc-800 p-8 rounded-xl">
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-4xl">🔍</span>
                  <div>
                    <p className="text-sm text-gray-500 uppercase tracking-wide">Discovery Mode</p>
                    <h3 className="text-2xl font-bold text-purple-400">
                      {synthesis.listeningDNA.discoveryMode.label}
                    </h3>
                  </div>
                </div>
                <p className="text-gray-300 text-lg">
                  {synthesis.listeningDNA.discoveryMode.evidence}
                </p>
              </div>

              {/* Attachment Style */}
              <div className="bg-zinc-900 border border-zinc-800 p-8 rounded-xl">
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-4xl">🎯</span>
                  <div>
                    <p className="text-sm text-gray-500 uppercase tracking-wide">Attachment Style</p>
                    <h3 className="text-2xl font-bold text-orange-400">
                      {synthesis.listeningDNA.attachmentStyle.label}
                    </h3>
                  </div>
                </div>
                <p className="text-gray-300 text-lg">
                  {synthesis.listeningDNA.attachmentStyle.evidence}
                </p>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* No synthesis fallback */}
      {!synthesis && detectedPatterns.length > 0 && (
        <section className="min-h-screen flex items-center justify-center p-8">
          <div className="max-w-2xl mx-auto text-center">
            <h1 className="text-5xl font-bold mb-8">
              We found {detectedPatterns.length} patterns in your listening
            </h1>
            <p className="text-xl text-gray-400 mb-8">
              But synthesis is currently disabled. Enable ENABLE_SYNTHESIS in the code to see viral insights.
            </p>
          </div>
        </section>
      )}

      {/* No patterns detected */}
      {detectedPatterns.length === 0 && (
        <section className="min-h-screen flex items-center justify-center p-8">
          <div className="max-w-2xl mx-auto text-center">
            <h1 className="text-5xl font-bold mb-8">Not enough data yet</h1>
            <p className="text-xl text-gray-400">
              Keep listening to Spotify and come back later for your personalized insights!
            </p>
          </div>
        </section>
      )}

      {/* Share CTA */}
      {synthesis && (
        <section className="py-20 px-8 bg-black">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-4xl font-bold mb-6">Share Your Unwrapped</h2>
            <p className="text-xl text-gray-400 mb-8">
              Screenshot your favorite patterns and share them on Instagram Stories
            </p>
            <button className="bg-gradient-to-r from-green-500 to-blue-500 text-white px-8 py-4 rounded-full text-lg font-semibold hover:opacity-90 transition-opacity">
              Download as Image
            </button>
          </div>
        </section>
      )}

      {/* Debug section (collapsible) */}
      <section className="py-12 px-8 bg-zinc-950">
        <div className="max-w-6xl mx-auto">
          <details className="cursor-pointer">
            <summary className="text-2xl font-semibold mb-4 text-gray-400 hover:text-white transition-colors">
              🔍 Debug Info (Click to Expand)
            </summary>

            <div className="mt-6 space-y-4">
              <div className="bg-zinc-900 p-6 rounded-lg">
                <h3 className="text-lg font-semibold mb-2 text-green-400">Patterns Detected: {detectedPatterns.length}</h3>
                <div className="grid md:grid-cols-3 gap-2 text-sm">
                  {detectedPatterns.map((p, i) => (
                    <div key={i} className="bg-zinc-800 p-2 rounded">
                      {p.patternName} ({Math.round(p.confidence * 100)}%)
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-zinc-900 p-6 rounded-lg">
                <h3 className="text-lg font-semibold mb-2 text-blue-400">Top Tracks (4 weeks)</h3>
                <div className="space-y-1 text-sm">
                  {userData.topTracks.short.slice(0, 5).map((track: any, i: number) => (
                    <div key={i} className="text-gray-400">
                      {i + 1}. {track.name} - {track.artists[0].name}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </details>
        </div>
      </section>
    </div>
  );
}
