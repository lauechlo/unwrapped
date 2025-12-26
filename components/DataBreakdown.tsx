"use client";

import { useState } from 'react';
import type { DetectionResult } from '@/lib/synthesis/types';

interface DataBreakdownProps {
  detectedPatterns: DetectionResult[];
  topTracks: {
    short: any[];
    medium: any[];
    long: any[];
  };
  topArtists: {
    short: any[];
    medium: any[];
    long: any[];
  };
}

/**
 * Clean, organized view of all data collected from Spotify
 * Shows users exactly what was analyzed and builds trust
 */
export function DataBreakdown({ detectedPatterns, topTracks, topArtists }: DataBreakdownProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <section className="py-16 px-8 bg-gradient-to-b from-zinc-950 to-black">
      <div className="max-w-6xl mx-auto">
        {/* Expandable Header */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full group"
        >
          <div className="flex items-center justify-between p-6 bg-zinc-900/50 border border-zinc-800
                         rounded-xl hover:border-zinc-700 transition-all">
            <div className="flex items-center gap-4">
              <span className="text-3xl">{isExpanded ? '📊' : '📈'}</span>
              <div className="text-left">
                <h2 className="text-2xl font-bold text-white">Your Data Breakdown</h2>
                <p className="text-gray-400 text-sm mt-1">
                  See exactly what we analyzed from your Spotify
                </p>
              </div>
            </div>
            <div className="text-gray-500 text-2xl group-hover:text-white transition-colors">
              {isExpanded ? '▼' : '▶'}
            </div>
          </div>
        </button>

        {/* Expanded Content */}
        {isExpanded && (
          <div className="mt-6 space-y-8">
            {/* Patterns Detected - Grouped by Category */}
            <div className="bg-zinc-900/30 border border-zinc-800 rounded-xl p-6">
              <h3 className="text-xl font-bold text-green-400 mb-2 flex items-center gap-2">
                <span>🎯</span>
                Patterns Detected ({detectedPatterns.length})
              </h3>
              <p className="text-sm text-gray-400 mb-6">
                We analyzed your listening behavior across multiple psychological dimensions
              </p>

              {/* Group patterns by dimension */}
              {(() => {
                const grouped = detectedPatterns.reduce((acc, pattern) => {
                  const dim = pattern.psychologicalDimension;
                  if (!acc[dim]) acc[dim] = [];
                  acc[dim].push(pattern);
                  return acc;
                }, {} as Record<string, typeof detectedPatterns>);

                // Dimension icons and colors
                const dimensionConfig: Record<string, { icon: string; color: string }> = {
                  'identity and attachment': { icon: '💎', color: 'text-purple-400' },
                  'emotional regulation': { icon: '🎭', color: 'text-pink-400' },
                  'memory and avoidance': { icon: '👻', color: 'text-blue-400' },
                  'ritual and repetition': { icon: '🔁', color: 'text-green-400' },
                  'attention and persistence': { icon: '🎯', color: 'text-orange-400' },
                  'cognitive patterns': { icon: '🧠', color: 'text-cyan-400' },
                  'discovery and exploration': { icon: '🔍', color: 'text-yellow-400' },
                  'temporal patterns': { icon: '⏰', color: 'text-red-400' },
                };

                return Object.entries(grouped).map(([dimension, patterns]) => {
                  const config = dimensionConfig[dimension.toLowerCase()] || { icon: '✨', color: 'text-gray-400' };
                  return (
                    <div key={dimension} className="mb-6 last:mb-0">
                      <h4 className={`text-sm font-semibold ${config.color} mb-3 flex items-center gap-2`}>
                        <span>{config.icon}</span>
                        {dimension.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')} ({patterns.length})
                      </h4>
                      <div className="grid md:grid-cols-2 gap-3">
                        {patterns.map((pattern, i) => (
                          <div
                            key={i}
                            className="bg-zinc-800/50 border border-zinc-700 rounded-lg p-3"
                          >
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm font-semibold text-white">
                                {pattern.patternName}
                              </span>
                              <span className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded-full">
                                {Math.round(pattern.confidence * 100)}%
                              </span>
                            </div>
                            {pattern.evidence.length > 0 && (
                              <div className="text-xs text-gray-400 mt-1 line-clamp-2">
                                {pattern.evidence[0].humanReadable}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                });
              })()}
            </div>

            {/* Top Tracks */}
            <div className="bg-zinc-900/30 border border-zinc-800 rounded-xl p-6">
              <h3 className="text-xl font-bold text-blue-400 mb-4 flex items-center gap-2">
                <span>🎵</span>
                Your Top Tracks
              </h3>
              <div className="grid md:grid-cols-3 gap-6">
                {/* Last 4 Weeks */}
                <div>
                  <h4 className="text-sm font-semibold text-gray-400 mb-3">Last 4 Weeks</h4>
                  <div className="space-y-2">
                    {topTracks.short.slice(0, 5).map((track: any, i: number) => (
                      <div key={i} className="text-sm">
                        <div className="text-white font-medium truncate">
                          {i + 1}. {track.name}
                        </div>
                        <div className="text-gray-500 text-xs truncate">
                          {track.artists[0].name}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Last 6 Months */}
                <div>
                  <h4 className="text-sm font-semibold text-gray-400 mb-3">Last 6 Months</h4>
                  <div className="space-y-2">
                    {topTracks.medium.slice(0, 5).map((track: any, i: number) => (
                      <div key={i} className="text-sm">
                        <div className="text-white font-medium truncate">
                          {i + 1}. {track.name}
                        </div>
                        <div className="text-gray-500 text-xs truncate">
                          {track.artists[0].name}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* All Time */}
                <div>
                  <h4 className="text-sm font-semibold text-gray-400 mb-3">All Time</h4>
                  <div className="space-y-2">
                    {topTracks.long.slice(0, 5).map((track: any, i: number) => (
                      <div key={i} className="text-sm">
                        <div className="text-white font-medium truncate">
                          {i + 1}. {track.name}
                        </div>
                        <div className="text-gray-500 text-xs truncate">
                          {track.artists[0].name}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Top Artists */}
            <div className="bg-zinc-900/30 border border-zinc-800 rounded-xl p-6">
              <h3 className="text-xl font-bold text-purple-400 mb-4 flex items-center gap-2">
                <span>🎤</span>
                Your Top Artists
              </h3>
              <div className="grid md:grid-cols-3 gap-6">
                {/* Last 4 Weeks */}
                <div>
                  <h4 className="text-sm font-semibold text-gray-400 mb-3">Last 4 Weeks</h4>
                  <div className="space-y-2">
                    {topArtists.short.slice(0, 5).map((artist: any, i: number) => (
                      <div key={i} className="text-sm text-white truncate">
                        {i + 1}. {artist.name}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Last 6 Months */}
                <div>
                  <h4 className="text-sm font-semibold text-gray-400 mb-3">Last 6 Months</h4>
                  <div className="space-y-2">
                    {topArtists.medium.slice(0, 5).map((artist: any, i: number) => (
                      <div key={i} className="text-sm text-white truncate">
                        {i + 1}. {artist.name}
                      </div>
                    ))}
                  </div>
                </div>

                {/* All Time */}
                <div>
                  <h4 className="text-sm font-semibold text-gray-400 mb-3">All Time</h4>
                  <div className="space-y-2">
                    {topArtists.long.slice(0, 5).map((artist: any, i: number) => (
                      <div key={i} className="text-sm text-white truncate">
                        {i + 1}. {artist.name}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* API Limitations - Transparency */}
            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-6">
              <h3 className="text-lg font-bold text-yellow-400 mb-3 flex items-center gap-2">
                <span>⚠️</span>
                What Spotify's API Gives Us (Data Limitations)
              </h3>
              <p className="text-sm text-gray-300 mb-4">
                Full transparency: Spotify's API doesn't give us your complete listening history.
                Here's exactly what we can access:
              </p>
              <div className="grid md:grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="text-green-400 font-semibold mb-2">✅ What We Have:</div>
                  <ul className="space-y-1 text-gray-300">
                    <li>• Top 50 tracks (3 time periods = ~150 tracks)</li>
                    <li>• Top 50 artists (3 time periods = ~150 artists)</li>
                    <li>• Last 50 recently played songs</li>
                    <li>• Your saved (liked) tracks</li>
                  </ul>
                </div>
                <div>
                  <div className="text-red-400 font-semibold mb-2">❌ What We Don't Have:</div>
                  <ul className="space-y-1 text-gray-300">
                    <li>• Your full listening history</li>
                    <li>• Exact play counts</li>
                    <li>• Complete timestamps</li>
                    <li>• All your playlists</li>
                  </ul>
                </div>
              </div>
              <p className="text-xs text-yellow-300 mt-4 italic">
                💡 This means some patterns are inferred from a snapshot of your data, not your complete history.
                Think of it as analyzing your "greatest hits" rather than every song you've ever played!
              </p>
            </div>

            {/* Privacy Note */}
            <div className="bg-pink-500/10 border border-pink-500/30 rounded-xl p-4">
              <p className="text-sm text-pink-300 text-center">
                🔒 This data stays on your device. We don't store any of your listening history.
              </p>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
