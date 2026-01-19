'use client';

import { useState } from 'react';
import type { DimensionResult } from '@/lib/v2.5/typing';
import ReplayIntensityChart from './visualizations/ReplayIntensityChart';
import DiscoveryTimeline from './visualizations/DiscoveryTimeline';
import AttachmentTimeline from './visualizations/AttachmentTimeline';

interface DimensionDetailCardProps {
  dimension: DimensionResult;
}

/**
 * Full-width V2-style card for dimension display
 * DATA-FIRST: Evidence prominent, prose minimal
 */
export default function DimensionDetailCard({ dimension }: DimensionDetailCardProps) {
  const [evidenceExpanded, setEvidenceExpanded] = useState(false);

  // Theme based on dimension category
  const getDimensionTheme = () => {
    switch (dimension.category) {
      case 'temporal':
        return {
          gradient: 'from-purple-900/20 to-pink-900/20',
          border: 'border-purple-500/40',
          borderAccent: 'border-l-purple-500',
          icon: dimension.code === 'N' ? '🌙' : '☀️',
          accent: 'text-purple-400',
          badgeBg: 'bg-purple-500/20 border-purple-500/40 text-purple-300',
        };
      case 'processing':
        return {
          gradient: 'from-blue-900/20 to-cyan-900/20',
          border: 'border-blue-500/40',
          borderAccent: 'border-l-blue-500',
          icon: dimension.code === 'L' ? '🔁' : '⏩',
          accent: 'text-blue-400',
          badgeBg: 'bg-blue-500/20 border-blue-500/40 text-blue-300',
        };
      case 'discovery':
        return {
          gradient: 'from-green-900/20 to-emerald-900/20',
          border: 'border-green-500/40',
          borderAccent: 'border-l-green-500',
          icon: dimension.code === 'E' ? '🔍' : '🏠',
          accent: 'text-green-400',
          badgeBg: 'bg-green-500/20 border-green-500/40 text-green-300',
        };
      case 'attachment':
        return {
          gradient: 'from-orange-900/20 to-red-900/20',
          border: 'border-orange-500/40',
          borderAccent: 'border-l-orange-500',
          icon: dimension.code === 'A' ? '⚓' : '🌊',
          accent: 'text-orange-400',
          badgeBg: 'bg-orange-500/20 border-orange-500/40 text-orange-300',
        };
    }
  };

  const theme = getDimensionTheme();
  const confidence = Math.round(dimension.confidence * 100);

  return (
    <div
      className={`
        bg-gradient-to-br ${theme.gradient}
        border-2 ${theme.border}
        p-6 md:p-10 rounded-xl md:rounded-2xl
        transition-all
      `}
    >
      {/* Header: Icon + Label + Confidence */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <span className="text-3xl md:text-4xl">{theme.icon}</span>
          <h3 className="text-2xl md:text-3xl font-bold text-white">
            {dimension.label}
          </h3>
        </div>

        {/* Confidence Badge */}
        <div className={`
          ${theme.badgeBg} border
          px-3 py-1 md:px-4 md:py-2 rounded-full
          text-xs font-bold
        `}>
          {confidence}% confidence
        </div>
      </div>

      {/* Key Finding - DATA FIRST */}
      <div className={`
        bg-zinc-900/30 border-l-4 ${theme.borderAccent}
        p-4 md:p-6 rounded-r-lg mb-5
      `}>
        <div className="text-xs font-bold uppercase text-gray-300 mb-3">
          📊 Data
        </div>
        <p className="text-white text-xl md:text-2xl font-bold mb-2">
          {dimension.metric}
        </p>
        <p className="text-gray-300 text-sm md:text-base">
          {dimension.comparison}
        </p>
      </div>

      {/* Evidence Section - ALWAYS VISIBLE */}
      {dimension.evidence && dimension.evidence.topExamples.length > 0 && (
        <div className="mt-5 pt-5 border-t border-zinc-700">
          <button
            onClick={() => setEvidenceExpanded(!evidenceExpanded)}
            className={`
              w-full flex items-center justify-between
              text-left ${theme.accent} font-semibold text-base md:text-lg
              mb-4 hover:opacity-80 transition-opacity
            `}
          >
            <span>📍 Evidence</span>
            <span className={`
              text-sm transition-transform duration-200
              ${evidenceExpanded ? 'rotate-180' : ''}
            `}>
              ▼
            </span>
          </button>

          {evidenceExpanded && (
            <div className="space-y-5">
              {/* Evidence examples */}
              <div className="space-y-3">
                {dimension.evidence.topExamples.map((example, idx) => (
                  <div
                    key={idx}
                    className="bg-zinc-800/50 rounded-lg p-4 md:p-5"
                  >
                    <div className="text-xs text-gray-500 uppercase tracking-wide mb-1.5">
                      {example.label}
                    </div>
                    <div className="text-white font-bold text-base md:text-lg mb-1">
                      {example.value}
                    </div>
                    <div className="text-sm md:text-base text-gray-300">
                      {example.detail}
                    </div>
                    {example.emphasis && (
                      <div className={`text-sm md:text-base ${theme.accent} font-medium mt-2`}>
                        {example.emphasis}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Visualization - Processing: Replay Intensity */}
              {dimension.category === 'processing' &&
                dimension.evidence.visualizationData?.type === 'replayIntensity' && (
                  <div className="bg-zinc-900/50 border border-zinc-700 rounded-lg p-5 md:p-6">
                    <div className="text-sm font-bold uppercase text-gray-300 mb-4">
                      📊 Replay Intensity
                    </div>
                    <ReplayIntensityChart
                      tracks={dimension.evidence.visualizationData.tracks}
                      maxDisplay={10}
                    />
                  </div>
                )}

              {/* Visualization - Discovery: Timeline */}
              {dimension.category === 'discovery' &&
                dimension.evidence.visualizationData?.type === 'discoveryTimeline' && (
                  <div className="bg-zinc-900/50 border border-zinc-700 rounded-lg p-5 md:p-6">
                    <div className="text-sm font-bold uppercase text-gray-300 mb-4">
                      📈 Discovery Over Time
                    </div>
                    <DiscoveryTimeline
                      monthlyData={dimension.evidence.visualizationData.monthlyData}
                    />
                  </div>
                )}

              {/* Visualization - Attachment: Timeline */}
              {dimension.category === 'attachment' &&
                dimension.evidence.visualizationData?.type === 'attachmentTimeline' && (
                  <div className="bg-zinc-900/50 border border-zinc-700 rounded-lg p-5 md:p-6">
                    <div className="text-sm font-bold uppercase text-gray-300 mb-4">
                      ⚓ Artist Loyalty Over Time
                    </div>
                    <AttachmentTimeline
                      monthlyTopArtists={dimension.evidence.visualizationData.monthlyTopArtists}
                      maxDisplay={12}
                    />
                  </div>
                )}
            </div>
          )}
        </div>
      )}

      {/* Low Data Warning */}
      {!dimension.hasSufficientData && (
        <div className="mt-5 bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
          <p className="text-xs text-yellow-200">
            ⚠️ Limited data for this dimension. Upload all Extended History files for more accurate results.
          </p>
        </div>
      )}
    </div>
  );
}
