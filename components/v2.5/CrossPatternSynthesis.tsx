'use client';

import { AI_INSIGHTS_CACHE_KEY } from '@/lib/v2.5/ai/types';

/**
 * CrossPatternSynthesis Component
 *
 * THE HERO MOMENT - AI-generated narrative that connects multiple data points
 * into a cohesive story. This is the "narrative threading" that Spotify can't do.
 *
 * Only rendered when AI insights are available; hidden on fallback.
 */

interface CrossPatternSynthesisProps {
  /** AI-generated synthesis text (250-550 chars) */
  synthesis: string;
  /** Optional callback to trigger regeneration */
  onRegenerate?: () => void;
}

export default function CrossPatternSynthesis({ synthesis, onRegenerate }: CrossPatternSynthesisProps) {
  if (!synthesis) return null;

  const handleRegenerate = () => {
    // Clear the AI insights cache
    localStorage.removeItem(AI_INSIGHTS_CACHE_KEY);
    // Call the regenerate callback if provided
    if (onRegenerate) {
      onRegenerate();
    } else {
      // Fallback: reload the page to trigger fresh generation
      window.location.reload();
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 md:py-10">
      {/* Prominent card with glow effect */}
      <div className="relative">
        {/* Glow background */}
        <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 via-pink-500/20 to-purple-500/20 rounded-2xl blur-xl" />

        {/* Main card */}
        <div className="relative bg-gradient-to-br from-zinc-900 via-zinc-900 to-zinc-800 border border-purple-500/30 rounded-2xl p-6 md:p-10 shadow-2xl">
          {/* Header with icon */}
          <div className="flex items-start gap-4 mb-6">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0 shadow-lg">
              <span className="text-2xl">🔮</span>
            </div>
            <div>
              <h3 className="text-xl md:text-2xl font-bold text-white">Your Story</h3>
              <p className="text-sm text-purple-300">The insight Spotify can't give you</p>
            </div>
          </div>

          {/* Large quote-style synthesis text */}
          <div className="relative pl-4 border-l-4 border-purple-500/50">
            <p className="text-lg md:text-xl text-gray-100 leading-relaxed font-medium">
              {synthesis}
            </p>
          </div>

          {/* Footer badge */}
          <div className="mt-8 pt-4 border-t border-zinc-700/50 flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <svg
                className="w-4 h-4 text-purple-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span>Woven from your actual listening patterns</span>
            </div>
            <button
              onClick={handleRegenerate}
              className="text-xs text-gray-500 hover:text-purple-400 transition-colors flex items-center gap-1"
              title="Generate a new version"
            >
              <svg
                className="w-3.5 h-3.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              <span>Regenerate</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
