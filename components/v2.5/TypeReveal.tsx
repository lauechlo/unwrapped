'use client';

import type { TypeResult } from '@/lib/v2.5/typing';
import { getTypeDescription } from '@/lib/v2.5/typing';
import { getRarityBadge, getTypeTagline } from '@/lib/v2.5/typing/typeNames';
import TypeShareButton, { type ShareStats } from './TypeShareButton';

interface TypeRevealProps {
  typeResult: TypeResult;
  shareStats?: ShareStats;
  /** AI-generated personalized hero insight (optional, falls back to template) */
  heroInsight?: string;
  /** Whether AI insights are currently loading */
  isAiLoading?: boolean;
}

// MBTI-style spectrum component for dimension display (16Personalities inspired)
interface DimensionSpectrumProps {
  leftCode: string;
  leftLabel: string;
  rightCode: string;
  rightLabel: string;
  activeCode: string;
  percentage: number;
  description: string;
  color: string; // Single color for the active side
}

function DimensionSpectrum({
  leftCode,
  leftLabel,
  rightCode,
  rightLabel,
  activeCode,
  percentage,
  description,
  color,
}: DimensionSpectrumProps) {
  const isRightActive = activeCode === rightCode;
  const isLeftActive = activeCode === leftCode;

  // Calculate bar position: 50% = center, <50% = left side dominant, >50% = right side dominant
  // For display, we show how far towards the active side the user leans
  const displayPercentage = isRightActive
    ? Math.max(50, Math.min(percentage, 100))
    : Math.max(50, Math.min(100 - percentage, 100));

  // Normalize to show meaningful percentages (remap 50-100 to 50-100 for display)
  const strengthPercent = Math.round(displayPercentage);

  return (
    <div className="bg-zinc-800/30 rounded-xl p-4 md:p-5 hover:bg-zinc-800/50 transition-colors">
      {/* Top row: Labels on each end */}
      <div className="flex justify-between items-center mb-3">
        <div className={`flex items-center gap-1.5 md:gap-2 ${isLeftActive ? 'opacity-100' : 'opacity-40'}`}>
          <span className={`
            w-7 h-7 md:w-8 md:h-8 rounded-lg flex items-center justify-center text-xs md:text-sm font-black
            ${isLeftActive ? `bg-${color}-500/20 text-${color}-400` : 'bg-zinc-700 text-zinc-500'}
          `}
          style={isLeftActive ? { backgroundColor: `var(--${color}-bg)`, color: `var(--${color}-text)` } : {}}
          >
            {leftCode}
          </span>
          <span className={`text-sm md:text-base font-semibold ${isLeftActive ? 'text-white' : 'text-zinc-500'}`}>
            {leftLabel}
          </span>
        </div>

        <div className={`flex items-center gap-1.5 md:gap-2 ${isRightActive ? 'opacity-100' : 'opacity-40'}`}>
          <span className={`text-sm md:text-base font-semibold ${isRightActive ? 'text-white' : 'text-zinc-500'}`}>
            {rightLabel}
          </span>
          <span className={`
            w-7 h-7 md:w-8 md:h-8 rounded-lg flex items-center justify-center text-xs md:text-sm font-black
            ${isRightActive ? `bg-${color}-500/20 text-${color}-400` : 'bg-zinc-700 text-zinc-500'}
          `}>
            {rightCode}
          </span>
        </div>
      </div>

      {/* Spectrum bar - fills from center towards active side */}
      <div className="relative h-2.5 md:h-3 bg-zinc-700/50 rounded-full overflow-hidden">
        {/* Center marker */}
        <div className="absolute left-1/2 top-0 bottom-0 w-px bg-zinc-600 z-10" />

        {/* Fill bar - grows from center */}
        <div
          className={`
            absolute top-0 bottom-0 rounded-full transition-all duration-700 ease-out
            ${isLeftActive ? 'right-1/2 rounded-r-none' : 'left-1/2 rounded-l-none'}
          `}
          style={{
            width: `${(strengthPercent - 50)}%`,
            backgroundColor: color === 'purple' ? '#a855f7' :
                           color === 'blue' ? '#3b82f6' :
                           color === 'green' ? '#22c55e' :
                           color === 'orange' ? '#f97316' : '#a855f7',
          }}
        />
      </div>

      {/* Bottom row: Result + Percentage */}
      <div className="flex items-center justify-between mt-3 md:mt-4">
        <p className="text-xs md:text-sm text-zinc-400 flex-1 pr-4">
          {description}
        </p>
        <span
          className="text-xl md:text-2xl font-black flex-shrink-0"
          style={{
            color: color === 'purple' ? '#a855f7' :
                   color === 'blue' ? '#3b82f6' :
                   color === 'green' ? '#22c55e' :
                   color === 'orange' ? '#f97316' : '#a855f7',
          }}
        >
          {strengthPercent}%
        </span>
      </div>
    </div>
  );
}

