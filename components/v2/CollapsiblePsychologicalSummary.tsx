'use client';

import { useState } from 'react';

interface CollapsiblePsychologicalSummaryProps {
  summary: string;
}

export default function CollapsiblePsychologicalSummary({ summary }: CollapsiblePsychologicalSummaryProps) {
  const [showResearch, setShowResearch] = useState(false);

  return (
    <section className="py-8 md:py-12 px-4 md:px-8">
      <div className="max-w-4xl mx-auto">
        <h3 className="text-xl md:text-2xl font-bold mb-4 text-purple-400 flex items-center gap-2">
          <span>🧠</span> Your Listening Profile
        </h3>

        {/* Main Summary - Clean single display */}
        <div className="bg-zinc-900/50 border border-zinc-700 rounded-xl p-6 md:p-8 mb-4">
          <p className="text-gray-200 text-base md:text-lg leading-relaxed">
            {summary}
          </p>
        </div>

        {/* Research Citations - Collapsible */}
        <button
          onClick={() => setShowResearch(!showResearch)}
          className="w-full px-4 py-2 bg-zinc-800/50 hover:bg-zinc-700/50 border border-zinc-700
                     text-gray-400 text-sm rounded-lg transition-all duration-200
                     flex items-center justify-center gap-2"
        >
          <span className="text-base">{showResearch ? '▲' : '▼'}</span>
          <span>{showResearch ? 'Hide Research Basis' : 'See Research Basis'}</span>
        </button>

        {showResearch && (
          <div className="mt-4 bg-zinc-900/80 border border-zinc-600 rounded-lg p-5">
            <h4 className="text-xs font-bold text-purple-400 mb-3 uppercase tracking-wide">
              Research Framework
            </h4>
            <div className="space-y-3 text-sm text-gray-400">
              <div className="border-l-2 border-purple-500/40 pl-3">
                <p className="font-medium text-gray-300">DeNora (2000)</p>
                <p className="text-xs text-gray-500">Music in Everyday Life - Identity construction through music</p>
              </div>
              <div className="border-l-2 border-purple-500/40 pl-3">
                <p className="font-medium text-gray-300">Saarikallio (2007)</p>
                <p className="text-xs text-gray-500">Music as mood regulation in adolescents</p>
              </div>
              <div className="border-l-2 border-purple-500/40 pl-3">
                <p className="font-medium text-gray-300">Levitin (2006)</p>
                <p className="text-xs text-gray-500">This Is Your Brain on Music - Temporal markers and memory</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
