'use client';

import V2NarrativeCards from '../V2NarrativeCards';

interface PatternsTabProps {
  narratives: any[]; // V2 narrative type from synthesis
}

export default function PatternsTab({ narratives }: PatternsTabProps) {
  return (
    <div className="max-w-5xl mx-auto px-4 py-12 space-y-8">
      {/* Header */}
      <div className="text-center mb-12">
        <h2 className="text-3xl md:text-4xl font-bold mb-3">Your Listening Patterns</h2>
        <p className="text-gray-400">
          Found {narratives.length} behavioral pattern{narratives.length !== 1 ? 's' : ''} in your listening history
        </p>
      </div>

      {/* Pattern Cards */}
      <V2NarrativeCards narratives={narratives} />
    </div>
  );
}
