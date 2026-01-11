'use client';

import { useState } from 'react';

interface CollapsiblePsychologicalSummaryProps {
  summary: string;
}

export default function CollapsiblePsychologicalSummary({ summary }: CollapsiblePsychologicalSummaryProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showResearch, setShowResearch] = useState(false);

  // Split summary into paragraphs
  const paragraphs = summary.split('\n\n').filter(p => p.trim().length > 0);
  const hook = paragraphs[0] || summary; // First paragraph as hook
  const fullSummary = summary;

  // Extract TL;DR - first sentence or create from key phrases
  const getTLDR = (text: string): string => {
    // Try to extract first sentence
    const firstSentence = text.split(/[.!?]/)[0];
    if (firstSentence && firstSentence.length > 20 && firstSentence.length < 120) {
      return firstSentence.trim();
    }
    // Fallback: extract pattern names if mentioned
    const patterns = ['Explorer', 'Loyalist', 'Looper', 'Ritualist', 'Emotional', 'Curator', 'Nostalgist'];
    const foundPatterns = patterns.filter(p => text.includes(p));
    if (foundPatterns.length >= 2) {
      return `${foundPatterns[0]} + ${foundPatterns[1]}: You ${text.includes('discover') ? 'discover broadly' : 'engage deeply'} but ${text.includes('commit') ? 'commit deeply' : 'stay flexible'}`;
    }
    return 'Your listening reveals complex, intentional patterns';
  };

  const tldr = getTLDR(hook);

  return (
    <section className="py-12 md:py-20 px-4 md:px-8 bg-gradient-to-b from-black to-zinc-900">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-2xl md:text-3xl font-bold mb-6 text-center text-purple-400">
          Psychological Profile
        </h2>

        {/* TL;DR - Bold Summary */}
        <div className="bg-gradient-to-r from-purple-900/30 to-pink-900/30 border-2 border-purple-500/40 rounded-xl p-6 md:p-8 mb-6">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-purple-400 text-xs font-bold uppercase tracking-wide">TL;DR</span>
          </div>
          <p className="text-white text-lg md:text-xl font-semibold leading-relaxed">
            {tldr}
          </p>
        </div>

        {/* Hook - Always Visible */}
        <div className="bg-zinc-900/50 border border-zinc-700 rounded-xl p-6 md:p-8 mb-4">
          <p className="text-gray-300 text-base md:text-lg leading-relaxed">
            {hook}
          </p>
        </div>

        {/* Expand Full Summary Button */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full mb-4 px-6 py-3 bg-zinc-800 hover:bg-zinc-700 border border-zinc-600
                     text-white font-semibold rounded-lg transition-all duration-200
                     flex items-center justify-center gap-2"
        >
          <span className="text-lg">{isExpanded ? '▲' : '▼'}</span>
          <span>{isExpanded ? 'Hide Full Analysis' : 'Show Full Psychological Analysis'}</span>
        </button>

        {/* Full Summary - Collapsible */}
        {isExpanded && (
          <div className="space-y-4 mb-4">
            <div className="bg-zinc-900/50 border border-zinc-700 rounded-xl p-6 md:p-8">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-purple-400 text-sm font-mono">DETAILED ANALYSIS</span>
              </div>
              <p className="text-gray-300 leading-relaxed whitespace-pre-wrap">
                {fullSummary}
              </p>
            </div>

            {/* Research Citations - Nested Collapsible */}
            <button
              onClick={() => setShowResearch(!showResearch)}
              className="w-full px-4 py-2 bg-zinc-800/50 hover:bg-zinc-700/50 border border-zinc-700
                         text-gray-300 text-sm rounded-lg transition-all duration-200
                         flex items-center justify-center gap-2"
            >
              <span className="text-base">{showResearch ? '▲' : '▼'}</span>
              <span>{showResearch ? 'Hide Research Citations' : 'Show Research Citations'}</span>
            </button>

            {showResearch && (
              <div className="bg-zinc-900/80 border border-zinc-600 rounded-lg p-6">
                <h4 className="text-sm font-bold text-purple-400 mb-4 uppercase tracking-wide">
                  Academic Framework
                </h4>
                <div className="space-y-4 text-sm text-gray-400">
                  <div className="border-l-2 border-purple-500/40 pl-4">
                    <p className="font-semibold text-gray-300 mb-1">Saarikallio & Erkkilä (2007)</p>
                    <p className="italic">The role of music in adolescents' mood regulation</p>
                    <p className="text-xs mt-1 text-gray-500">
                      Framework: Entertainment, Revival, Strong sensation, Diversion, Discharge, Mental work, Solace
                    </p>
                  </div>
                  <div className="border-l-2 border-purple-500/40 pl-4">
                    <p className="font-semibold text-gray-300 mb-1">Rentfrow & Gosling (2003)</p>
                    <p className="italic">The do re mi's of everyday life: The structure and personality correlates of music preferences</p>
                    <p className="text-xs mt-1 text-gray-500">
                      MUSIC dimensions: Mellow, Unpretentious, Sophisticated, Intense, Contemporary
                    </p>
                  </div>
                  <div className="border-l-2 border-purple-500/40 pl-4">
                    <p className="font-semibold text-gray-300 mb-1">Levitin (2006)</p>
                    <p className="italic">This Is Your Brain on Music: The Science of a Human Obsession</p>
                    <p className="text-xs mt-1 text-gray-500">
                      Music as temporal marker and memory encoding
                    </p>
                  </div>
                  <div className="border-l-2 border-purple-500/40 pl-4">
                    <p className="font-semibold text-gray-300 mb-1">Datta, Knox, & Bronnenberg (2017)</p>
                    <p className="italic">Changing their tune: How consumers' adoption of online streaming affects music consumption and discovery</p>
                    <p className="text-xs mt-1 text-gray-500">
                      Marketing Science - Behavioral shifts in streaming era
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Methodology Note */}
        <div className="mt-6 bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
          <p className="text-xs text-gray-400 text-center">
            <span className="font-semibold text-blue-400">Research-Grounded Analysis:</span> All patterns are validated
            against academic frameworks from music cognition and psychology research.
          </p>
        </div>
      </div>
    </section>
  );
}
