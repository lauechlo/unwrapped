'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import ComparisonResults from '@/components/v2.5/ComparisonResults';
import TypeCodeInput from '@/components/v2.5/TypeCodeInput';
import { storeUserType, isValidTypeCode } from '@/lib/v2.5/comparison';
import { getTypeInfo } from '@/lib/v2.5/typing/typeNames';
import type { TypeCode } from '@/lib/v2.5/typing';

/**
 * Comparison page that shows compatibility between two Music Types
 * Now with Quick Compare: enter your type manually for instant comparison
 *
 * Flow:
 * 1. User clicks comparison link with ?type=XXXX
 * 2. Option A: "I know my type" - enter 4-letter code for instant compare
 * 3. Option B: "Get my type" - redirect to analysis flow
 * 4. Show comparison results
 */
function CompareContent() {
  const searchParams = useSearchParams();
  const [friendType, setFriendType] = useState<TypeCode | null>(null);
  const [userType, setUserType] = useState<TypeCode | null>(null);
  const [showQuickCompare, setShowQuickCompare] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Get friend's type from URL
    const typeFromUrl = searchParams.get('type') as TypeCode | null;
    if (typeFromUrl && isValidTypeCode(typeFromUrl)) {
      setFriendType(typeFromUrl.toUpperCase() as TypeCode);
    }

    // Check if user has completed analysis (would be passed via ?user=XXXX)
    const userTypeFromUrl = searchParams.get('user') as TypeCode | null;
    if (userTypeFromUrl && isValidTypeCode(userTypeFromUrl)) {
      setUserType(userTypeFromUrl.toUpperCase() as TypeCode);
      storeUserType(userTypeFromUrl.toUpperCase() as TypeCode);
    }

    // Done loading - params have been processed
    setIsLoading(false);
  }, [searchParams]);

  // Handle quick compare code entry
  const handleQuickCompare = (code: TypeCode) => {
    setUserType(code);
    storeUserType(code);
  };

  // Show loading spinner while params are being read
  if (isLoading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

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
    const friendTypeInfo = friendType ? getTypeInfo(friendType) : null;

    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center p-4">
        <div className="max-w-2xl w-full text-center space-y-8">
          {/* Header */}
          <div className="space-y-4">
            <h1 className="text-4xl md:text-5xl font-bold">
              Compare Music Types
            </h1>
            <p className="text-xl text-gray-400">
              Your friend shared their Music Type with you!
            </p>
          </div>

          {/* Friend's type display */}
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-8">
            <div className="text-sm uppercase tracking-widest text-gray-500 mb-4">
              Their Type
            </div>
            <div className="text-6xl md:text-7xl font-black mb-3">
              <span
                className="bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent"
                style={{ filter: 'drop-shadow(0 0 30px rgba(6, 182, 212, 0.4))' }}
              >
                {friendType}
              </span>
            </div>
            {friendTypeInfo && (
              <p className="text-xl text-gray-300 font-medium">
                {friendTypeInfo.name}
              </p>
            )}
          </div>

          {/* Quick Compare Section */}
          {showQuickCompare ? (
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-8 space-y-6">
              <div>
                <h2 className="text-xl font-bold text-white mb-2">
                  Enter Your Type
                </h2>
                <p className="text-gray-400 text-sm">
                  Already know your 4-letter code? Enter it below for instant comparison.
                </p>
              </div>

              <TypeCodeInput onComplete={handleQuickCompare} />

              <button
                onClick={() => setShowQuickCompare(false)}
                className="text-sm text-gray-500 hover:text-gray-400 transition-colors"
              >
                ← Back to options
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Option 1: Quick Compare */}
              <button
                onClick={() => setShowQuickCompare(true)}
                className="
                  w-full px-8 py-4 rounded-xl
                  bg-zinc-900 border border-zinc-700
                  hover:border-purple-500/50 hover:bg-zinc-800
                  text-white font-medium text-lg
                  transition-all duration-200
                  flex items-center justify-center gap-3
                "
              >
                <span className="text-2xl">⚡</span>
                <span>I already know my type</span>
              </button>

              {/* Divider */}
              <div className="flex items-center gap-4">
                <div className="flex-1 h-px bg-zinc-800" />
                <span className="text-gray-500 text-sm">or</span>
                <div className="flex-1 h-px bg-zinc-800" />
              </div>

              {/* Option 2: Get Type */}
              <a
                href={`/extended?compare=${friendType}`}
                className="
                  w-full px-8 py-4 rounded-xl
                  bg-gradient-to-r from-purple-500 to-pink-500
                  hover:from-purple-600 hover:to-pink-600
                  text-white font-bold text-lg
                  shadow-lg hover:shadow-xl
                  transition-all duration-200
                  flex items-center justify-center gap-3
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
                Analyze your Spotify data to discover your type
              </p>
            </div>
          )}
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
