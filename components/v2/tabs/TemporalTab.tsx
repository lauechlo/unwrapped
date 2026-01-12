'use client';

import TemporalHeatmap from '../TemporalHeatmap';

interface TemporalTabProps {
  plays: any[]; // Raw play data for heatmap
}

export default function TemporalTab({ plays }: TemporalTabProps) {
  return (
    <div className="max-w-7xl mx-auto px-4 py-12 space-y-8">
      {/* Header */}
      <div className="text-center mb-12">
        <h2 className="text-3xl md:text-4xl font-bold mb-3">When You Listen</h2>
        <p className="text-gray-400">
          Your overall listening rhythm across all plays
        </p>
      </div>

      {/* Temporal Heatmap */}
      <TemporalHeatmap uploadedData={plays} />

      {/* Additional Context */}
      <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-6 max-w-3xl mx-auto">
        <h4 className="text-sm font-bold text-blue-400 mb-2 uppercase tracking-wide">
          💡 About This Heatmap
        </h4>
        <p className="text-sm text-gray-300 leading-relaxed">
          This shows your general listening habits across all time periods. Individual patterns in the Patterns tab may focus on specific moments or behaviors within this broader rhythm.
        </p>
      </div>
    </div>
  );
}
