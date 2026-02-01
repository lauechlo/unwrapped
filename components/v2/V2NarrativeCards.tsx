'use client';

import { useState, useEffect } from 'react';
import type { PatternNarrative } from '@/lib/v2/synthesis/types';
import LoopIntensityMeter from './LoopIntensityMeter';
import TemporalDistribution from './TemporalDistribution';
// ShareButton removed - V2 is deprecated, use V2.5 TypeShareButton instead
import { trackNarrativeFeedback } from '@/lib/feedback';
import { getTestVariant, trackABTestMetric } from '@/lib/abtest';

// Enhanced tooltip component for confidence badges with full methodology
function ConfidenceBadge({ confidence, theme, narrative }: { confidence: number; theme: any; narrative?: any }) {
  const [showTooltip, setShowTooltip] = useState(false);

  const confidencePercent = Math.round(confidence * 100);
  const confidenceLevel = confidencePercent >= 90 ? 'high' : confidencePercent >= 70 ? 'medium' : 'emerging';
  const confidenceColor = confidenceLevel === 'high' ? 'text-green-400' : confidenceLevel === 'medium' ? 'text-amber-400' : 'text-blue-400';

  // Extract metrics from narrative (if available)
  const hasSkipData = narrative?.finding?.match(/(\d+)%\s+skip/i);
  const hasCompletionData = narrative?.finding?.match(/(\d+)%\s+completion/i);
  const hasPlaysData = narrative?.finding?.match(/(\d+)\s+(?:consecutive\s+)?plays?/i);

  return (
    <div
      className="relative inline-block"
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      <div className={`${theme.badge} border px-3 py-1 md:px-4 md:py-2 rounded-full text-xs cursor-help flex items-center gap-1`}>
        <span>{confidencePercent}% confidence</span>
        <span className="text-[10px] opacity-60">?</span>
      </div>

      {/* Enhanced Tooltip with Full Methodology */}
      {showTooltip && (
        <div className="absolute z-50 left-0 top-full mt-2 w-80 max-w-[90vw] bg-zinc-900 border border-zinc-700 rounded-lg shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-purple-600/20 to-pink-600/20 border-b border-zinc-700 p-3">
            <h4 className="text-sm font-bold text-white mb-1">Why {confidencePercent}% Confidence?</h4>
            <p className={`text-xs font-semibold ${confidenceColor}`}>
              {confidenceLevel === 'high' ? '✓ High Confidence Pattern' : confidenceLevel === 'medium' ? '⚠ Medium Confidence Pattern' : '○ Emerging Pattern'}
            </p>
          </div>

          {/* Methodology Breakdown */}
          <div className="p-4 space-y-3">
            {/* Data Consistency */}
            <div>
              <h5 className="text-xs font-bold text-gray-300 mb-1.5 flex items-center gap-1">
                <span className="text-green-400">✓</span> Data Consistency
              </h5>
              <ul className="text-xs text-gray-300 space-y-1 pl-4">
                {hasSkipData && <li>• Low skip rate detected in evidence</li>}
                {hasCompletionData && <li>• High completion rate observed</li>}
                {confidenceLevel === 'high' && <li>• Low variance across observations</li>}
                {!hasSkipData && !hasCompletionData && <li>• Pattern consistent across data points</li>}
              </ul>
            </div>

            {/* Sample Size */}
            <div>
              <h5 className="text-xs font-bold text-gray-300 mb-1.5 flex items-center gap-1">
                <span className="text-blue-400">✓</span> Sample Size
              </h5>
              <ul className="text-xs text-gray-300 space-y-1 pl-4">
                {hasPlaysData ? (
                  <li>• {hasPlaysData[1]} observations detected</li>
                ) : (
                  <li>• Multiple data points analyzed</li>
                )}
                {confidenceLevel === 'high' && <li>• Sufficient data for reliable pattern</li>}
              </ul>
            </div>

            {/* Behavioral Clarity */}
            <div>
              <h5 className="text-xs font-bold text-gray-300 mb-1.5 flex items-center gap-1">
                <span className="text-purple-400">✓</span> Behavioral Clarity
              </h5>
              <ul className="text-xs text-gray-300 space-y-1 pl-4">
                <li>• {confidenceLevel === 'high' ? 'Clear, unambiguous pattern' : 'Pattern detected with some variation'}</li>
                <li>• {confidenceLevel === 'high' ? 'No noise or randomness detected' : 'Moderate signal strength'}</li>
              </ul>
            </div>

            {/* What This Does NOT Mean */}
            <div className="pt-3 border-t border-zinc-700">
              <h5 className="text-xs font-bold text-yellow-400 mb-1.5">⚠️ What This Does NOT Mean:</h5>
              <ul className="text-xs text-gray-500 space-y-1 pl-4">
                <li>• Not diagnosing emotional state</li>
                <li>• Behavior only, not well-being</li>
                {confidenceLevel !== 'high' && <li>• Pattern may evolve over time</li>}
              </ul>
            </div>

            {/* Learn More Link */}
            <div className="pt-2">
              <a
                href="/methodology"
                className="text-xs text-purple-400 hover:text-purple-300 underline inline-flex items-center gap-1"
                onClick={(e) => e.stopPropagation()}
              >
                Learn about our confidence methodology →
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

interface V2NarrativeCardsProps {
  narratives: PatternNarrative[];
}

export default function V2NarrativeCards({ narratives }: V2NarrativeCardsProps) {
  const [expandedCards, setExpandedCards] = useState<Set<number>>(new Set());
  const [expandedEvidence, setExpandedEvidence] = useState<Set<string>>(new Set());
  const [collapsedCards, setCollapsedCards] = useState<Set<number>>(new Set());
  const [narrativeFeedback, setNarrativeFeedback] = useState<Map<number, 'up' | 'down'>>(new Map());
  const [shareCount, setShareCount] = useState(0);
  const [showProofCount, setShowProofCount] = useState(0);
  const [expandedGroupInstances, setExpandedGroupInstances] = useState<Set<string>>(new Set());

  // Group narratives by patternId
  interface NarrativeGroup {
    patternId: string;
    patternName: string;
    instances: Array<{ narrative: PatternNarrative; originalIndex: number }>;
  }

  const groupedNarratives: NarrativeGroup[] = [];
  const patternMap = new Map<string, NarrativeGroup>();

  narratives.forEach((narrative, idx) => {
    if (!patternMap.has(narrative.patternId)) {
      const group: NarrativeGroup = {
        patternId: narrative.patternId,
        patternName: narrative.title.split(':')[0] || narrative.title.split('—')[0] || narrative.title, // Extract base pattern name
        instances: [],
      };
      patternMap.set(narrative.patternId, group);
      groupedNarratives.push(group);
    }
    patternMap.get(narrative.patternId)!.instances.push({ narrative, originalIndex: idx });
  });

  // Get A/B test variant assignment (for narrative tone test)
  useEffect(() => {
    // Initialize test variant (assigns user to A or B if not already assigned)
    getTestVariant('narrative_tone_v1');
  }, []);

  const toggleCard = (idx: number) => {
    setExpandedCards(prev => {
      const newSet = new Set(prev);
      if (newSet.has(idx)) {
        newSet.delete(idx);
      } else {
        newSet.add(idx);
        // Track "Show Proof" click
        setShowProofCount(c => c + 1);
      }
      return newSet;
    });
  };

  const toggleCardCollapse = (idx: number) => {
    setCollapsedCards(prev => {
      const newSet = new Set(prev);
      if (newSet.has(idx)) {
        newSet.delete(idx);
      } else {
        newSet.add(idx);
      }
      return newSet;
    });
  };

  const toggleEvidence = (cardIdx: number, evidenceIdx: number) => {
    const key = `${cardIdx}-${evidenceIdx}`;
    setExpandedEvidence(prev => {
      const newSet = new Set(prev);
      if (newSet.has(key)) {
        newSet.delete(key);
      } else {
        newSet.add(key);
      }
      return newSet;
    });
  };

  const toggleGroupInstance = (groupId: string, instanceIdx: number) => {
    const key = `${groupId}-${instanceIdx}`;
    setExpandedGroupInstances(prev => {
      const newSet = new Set(prev);
      if (newSet.has(key)) {
        newSet.delete(key);
      } else {
        newSet.add(key);
      }
      return newSet;
    });
  };

  // Extract track/artist name from narrative title for accordion preview
  const getPreviewText = (narrative: PatternNarrative): string => {
    // Try to extract quoted text (track names)
    const quotedMatch = narrative.title.match(/["']([^"']+)["']/);
    if (quotedMatch) return quotedMatch[1];

    // Try to extract artist from finding
    const artistMatch = narrative.finding.match(/by ([A-Za-z\s&]+)/i);
    if (artistMatch) return artistMatch[1].trim();

    // Fallback to first few words of title
    return narrative.title.substring(0, 50);
  };

  const handleFeedback = (idx: number, type: 'up' | 'down') => {
    const narrative = narratives[idx];

    // Update local state
    setNarrativeFeedback(prev => {
      const newMap = new Map(prev);
      newMap.set(idx, type);
      return newMap;
    });

    // Track in feedback system
    trackNarrativeFeedback(
      `narrative-${idx}`,
      narrative.title,
      narrative.patternFamily,
      type
    );

    // Track A/B test metrics
    const currentFeedback = Array.from(narrativeFeedback.entries());
    const thumbsUpCount = currentFeedback.filter(([_, v]) => v === 'up').length + (type === 'up' ? 1 : 0);
    const thumbsDownCount = currentFeedback.filter(([_, v]) => v === 'down').length + (type === 'down' ? 1 : 0);

    trackABTestMetric('narrative_tone_v1', {
      thumbsUpCount,
      thumbsDownCount,
      shareCount,
      showProofClicks: showProofCount,
    });
  };

  // Group by pattern family for color coding
  const familyThemes: Record<string, { gradient: string; border: string; badge: string; accent: string }> = {
    'diversity': {
      gradient: 'from-yellow-900/20 to-orange-900/20',
      border: 'border-yellow-500/40',
      badge: 'bg-yellow-500/20 border-yellow-500/40 text-yellow-300',
      accent: 'text-yellow-400',
    },
    'loyalty_retention': {
      gradient: 'from-purple-900/20 to-pink-900/20',
      border: 'border-purple-500/40',
      badge: 'bg-purple-500/20 border-purple-500/40 text-purple-300',
      accent: 'text-purple-400',
    },
    'engagement': {
      gradient: 'from-blue-900/20 to-cyan-900/20',
      border: 'border-blue-500/40',
      badge: 'bg-blue-500/20 border-blue-500/40 text-blue-300',
      accent: 'text-blue-400',
    },
    'repetition': {
      gradient: 'from-green-900/20 to-emerald-900/20',
      border: 'border-green-500/40',
      badge: 'bg-green-500/20 border-green-500/40 text-green-300',
      accent: 'text-green-400',
    },
    'temporal': {
      gradient: 'from-red-900/20 to-orange-900/20',
      border: 'border-red-500/40',
      badge: 'bg-red-500/20 border-red-500/40 text-red-300',
      accent: 'text-red-400',
    },
    'evolution': {
      gradient: 'from-pink-900/20 to-purple-900/20',
      border: 'border-pink-500/40',
      badge: 'bg-pink-500/20 border-pink-500/40 text-pink-300',
      accent: 'text-pink-400',
    },
  };

  return (
    <section className="py-16 md:py-24 px-4 md:px-8 bg-black">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-bold mb-10 md:mb-16 text-center px-2">Your Listening Patterns</h2>

        <div className="grid gap-8 md:gap-12">
          {groupedNarratives.map((group, groupIdx) => {
            const firstNarrative = group.instances[0].narrative;
            const theme = familyThemes[firstNarrative.patternFamily] || familyThemes['engagement'];
            const isLifeEvent = group.patternId === 'life-event';
            const isGrouped = group.instances.length > 1;

            // For single instances, render normal card
            if (!isGrouped) {
              const { narrative, originalIndex: idx } = group.instances[0];
              const isCollapsed = collapsedCards.has(idx);

              return (
              <div
                key={idx}
                id={`narrative-card-${idx}`}
                className={`bg-gradient-to-br ${theme.gradient} ${
                  isLifeEvent
                    ? 'border-4 border-amber-500 shadow-[0_0_30px_rgba(245,158,11,0.3)]'
                    : `border-2 ${theme.border}`
                } p-4 md:p-10 rounded-xl md:rounded-2xl transition-all ${
                  isLifeEvent ? 'relative overflow-hidden' : ''
                }`}
              >
                {/* Life Event Special Badge */}
                {isLifeEvent && (
                  <div className="absolute top-4 right-4 bg-amber-500/20 border-2 border-amber-500 px-3 py-1.5 rounded-full flex items-center gap-2 animate-pulse">
                    <span className="text-xl">📍</span>
                    <span className="text-xs font-bold text-amber-300 uppercase tracking-wide">
                      Something Happened Here
                    </span>
                  </div>
                )}

                {/* Title - Viral Label - Clickable to Collapse */}
                <div
                  className="mb-4 md:mb-6 cursor-pointer select-none"
                  onClick={() => toggleCardCollapse(idx)}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="mb-3 md:mb-4">
                        <ConfidenceBadge confidence={narrative.confidence} theme={theme} narrative={narrative} />
                      </div>
                      <h3 className={`${
                        isLifeEvent ? 'text-2xl sm:text-3xl md:text-4xl' : 'text-xl sm:text-2xl md:text-2xl'
                      } font-bold text-white mb-3 md:mb-4 leading-tight ${
                        isLifeEvent ? 'pr-32' : ''
                      }`}>
                        {narrative.title}
                      </h3>
                    </div>
                    <div className={`text-2xl md:text-3xl text-gray-300 transition-transform duration-200 flex-shrink-0 ${isCollapsed ? '' : 'rotate-180'}`}>
                      ▼
                    </div>
                  </div>
                </div>

                {/* Card Body - Collapsible */}
                {!isCollapsed && (
                  <>
                    {/* Evidence Tree - Tiered Disclosure */}
                    <div className="space-y-4 md:space-y-5 mb-5 md:mb-7">
                      {/* Tier 1: Key Finding */}
                      <div className={`bg-zinc-900/30 border-l-4 ${theme.border.split(' ')[0].replace('border-', 'border-l-')} p-4 md:p-5 rounded-r-lg`}>
                        <div className="flex items-center gap-2 mb-2">
                          <span className={`${theme.accent} text-xs font-bold uppercase tracking-wide`}>Key Finding</span>
                        </div>
                        <p className="text-gray-200 text-sm md:text-base leading-relaxed font-medium">
                          {narrative.finding}
                        </p>
                      </div>

                      {/* Tier 2: Psychological Context */}
                      <div className={`bg-zinc-900/20 border-l-4 ${theme.border.split(' ')[0].replace('border-', 'border-l-')} p-4 md:p-5 rounded-r-lg`}>
                        <div className="flex items-center gap-2 mb-2">
                          <span className={`${theme.accent} text-xs font-bold uppercase tracking-wide opacity-80`}>
                            Psychological Context
                          </span>
                        </div>
                        <p className="text-gray-300 text-sm md:text-base leading-relaxed">
                          {narrative.context}
                        </p>
                      </div>
                    </div>

                    {/* Insight Summary */}
                    <div className="bg-zinc-950/50 border border-zinc-800 p-5 md:p-7 rounded-lg md:rounded-xl mb-4 md:mb-5">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs text-gray-500 uppercase tracking-wide font-semibold">Insight</span>
                      </div>
                      <p className="text-base md:text-lg text-gray-300 leading-relaxed">
                        {narrative.callout}
                      </p>
                    </div>

                    {/* Disclaimer */}
                    <div className="bg-zinc-800/50 border border-zinc-700 rounded-lg p-3 mb-4 md:mb-5">
                      <p className="text-xs text-gray-400">
                        Based on listening behavior only—not a diagnosis or assessment of well-being.
                      </p>
                    </div>

                    {/* Collapsible Visualizations */}
                    <div className="space-y-3 mb-4">
                      {/* Loop Intensity Meter - for looper/repetition patterns */}
                      {narrative.patternFamily === 'repetition' && narrative.finding.includes('play') && (
                        <details className="group">
                          <summary className="cursor-pointer list-none">
                            <div className="flex items-center justify-between p-4 bg-zinc-900/50 border border-zinc-700 rounded-lg hover:bg-zinc-900/70 transition-colors">
                              <span className="text-sm font-semibold text-purple-400">▼ View Loop Intensity Profile</span>
                              <span className="text-xs text-gray-500 group-open:hidden">Expand</span>
                            </div>
                          </summary>
                          <div className="mt-2">
                            <LoopIntensityMeter
                              plays={parseInt(narrative.finding.match(/(\d+)\s+(?:consecutive\s+)?plays?/i)?.[1] || '0')}
                              completionRate={parseInt(narrative.finding.match(/(\d+)%\s+completion/i)?.[1] || '0')}
                              skipRate={parseInt(narrative.finding.match(/(\d+)%\s+skip/i)?.[1] || '0')}
                            />
                          </div>
                        </details>
                      )}

                      {/* Temporal Distribution - DISABLED: Shows hardcoded dummy data that conflicts with actual evidence
                          The real time breakdown is shown in the evidence section below
                      {(narrative.patternFamily === 'temporal' || narrative.finding.match(/\d+(?:am|pm)/i)) && (
                        <details className="group">
                          <summary className="cursor-pointer list-none">
                            <div className="flex items-center justify-between p-4 bg-zinc-900/50 border border-zinc-700 rounded-lg hover:bg-zinc-900/70 transition-colors">
                              <span className="text-sm font-semibold text-blue-400">▼ View Temporal Patterns</span>
                              <span className="text-xs text-gray-500 group-open:hidden">Expand</span>
                            </div>
                          </summary>
                          <div className="mt-2">
                            <TemporalDistribution
                              timeSlots={[
                                // Parse from finding - this is a simplified example
                                { hour: '5pm', percentage: 14, plays: 2 },
                                { hour: '6pm', percentage: 71, plays: 5 },
                                { hour: '7pm', percentage: 14, plays: 1 },
                              ]}
                              dominantHour="6pm"
                              pattern="Weekday afternoon ritual"
                            />
                          </div>
                        </details>
                      )} */}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col sm:flex-row gap-3 mt-2">
                      {/* Show Proof Button - V1 Style */}
                      <button
                        onClick={() => toggleCard(idx)}
                        className="group relative flex-1 px-4 md:px-6 py-3 md:py-4 bg-gradient-to-r from-purple-600 to-pink-600
                                 hover:from-purple-500 hover:to-pink-500 text-white font-semibold rounded-xl
                                 transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/50
                                 flex items-center justify-center gap-2 md:gap-3 text-base md:text-lg min-h-[44px]"
                      >
                        <span className="text-xl md:text-2xl">{expandedCards.has(idx) ? '📊' : '🔍'}</span>
                        <span>{expandedCards.has(idx) ? 'Hide Evidence' : 'Show Proof'}</span>
                        <div className="absolute inset-0 bg-gradient-to-r from-purple-400 to-pink-400 opacity-0
                                     group-hover:opacity-20 rounded-xl transition-opacity blur-xl" />
                      </button>

                      {/* Share Button - V2 deprecated, share via V2.5 TypeShareButton */}
                    </div>

                    {/* Feedback Buttons - Thumbs Up/Down */}
                    <div className="mt-4 pt-4 border-t border-zinc-700/50">
                      <p className="text-xs text-gray-300 mb-3 text-center">How accurate is this insight?</p>
                      <div className="flex gap-3">
                        <button
                          onClick={() => handleFeedback(idx, 'up')}
                          className={`flex-1 px-4 py-3 rounded-lg font-medium transition-all flex items-center justify-center gap-2 ${
                            narrativeFeedback.get(idx) === 'up'
                              ? 'bg-green-600 text-white shadow-lg shadow-green-500/30'
                              : 'bg-zinc-800 hover:bg-zinc-700 text-gray-300 border border-zinc-700'
                          }`}
                        >
                          <span className="text-xl">👍</span>
                          <span className="text-sm">Accurate</span>
                        </button>
                        <button
                          onClick={() => handleFeedback(idx, 'down')}
                          className={`flex-1 px-4 py-3 rounded-lg font-medium transition-all flex items-center justify-center gap-2 ${
                            narrativeFeedback.get(idx) === 'down'
                              ? 'bg-red-600 text-white shadow-lg shadow-red-500/30'
                              : 'bg-zinc-800 hover:bg-zinc-700 text-gray-300 border border-zinc-700'
                          }`}
                        >
                          <span className="text-xl">👎</span>
                          <span className="text-sm">Not Quite</span>
                        </button>
                      </div>

                      {/* Thank You Message */}
                      {narrativeFeedback.has(idx) && (
                        <div className="mt-3 text-center">
                          <p className="text-xs text-gray-500">
                            {narrativeFeedback.get(idx) === 'up'
                              ? '✓ Thanks! Glad this resonated'
                              : '✓ Thanks for the feedback'}
                          </p>
                        </div>
                      )}
                    </div>

                {/* Detailed Evidence - Collapsible - V1 Style */}
                {expandedCards.has(idx) && (
                  <div className={`mt-4 ${theme.badge.split(' ')[0]} border ${theme.badge.split(' ')[1]} rounded-lg p-4`}>
                    <p className={`text-xs ${theme.accent} uppercase tracking-wide mb-3`}>📊 Detailed Evidence</p>
                    <ul className="space-y-3">
                      {narrative.evidenceSummary.map((evidence, i) => {
                        const evidenceKey = `${idx}-${i}`;
                        const isExpanded = expandedEvidence.has(evidenceKey);

                        // Check if evidence has multiple lines (likely a long list)
                        const lines = evidence.split('\n');
                        const hasLongList = lines.length > 15; // More than 15 lines
                        const truncatedEvidence = hasLongList && !isExpanded
                          ? lines.slice(0, 10).join('\n') + `\n... (${lines.length - 10} more items)`
                          : evidence;

                        return (
                          <li key={i} className={`text-sm text-gray-300 pl-4 border-l-2 ${theme.border.split(' ')[0].replace('border-', 'border-l-')}`}>
                            <div className="whitespace-pre-line">{truncatedEvidence}</div>
                            {hasLongList && (
                              <button
                                onClick={() => toggleEvidence(idx, i)}
                                className={`mt-2 text-xs ${theme.accent} hover:underline focus:outline-none`}
                              >
                                {isExpanded ? '▲ Show Less' : `▼ Show All ${lines.length} Items`}
                              </button>
                            )}
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                )}
                  </>
                )}
              </div>
              );
            }

            // For grouped instances (2+), render accordion
            return (
              <div
                key={`group-${groupIdx}`}
                className={`bg-gradient-to-br ${theme.gradient} border-2 ${theme.border} p-4 md:p-8 rounded-xl md:rounded-2xl`}
              >
                {/* Group Header */}
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-2xl md:text-3xl font-bold text-white">
                      {group.patternName}
                    </h3>
                    <div className="bg-zinc-800/80 px-3 py-1 rounded-full">
                      <span className="text-sm font-bold text-gray-300">
                        {group.instances.length} moments detected
                      </span>
                    </div>
                  </div>
                  <p className="text-gray-300 text-sm">
                    You had multiple instances of this pattern throughout your listening history
                  </p>
                </div>

                {/* Accordion Instances */}
                <div className="space-y-3">
                  {group.instances.map(({ narrative, originalIndex: idx }, instanceIdx) => {
                    const key = `${group.patternId}-${instanceIdx}`;
                    const isExpanded = expandedGroupInstances.has(key);
                    const previewText = getPreviewText(narrative);

                    return (
                      <div key={key} className="border border-zinc-700 rounded-lg overflow-hidden">
                        {/* Accordion Header - Clickable */}
                        <button
                          onClick={() => toggleGroupInstance(group.patternId, instanceIdx)}
                          className="w-full flex items-center justify-between p-4 bg-zinc-900/50 hover:bg-zinc-900/70 transition-colors text-left"
                        >
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-1">
                              <span className="text-sm font-semibold text-purple-400">
                                Instance {instanceIdx + 1}
                              </span>
                              <ConfidenceBadge confidence={narrative.confidence} theme={theme} narrative={narrative} />
                            </div>
                            <p className="text-white font-medium">
                              {previewText}
                            </p>
                          </div>
                          <div className={`text-xl text-gray-300 transition-transform duration-200 ml-4 ${isExpanded ? 'rotate-180' : ''}`}>
                            ▼
                          </div>
                        </button>

                        {/* Accordion Body - Expanded Content */}
                        {isExpanded && (
                          <div className="p-4 md:p-6 bg-zinc-900/30 border-t border-zinc-700">
                            {/* Full Title */}
                            <h4 className="text-lg md:text-xl font-bold text-white mb-4">
                              {narrative.title}
                            </h4>

                            {/* Evidence Tree */}
                            <div className="space-y-4 mb-5">
                              {/* Key Finding */}
                              <div className={`bg-zinc-900/30 border-l-4 ${theme.border.split(' ')[0].replace('border-', 'border-l-')} p-4 rounded-r-lg`}>
                                <div className="flex items-center gap-2 mb-2">
                                  <span className={`${theme.accent} text-xs font-bold uppercase tracking-wide`}>Key Finding</span>
                                </div>
                                <p className="text-gray-200 text-sm leading-relaxed font-medium">
                                  {narrative.finding}
                                </p>
                              </div>

                              {/* Psychological Context */}
                              <div className={`bg-zinc-900/20 border-l-4 ${theme.border.split(' ')[0].replace('border-', 'border-l-')} p-4 rounded-r-lg`}>
                                <div className="flex items-center gap-2 mb-2">
                                  <span className={`${theme.accent} text-xs font-bold uppercase tracking-wide opacity-80`}>
                                    Psychological Context
                                  </span>
                                </div>
                                <p className="text-gray-300 text-sm leading-relaxed">
                                  {narrative.context}
                                </p>
                              </div>
                            </div>

                            {/* Insight Summary */}
                            <div className="bg-zinc-950/50 border border-zinc-800 p-5 rounded-lg mb-4">
                              <div className="flex items-center gap-2 mb-2">
                                <span className="text-xs text-gray-500 uppercase tracking-wide font-semibold">Insight</span>
                              </div>
                              <p className="text-base text-gray-300 leading-relaxed">
                                {narrative.callout}
                              </p>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex flex-wrap gap-3 mt-4">
                              {/* ShareButton removed - V2 deprecated */}
                              <div className="flex gap-2">
                                <button
                                  onClick={() => handleFeedback(idx, 'up')}
                                  className={`px-3 py-2 rounded-lg border transition-all ${
                                    narrativeFeedback.get(idx) === 'up'
                                      ? 'bg-green-500/20 border-green-500 text-green-400'
                                      : 'bg-zinc-800 border-zinc-700 text-gray-300 hover:border-gray-500'
                                  }`}
                                  title="This resonates"
                                >
                                  👍
                                </button>
                                <button
                                  onClick={() => handleFeedback(idx, 'down')}
                                  className={`px-3 py-2 rounded-lg border transition-all ${
                                    narrativeFeedback.get(idx) === 'down'
                                      ? 'bg-red-500/20 border-red-500 text-red-400'
                                      : 'bg-zinc-800 border-zinc-700 text-gray-300 hover:border-gray-500'
                                  }`}
                                  title="This feels off"
                                >
                                  👎
                                </button>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
