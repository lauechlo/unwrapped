'use client';

import { useState } from 'react';
import FileUploader from '@/components/FileUploader';
import { Footer } from '@/components/Footer';
import ExtendedResultsComponent from './results/ExtendedResultsComponent';

export default function ExtendedPage() {
  const [uploadedData, setUploadedData] = useState<any>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const handleUploadComplete = (data: any) => {
    setUploadedData(data);

    // Store metadata only (not the full data - too large for localStorage)
    localStorage.setItem('v2_upload_timestamp', Date.now().toString());
    localStorage.setItem('v2_upload_plays', data.length.toString());
  };

  const handleAnalyze = () => {
    if (uploadedData) {
      console.log('[Extended Upload] Analyze button clicked');
      console.log(`[Extended Upload] Data size: ${uploadedData.length} plays`);
      console.log('[Extended Upload] Transitioning to analysis...');

      // Keep data in memory - no storage needed
      setIsAnalyzing(true);
    } else {
      console.error('[Extended Upload] No data to analyze!');
    }
  };

  // If analyzing, show results component with data
  if (isAnalyzing && uploadedData) {
    return <ExtendedResultsComponent uploadedData={uploadedData} />;
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Hero Section */}
      <section className="py-20 px-8 bg-gradient-to-b from-purple-950/20 to-black">
        <div className="max-w-6xl mx-auto text-center">
          <div className="inline-block bg-purple-500/20 border border-purple-500/40 px-4 py-2 rounded-full text-sm mb-6">
            Full Listening History
          </div>

          <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            Unwrapped
          </h1>

          <p className="text-xl md:text-2xl text-gray-300 mb-8 max-w-3xl mx-auto">
            See what your <strong className="text-purple-400">Spotify history</strong> says about you
          </p>

          <div className="flex flex-wrap justify-center gap-4 mb-12">
            <div className="bg-zinc-900/50 border border-zinc-700 px-6 py-3 rounded-lg">
              <div className="text-sm text-gray-400">No Login Needed</div>
              <div className="text-lg font-bold text-green-400">Just upload your files</div>
            </div>
            <div className="bg-zinc-900/50 border border-zinc-700 px-6 py-3 rounded-lg">
              <div className="text-sm text-gray-400">30+ Patterns</div>
              <div className="text-lg font-bold text-purple-400">From your real data</div>
            </div>
            <div className="bg-zinc-900/50 border border-zinc-700 px-6 py-3 rounded-lg">
              <div className="text-sm text-gray-400">Stays Private</div>
              <div className="text-lg font-bold text-blue-400">Nothing leaves your browser</div>
            </div>
          </div>
        </div>
      </section>

      {/* Upload Section */}
      <section className="py-16 px-8">
        <div className="max-w-6xl mx-auto">
          <FileUploader onUploadComplete={handleUploadComplete} />

          {/* Analyze Button */}
          {uploadedData && (
            <div className="mt-8 text-center">
              <button
                onClick={handleAnalyze}
                className="group relative px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600
                         hover:from-purple-500 hover:to-pink-500 text-white font-bold rounded-xl
                         transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/50
                         text-lg"
              >
                <span className="relative z-10">Analyze My Listening History →</span>
                <div className="absolute inset-0 bg-gradient-to-r from-purple-400 to-pink-400 opacity-0
                             group-hover:opacity-20 rounded-xl transition-opacity blur-xl" />
              </button>
            </div>
          )}
        </div>
      </section>

      {/* Why Full History Section */}
      <section className="py-16 px-8 bg-zinc-950">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-center">
            Your Full History = Better Insights
          </h2>
          <p className="text-gray-400 text-center mb-12 max-w-2xl mx-auto">
            Spotify's data export includes everything—not just your top 50
          </p>

          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-gradient-to-br from-purple-900/20 to-pink-900/20 border border-purple-500/40 rounded-xl p-6 text-center">
              <div className="text-4xl mb-3">📊</div>
              <h3 className="text-lg font-bold text-purple-400 mb-2">Every Play</h3>
              <p className="text-sm text-gray-300">Years of listening data, not just recent favorites</p>
            </div>
            <div className="bg-gradient-to-br from-purple-900/20 to-pink-900/20 border border-purple-500/40 rounded-xl p-6 text-center">
              <div className="text-4xl mb-3">⏭️</div>
              <h3 className="text-lg font-bold text-purple-400 mb-2">Skip Behavior</h3>
              <p className="text-sm text-gray-300">Songs you skip, songs you finish, songs you replay</p>
            </div>
            <div className="bg-gradient-to-br from-purple-900/20 to-pink-900/20 border border-purple-500/40 rounded-xl p-6 text-center">
              <div className="text-4xl mb-3">🔍</div>
              <h3 className="text-lg font-bold text-purple-400 mb-2">Search Intent</h3>
              <p className="text-sm text-gray-300">Music you searched for vs. let autoplay</p>
            </div>
          </div>
        </div>
      </section>

      {/* How to Get Your Data */}
      <section className="py-16 px-8">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold mb-8 text-center">
            How to Get Your Extended History
          </h2>

          <div className="bg-zinc-900/50 border border-zinc-700 rounded-xl p-8">
            <ol className="space-y-6">
              <li className="flex gap-4">
                <span className="flex-shrink-0 w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center font-bold">
                  1
                </span>
                <div>
                  <h3 className="font-bold text-lg mb-2">Request Your Data</h3>
                  <p className="text-gray-400">
                    Go to{' '}
                    <a
                      href="https://www.spotify.com/account/privacy/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-purple-400 hover:underline"
                    >
                      spotify.com/account/privacy
                    </a>{' '}
                    and request your "Extended streaming history"
                  </p>
                </div>
              </li>

              <li className="flex gap-4">
                <span className="flex-shrink-0 w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center font-bold">
                  2
                </span>
                <div>
                  <h3 className="font-bold text-lg mb-2">Wait ~30 Days</h3>
                  <p className="text-gray-400">
                    Spotify will email you when your data is ready (usually takes 2-4 weeks)
                  </p>
                </div>
              </li>

              <li className="flex gap-4">
                <span className="flex-shrink-0 w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center font-bold">
                  3
                </span>
                <div>
                  <h3 className="font-bold text-lg mb-2">Download & Extract</h3>
                  <p className="text-gray-400">
                    Download the ZIP file and extract the <span className="font-mono text-purple-300">Streaming_History_Audio_*.json</span> files
                  </p>
                </div>
              </li>

              <li className="flex gap-4">
                <span className="flex-shrink-0 w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center font-bold">
                  4
                </span>
                <div>
                  <h3 className="font-bold text-lg mb-2">Upload Here</h3>
                  <p className="text-gray-400">
                    Drag and drop all the JSON files into the uploader above
                  </p>
                </div>
              </li>
            </ol>
          </div>

          <div className="mt-6 bg-green-500/10 border border-green-500/30 rounded-xl p-6">
            <h4 className="text-lg font-bold text-green-400 mb-2 flex items-center gap-2">
              <span>🔒</span>
              100% Private & Secure
            </h4>
            <p className="text-sm text-gray-300">
              All processing happens in your browser. We never upload or store your data on any server.
              Close this tab and your data is gone forever.
            </p>
          </div>
        </div>
      </section>

      {/* V2 Detectors Preview */}
      <section className="py-16 px-8 bg-zinc-950">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold mb-8 text-center">
            What We Look For
          </h2>

          <div className="grid md:grid-cols-2 gap-6">
            {[
              {
                name: 'Discovery',
                icon: '🔍',
                description: 'Weeks when you found lots of new artists',
                family: 'New music'
              },
              {
                name: 'Loyalty',
                icon: '💎',
                description: 'Artists you keep coming back to',
                family: 'Favorites'
              },
              {
                name: 'Skips',
                icon: '⚡',
                description: 'Songs you skip within seconds',
                family: 'Taste',
                exclusive: true
              },
              {
                name: 'Search',
                icon: '🎯',
                description: 'Music you looked for vs. let play',
                family: 'Intent',
                exclusive: true
              },
              {
                name: 'Replays',
                icon: '🔁',
                description: 'Songs you play on repeat',
                family: 'Comfort'
              },
              {
                name: 'Completion',
                icon: '✅',
                description: 'How often you finish songs',
                family: 'Attention',
                exclusive: true
              },
            ].map((detector, i) => (
              <div
                key={i}
                className={`
                  p-6 rounded-xl border-2 transition-all hover:scale-105
                  ${detector.exclusive
                    ? 'bg-gradient-to-br from-purple-900/30 to-pink-900/30 border-purple-500/40'
                    : 'bg-zinc-900/50 border-zinc-700'
                  }
                `}
              >
                <div className="flex items-start gap-4">
                  <span className="text-4xl">{detector.icon}</span>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-bold text-lg">{detector.name}</h3>
                      {detector.exclusive && (
                        <span className="text-xs bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded-full border border-purple-500/40">
                          Extended only
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-400 mb-2">{detector.description}</p>
                    <div className="text-xs text-gray-500">
                      {detector.family}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <p className="text-center text-gray-400 mt-8">
            ...and more
          </p>
        </div>
      </section>

      {/* Try V1 Link */}
      <section className="py-8 px-8 text-center">
        <p className="text-gray-500 text-sm">
          Have a Spotify account?{' '}
          <a
            href="/v1"
            className="text-purple-400 hover:text-purple-300 underline underline-offset-2"
          >
            Try V1 (beta)
          </a>
          {' '}— instant results, no download needed
        </p>
      </section>

      <Footer />
    </div>
  );
}
