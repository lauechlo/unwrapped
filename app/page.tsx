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
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    setHasUsesLeft(canMakeRequest());

    // Check for OAuth errors in URL params
    const params = new URLSearchParams(window.location.search);
    const error = params.get('error');
    if (error) {
      setAuthError(error);
    }
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
            "url": "https://unwrapped.fm",
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

        {/* OAuth Error Banner - User not on allowlist */}
        {authError && (
          <div className="bg-pink-500/10 border-b border-pink-500/30 py-4 px-4">
            <div className="max-w-4xl mx-auto text-center">
              <div className="flex items-center justify-center gap-2 mb-3">
                <span className="text-2xl">💔</span>
                <h3 className="text-lg font-bold text-white">
                  Spotify Unwrapped v1 is at capacity!
                </h3>
              </div>
              <p className="text-sm text-gray-300 mb-4 max-w-2xl mx-auto">
                This early version is limited to 25 beta testers while we use Spotify's development API.
              </p>
              <p className="text-sm text-pink-300 font-semibold mb-4">
                ✨ Good news: v2 is launching soon with unlimited access, more insights, and new features!
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
                <a
                  href="https://forms.gle/djCs4NFUBnwFCLBr7"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-6 py-3 bg-gradient-to-r from-pink-500 to-purple-500 text-white font-semibold rounded-lg
                           hover:opacity-90 transition-all shadow-lg hover:shadow-pink-500/50"
                >
                  🎉 Join the v2 Waitlist
                </a>
                <button
                  onClick={() => {
                    setAuthError(null);
                    window.history.replaceState({}, '', '/');
                  }}
                  className="px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors"
                >
                  Dismiss
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-4">
                Got sent here by a friend? Join the waitlist to be first in line when we launch!
              </p>
            </div>
          </div>
        )}

      {/* Main content */}
      <div className="flex items-center justify-center px-4 py-16 min-h-[calc(100vh-60px)]">
        <div className="max-w-4xl w-full">
          <div className="flex flex-col md:flex-row gap-8 md:gap-20 items-center">
            {/* Left side - Text content */}
            <div className="text-center md:text-left flex-1">
              <h1 className="text-5xl md:text-6xl font-bold mb-4 bg-gradient-to-r from-pink-400 via-purple-400 to-blue-400 bg-clip-text text-transparent">
                Unwrapped
              </h1>

              <p className="text-lg md:text-xl text-gray-400 mb-8">
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

              {/* Feature cards */}
              <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-4 text-left">
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

            {/* Right side - Mobile mockup (static, no animations) */}
            <div className="hidden md:flex justify-center md:justify-end">
              <img
                src="/mockup.png"
                alt="Mobile app preview showing callout feature"
                className="w-64 h-auto drop-shadow-2xl"
              />
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