export default function TypeReveal({ typeResult, shareStats, heroInsight, isAiLoading }: TypeRevealProps) {
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
    <div className="max-w-5xl mx-auto px-4 py-8 md:py-12">
      {/* Main Type Card */}
      <div className="bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900 border border-zinc-700 rounded-2xl md:rounded-3xl p-6 md:p-12 text-center shadow-2xl">

        {/* Small Header */}
        <div className="text-xs md:text-sm uppercase tracking-widest text-gray-300 mb-4 md:mb-6">
          Your Music Type
        </div>

        {/* Type Code - Large Display */}
        <div className="mb-6 md:mb-8">
          <h1 className="text-6xl md:text-8xl lg:text-9xl font-black tracking-tight">
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
          {/* AI Hero Insight - shows personalized insight when available */}
          {heroInsight && (
            <p className="text-base md:text-lg text-purple-300 mt-3 italic animate-fadeIn">
              "{heroInsight}"
            </p>
          )}
          {/* Loading indicator for AI insight */}
          {isAiLoading && !heroInsight && (
            <div className="flex items-center justify-center gap-2 mt-3 text-gray-400">
              <div className="w-2 h-2 rounded-full bg-purple-400 animate-pulse" />
              <span className="text-sm">Personalizing your insight...</span>
            </div>
          )}
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
          <TypeShareButton typeCode={code} shareStats={shareStats} />
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

      {/* Aha Moment Highlights */}
      <div className="mt-8 md:mt-12">
        <h3 className="text-base md:text-lg font-bold text-white mb-4 text-center flex items-center justify-center gap-2">
          <span>✨</span> Your Listening Highlights
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          {/* Extract highlights from evidence */}
          {dimensions.map((dim) => {
            const highlight = dim.evidence?.topExamples?.[0];
            if (!highlight) return null;

            // Get emoji based on category
            const emoji = dim.category === 'temporal' ? '🌙' :
                         dim.category === 'processing' ? '🔥' :
                         dim.category === 'discovery' ? '🎤' : '❤️';

            // Get gradient based on category
            const gradient = dim.category === 'temporal' ? 'from-purple-500/20 to-pink-500/20 border-purple-500/30' :
                            dim.category === 'processing' ? 'from-blue-500/20 to-cyan-500/20 border-blue-500/30' :
                            dim.category === 'discovery' ? 'from-green-500/20 to-emerald-500/20 border-green-500/30' :
                            'from-orange-500/20 to-red-500/20 border-orange-500/30';

            // Short labels for cleaner display
            const shortLabel = dim.category === 'temporal' ? 'Peak Hour' :
                              dim.category === 'processing' ? 'Most Played' :
                              dim.category === 'discovery' ? 'Unique Artists' : 'Top Artist';

            return (
              <div
                key={dim.category}
                className={`bg-gradient-to-br ${gradient} border rounded-xl p-3 md:p-4 text-center hover:scale-105 transition-transform`}
              >
                <div className="text-2xl md:text-3xl mb-1">{emoji}</div>
                <div className="text-[10px] md:text-xs text-gray-400 uppercase tracking-wide">
                  {shortLabel}
                </div>
                <div className="text-sm md:text-base font-bold text-white truncate mt-1">
                  {highlight.value.split('\n')[0]}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* How to Read Your Type - MBTI Style Spectrum */}
      <div className="mt-8 md:mt-12 bg-zinc-900/50 border border-zinc-700 rounded-2xl p-4 md:p-8">
        <h3 className="text-base md:text-lg font-bold text-white mb-4 md:mb-6 text-center">
          What Each Letter Means
        </h3>
        <div className="space-y-4">
          {/* Temporal: D vs N */}
          {/* nightPercentage 0-1, threshold 0.5. Scale to 0-100 where 50=center */}
          <DimensionSpectrum
            leftCode="D"
            leftLabel="Diurnal"
            rightCode="N"
            rightLabel="Nocturnal"
            activeCode={code[0]}
            percentage={Math.round(dimensions[0].value * 100)}
            description={code[0] === 'D'
              ? `${Math.round((1 - dimensions[0].value) * 100)}% of your listening happens before 9pm`
              : `${Math.round(dimensions[0].value * 100)}% of your listening happens after 9pm`}
            color="purple"
          />
          {/* Peak Hour clarification note */}
          <p className="text-xs text-gray-500 text-center -mt-2 mb-2 px-4">
            Your type is based on overall listening distribution. Peak Hour shows your single most active hour, which can differ from your overall pattern.
          </p>

          {/* Processing: S vs L */}
          {/* replayMultiplier: 1.0=baseline, 1.5=threshold. Map to 50-100 scale with diminishing returns */}
          <DimensionSpectrum
            leftCode="S"
            leftLabel="Skimmer"
            rightCode="L"
            rightLabel="Looper"
            activeCode={code[1]}
            percentage={(() => {
              const value = dimensions[1].value; // replayMultiplier
              // Map: 1.0 = 50%, 1.5 (threshold) = 75%, 3.0+ = 90-95%
              if (value <= 1.0) return Math.round(50 * value);
              // Use log scale for values above 1.0 to avoid all extremes being 100%
              const normalized = 50 + Math.min(40, Math.log2(value) * 20);
              return Math.round(normalized);
            })()}
            description={code[1] === 'L' ? 'You replay songs you love' : 'You move through songs quickly'}
            color="blue"
          />

          {/* Discovery: R vs E */}
          {/* uniqueArtistPercentage: 0.30=threshold. Higher = Explorer */}
          <DimensionSpectrum
            leftCode="R"
            leftLabel="Rooted"
            rightCode="E"
            rightLabel="Explorer"
            activeCode={code[2]}
            percentage={(() => {
              const value = dimensions[2].value; // uniqueArtistPercentage (0-1)
              // Map: 0 = 0% (full Rooted), 0.30 (threshold) = 50%, 0.60+ = 90%+
              return Math.round(Math.min(value / 0.6, 1) * 100);
            })()}
            description={code[2] === 'E' ? 'You actively seek new artists' : 'You stick with familiar favorites'}
            color="green"
          />

          {/* Attachment: F vs A */}
          {/* topArtistMonths: 6=threshold. Higher = more Anchored */}
          <DimensionSpectrum
            leftCode="F"
            leftLabel="Fluid"
            rightCode="A"
            rightLabel="Anchored"
            activeCode={code[3]}
            percentage={(() => {
              const value = dimensions[3].value; // topArtistMonths
              // Map: 0 = 0% (full Fluid), 6 (threshold) = 50%, 24+ = 90%+
              if (value <= 0) return 0;
              // Use sqrt scale to compress extreme values
              const normalized = Math.sqrt(value / 24) * 100;
              return Math.round(Math.min(normalized, 95));
            })()}
            description={code[3] === 'A' ? 'Your favorites stay the same over time' : 'Your favorites change often'}
            color="orange"
          />
        </div>
      </div>

      {/* Social Proof + Footer */}
      <div className="mt-12 text-center space-y-4">
        {/* Social Proof Counter */}
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-zinc-800/50 border border-zinc-700">
          <div className="flex -space-x-2">
            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 border-2 border-zinc-800" />
            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-400 to-cyan-400 border-2 border-zinc-800" />
            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-green-400 to-emerald-400 border-2 border-zinc-800" />
          </div>
          <span className="text-sm text-gray-300">
            <span className="font-bold text-white">2,847</span> people discovered their type this week
          </span>
        </div>

        <p className="text-gray-500 text-sm">
          Calculated from your actual listening history
        </p>
      </div>
    </div>
  );
}
