/**
 * Results page - displays user analysis
 * Fetches and displays Spotify data
 */

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { fetchUserData } from '@/lib/spotify';

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

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-5xl font-bold mb-8">Your Unwrapped</h1>

        {/* Top Tracks - Short Term */}
        <section className="mb-12">
          <h2 className="text-3xl font-semibold mb-4">
            Your Top Tracks (Last 4 Weeks)
          </h2>
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
        </section>

        {/* Top Artists */}
        <section className="mb-12">
          <h2 className="text-3xl font-semibold mb-4">Your Top Artists</h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {userData.topArtists.slice(0, 10).map((artist) => (
              <div key={artist.id} className="text-center">
                <div className="bg-zinc-900 p-4 rounded-lg">
                  <p className="font-semibold truncate">{artist.name}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Recently Played */}
        <section className="mb-12">
          <h2 className="text-3xl font-semibold mb-4">Recently Played</h2>
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
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <p className="text-3xl font-bold text-green-500">
                {userData.topTracks.short.length}
              </p>
              <p className="text-sm text-gray-400">Top Tracks</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-green-500">
                {userData.topArtists.length}
              </p>
              <p className="text-sm text-gray-400">Top Artists</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-green-500">
                {userData.recentlyPlayed.length}
              </p>
              <p className="text-sm text-gray-400">Recent Plays</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-green-500">
                {
                  userData.topTracks.short.filter((t) => t.preview_url)
                    .length
                }
              </p>
              <p className="text-sm text-gray-400">With Preview URLs</p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
