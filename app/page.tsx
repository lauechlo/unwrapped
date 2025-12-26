"use client";

import { useState, useEffect } from 'react';
import { canMakeRequest } from '@/lib/rateLimit';
import { UsageLimitBanner } from '@/components/UsageLimitBanner';
import { RateLimitModal } from '@/components/RateLimitModal';
import { ExampleCardsSection } from '@/components/ExampleCardsSection';

/**
 * Landing page with Spotify OAuth and rate limiting
 */
export default function Home() {
  const [showLimitModal, setShowLimitModal] = useState(false);
  const [hasUsesLeft, setHasUsesLeft] = useState(true);

  useEffect(() => {
    setHasUsesLeft(canMakeRequest());
  }, []);

  const handleConnectClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (!hasUsesLeft) {
      e.preventDefault();
      setShowLimitModal(true);
    }
  };

  return (
    <>
      {/* Structured Data for SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebApplication",
            "name": "Unwrapped",
            "description": "Psychology-driven Spotify listening analysis with AI-powered insights and shareable Instagram Stories cards",
            "url": "https://unwrapped.app",
            "applicationCategory": "MusicApplication",
            "offers": {
              "@type": "Offer",
              "price": "0",
              "priceCurrency": "USD"
            },
            "creator": {
              "@type": "Person",
              "name": "Chloe"
            }
          })
        }}
      />

      <div className="min-h-screen bg-black text-white">
        {/* Usage limit banner */}
        <UsageLimitBanner />

      {/* Main content */}
      <div className="flex items-center justify-center px-4 py-16 min-h-[calc(100vh-60px)]">
        <div className="max-w-2xl text-center">
          <h1 className="text-5xl md:text-6xl font-bold mb-4 bg-gradient-to-r from-pink-400 via-purple-400 to-blue-400 bg-clip-text text-transparent">
            Unwrapped
          </h1>
          <p className="text-lg md:text-xl text-gray-400 mb-8 px-4">
            Spotify shows what you listen to. We show <span className="text-pink-400 font-semibold">who you are</span>.
          </p>

          <a
            href="/api/auth/spotify"
            onClick={handleConnectClick}
            className={`inline-block font-semibold px-8 py-4 rounded-full transition-all shadow-lg
              ${hasUsesLeft
                ? 'bg-green-500 hover:bg-green-600 text-black hover:shadow-green-500/50'
                : 'bg-gray-600 text-gray-400 cursor-not-allowed'
              }`}
          >
            {hasUsesLeft ? 'Connect Spotify' : 'Limit Reached'}
          </a>

          <div className="mt-12 text-sm text-gray-500">
            <p className="text-gray-400 mb-4">
              Get psychology-driven insights + Instagram-ready shareable cards 📲
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-left max-w-xl mx-auto">
              <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-4">
                <div className="text-pink-400 font-semibold mb-1">30+ Detectors</div>
                <div className="text-xs text-gray-500">Behavioral patterns, coping songs, rituals</div>
              </div>
              <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-4">
                <div className="text-purple-400 font-semibold mb-1">AI Synthesis</div>
                <div className="text-xs text-gray-500">Claude-powered insights with proof</div>
              </div>
              <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-4">
                <div className="text-blue-400 font-semibold mb-1">Share Cards</div>
                <div className="text-xs text-gray-500">Instagram Stories-ready (1080×1920)</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Example Cards Section */}
      <ExampleCardsSection />

        {/* Rate limit modal */}
        <RateLimitModal
          isOpen={showLimitModal}
          onClose={() => setShowLimitModal(false)}
        />

        {/* Footer */}
        <footer className="py-8 text-center text-sm text-gray-600">
          <a href="/privacy" className="hover:text-gray-400 transition-colors">
            Privacy Policy
          </a>
          <span className="mx-3">•</span>
          <span>Made with ✨ by Chloe</span>
        </footer>
      </div>
    </>
  );
}
