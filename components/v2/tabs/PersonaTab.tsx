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
      {/* Persona Card - Header removed since "Your Archetype" section already has one */}
      <PersonaCard personaMatch={personaMatch} />

      {/* Psychological Profile - CollapsiblePsychologicalSummary has its own header */}
      {psychologicalSummary && (
        <div className="mt-12">
          <CollapsiblePsychologicalSummary summary={psychologicalSummary} />
        </div>
      )}

      {/* Context Note */}
      <div className="bg-zinc-900/50 border border-zinc-700 rounded-xl p-6 max-w-3xl mx-auto">
        <h4 className="text-sm font-bold text-gray-300 mb-3 uppercase tracking-wide flex items-center gap-2">
          <span>💡</span>
          About Your Type
        </h4>
        <p className="text-sm text-gray-300 leading-relaxed">
          This is based on patterns in your listening data. Most people don't fit one type perfectly—think of it as your dominant style, not a complete picture.
        </p>
      </div>
    </div>
  );
}
