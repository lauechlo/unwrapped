/**
 * Results Page - V3 Viral Labels
 * Displays user analysis with viral, screenshot-worthy insights
 */

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { fetchUserData } from '@/lib/spotify';
import { runAllDetectors, type UserListeningData } from '@/lib/detectors';
import { UsageTracker } from '@/components/UsageTracker';
import { DataBreakdown } from '@/components/DataBreakdown';
import { SynthesisClient } from '@/components/SynthesisClient';

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
  let detectedPatterns: Awaited<ReturnType<typeof runAllDetectors>> = [];
  try {
    console.log('[Results] Running pattern detection...');
    const listeningData: UserListeningData = userData as UserListeningData;
    detectedPatterns = await runAllDetectors(listeningData);
    console.log(`[Results] Detected ${detectedPatterns.length} patterns`);
  } catch (error) {
    console.error('[Results] Pattern detection error:', error);
    detectedPatterns = [];
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Track usage */}
      <UsageTracker />

      {/* Synthesis with client-side caching */}
      {detectedPatterns.length > 0 ? (
        <SynthesisClient detectedPatterns={detectedPatterns} />
      ) : (
        <section className="min-h-screen flex items-center justify-center p-8">
          <div className="max-w-2xl mx-auto text-center">
            <h1 className="text-5xl font-bold mb-8">Not enough data yet</h1>
            <p className="text-xl text-gray-400">
              Keep listening to Spotify and come back later for your personalized insights!
            </p>
          </div>
        </section>
      )}

      {/* Data Breakdown - Clean view of all analyzed data */}
      <DataBreakdown
        detectedPatterns={detectedPatterns}
        topTracks={userData.topTracks}
        topArtists={userData.topArtists}
      />

      {/* Debug section - Hidden for production */}
      {/* Uncomment for debugging: */}
      {/* <section className="py-12 px-8 bg-zinc-950">
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
      </section> */}
    </div>
  );
}
