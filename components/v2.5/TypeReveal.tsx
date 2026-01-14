'use client';

import type { TypeResult } from '@/lib/v2.5/typing';
import { getTypeDescription } from '@/lib/v2.5/typing';

interface TypeRevealProps {
  typeResult: TypeResult;
}

export default function TypeReveal({ typeResult }: TypeRevealProps) {
  const { code, dimensions, rarity, description } = typeResult;

  // Get dimension labels for display (e.g., "Nocturnal · Looper · Explorer · Anchored")
  const dimensionLabels = dimensions.map((d) => d.label).join(' · ');

  // Determine rarity color based on percentage
  const getRarityColor = (rarity: number): string => {
    if (rarity <= 5) return 'from-purple-500 to-pink-500'; // Very rare
    if (rarity <= 10) return 'from-blue-500 to-purple-500'; // Rare
    if (rarity <= 20) return 'from-cyan-500 to-blue-500'; // Uncommon
    return 'from-green-500 to-cyan-500'; // Common
  };

  const rarityColor = getRarityColor(rarity);
  const rarityLabel = rarity <= 5 ? 'Very Rare' : rarity <= 10 ? 'Rare' : rarity <= 20 ? 'Uncommon' : 'Common';

  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      {/* Main Type Card */}
      <div className="bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900 border border-zinc-700 rounded-3xl p-8 md:p-12 text-center shadow-2xl">

        {/* Small Header */}
        <div className="text-sm uppercase tracking-widest text-gray-400 mb-6">
          Your Music Type
        </div>

        {/* Type Code - Large Display */}
        <div className="mb-8">
          <h1 className="text-7xl md:text-8xl lg:text-9xl font-black tracking-tight">
            <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 bg-clip-text text-transparent">
              {code}
            </span>
          </h1>
        </div>

        {/* Type Description */}
        <div className="mb-8">
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">
            {description}
          </h2>
        </div>

        {/* Dimension Labels */}
        <div className="mb-10">
          <p className="text-lg md:text-xl text-gray-300 leading-relaxed">
            {dimensionLabels}
          </p>
        </div>

        {/* Rarity Badge */}
        <div className="flex justify-center items-center gap-4 flex-wrap">
          {/* Rarity Percentage */}
          <div className={`
            inline-flex items-center gap-2 px-6 py-3 rounded-full
            bg-gradient-to-r ${rarityColor}
            text-white font-bold text-base md:text-lg
            shadow-lg
          `}>
            <span className="text-xl">✨</span>
            <span>{rarityLabel}</span>
          </div>

          {/* Population Text */}
          <div className="text-gray-400 text-base md:text-lg">
            Only <span className="text-white font-bold">{rarity}%</span> of users share your type
          </div>
        </div>

        {/* Confidence Indicator (if not complete) */}
        {!typeResult.isComplete && (
          <div className="mt-8 bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
            <p className="text-sm text-yellow-200">
              ⚠️ Based on limited data. Upload all Extended History files for more accurate typing.
            </p>
          </div>
        )}
      </div>

      {/* What This Means Section */}
      <div className="mt-8 bg-zinc-900/50 border border-zinc-700 rounded-2xl p-6 md:p-8">
        <h3 className="text-xl font-bold mb-4 text-white">What This Means</h3>
        <div className="space-y-4 text-gray-300">
          <p>
            Your <span className="text-purple-400 font-bold">{code}</span> type is based on four dimensions of your listening behavior:
          </p>
          <div className="grid md:grid-cols-2 gap-4 mt-6">
            {dimensions.map((dimension) => (
              <div key={dimension.code} className="bg-zinc-800/50 rounded-lg p-4">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-3xl font-black text-purple-400">{dimension.code}</span>
                  <span className="text-lg font-bold text-white">{dimension.label}</span>
                </div>
                <div className="text-sm text-gray-400">
                  {dimension.metric}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* About Your Type Section */}
      <div className="mt-8 text-center">
        <p className="text-gray-400 text-sm">
          Your type is calculated from your actual listening data—no surveys, no guessing.
          <br />
          Scroll down to explore each dimension in detail.
        </p>
      </div>
    </div>
  );
}
