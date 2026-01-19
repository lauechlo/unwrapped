'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import ComparisonResults from '@/components/v2.5/ComparisonResults';
import { getTypeFromUrl, storeUserType } from '@/lib/v2.5/comparison';
import type { TypeCode } from '@/lib/v2.5/typing';

/**
 * Comparison page that shows compatibility between two Music Types
 * Implements P1.2 from SHARE_AND_COMPARISON_FLOW_SPEC
 *
 * Flow:
 * 1. User clicks comparison link with ?type=XXXX
 * 2. If they haven't analyzed yet, prompt them to get their type
 * 3. After analysis, redirect back here with both types
 * 4. Show comparison results
 */
function CompareContent() {
  const searchParams = useSearchParams();
  const [friendType, setFriendType] = useState<TypeCode | null>(null);
  const [userType, setUserType] = useState<TypeCode | null>(null);

  useEffect(() => {
    // Get friend's type from URL
    const typeFromUrl = searchParams.get('type') as TypeCode | null;
    if (typeFromUrl && typeFromUrl.length === 4) {
      setFriendType(typeFromUrl);
    }

    // Check if user has completed analysis (would be passed via ?user=XXXX)
    const userTypeFromUrl = searchParams.get('user') as TypeCode | null;
    if (userTypeFromUrl && userTypeFromUrl.length === 4) {
      setUserType(userTypeFromUrl);
      storeUserType(userTypeFromUrl);
    }
  }, [searchParams]);

  // No friend type - invalid link
  if (!friendType) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center p-4">
        <div className="max-w-md text-center space-y-4">
          <h1 className="text-3xl font-bold text-red-400">Invalid Comparison Link</h1>
          <p className="text-gray-400">
            This comparison link appears to be invalid. Make sure you're using the full link shared by your friend.
          </p>
          <a
            href="/extended"
            className="inline-block px-6 py-3 bg-purple-600 hover:bg-purple-700 rounded-lg font-medium"
          >
            Get Your Music Type
          </a>
        </div>
      </div>
    );
  }

  // Friend type exists but user hasn't analyzed yet
  if (!userType) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center p-4">
        <div className="max-w-2xl text-center space-y-6">
          <div className="space-y-4">
            <h1 className="text-4xl md:text-5xl font-bold">
              Compare Music Types
            </h1>
            <p className="text-xl text-gray-400">
              Your friend shared their Music Type with you!
            </p>
          </div>

          <div className="bg-zinc-900 border border-zinc-700 rounded-2xl p-8">
            <div className="text-sm uppercase tracking-widest text-gray-500 mb-4">
              Their Type
            </div>
            <div className="text-6xl font-black mb-4">
              <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                {friendType}
              </span>
            </div>
            <p className="text-gray-400">
              Get your Music Type to see how compatible you are!
            </p>
          </div>

          <div className="space-y-3">
            <a
              href={`/extended?compare=${friendType}`}
              className="
                inline-flex items-center gap-2 px-8 py-4 rounded-full
                bg-gradient-to-r from-purple-500 to-pink-500
                hover:from-purple-600 hover:to-pink-600
                text-white font-bold text-lg
                shadow-lg hover:shadow-xl
                transition-all duration-200
                transform hover:scale-105
              "
            >
              <span>Get My Music Type</span>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            </a>
            <p className="text-sm text-gray-500">
              Takes 2-3 minutes • Requires Spotify Extended History
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Both types available - show comparison
  return (
    <div className="min-h-screen bg-black text-white">
      <ComparisonResults userType={userType} friendType={friendType} />
    </div>
  );
}

export default function ComparePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-2xl font-bold text-gray-400">Loading...</div>
      </div>
    }>
      <CompareContent />
    </Suspense>
  );
}
