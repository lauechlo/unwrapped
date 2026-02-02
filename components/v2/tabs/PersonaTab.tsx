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
    <div className="max-w-5xl mx-auto px-4 space-y-6">
      {/* Persona Card */}
      <PersonaCard personaMatch={personaMatch} />

      {/* AI Psychological Summary - only if available */}
      {psychologicalSummary && (
        <CollapsiblePsychologicalSummary summary={psychologicalSummary} />
      )}

      {/* Context Note - moved to bottom, more subtle */}
      <div className="bg-zinc-800/30 border border-zinc-700/50 rounded-lg p-4 max-w-2xl mx-auto">
        <p className="text-xs text-gray-500 text-center">
          Based on patterns in your listening data. Most people don't fit one type perfectly—think of it as your dominant style.
        </p>
      </div>
    </div>
  );
}
