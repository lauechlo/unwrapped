'use client';

import PersonaCard from '../PersonaCard';
import CollapsiblePsychologicalSummary from '../CollapsiblePsychologicalSummary';
import type { PersonaMatch } from '@/lib/v2/personas';

interface PersonaTabProps {
  personaMatch: PersonaMatch;
  psychologicalSummary?: string;
}

export default function PersonaTab({ personaMatch, psychologicalSummary }: PersonaTabProps) {
  return (
    <div className="max-w-5xl mx-auto px-4 py-12 space-y-8">
      {/* Header */}
      <div className="text-center mb-12">
        <h2 className="text-3xl md:text-4xl font-bold mb-3">People Like You</h2>
        <p className="text-gray-400">
          Based on your listening patterns, here's your archetype
        </p>
      </div>

      {/* Persona Card */}
      <PersonaCard personaMatch={personaMatch} />

      {/* Psychological Profile - CollapsiblePsychologicalSummary has its own header */}
      {psychologicalSummary && (
        <div className="mt-12">
          <CollapsiblePsychologicalSummary summary={psychologicalSummary} />
        </div>
      )}

      {/* Research Context */}
      <div className="bg-zinc-900/50 border border-zinc-700 rounded-xl p-6 max-w-3xl mx-auto">
        <h4 className="text-sm font-bold text-gray-400 mb-3 uppercase tracking-wide flex items-center gap-2">
          <span>📚</span>
          Research-Grounded Analysis
        </h4>
        <p className="text-sm text-gray-300 leading-relaxed">
          All patterns are validated against academic frameworks from music cognition and psychology research.
          This persona is based on your detected listening patterns—people rarely fit one archetype perfectly.
          Consider this a starting point for understanding your musical identity.
        </p>
      </div>
    </div>
  );
}
