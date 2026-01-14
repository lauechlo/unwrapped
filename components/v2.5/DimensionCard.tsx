'use client';

import type { DimensionResult } from '@/lib/v2.5/typing';

interface DimensionCardProps {
  dimension: DimensionResult;
  /** Optional: Show detailed explanation */
  showDetails?: boolean;
}

export default function DimensionCard({ dimension, showDetails = false }: DimensionCardProps) {
  const { code, label, metric, comparison, confidence, hasSufficientData, category } = dimension;

  // Color scheme based on dimension category
  const getDimensionColor = (category: string): string => {
    switch (category) {
      case 'temporal':
        return 'from-purple-500 to-pink-500';
      case 'processing':
        return 'from-blue-500 to-cyan-500';
      case 'discovery':
        return 'from-green-500 to-emerald-500';
      case 'attachment':
        return 'from-orange-500 to-red-500';
      default:
        return 'from-gray-500 to-gray-600';
    }
  };

  // Get dimension description
  const getDimensionDescription = (category: string): string => {
    switch (category) {
      case 'temporal':
        return 'When you listen to music';
      case 'processing':
        return 'How you engage with tracks';
      case 'discovery':
        return 'How you discover new music';
      case 'attachment':
        return 'How you bond with artists';
      default:
        return '';
    }
  };

  const gradientColor = getDimensionColor(category);
  const description = getDimensionDescription(category);

  return (
    <div className="bg-zinc-900/50 border border-zinc-700 rounded-2xl p-6 hover:border-zinc-600 transition-all duration-200">
      {/* Code Badge */}
      <div className="flex items-start justify-between mb-4">
        <div className={`
          w-16 h-16 rounded-xl flex items-center justify-center
          bg-gradient-to-br ${gradientColor}
          shadow-lg
        `}>
          <span className="text-3xl font-black text-white">{code}</span>
        </div>

        {/* Confidence Indicator */}
        {!hasSufficientData && (
          <div className="bg-yellow-500/20 text-yellow-300 text-xs px-2 py-1 rounded-full">
            Low data
          </div>
        )}
      </div>

      {/* Label */}
      <div className="mb-4">
        <h3 className="text-2xl font-bold text-white mb-1">{label}</h3>
        <p className="text-sm text-gray-400">{description}</p>
      </div>

      {/* Metric - Large Display */}
      <div className="mb-3">
        <div className="text-3xl font-black text-white mb-1">
          {metric.split(' ')[0]}
        </div>
        <div className="text-base text-gray-300">
          {metric.split(' ').slice(1).join(' ')}
        </div>
      </div>

      {/* Comparison */}
      <div className="pt-3 border-t border-zinc-700">
        <p className="text-sm text-gray-400">{comparison}</p>
      </div>

      {/* Confidence Bar */}
      {showDetails && (
        <div className="mt-4 pt-4 border-t border-zinc-700">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs text-gray-500">Confidence</span>
            <span className="text-xs font-bold text-gray-400">
              {Math.round(confidence * 100)}%
            </span>
          </div>
          <div className="w-full bg-zinc-800 rounded-full h-2 overflow-hidden">
            <div
              className={`h-full bg-gradient-to-r ${gradientColor} transition-all duration-500`}
              style={{ width: `${confidence * 100}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
