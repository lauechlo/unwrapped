/**
 * Results page - displays user analysis
 * Fetches and displays Spotify data with pattern detection
 */

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { fetchUserData } from '@/lib/spotify';
import { runAllDetectors, type UserListeningData, type DetectionResult } from '@/lib/detectors';

export default async function ResultsPage() {
  // Check if we have a valid access token in cookies
  const cookieStore = await cookies();
  const accessToken = cookieStore.get('spotify_access_token')?.value;

  if (!accessToken) {
    redirect('/?error=not_authenticated');
  }

  // Fetch user's Spotify data
  let userData;
  try {
    console.log('[Results Page] Fetching Spotify data...');
    userData = await fetchUserData(accessToken);
    console.log('[Results Page] Data fetched successfully');
  } catch (error) {
    console.error('[Results Page] Error fetching data:', error);
    redirect('/?error=fetch_failed');
  }

  // Run pattern detection
  let detectedPatterns: DetectionResult[];
  try {
    console.log('[Results Page] Running pattern detection...');

    // Analyze data coverage
    if (userData.recentlyPlayed.length > 0) {
      const oldestPlay = new Date(userData.recentlyPlayed[userData.recentlyPlayed.length - 1].played_at);
      const newestPlay = new Date(userData.recentlyPlayed[0].played_at);
      const daysCovered = (newestPlay.getTime() - oldestPlay.getTime()) / (1000 * 60 * 60 * 24);

      console.log('[Data Coverage] Recent plays:', userData.recentlyPlayed.length);
      console.log('[Data Coverage] Time span:', daysCovered.toFixed(1), 'days');
      console.log('[Data Coverage] Oldest:', oldestPlay.toLocaleString());
      console.log('[Data Coverage] Newest:', newestPlay.toLocaleString());

      // Count track frequencies
      const trackCounts = new Map<string, { name: string; count: number }>();
      userData.recentlyPlayed.forEach(play => {
        const existing = trackCounts.get(play.track.id);
        if (existing) {
          existing.count++;
        } else {
          trackCounts.set(play.track.id, { name: play.track.name, count: 1 });
        }
      });

      const topRepeated = Array.from(trackCounts.values())
        .sort((a, b) => b.count - a.count)
        .slice(0, 3);

      console.log('[Data Coverage] Most played tracks in recent plays:');
      topRepeated.forEach(t => console.log(`  - "${t.name}": ${t.count} plays`));
    }

    // Check top tracks for better repetition detection
    console.log('[Data Coverage] Top tracks (last 4 weeks):');
    userData.topTracks.short.slice(0, 5).forEach((track, i) =>
      console.log(`  ${i + 1}. "${track.name}" by ${track.artists[0].name}`)
    );

    // Validate Looper detection by checking persistence
    const topTrack = userData.topTracks.short[0];
    if (topTrack) {
      console.log(`\n[Looper Validation] Checking "${topTrack.name}" persistence:`);

      // Check medium-term (6 months)
      const mediumIndex = userData.topTracks.medium.findIndex(t => t.id === topTrack.id);
      if (mediumIndex !== -1) {
        console.log(`  ✓ Found at #${mediumIndex + 1} in 6-month top tracks`);
      } else {
        console.log(`  ✗ NOT in 6-month top 50`);
      }

      // Check long-term (all-time)
      const longIndex = userData.topTracks.long.findIndex(t => t.id === topTrack.id);
      if (longIndex !== -1) {
        console.log(`  ✓ Found at #${longIndex + 1} in all-time top tracks`);
      } else {
        console.log(`  ✗ NOT in all-time top 50`);
      }

      // Calculate expected confidence
      let expectedConfidence = 0.9; // Rank 1 base
      if (mediumIndex !== -1 && mediumIndex < 10) expectedConfidence = Math.min(expectedConfidence + 0.2, 1.0);
      if (longIndex !== -1 && longIndex < 10) expectedConfidence = Math.min(expectedConfidence + 0.2, 1.0);
      console.log(`  Expected confidence: ${expectedConfidence.toFixed(2)}`);
    }

    // UserData now matches UserListeningData format
    const listeningData: UserListeningData = userData as UserListeningData;

    detectedPatterns = await runAllDetectors(listeningData);
    console.log('[Results Page] Detected', detectedPatterns.length, 'patterns');
  } catch (error) {
    console.error('[Results Page] Pattern detection error:', error);
    // Continue without patterns rather than failing completely
    detectedPatterns = [];
  }

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-5xl font-bold mb-8">Your Unwrapped</h1>

        {/* Data Sources Info */}
        <section className="mb-12 bg-zinc-900 border border-zinc-800 p-6 rounded-lg">
          <h2 className="text-2xl font-semibold mb-4">Data Sources</h2>
          <p className="text-gray-300 mb-4">
            All analysis is based on your personal Spotify listening data. We fetch:
          </p>
          <div className="grid md:grid-cols-3 gap-4 text-sm">
            <div className="bg-zinc-800 p-4 rounded">
              <p className="font-semibold text-green-400 mb-2">Top Tracks</p>
              <p className="text-gray-400 mb-2">50 tracks across 3 time ranges:</p>
              <ul className="text-gray-400 space-y-1 ml-4">
                <li>• Last 4 weeks (short_term)</li>
                <li>• Last 6 months (medium_term)</li>
                <li>• All time (long_term)</li>
              </ul>
            </div>
            <div className="bg-zinc-800 p-4 rounded">
              <p className="font-semibold text-blue-400 mb-2">Top Artists</p>
              <p className="text-gray-400 mb-2">50 artists across 3 time ranges:</p>
              <ul className="text-gray-400 space-y-1 ml-4">
                <li>• Last 4 weeks (short_term)</li>
                <li>• Last 6 months (medium_term)</li>
                <li>• All time (long_term)</li>
              </ul>
            </div>
            <div className="bg-zinc-800 p-4 rounded">
              <p className="font-semibold text-purple-400 mb-2">Recent History</p>
              <p className="text-gray-400 mb-2">Last 50 played tracks:</p>
              <ul className="text-gray-400 space-y-1 ml-4">
                <li>• Typically ~2-3 days</li>
                <li>• Used for temporal patterns</li>
                <li>• Exact play timestamps</li>
              </ul>
              <p className="text-xs text-red-400 mt-2">
                Note: Audio features (energy, valence, tempo) deprecated by Spotify Nov 2024
              </p>
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-4">
            Data is fetched directly from Spotify Web API endpoints. No listening history is stored on our servers.
          </p>
        </section>

        {/* Quick Reference for Validation */}
        <section className="mb-12 bg-zinc-900 border border-zinc-700 p-6 rounded-lg">
          <h2 className="text-2xl font-semibold mb-4 text-yellow-400">Quick Reference - Validation Helper</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {/* Artists with multiple tracks in top 10 */}
            <div>
              <h3 className="text-lg font-semibold mb-3 text-green-400">Artists in Your Top 10 (Last 4 Weeks)</h3>
              {(() => {
                const artistCounts = new Map<string, { name: string; count: number; tracks: string[] }>();
                userData.topTracks.short.slice(0, 10).forEach(track => {
                  const artist = track.artists[0];
                  const existing = artistCounts.get(artist.id);
                  if (existing) {
                    existing.count++;
                    existing.tracks.push(track.name);
                  } else {
                    artistCounts.set(artist.id, { name: artist.name, count: 1, tracks: [track.name] });
                  }
                });
                const sorted = Array.from(artistCounts.values()).sort((a, b) => b.count - a.count);
                return (
                  <div className="space-y-2">
                    {sorted.map((artist, idx) => (
                      <div key={idx} className="text-sm bg-zinc-800 p-3 rounded">
                        <p className="font-semibold">{artist.name}: {artist.count} tracks</p>
                        <p className="text-xs text-gray-400 mt-1">{artist.tracks.join(', ')}</p>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>

            {/* Artist presence across time ranges */}
            <div>
              <h3 className="text-lg font-semibold mb-3 text-blue-400">Artist History (Top 10 Artists)</h3>
              {(() => {
                const top10Artists = userData.topArtists.short.slice(0, 10);
                return (
                  <div className="space-y-2">
                    {top10Artists.map((artist, idx) => {
                      const inMedium = userData.topArtists.medium.some(a => a.id === artist.id);
                      const inLong = userData.topArtists.long.some(a => a.id === artist.id);
                      return (
                        <div key={artist.id} className="text-sm bg-zinc-800 p-3 rounded">
                          <p className="font-semibold">{idx + 1}. {artist.name}</p>
                          <div className="flex gap-2 mt-1 text-xs">
                            <span className="text-green-400">✓ 4wk</span>
                            {inMedium ? <span className="text-blue-400">✓ 6mo</span> : <span className="text-gray-600">✗ 6mo</span>}
                            {inLong ? <span className="text-purple-400">✓ all-time</span> : <span className="text-gray-600">✗ all-time</span>}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </div>
          </div>
        </section>

        {/* Data Validation & Debug Section */}
        <section className="mb-12 bg-zinc-900 border border-yellow-600 p-6 rounded-lg">
          <details className="cursor-pointer">
            <summary className="text-2xl font-semibold mb-4 text-yellow-400">
              🔍 Data Validation & Debug Console (Click to Expand)
            </summary>

            <div className="mt-6 space-y-6">
              {/* Data Coverage Metrics */}
              <div className="bg-zinc-800 p-4 rounded-lg">
                <h3 className="text-lg font-semibold mb-3 text-green-400">📊 Data Coverage & Quality</h3>
                {(() => {
                  const oldestPlay = userData.recentlyPlayed.length > 0
                    ? new Date(userData.recentlyPlayed[userData.recentlyPlayed.length - 1].played_at)
                    : null;
                  const newestPlay = userData.recentlyPlayed.length > 0
                    ? new Date(userData.recentlyPlayed[0].played_at)
                    : null;
                  const daysCovered = oldestPlay && newestPlay
                    ? (newestPlay.getTime() - oldestPlay.getTime()) / (1000 * 60 * 60 * 24)
                    : 0;

                  return (
                    <div className="grid md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <p className="text-gray-400 mb-2">Recent Play History</p>
                        <p className="text-white font-semibold">{userData.recentlyPlayed.length} tracks</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {daysCovered.toFixed(1)} days covered
                        </p>
                        {oldestPlay && (
                          <p className="text-xs text-gray-500 mt-1">
                            {oldestPlay.toLocaleString()} → {newestPlay?.toLocaleString()}
                          </p>
                        )}
                      </div>
                      <div>
                        <p className="text-gray-400 mb-2">Top Tracks Data</p>
                        <p className="text-white font-semibold">
                          {userData.topTracks.short.length} / {userData.topTracks.medium.length} / {userData.topTracks.long.length}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">4wk / 6mo / all-time</p>
                      </div>
                      <div>
                        <p className="text-gray-400 mb-2">Top Artists Data</p>
                        <p className="text-white font-semibold">
                          {userData.topArtists.short.length} / {userData.topArtists.medium.length} / {userData.topArtists.long.length}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">4wk / 6mo / all-time</p>
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* Full Play History with Timestamps */}
              <div className="bg-zinc-800 p-4 rounded-lg max-h-96 overflow-y-auto">
                <h3 className="text-lg font-semibold mb-3 text-blue-400 sticky top-0 bg-zinc-800 pb-2">
                  ⏱️ Complete Play History (All {userData.recentlyPlayed.length} Tracks with Exact Timestamps)
                </h3>
                <div className="space-y-1 text-xs">
                  {userData.recentlyPlayed.map((play, idx) => {
                    const playTime = new Date(play.played_at);
                    const timeStr = playTime.toLocaleString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit',
                      hour12: true
                    });

                    // Calculate gap from previous play
                    let gap = '';
                    if (idx < userData.recentlyPlayed.length - 1) {
                      const prevTime = new Date(userData.recentlyPlayed[idx + 1].played_at);
                      const gapMinutes = (playTime.getTime() - prevTime.getTime()) / (1000 * 60);
                      if (gapMinutes < 1) {
                        gap = `(${Math.round(gapMinutes * 60)}s gap)`;
                      } else if (gapMinutes < 60) {
                        gap = `(${Math.round(gapMinutes)}m gap)`;
                      } else {
                        gap = `(${(gapMinutes / 60).toFixed(1)}h gap)`;
                      }
                    }

                    return (
                      <div key={idx} className={`p-2 rounded ${idx % 2 === 0 ? 'bg-zinc-900' : 'bg-zinc-800'}`}>
                        <span className="text-gray-500 mr-2">#{idx + 1}</span>
                        <span className="text-yellow-400 mr-2">{timeStr}</span>
                        <span className="text-white mr-2">{play.track.name}</span>
                        <span className="text-gray-400 mr-2">- {play.track.artists[0].name}</span>
                        {gap && <span className="text-purple-400">{gap}</span>}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Pattern Detection Status */}
              <div className="bg-zinc-800 p-4 rounded-lg">
                <h3 className="text-lg font-semibold mb-3 text-purple-400">🎯 Pattern Detection Status (All 30 Detectors)</h3>
                <div className="space-y-2 text-sm">
                  {(() => {
                    const allPatternNames = [
                      'Night Owl Processor', 'Early Bird Processor', 'Weekend Warrior', 'The Looper',
                      'Ghost Artist', 'Phase Shifter', 'The Loyalist', 'The Explorer', 'The Trendy',
                      'Time Capsule', 'Comfort Rotation', 'Album Devotee', 'Genre Purist', 'The Curator',
                      'One-Track Wonder', 'The 2AM Song', 'Emotional Bookender', 'The Binge Listener',
                      'Sunday Ritual', 'Coping Song', 'The Rediscovery', 'The Genre Hopper',
                      'The Day/Night Persona', 'The Momentum Builder', 'The Skip-Proof Track',
                      'The Transition Ritual', 'The Featured Artist Hunter', 'The First Verse Addict',
                      'The Perfectionist', 'The Late Bloomer'
                    ];

                    const detectedSet = new Set(detectedPatterns.map(p => p.patternName));

                    return (
                      <div className="grid md:grid-cols-2 gap-2">
                        {allPatternNames.map((name, idx) => {
                          const isDetected = detectedSet.has(name);
                          const pattern = detectedPatterns.find(p => p.patternName === name);

                          return (
                            <div
                              key={idx}
                              className={`p-2 rounded ${
                                isDetected ? 'bg-green-900/30 border border-green-700' : 'bg-zinc-900 border border-zinc-700'
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <span className={isDetected ? 'text-green-400 font-semibold' : 'text-gray-400'}>
                                  {isDetected ? '✓' : '✗'} {name}
                                </span>
                                {pattern && (
                                  <span className="text-xs text-green-300">
                                    {Math.round(pattern.confidence * 100)}%
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })()}
                </div>
              </div>

              {/* Track Frequency Analysis */}
              <div className="bg-zinc-800 p-4 rounded-lg">
                <h3 className="text-lg font-semibold mb-3 text-orange-400">🔁 Track Frequency in Recent Plays</h3>
                {(() => {
                  const trackCounts = new Map<string, { track: any; count: number; times: Date[] }>();
                  userData.recentlyPlayed.forEach(play => {
                    const existing = trackCounts.get(play.track.id);
                    if (existing) {
                      existing.count++;
                      existing.times.push(new Date(play.played_at));
                    } else {
                      trackCounts.set(play.track.id, {
                        track: play.track,
                        count: 1,
                        times: [new Date(play.played_at)]
                      });
                    }
                  });

                  const sorted = Array.from(trackCounts.values())
                    .sort((a, b) => b.count - a.count)
                    .slice(0, 10);

                  return (
                    <div className="space-y-2 text-sm">
                      {sorted.map((item, idx) => (
                        <div key={idx} className="p-2 bg-zinc-900 rounded">
                          <div className="flex items-center justify-between">
                            <span className="text-white">
                              {item.count}x - {item.track.name}
                            </span>
                            <span className="text-gray-400 text-xs">
                              by {item.track.artists[0].name}
                            </span>
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            {item.count >= 3 && `⚠️ Potential Looper/Coping Song candidate`}
                            {item.count === 2 && `Near-miss for repetition patterns`}
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </div>

              {/* Data Quality Warnings */}
              <div className="bg-red-900/20 border border-red-700 p-4 rounded-lg">
                <h3 className="text-lg font-semibold mb-2 text-red-400">⚠️ Data Limitations</h3>
                <ul className="text-sm text-gray-300 space-y-1">
                  <li>• Recent plays limited to ~50 tracks (Spotify API constraint)</li>
                  <li>• Temporal patterns only cover ~2-3 days of listening</li>
                  <li>• Some patterns require more data than available (e.g., The 2AM Song needs 5+ late-night plays)</li>
                  <li>• Genre data depends on Spotify's artist genre tagging</li>
                  <li>• Confidence scores calibrated for limited data: temporal (55-60%), identity (70-100%)</li>
                </ul>
              </div>
            </div>
          </details>
        </section>

        {/* Detected Patterns Section */}
        {detectedPatterns.length > 0 && (
          <section className="mb-12">
            <h2 className="text-3xl font-semibold mb-4">
              Detected Patterns
            </h2>
            <div className="grid gap-4">
              {detectedPatterns.map((pattern) => (
                <div
                  key={pattern.patternId}
                  className="bg-zinc-900 p-6 rounded-lg border border-zinc-800"
                >
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-bold text-green-400">
                      {pattern.patternName}
                    </h3>
                    <span className="text-sm text-gray-400">
                      {Math.round(pattern.confidence * 100)}% confidence
                    </span>
                  </div>

                  <div className="space-y-2 mb-4">
                    {pattern.evidence.map((evidence, idx) => (
                      <div
                        key={idx}
                        className="text-sm text-gray-300 flex items-start gap-2"
                      >
                        <span className="text-green-500 mt-1">•</span>
                        <span>{evidence.humanReadable}</span>
                      </div>
                    ))}
                  </div>

                  <div className="flex gap-3 text-xs">
                    <span className="bg-zinc-800 px-3 py-1 rounded-full text-gray-400">
                      {pattern.category}
                    </span>
                    <span className="bg-zinc-800 px-3 py-1 rounded-full text-gray-400">
                      {pattern.psychologicalDimension}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Top Tracks - All Time Ranges */}
        <section className="mb-12">
          <h2 className="text-3xl font-semibold mb-8">Your Top Tracks</h2>

          {/* Short Term - Last 4 Weeks */}
          <div className="mb-8">
            <h3 className="text-xl font-semibold mb-2 text-green-400">
              Last 4 Weeks
            </h3>
            <p className="text-sm text-gray-400 mb-4">
              Spotify API: top/tracks?time_range=short_term
            </p>
            <div className="grid gap-4">
              {userData.topTracks.short.slice(0, 10).map((track, index) => (
              <div
                key={track.id}
                className="bg-zinc-900 p-4 rounded-lg flex items-center gap-4"
              >
                <span className="text-2xl font-bold text-gray-500 w-8">
                  {index + 1}
                </span>
                {track.album.images[0] && (
                  <img
                    src={track.album.images[0].url}
                    alt={track.album.name}
                    className="w-16 h-16 rounded"
                  />
                )}
                <div className="flex-1">
                  <p className="font-semibold">{track.name}</p>
                  <p className="text-sm text-gray-400">
                    {track.artists.map((a) => a.name).join(', ')}
                  </p>
                </div>
                {track.preview_url ? (
                  <span className="text-xs text-green-500">Preview ✓</span>
                ) : (
                  <span className="text-xs text-gray-500">No preview</span>
                )}
              </div>
            ))}
            </div>
          </div>

          {/* Medium Term - Last 6 Months */}
          <div className="mb-8">
            <h3 className="text-xl font-semibold mb-2 text-blue-400">
              Last 6 Months
            </h3>
            <p className="text-sm text-gray-400 mb-4">
              Spotify API: top/tracks?time_range=medium_term
            </p>
            <div className="grid gap-4">
              {userData.topTracks.medium.slice(0, 10).map((track, index) => (
              <div
                key={track.id}
                className="bg-zinc-900 p-4 rounded-lg flex items-center gap-4"
              >
                <span className="text-2xl font-bold text-gray-500 w-8">
                  {index + 1}
                </span>
                {track.album.images[0] && (
                  <img
                    src={track.album.images[0].url}
                    alt={track.album.name}
                    className="w-16 h-16 rounded"
                  />
                )}
                <div className="flex-1">
                  <p className="font-semibold">{track.name}</p>
                  <p className="text-sm text-gray-400">
                    {track.artists.map((a) => a.name).join(', ')}
                  </p>
                </div>
              </div>
            ))}
            </div>
          </div>

          {/* Long Term - All Time */}
          <div className="mb-8">
            <h3 className="text-xl font-semibold mb-2 text-purple-400">
              All Time Favorites
            </h3>
            <p className="text-sm text-gray-400 mb-4">
              Spotify API: top/tracks?time_range=long_term
            </p>
            <div className="grid gap-4">
              {userData.topTracks.long.slice(0, 10).map((track, index) => (
              <div
                key={track.id}
                className="bg-zinc-900 p-4 rounded-lg flex items-center gap-4"
              >
                <span className="text-2xl font-bold text-gray-500 w-8">
                  {index + 1}
                </span>
                {track.album.images[0] && (
                  <img
                    src={track.album.images[0].url}
                    alt={track.album.name}
                    className="w-16 h-16 rounded"
                  />
                )}
                <div className="flex-1">
                  <p className="font-semibold">{track.name}</p>
                  <p className="text-sm text-gray-400">
                    {track.artists.map((a) => a.name).join(', ')}
                  </p>
                </div>
              </div>
            ))}
            </div>
          </div>
        </section>

        {/* Top Artists - All Time Ranges */}
        <section className="mb-12">
          <h2 className="text-3xl font-semibold mb-8">Your Top Artists</h2>

          {/* Short Term - Last 4 Weeks */}
          <div className="mb-8">
            <h3 className="text-xl font-semibold mb-2 text-green-400">
              Last 4 Weeks
            </h3>
            <p className="text-sm text-gray-400 mb-4">
              Spotify API: top/artists?time_range=short_term
            </p>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {userData.topArtists.short.slice(0, 10).map((artist, index) => (
                <div key={artist.id} className="text-center">
                  <div className="bg-zinc-900 p-4 rounded-lg">
                    <p className="text-2xl font-bold text-gray-500 mb-2">
                      {index + 1}
                    </p>
                    <p className="font-semibold truncate">{artist.name}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Medium Term - Last 6 Months */}
          <div className="mb-8">
            <h3 className="text-xl font-semibold mb-2 text-blue-400">
              Last 6 Months
            </h3>
            <p className="text-sm text-gray-400 mb-4">
              Spotify API: top/artists?time_range=medium_term
            </p>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {userData.topArtists.medium.slice(0, 10).map((artist, index) => (
                <div key={artist.id} className="text-center">
                  <div className="bg-zinc-900 p-4 rounded-lg">
                    <p className="text-2xl font-bold text-gray-500 mb-2">
                      {index + 1}
                    </p>
                    <p className="font-semibold truncate">{artist.name}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Long Term - All Time */}
          <div className="mb-8">
            <h3 className="text-xl font-semibold mb-2 text-purple-400">
              All Time Favorites
            </h3>
            <p className="text-sm text-gray-400 mb-4">
              Spotify API: top/artists?time_range=long_term
            </p>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {userData.topArtists.long.slice(0, 10).map((artist, index) => (
                <div key={artist.id} className="text-center">
                  <div className="bg-zinc-900 p-4 rounded-lg">
                    <p className="text-2xl font-bold text-gray-500 mb-2">
                      {index + 1}
                    </p>
                    <p className="font-semibold truncate">{artist.name}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Recently Played */}
        <section className="mb-12">
          <h2 className="text-3xl font-semibold mb-4">Recently Played</h2>
          <p className="text-sm text-gray-400 mb-4">
            Spotify API: player/recently-played (last 50 tracks, ~2 days of history)
          </p>
          <div className="grid gap-2">
            {userData.recentlyPlayed.slice(0, 5).map((play) => (
              <div
                key={`${play.track.id}-${play.played_at}`}
                className="bg-zinc-900 p-3 rounded flex justify-between items-center"
              >
                <div>
                  <p className="font-medium">{play.track.name}</p>
                  <p className="text-sm text-gray-400">
                    {play.track.artists.map((a) => a.name).join(', ')}
                  </p>
                </div>
                <p className="text-xs text-gray-500">
                  {new Date(play.played_at).toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Data Summary */}
        <section className="bg-zinc-900 p-6 rounded-lg">
          <h2 className="text-2xl font-semibold mb-4">Data Summary</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center mb-6">
            <div>
              <p className="text-3xl font-bold text-green-500">
                {userData.topTracks.short.length + userData.topTracks.medium.length + userData.topTracks.long.length}
              </p>
              <p className="text-sm text-gray-400">Total Top Tracks</p>
              <p className="text-xs text-gray-500 mt-1">
                {userData.topTracks.short.length}S / {userData.topTracks.medium.length}M / {userData.topTracks.long.length}L
              </p>
            </div>
            <div>
              <p className="text-3xl font-bold text-blue-500">
                {userData.topArtists.short.length + userData.topArtists.medium.length + userData.topArtists.long.length}
              </p>
              <p className="text-sm text-gray-400">Total Top Artists</p>
              <p className="text-xs text-gray-500 mt-1">
                {userData.topArtists.short.length}S / {userData.topArtists.medium.length}M / {userData.topArtists.long.length}L
              </p>
            </div>
            <div>
              <p className="text-3xl font-bold text-purple-500">
                {userData.recentlyPlayed.length}
              </p>
              <p className="text-sm text-gray-400">Recent Plays</p>
              <p className="text-xs text-gray-500 mt-1">
                Last ~2 days
              </p>
            </div>
            <div>
              <p className="text-3xl font-bold text-orange-500">
                N/A
              </p>
              <p className="text-sm text-gray-400">Audio Features</p>
              <p className="text-xs text-gray-500 mt-1">
                Deprecated Nov 2024
              </p>
            </div>
          </div>
          <div className="border-t border-zinc-800 pt-4">
            <p className="text-xs text-gray-500 text-center">
              Unique tracks analyzed: {new Set([
                ...userData.topTracks.short.map(t => t.id),
                ...userData.topTracks.medium.map(t => t.id),
                ...userData.topTracks.long.map(t => t.id)
              ]).size} |
              Patterns detected: {detectedPatterns.length}
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
