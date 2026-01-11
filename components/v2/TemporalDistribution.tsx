'use client';

interface TimeSlot {
  hour: string;
  percentage: number;
  plays: number;
}

interface TemporalDistributionProps {
  timeSlots: TimeSlot[];
  dominantHour?: string;
  pattern?: string; // e.g., "Weekday afternoon ritual"
}

export default function TemporalDistribution({
  timeSlots,
  dominantHour,
  pattern,
}: TemporalDistributionProps) {
  // Find max for scaling
  const maxPercentage = Math.max(...timeSlots.map(slot => slot.percentage));

  return (
    <div className="bg-zinc-900/30 border border-zinc-700 rounded-lg p-4 md:p-6">
      <h4 className="text-sm font-bold text-blue-400 mb-4 uppercase tracking-wide">
        When You Play This
      </h4>

      {/* Time Distribution Bars */}
      <div className="space-y-3 mb-4">
        {timeSlots.map((slot, idx) => {
          const isMain = slot.hour === dominantHour;
          const barWidth = (slot.percentage / maxPercentage) * 100;

          return (
            <div key={idx} className="flex items-center gap-3">
              {/* Hour Label */}
              <div className="w-12 text-right">
                <span className={`text-sm ${isMain ? 'font-bold text-white' : 'text-gray-400'}`}>
                  {slot.hour}
                </span>
              </div>

              {/* Bar */}
              <div className="flex-1 relative">
                <div className="h-6 bg-zinc-800 rounded-md overflow-hidden">
                  <div
                    className={`h-full transition-all duration-500 rounded-md flex items-center px-2 ${
                      isMain
                        ? 'bg-gradient-to-r from-blue-500 to-cyan-500'
                        : 'bg-gradient-to-r from-blue-500/50 to-cyan-500/50'
                    }`}
                    style={{ width: `${barWidth}%` }}
                  >
                    <span className="text-xs font-semibold text-white">
                      {slot.percentage}%
                    </span>
                  </div>
                </div>
              </div>

              {/* Main Ritual Indicator */}
              {isMain && (
                <span className="text-xs text-blue-400 font-semibold">← Main ritual</span>
              )}
            </div>
          );
        })}
      </div>

      {/* Pattern Analysis */}
      <div className="pt-4 border-t border-zinc-700">
        <div className="space-y-3">
          <div>
            <h5 className="text-xs font-bold text-white mb-2">PATTERN ANALYSIS</h5>
            <div className="space-y-1 text-xs text-gray-400">
              {dominantHour && (
                <p>
                  <span className="text-gray-300">Peak Time:</span> {dominantHour} ({timeSlots.find(s => s.hour === dominantHour)?.percentage}% of plays)
                </p>
              )}
              {pattern && (
                <p>
                  <span className="text-gray-300">Type:</span> {pattern}
                </p>
              )}
              <p>
                <span className="text-gray-300">Consistency:</span> High temporal clustering
              </p>
            </div>
          </div>

          <div>
            <h5 className="text-xs font-bold text-white mb-2">WHAT THIS SUGGESTS</h5>
            <p className="text-xs text-gray-400 leading-relaxed">
              This track is tied to a specific moment in your routine—likely a transition time
              (commute, break, wind-down). The high consistency suggests strong emotional or
              practical anchoring to this time of day.
            </p>
          </div>

          <div className="pt-2 border-t border-zinc-800">
            <p className="text-xs text-gray-500">
              <span className="text-gray-400 font-semibold">Research term:</span> "Temporal marking"
              (Levitin, 2006) - using music to structure time and emotional states
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
