'use client';

import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function ShareNarrativePage() {
  const params = useParams();
  const id = params.id as string;
  const [narrative, setNarrative] = useState<any>(null);

  useEffect(() => {
    // Try to load from localStorage (if user is on same device)
    const cachedResults = localStorage.getItem('v2_synthesis_results');
    if (cachedResults) {
      try {
        const results = JSON.parse(cachedResults);
        const found = results.narratives?.find((n: any) => n.id === id);
        if (found) {
          setNarrative(found);
        }
      } catch (err) {
        console.error('Failed to load narrative:', err);
      }
    }
  }, [id]);

  if (!narrative) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center p-8">
        <div className="max-w-2xl text-center">
          <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            Unwrapped Insight
          </h1>
          <p className="text-xl text-gray-300 mb-8">
            This insight was shared from someone's Spotify Extended History analysis
          </p>
          <div className="bg-zinc-900 border border-zinc-700 rounded-xl p-8 mb-8">
            <p className="text-gray-400 mb-6">
              Want to discover your own listening patterns?
            </p>
            <Link
              href="/extended"
              className="inline-block px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold rounded-lg transition-all"
            >
              Analyze Your Music →
            </Link>
          </div>
          <p className="text-sm text-gray-500">
            Get deep insights into your listening behavior with Extended Streaming History
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-block bg-purple-500/20 border border-purple-500/40 px-4 py-2 rounded-full text-sm mb-4">
            Shared Insight
          </div>
          <h1 className="text-3xl font-bold mb-2">{narrative.title}</h1>
          <p className="text-gray-400">From Unwrapped V2 Analysis</p>
        </div>

        {/* Narrative Card */}
        <div className="bg-zinc-900 border border-zinc-700 rounded-xl p-8 mb-8">
          <div className="mb-6">
            <h3 className="text-green-400 font-bold mb-2">KEY FINDING</h3>
            <p className="text-gray-300">{narrative.finding}</p>
          </div>

          <div className="mb-6">
            <h3 className="text-green-400 font-bold mb-2">PSYCHOLOGICAL CONTEXT</h3>
            <p className="text-gray-300">{narrative.context}</p>
          </div>

          <div className="bg-zinc-800 rounded-lg p-6">
            <h3 className="text-gray-400 font-bold text-sm mb-2">INSIGHT</h3>
            <p className="text-white">{narrative.callout}</p>
          </div>
        </div>

        {/* CTA */}
        <div className="bg-gradient-to-r from-purple-600/20 to-pink-600/20 border border-purple-500/40 rounded-xl p-8 text-center">
          <h2 className="text-2xl font-bold mb-4">Discover Your Patterns</h2>
          <p className="text-gray-300 mb-6">
            Upload your Extended Streaming History to get personalized insights like this
          </p>
          <Link
            href="/extended"
            className="inline-block px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold rounded-lg transition-all"
          >
            Analyze Your Music →
          </Link>
        </div>

        {/* Footer */}
        <div className="mt-12 text-center text-gray-500 text-sm">
          <p>🔒 100% Private • All analysis happens client-side</p>
          <p className="mt-2">Made with ✨ by Chloe</p>
        </div>
      </div>
    </div>
  );
}
