"use client";

import { useState } from 'react';

/**
 * Friendly disclaimer banner that sets expectations about the playful nature
 * of the insights. Dismissible so it doesn't clutter the page.
 */
export function DisclaimerBanner() {
  const [isDismissed, setIsDismissed] = useState(false);

  if (isDismissed) return null;

  return (
    <div className="w-full bg-gradient-to-r from-pink-500/10 via-purple-500/10 to-blue-500/10
                    border-y border-pink-500/20 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-start gap-4">
          {/* Icon */}
          <div className="text-4xl flex-shrink-0">📊</div>

          {/* Content */}
          <div className="flex-1">
            <h3 className="text-lg md:text-xl font-bold text-white mb-2">
              A Note from Chloe
            </h3>
            <p className="text-sm md:text-base text-gray-300 leading-relaxed">
              Built as a <span className="text-blue-400 font-semibold">fun side project</span> at Princeton using{' '}
              <span className="text-pink-400 font-semibold">music psychology research</span>. These "diagnoses" are{' '}
              <span className="text-purple-400 font-semibold">playful roasts</span>, not clinical assessments.
              Think of it as data art, not therapy! ✨
            </p>
            <p className="text-gray-500 text-xs md:text-sm mt-3 italic">
              TL;DR: For laughs and Instagram Stories, not your therapist's notes.
            </p>
          </div>

          {/* Dismiss Button */}
          <button
            onClick={() => setIsDismissed(true)}
            className="text-gray-500 hover:text-white transition-colors flex-shrink-0 text-2xl"
            aria-label="Dismiss"
          >
            ✕
          </button>
        </div>
      </div>
    </div>
  );
}
