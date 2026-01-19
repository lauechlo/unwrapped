'use client';

import type { PersonaMatch } from '@/lib/v2/personas';
import ShareButton from '@/components/ShareButton';

interface PersonaCardProps {
  personaMatch: PersonaMatch;
}

export default function PersonaCard({ personaMatch }: PersonaCardProps) {
  const { persona, matchScore, reasoning } = personaMatch;

  // Color scheme based on match score
  const getScoreColor = (score: number): string => {
    if (score >= 75) return 'from-purple-500 to-pink-500';
    if (score >= 50) return 'from-blue-500 to-cyan-500';
    return 'from-green-500 to-emerald-500';
  };

  const scoreColor = getScoreColor(matchScore);

  return (
    <div id="persona-card" className="bg-zinc-900/30 border border-zinc-700 rounded-2xl p-6 md:p-8 mb-6">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center gap-4">
          <div className="text-6xl">{persona.icon}</div>
          <div>
            <div className="text-xs uppercase tracking-wide text-gray-300 mb-1">
              You Are Most Like
            </div>
            <h3 className="text-2xl md:text-3xl font-bold text-white">
              {persona.name}
            </h3>
          </div>
        </div>

        {/* Match Score Badge */}
        <div className="flex flex-col items-end">
          <div className={`
            px-4 py-2 rounded-full bg-gradient-to-r ${scoreColor}
            text-white font-bold text-sm
          `}>
            {matchScore}% Match
          </div>
          <div className="text-xs text-gray-500 mt-1">Confidence</div>
        </div>
      </div>

      {/* Tagline */}
      <div className="mb-6">
        <p className="text-lg md:text-xl font-medium text-gray-300 italic">
          "{persona.tagline}"
        </p>
      </div>

      {/* Description */}
      <div className="mb-6">
        <p className="text-base text-gray-300 leading-relaxed">
          {persona.description}
        </p>
      </div>

      {/* Matching Reasoning */}
      <div className="mb-6 bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
        <h4 className="text-sm font-bold text-blue-400 mb-2 uppercase tracking-wide">
          Why This Match?
        </h4>
        <p className="text-sm text-gray-300">
          {reasoning}
        </p>
      </div>

      {/* Traits */}
      <details className="mb-6">
        <summary className="cursor-pointer text-sm font-bold text-purple-400 hover:text-purple-300 mb-3 uppercase tracking-wide list-none">
          <span className="inline-flex items-center gap-2">
            <span className="text-xs">▼</span>
            <span>Key Traits of {persona.name}</span>
          </span>
        </summary>
        <ul className="space-y-2 mt-3">
          {persona.traits.map((trait, idx) => (
            <li key={idx} className="flex items-start gap-2 text-sm text-gray-300">
              <span className="text-purple-400">•</span>
              <span>{trait}</span>
            </li>
          ))}
        </ul>
      </details>

      {/* Research Basis */}
      <details>
        <summary className="cursor-pointer text-sm font-bold text-gray-300 hover:text-gray-300 mb-3 uppercase tracking-wide list-none">
          <span className="inline-flex items-center gap-2">
            <span className="text-xs">▼</span>
            <span>Research Basis</span>
          </span>
        </summary>
        <div className="mt-3 space-y-3">
          <div className="bg-zinc-800/50 p-3 rounded-lg">
            <p className="text-xs text-gray-300">{persona.researchBasis}</p>
          </div>

          {persona.famousExample && (
            <div className="bg-zinc-800/50 p-3 rounded-lg">
              <div className="text-xs font-bold text-gray-500 mb-1">IN THE WILD:</div>
              <p className="text-xs text-gray-300 italic">{persona.famousExample}</p>
            </div>
          )}
        </div>
      </details>

      {/* Share Button */}
      <div className="mt-6 flex justify-center">
        <ShareButton
          cardId="persona-card"
          cardTitle={`${persona.name} - ${persona.tagline}`}
          cardType="persona"
          onShare={() => {
            // Track share analytics
            console.log(`[Share] Persona: ${persona.name}`);
          }}
        />
      </div>

      {/* Footer Note */}
      <div className="mt-6 pt-4 border-t border-zinc-700">
        <p className="text-xs text-gray-500 leading-relaxed">
          → This persona is based on your detected listening patterns. People rarely fit one archetype perfectly—consider this a starting point for understanding your musical identity.
        </p>
      </div>
    </div>
  );
}
