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
            ✨ Extended Streaming History Analysis
          </div>

          <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            Unwrapped V2
          </h1>

          <p className="text-xl md:text-2xl text-gray-300 mb-8 max-w-3xl mx-auto">
            Analyze your <strong className="text-purple-400">complete Spotify history</strong> with advanced behavioral patterns
          </p>

          <div className="flex flex-wrap justify-center gap-4 mb-12">
            <div className="bg-zinc-900/50 border border-zinc-700 px-6 py-3 rounded-lg">
              <div className="text-sm text-gray-400">100% Client-Side</div>
              <div className="text-lg font-bold text-green-400">No OAuth Required</div>
            </div>
            <div className="bg-zinc-900/50 border border-zinc-700 px-6 py-3 rounded-lg">
              <div className="text-sm text-gray-400">Advanced Patterns</div>
              <div className="text-lg font-bold text-purple-400">9 V2 Detectors</div>
            </div>
            <div className="bg-zinc-900/50 border border-zinc-700 px-6 py-3 rounded-lg">
              <div className="text-sm text-gray-400">Privacy First</div>
              <div className="text-lg font-bold text-blue-400">Never Stored</div>
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
              <p className="text-sm text-gray-500 mt-3">
                This will run 9 advanced behavioral pattern detectors on your data
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Why V2? Section */}
      <section className="py-16 px-8 bg-zinc-950">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold mb-12 text-center">
            Why Use Extended History?
          </h2>

          <div className="grid md:grid-cols-2 gap-8">
            {/* V1 (API) */}
            <div className="bg-zinc-900/50 border border-zinc-700 rounded-xl p-8">
              <div className="flex items-center gap-3 mb-4">
                <span className="text-3xl">🔌</span>
                <h3 className="text-2xl font-bold">V1 (Spotify API)</h3>
              </div>
              <div className="space-y-3">
                <div className="flex items-start gap-2">
                  <span className="text-green-400">✓</span>
                  <span className="text-gray-300">Instant results (OAuth login)</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-green-400">✓</span>
                  <span className="text-gray-300">Top 50 tracks/artists snapshots</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-red-400">✗</span>
                  <span className="text-gray-300">No skip data, completion rates, or search behavior</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-red-400">✗</span>
                  <span className="text-gray-300">Some users experience OAuth failures</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-red-400">✗</span>
                  <span className="text-gray-300">Limited to API-provided data</span>
                </div>
              </div>
            </div>

            {/* V2 (Extended) */}
            <div className="bg-gradient-to-br from-purple-900/20 to-pink-900/20 border-2 border-purple-500/40 rounded-xl p-8">
              <div className="flex items-center gap-3 mb-4">
                <span className="text-3xl">🚀</span>
                <h3 className="text-2xl font-bold text-purple-400">V2 (Extended History)</h3>
              </div>
              <div className="space-y-3">
                <div className="flex items-start gap-2">
                  <span className="text-green-400">✓</span>
                  <span className="text-gray-300">100% reliable (no OAuth)</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-green-400">✓</span>
                  <span className="text-gray-300">Complete listening history</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-green-400">✓</span>
                  <span className="text-gray-300">Skip rates, completion tracking, search intent</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-green-400">✓</span>
                  <span className="text-gray-300">10 V2-exclusive behavioral detectors</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-yellow-400">⚠</span>
                  <span className="text-gray-300">Requires 30-day wait for Spotify export</span>
                </div>
              </div>
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
            9 Advanced Behavioral Detectors
          </h2>

          <div className="grid md:grid-cols-2 gap-6">
            {[
              {
                name: 'The Explorer',
                icon: '🔍',
                description: 'Detects weeks with high new artist discovery velocity',
                family: 'Discovery & Diversity'
              },
              {
                name: 'The Loyalist',
                icon: '💎',
                description: 'Finds sustained artist devotion over multiple weeks',
                family: 'Loyalty & Retention'
              },
              {
                name: 'Skip Velocity',
                icon: '⚡',
                description: 'Identifies instant rejection and extreme skip patterns',
                family: 'Engagement',
                exclusive: true
              },
              {
                name: 'The Searcher',
                icon: '🎯',
                description: 'Reveals intentional search vs. passive listening',
                family: 'Cognitive Patterns',
                exclusive: true
              },
              {
                name: 'The Looper',
                icon: '🔁',
                description: 'Detects consecutive track repetition (emotional processing)',
                family: 'Ritual & Repetition'
              },
              {
                name: 'Completion Loyalist',
                icon: '✅',
                description: 'Tracks sustained completion rates over time',
                family: 'Attention & Persistence',
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
                          V2 Exclusive
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
            ...plus 3 more from the existing detector suite adapted for extended history data
          </p>
        </div>
      </section>

      <Footer />
    </div>
  );
}
