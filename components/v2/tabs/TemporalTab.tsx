'use client';

import TemporalHeatmap from '../TemporalHeatmap';

interface TemporalTabProps {
  plays: any[]; // Raw play data for heatmap
}

export default function TemporalTab({ plays }: TemporalTabProps) {
  return (
    <div className="max-w-7xl mx-auto px-4 py-12 space-y-8">
      {/* Temporal Heatmap - has its own header */}
      <TemporalHeatmap uploadedData={plays} />

      {/* Context */}
      <div className="bg-zinc-900/50 border border-zinc-700 rounded-lg p-5 max-w-3xl mx-auto">
        <p className="text-sm text-gray-400">
          Darker squares = more listening. Times are in your local timezone.
        </p>
      </div>
    </div>
  );
}
