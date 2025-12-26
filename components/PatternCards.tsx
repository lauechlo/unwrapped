'use client';

import { useState } from 'react';
import type { PatternCard } from '@/lib/synthesis/types';
import { getArtistTheme } from '@/lib/artistColors';
import { trackProveItClick } from '@/lib/analytics';

export default function PatternCards({ cards }: { cards: PatternCard[] }) {
  const [expandedCards, setExpandedCards] = useState<Set<number>>(new Set());

  const toggleCard = (idx: number, patternLabel: string) => {
    setExpandedCards(prev => {
      const newSet = new Set(prev);
      if (newSet.has(idx)) {
        newSet.delete(idx);
      } else {
        newSet.add(idx);
        // Track "Prove It" click when expanding
        trackProveItClick(patternLabel);
      }
      return newSet;
    });
  };

  return (
    <section className="py-12 md:py-20 px-4 md:px-8 bg-black">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-2xl md:text-4xl font-bold mb-8 md:mb-12 text-center px-2">Your Listening Patterns</h2>

        <div className="grid gap-6 md:gap-8">
          {cards.map((card, idx) => {
            const theme = getArtistTheme(card.patternLabel);
            return (
              <div
                key={idx}
                className={`bg-gradient-to-br ${theme.gradient} border-2 ${theme.border} p-4 md:p-8 rounded-xl md:rounded-2xl transition-all`}
              >
                {/* Pattern Label - Viral */}
                <div className="mb-4 md:mb-6">
                  <div className={`inline-block ${theme.badge} border px-3 py-1 md:px-4 md:py-2 rounded-full text-xs mb-3 md:mb-4`}>
                    {Math.round(card.confidence * 100)}% confidence
                  </div>
                  <h3 className="text-xl sm:text-2xl md:text-3xl font-bold text-white mb-3 md:mb-4 leading-tight">
                    {card.patternLabel}
                  </h3>
                </div>

                {/* Evidence Tree */}
                <div className={`space-y-2 md:space-y-3 mb-4 md:mb-6 pl-3 md:pl-4 border-l-2 ${theme.border.split(' ')[0].replace('border-', 'border-l-')}`}>
                  <div className="flex items-start gap-2 md:gap-3">
                    <span className={`${theme.accent} text-xs md:text-sm font-mono flex-shrink-0`}>├─ CORE:</span>
                    <p className="text-gray-300 text-sm md:text-lg leading-relaxed">{card.core}</p>
                  </div>
                  <div className="flex items-start gap-2 md:gap-3">
                    <span className={`${theme.accent} text-xs md:text-sm font-mono opacity-80 flex-shrink-0`}>├─ SUPPORTING:</span>
                    <p className="text-gray-300 text-sm md:text-lg leading-relaxed">{card.supporting}</p>
                  </div>
                  <div className="flex items-start gap-2 md:gap-3">
                    <span className={`${theme.accent} text-xs md:text-sm font-mono opacity-60 flex-shrink-0`}>└─ BEHAVIOR:</span>
                    <p className="text-gray-300 text-sm md:text-lg leading-relaxed">{card.behavior}</p>
                  </div>
                </div>

                {/* Callout - Gen Z language */}
                <div className="bg-zinc-950/50 border border-zinc-800 p-4 md:p-6 rounded-lg md:rounded-xl mb-3 md:mb-4">
                  <p className="text-base md:text-xl italic text-gray-400 leading-relaxed">
                    {card.callout}
                  </p>
                </div>

                {/* Prove It Button - Showy and Prominent - Minimum 44px tap target */}
                <button
                  onClick={() => toggleCard(idx, card.patternLabel)}
                  className="group relative w-full mt-2 px-4 md:px-6 py-3 md:py-4 bg-gradient-to-r from-purple-600 to-pink-600
                           hover:from-purple-500 hover:to-pink-500 text-white font-semibold rounded-xl
                           transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/50
                           flex items-center justify-center gap-2 md:gap-3 text-base md:text-lg min-h-[44px]"
                >
                  <span className="text-xl md:text-2xl">{expandedCards.has(idx) ? '📊' : '🔍'}</span>
                  <span>{expandedCards.has(idx) ? 'Hide Evidence' : 'Prove It'}</span>
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-400 to-pink-400 opacity-0
                               group-hover:opacity-20 rounded-xl transition-opacity blur-xl" />
                </button>

                {/* Raw Evidence - Collapsible */}
                {expandedCards.has(idx) && (
                  <div className={`mt-4 ${theme.badge.split(' ')[0]} border ${theme.badge.split(' ')[1]} rounded-lg p-4`}>
                    <p className={`text-xs ${theme.accent} uppercase tracking-wide mb-3`}>📊 Raw Evidence</p>
                    <ul className="space-y-2">
                      {card.rawEvidence.map((evidence, i) => (
                        <li key={i} className={`text-sm text-gray-300 pl-4 border-l-2 ${theme.border.split(' ')[0].replace('border-', 'border-l-')}`}>
                          {evidence}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
