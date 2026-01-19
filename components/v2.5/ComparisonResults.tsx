'use client';

import type { TypeCode } from '@/lib/v2.5/typing';
import { getTypeInfo } from '@/lib/v2.5/typing/typeNames';
import { calculateCompatibility } from '@/lib/v2.5/comparison';

interface ComparisonResultsProps {
  userType: TypeCode;
  friendType: TypeCode;
}

/**
 * Comparison results display showing compatibility between two types
 * Implements P1.2 from SHARE_AND_COMPARISON_FLOW_SPEC
 */
export default function ComparisonResults({ userType, friendType }: ComparisonResultsProps) {
  const userInfo = getTypeInfo(userType);
  const friendInfo = getTypeInfo(friendType);
  const compatibility = calculateCompatibility(userType, friendType);

  // Get color based on compatibility level
  const getCompatibilityColor = () => {
    switch (compatibility.level) {
      case 'soulmates':
        return 'from-pink-500 to-purple-500';
      case 'compatible':
        return 'from-blue-500 to-cyan-500';
      case 'different':
        return 'from-yellow-500 to-orange-500';
      case 'opposites':
        return 'from-red-500 to-pink-500';
    }
  };

  const getCompatibilityEmoji = () => {
    switch (compatibility.level) {
      case 'soulmates':
        return '💖';
      case 'compatible':
        return '✨';
      case 'different':
        return '🎭';
      case 'opposites':
        return '🌓';
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-12 space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl md:text-5xl font-black text-white">
          Music Type Compatibility
        </h1>
        <p className="text-xl text-gray-300">
          Comparing listening styles
        </p>
      </div>

      {/* Compatibility Score */}
      <div className="bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900 border border-zinc-700 rounded-3xl p-8 md:p-12 text-center">
        {/* Score Display */}
        <div className="mb-8">
          <div className="inline-flex items-center justify-center w-40 h-40 rounded-full bg-gradient-to-r from-zinc-800 to-zinc-900 border-4 border-zinc-700 mb-6">
            <div className={`text-6xl font-black bg-gradient-to-r ${getCompatibilityColor()} bg-clip-text text-transparent`}>
              {compatibility.score}
            </div>
          </div>

          <div className={`inline-flex items-center gap-3 px-6 py-3 rounded-full bg-gradient-to-r ${getCompatibilityColor()} text-white font-bold text-xl mb-4`}>
            <span className="text-2xl">{getCompatibilityEmoji()}</span>
            <span className="capitalize">{compatibility.level}</span>
          </div>

          <p className="text-gray-300 text-lg">
            {compatibility.message}
          </p>
        </div>

        {/* Shared Dimensions */}
        <div className="text-gray-300 text-sm">
          {compatibility.sharedDimensions} of 4 dimensions match
        </div>
      </div>

      {/* Type Comparison */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Your Type */}
        <div className="bg-zinc-900 border border-zinc-700 rounded-2xl p-6">
          <div className="text-sm uppercase tracking-widest text-gray-500 mb-4">
            Your Type
          </div>
          <div className="space-y-3">
            <h2 className="text-5xl font-black">
              <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                {userType}
              </span>
            </h2>
            <h3 className="text-2xl font-bold text-white">
              {userInfo.name}
            </h3>
            {userInfo.tagline && (
              <p className="text-gray-300 italic">
                "{userInfo.tagline}"
              </p>
            )}
          </div>
        </div>

        {/* Friend's Type */}
        <div className="bg-zinc-900 border border-zinc-700 rounded-2xl p-6">
          <div className="text-sm uppercase tracking-widest text-gray-500 mb-4">
            Their Type
          </div>
          <div className="space-y-3">
            <h2 className="text-5xl font-black">
              <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                {friendType}
              </span>
            </h2>
            <h3 className="text-2xl font-bold text-white">
              {friendInfo.name}
            </h3>
            {friendInfo.tagline && (
              <p className="text-gray-300 italic">
                "{friendInfo.tagline}"
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Differences Breakdown */}
      {compatibility.differences.length > 0 && (
        <div className="bg-zinc-900 border border-zinc-700 rounded-2xl p-6 md:p-8">
          <h3 className="text-xl font-bold text-white mb-6">
            Where You Differ
          </h3>
          <div className="space-y-4">
            {compatibility.differences.map((diff, index) => (
              <div
                key={index}
                className="bg-zinc-800/50 rounded-lg p-4 flex items-center justify-between"
              >
                <div className="flex-1">
                  <div className="text-sm text-gray-500 mb-1">
                    {diff.dimension}
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <span className="text-purple-400 font-bold">You:</span>
                      <span className="text-white">{diff.type1}</span>
                    </div>
                    <span className="text-gray-600">vs</span>
                    <div className="flex items-center gap-2">
                      <span className="text-blue-400 font-bold">Them:</span>
                      <span className="text-white">{diff.type2}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Call to Action */}
      <div className="text-center bg-zinc-900/50 border border-zinc-700 rounded-2xl p-8">
        <h3 className="text-2xl font-bold text-white mb-4">
          Want to see your own Music Type?
        </h3>
        <a
          href="/extended"
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
          <span>Get Your Music Type</span>
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
      </div>
    </div>
  );
}
