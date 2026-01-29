'use client';

import type { TypeResult } from '@/lib/v2.5/typing';
import { getTypeDescription } from '@/lib/v2.5/typing';
import { getRarityBadge, getTypeTagline } from '@/lib/v2.5/typing/typeNames';
import TypeShareButton from './TypeShareButton';
import DimensionDetailCard from './DimensionDetailCard';

interface TypeRevealProps {
  typeResult: TypeResult;
}

export default function TypeReveal({ typeResult }: TypeRevealProps) {
  const { code, dimensions, description } = typeResult;

  // Get dimension labels for display (e.g., "Nocturnal · Looper · Explorer · Anchored")
  const dimensionLabels = dimensions.map((d) => d.label).join(' · ');

  // Get Gen Z slang tagline and behavior-based rarity badge
  const tagline = getTypeTagline(code);
  const rarityBadge = getRarityBadge(code);

  // Map rarity badge colors to Tailwind gradients
  const getRarityGradient = (color: 'gold' | 'purple' | 'blue' | null): string => {
    switch (color) {
      case 'gold':
        return 'from-yellow-400 to-orange-400';
      case 'purple':
        return 'from-purple-500 to-pink-500';
      case 'blue':
        return 'from-blue-500 to-cyan-500';
      default:
        return 'from-gray-500 to-gray-400';
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      {/* Main Type Card */}
      <div className="bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900 border border-zinc-700 rounded-3xl p-8 md:p-12 text-center shadow-2xl">

        {/* Small Header */}
        <div className="text-sm uppercase tracking-widest text-gray-300 mb-6">
          Your Type
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
        <div className="mb-4">
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">
            {description}
          </h2>
        </div>

        {/* Tagline (Gen Z Slang) */}
        {tagline && (
          <div className="mb-8">
            <p className="text-lg md:text-xl text-gray-300 italic">
              "{tagline}"
            </p>
          </div>
        )}

        {/* Dimension Labels */}
        <div className="mb-10">
          <p className="text-base md:text-lg text-gray-300 leading-relaxed">
            {dimensionLabels}
          </p>
        </div>

        {/* Rarity Badge (Behavior-Based, Honest) */}
        {rarityBadge && (
          <div className="flex justify-center">
            <div className={`
              inline-flex items-center gap-2 px-6 py-3 rounded-full
              bg-gradient-to-r ${getRarityGradient(rarityBadge.color)}
              text-white font-bold text-base md:text-lg
              shadow-lg
            `}>
              <span className="text-xl">✨</span>
              <span>{rarityBadge.text}</span>
            </div>
          </div>
        )}

        {/* Share Button */}
        <div className="flex justify-center mt-8">
          <TypeShareButton typeCode={code} />
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

      {/* How to Read Your Type */}
      <div className="mt-12 bg-zinc-900/50 border border-zinc-700 rounded-2xl p-6 md:p-8">
        <h3 className="text-lg font-bold text-white mb-6 text-center">
          What Each Letter Means
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Temporal */}
          <div className="bg-zinc-800/50 rounded-lg p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0">
              <span className="text-xl font-black text-white">{code[0]}</span>
            </div>
            <div className="flex-1">
              <div className="font-bold text-white">
                {code[0] === 'D' ? 'Diurnal' : 'Nocturnal'}
              </div>
              <div className="text-sm text-gray-400">
                {code[0] === 'D' ? 'You listen mostly during the day' : 'You listen mostly at night'}
              </div>
            </div>
          </div>

          {/* Processing */}
          <div className="bg-zinc-800/50 rounded-lg p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center flex-shrink-0">
              <span className="text-xl font-black text-white">{code[1]}</span>
            </div>
            <div className="flex-1">
              <div className="font-bold text-white">
                {code[1] === 'L' ? 'Looper' : 'Skimmer'}
              </div>
              <div className="text-sm text-gray-400">
                {code[1] === 'L' ? 'You replay songs you love' : 'You move through songs quickly'}
              </div>
            </div>
          </div>

          {/* Discovery */}
          <div className="bg-zinc-800/50 rounded-lg p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center flex-shrink-0">
              <span className="text-xl font-black text-white">{code[2]}</span>
            </div>
            <div className="flex-1">
              <div className="font-bold text-white">
                {code[2] === 'E' ? 'Explorer' : 'Rooted'}
              </div>
              <div className="text-sm text-gray-400">
                {code[2] === 'E' ? 'You actively seek new artists' : 'You stick with familiar favorites'}
              </div>
            </div>
          </div>

          {/* Attachment */}
          <div className="bg-zinc-800/50 rounded-lg p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center flex-shrink-0">
              <span className="text-xl font-black text-white">{code[3]}</span>
            </div>
            <div className="flex-1">
              <div className="font-bold text-white">
                {code[3] === 'A' ? 'Anchored' : 'Fluid'}
              </div>
              <div className="text-sm text-gray-400">
                {code[3] === 'A' ? 'Your favorites stay the same over time' : 'Your favorites change often'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* The Four Dimensions - Full Cards */}
      <div className="mt-16 space-y-6">
        <div className="text-center mb-10">
          <h3 className="text-2xl md:text-3xl font-bold text-white mb-3">
            Your Data Breakdown
          </h3>
          <p className="text-gray-400 max-w-xl mx-auto">
            Here's the evidence behind each dimension of your type
          </p>
        </div>
        {dimensions.map((dimension, index) => (
          <DimensionDetailCard
            key={`${dimension.code}-${index}`}
            dimension={dimension}
          />
        ))}
      </div>

      {/* Footer Note */}
      <div className="mt-12 text-center">
        <p className="text-gray-500 text-sm">
          Calculated from your actual listening history
        </p>
      </div>
    </div>
  );
}
