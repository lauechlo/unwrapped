'use client';

import { useState, useMemo } from 'react';

interface TimelinePattern {
  id: string;
  name: string;
  family: string;
  icon: string;
  date: Date;
  dateLabel: string;
  confidence: number;
  evidence: string[];
}

interface ListeningJourneyTimelineProps {
  patterns: any[];
}

// Pattern family to icon mapping
const PATTERN_ICONS: Record<string, string> = {
  'loyalty_dropoff': '👻',
  'loyalty_retention': '💎',
  'temporal': '🕐',
  'diversity': '🔍',
  'repetition': '🔁',
  'behavioral': '🎯',
  'evolution': '🌱',
};

// Pattern family to color mapping
const PATTERN_COLORS: Record<string, string> = {
  'loyalty_dropoff': 'from-purple-500 to-pink-500',
  'loyalty_retention': 'from-blue-500 to-cyan-500',
  'temporal': 'from-orange-500 to-yellow-500',
  'diversity': 'from-green-500 to-emerald-500',
  'repetition': 'from-pink-500 to-rose-500',
  'behavioral': 'from-indigo-500 to-purple-500',
  'evolution': 'from-teal-500 to-green-500',
};

export default function ListeningJourneyTimeline({ patterns }: ListeningJourneyTimelineProps) {
  const [selectedPattern, setSelectedPattern] = useState<TimelinePattern | null>(null);
  const [expandedEvidence, setExpandedEvidence] = useState<Set<string>>(new Set());

  const toggleEvidence = (patternId: string, evidenceIndex: number) => {
    const key = `${patternId}-${evidenceIndex}`;
    const newSet = new Set(expandedEvidence);
    if (newSet.has(key)) {
      newSet.delete(key);
    } else {
      newSet.add(key);
    }
    setExpandedEvidence(newSet);
  };

  // Extract temporal information from patterns
  const timelinePatterns = useMemo(() => {
    const extracted: TimelinePattern[] = [];

    patterns.forEach((pattern) => {
      // Look for timestamp evidence
      const timestampEvidence = pattern.evidence?.find(
        (e: any) => e.type === 'timestamp' && (e.metric === 'last_played' || e.metric === 'peak_month' || e.metric === 'time_window')
      );

      if (timestampEvidence) {
        let date: Date;
        let dateLabel: string;

        // Parse different timestamp formats
        if (timestampEvidence.value.includes('T')) {
          // ISO string
          date = new Date(timestampEvidence.value);
          dateLabel = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
        } else if (timestampEvidence.value.match(/^\d{4}-\d{2}$/)) {
          // YYYY-MM format
          const [year, month] = timestampEvidence.value.split('-');
          date = new Date(parseInt(year), parseInt(month) - 1, 1);
          dateLabel = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
        } else {
          // Fallback - use current date
          date = new Date();
          dateLabel = 'Recent';
        }

        // Collect evidence strings
        const evidenceStrings = pattern.evidence
          ?.filter((e: any) => e.type === 'artist' || e.type === 'track')
          .map((e: any) => e.humanReadable)
          .slice(0, 3) || [];

        extracted.push({
          id: pattern.patternId,
          name: pattern.patternName,
          family: pattern.patternFamily,
          icon: PATTERN_ICONS[pattern.patternFamily] || '🎵',
          date,
          dateLabel,
          confidence: pattern.confidence,
          evidence: evidenceStrings,
        });
      }
    });

    // Sort chronologically first
    const sorted = extracted.sort((a, b) => a.date.getTime() - b.date.getTime());

    // Apply diversity logic - prevent more than 3 consecutive patterns of same family
    const diversified: TimelinePattern[] = [];
    const familyCount: Record<string, number> = {};

    for (const pattern of sorted) {
      const recentFamily = familyCount[pattern.family] || 0;

      // If we already have 3+ of this family, skip to promote diversity
      // unless we have very few patterns total
      if (recentFamily >= 3 && sorted.length > 6) {
        continue;
      }

      diversified.push(pattern);

      // Update family count
      familyCount[pattern.family] = (familyCount[pattern.family] || 0) + 1;
    }

    return diversified;
  }, [patterns]);

  if (timelinePatterns.length === 0) {
    return null;
  }

  return (
    <section className="py-16 px-4 md:px-8 bg-gradient-to-b from-black to-zinc-950">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-3">
            Your Listening Journey
          </h2>
          <p className="text-gray-300">
            A timeline of your musical patterns and moments
          </p>
        </div>

        {/* Timeline Container */}
        <div className="relative">
          {/* Timeline Line */}
          <div className="absolute left-8 md:left-1/2 top-0 bottom-0 w-0.5 bg-gradient-to-b from-purple-500/50 via-pink-500/50 to-purple-500/50" />

          {/* Timeline Events */}
          <div className="space-y-8">
            {timelinePatterns.map((pattern, index) => {
              const isLeft = index % 2 === 0;

              return (
                <div
                  key={`${pattern.id}-${index}`}
                  className={`relative flex items-center ${
                    isLeft ? 'md:flex-row' : 'md:flex-row-reverse'
                  } flex-row`}
                >
                  {/* Spacer for desktop */}
                  <div className="hidden md:block md:w-1/2" />

                  {/* Timeline Dot */}
                  <div className="absolute left-8 md:left-1/2 -ml-3 md:-ml-4 w-6 h-6 md:w-8 md:h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 border-4 border-black flex items-center justify-center z-10">
                    <span className="text-xs md:text-base">{pattern.icon}</span>
                  </div>

                  {/* Content Card */}
                  <div className={`ml-20 md:ml-0 md:w-1/2 ${isLeft ? 'md:pr-12' : 'md:pl-12'}`}>
                    <button
                      onClick={() => setSelectedPattern(selectedPattern?.id === pattern.id ? null : pattern)}
                      className={`w-full text-left bg-zinc-900 border-2 hover:border-purple-500 transition-all rounded-lg p-4 ${
                        selectedPattern?.id === pattern.id ? 'border-purple-500 ring-2 ring-purple-500/50' : 'border-zinc-700'
                      }`}
                    >
                      {/* Date Label */}
                      <div className="text-xs md:text-sm text-purple-400 font-semibold mb-2">
                        {pattern.dateLabel}
                      </div>

                      {/* Pattern Name */}
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xl md:text-2xl">{pattern.icon}</span>
                        <h3 className="text-base md:text-lg font-bold text-white">
                          {pattern.name}
                        </h3>
                      </div>

                      {/* Confidence Badge */}
                      <div className="mb-3">
                        <div className="inline-block px-2 py-1 bg-zinc-800 rounded text-xs text-gray-300">
                          {(pattern.confidence * 100).toFixed(0)}% confidence
                        </div>
                      </div>

                      {/* Evidence Preview (only when selected) */}
                      {selectedPattern?.id === pattern.id && pattern.evidence.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-zinc-700 space-y-2">
                          {pattern.evidence.map((ev, idx) => {
                            const evidenceKey = `${pattern.id}-${idx}`;
                            const isExpanded = expandedEvidence.has(evidenceKey);

                            // Try to parse track lists from evidence
                            // Pattern: "Artist: track1, track2, track3" or "Abandoned: track1, track2"
                            const trackListMatch = ev.match(/^(.+?):\s*(.+)$/);

                            if (trackListMatch) {
                              const [, label, trackList] = trackListMatch;
                              const tracks = trackList.split(',').map(t => t.trim());

                              // If more than 1 track, show collapsed version
                              if (tracks.length > 1) {
                                const artistName = label.includes('Artist') || label.includes('Abandoned')
                                  ? label
                                  : tracks[0].split(' - ')[0] || label;
                                const firstTrack = tracks[0];

                                return (
                                  <div key={idx} className="text-sm text-gray-300">
                                    <div className="flex items-start gap-2">
                                      <span className="text-purple-400">•</span>
                                      <div className="flex-1">
                                        {isExpanded ? (
                                          // Expanded: Show all tracks
                                          <div>
                                            <p className="font-semibold mb-1">{label}:</p>
                                            <ul className="ml-4 space-y-1">
                                              {tracks.map((track, i) => (
                                                <li key={i} className="text-xs text-gray-300">
                                                  {i + 1}. {track}
                                                </li>
                                              ))}
                                            </ul>
                                          </div>
                                        ) : (
                                          // Collapsed: Show artist + first track only
                                          <p>
                                            <span className="font-semibold">{label}</span>
                                            <span className="text-gray-300"> · {firstTrack}</span>
                                          </p>
                                        )}
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            toggleEvidence(pattern.id, idx);
                                          }}
                                          className="mt-1 text-xs text-purple-400 hover:text-purple-300 underline"
                                        >
                                          {isExpanded ? '▲ Show less' : `▼ See all ${tracks.length} tracks`}
                                        </button>
                                      </div>
                                    </div>
                                  </div>
                                );
                              }
                            }

                            // No track list detected or only 1 item - show as is
                            return (
                              <p key={idx} className="text-sm text-gray-300">
                                • {ev}
                              </p>
                            );
                          })}
                        </div>
                      )}

                      {/* Click Hint */}
                      {selectedPattern?.id !== pattern.id && (
                        <p className="text-xs text-gray-500 mt-2">
                          Click to see details
                        </p>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Legend */}
        <div className="mt-12 text-center">
          <p className="text-sm text-gray-500">
            Scroll down to see detailed narrative cards for each pattern ↓
          </p>
        </div>
      </div>
    </section>
  );
}
