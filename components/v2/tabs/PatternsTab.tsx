'use client';

import V2NarrativeCards from '../V2NarrativeCards';

interface PatternsTabProps {
  narratives: any[]; // V2 narrative type from synthesis
}

export default function PatternsTab({ narratives }: PatternsTabProps) {
  return (
    <div className="max-w-5xl mx-auto px-4 py-12 space-y-8">
      {/* Pattern Cards - V2NarrativeCards has its own header */}
      <V2NarrativeCards narratives={narratives} />
    </div>
  );
}
