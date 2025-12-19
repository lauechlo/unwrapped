/**
 * Landing page with Spotify OAuth
 */

export default function Home() {
  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center px-4">
      <div className="max-w-2xl text-center">
        <h1 className="text-6xl font-bold mb-4">Unwrapped</h1>
        <p className="text-xl text-gray-400 mb-8">
          Spotify shows what you listen to. We show who you are.
        </p>

        <a
          href="/api/auth/spotify"
          className="inline-block bg-green-500 hover:bg-green-600 text-black font-semibold px-8 py-4 rounded-full transition-colors"
        >
          Connect Spotify
        </a>

        <div className="mt-12 text-sm text-gray-500">
          <p>We analyze your listening data to generate insights backed by:</p>
          <ul className="mt-4 space-y-2">
            <li>Audio analysis (key, BPM, mode)</li>
            <li>Behavioral patterns (coping songs, breakup cycles)</li>
            <li>Psychologically-grounded personality insights</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
