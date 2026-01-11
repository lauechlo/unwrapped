'use client';

interface LoopIntensityMeterProps {
  plays: number;
  durationMinutes?: number;
  completionRate?: number;
  skipRate?: number;
  consistency?: string; // e.g., "±2s variance"
  userAvgPlays?: number;
  userAvgSkip?: number;
}

export default function LoopIntensityMeter({
  plays,
  durationMinutes,
  completionRate,
  skipRate,
  consistency,
  userAvgPlays = 3,
  userAvgSkip = 12,
}: LoopIntensityMeterProps) {
  // Calculate percentages for bar widths
  const playsPercent = Math.min((plays / Math.max(plays, userAvgPlays * 2)) * 100, 100);
  const durationPercent = durationMinutes ? Math.min((durationMinutes / 1440) * 100, 100) : 0; // Max 24 hours
  const completionPercent = completionRate || 0;

  return (
    <div className="bg-zinc-900/30 border border-zinc-700 rounded-lg p-4 md:p-6">
      <h4 className="text-sm font-bold text-purple-400 mb-4 uppercase tracking-wide">
        Loop Intensity Profile
      </h4>

      <div className="space-y-4">
        {/* Plays */}
        <div className="metric">
          <div className="flex justify-between items-center mb-2">
            <label className="text-xs text-gray-400 uppercase tracking-wide">Plays</label>
            <span className="text-sm font-bold text-white">{plays}</span>
          </div>
          <div className="relative h-2 bg-zinc-800 rounded-full overflow-hidden">
            <div
              className="absolute inset-y-0 left-0 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all duration-500"
              style={{ width: `${playsPercent}%` }}
            />
          </div>
          <p className="text-xs text-gray-500 mt-1">
            vs. your avg loop: {userAvgPlays}-{userAvgPlays + 2} plays
          </p>
        </div>

        {/* Duration */}
        {durationMinutes && (
          <div className="metric">
            <div className="flex justify-between items-center mb-2">
              <label className="text-xs text-gray-400 uppercase tracking-wide">Duration</label>
              <span className="text-sm font-bold text-white">
                {durationMinutes >= 60
                  ? `${Math.floor(durationMinutes / 60)}h ${durationMinutes % 60}m`
                  : `${durationMinutes}m`}
              </span>
            </div>
            <div className="relative h-2 bg-zinc-800 rounded-full overflow-hidden">
              <div
                className="absolute inset-y-0 left-0 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full transition-all duration-500"
                style={{ width: `${durationPercent}%` }}
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {durationMinutes >= 60 ? 'Extended listening session' : 'Focused session'}
            </p>
          </div>
        )}

        {/* Completion Rate */}
        {completionRate !== undefined && completionRate > 0 && (
          <div className="metric">
            <div className="flex justify-between items-center mb-2">
              <label className="text-xs text-gray-400 uppercase tracking-wide">Completion</label>
              <span className="text-sm font-bold text-white">{completionRate}%</span>
            </div>
            <div className="relative h-2 bg-zinc-800 rounded-full overflow-hidden">
              <div
                className="absolute inset-y-0 left-0 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full transition-all duration-500"
                style={{ width: `${completionPercent}%` }}
              />
            </div>
            {skipRate !== undefined && (
              <p className="text-xs text-gray-500 mt-1">
                you skip: {skipRate}% avg | {userAvgSkip}% typical
              </p>
            )}
          </div>
        )}

        {/* Skip Rate (when completion not available) */}
        {skipRate !== undefined && (completionRate === undefined || completionRate === 0) && (
          <div className="metric">
            <div className="flex justify-between items-center mb-2">
              <label className="text-xs text-gray-400 uppercase tracking-wide">Skip Rate</label>
              <span className="text-sm font-bold text-white">{skipRate}%</span>
            </div>
            <div className="relative h-2 bg-zinc-800 rounded-full overflow-hidden">
              <div
                className="absolute inset-y-0 left-0 bg-gradient-to-r from-red-500 to-orange-500 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(skipRate, 100)}%` }}
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              lower is better | {userAvgSkip}% typical
            </p>
          </div>
        )}

        {/* Consistency */}
        {consistency && (
          <div className="metric">
            <div className="flex justify-between items-center mb-2">
              <label className="text-xs text-gray-400 uppercase tracking-wide">Consistency</label>
              <span className="text-sm font-bold text-white">{consistency}</span>
            </div>
            <div className="relative h-2 bg-zinc-800 rounded-full overflow-hidden">
              <div
                className="absolute inset-y-0 left-0 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full transition-all duration-500"
                style={{ width: '95%' }}
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              High consistency indicates ritualistic behavior
            </p>
          </div>
        )}
      </div>

      {/* Interpretation */}
      <div className="mt-4 pt-4 border-t border-zinc-700">
        <p className="text-xs text-gray-400 leading-relaxed">
          → This pattern suggests{' '}
          {plays > userAvgPlays * 3 ? 'deep engagement and ' : ''}
          intentional, ritualistic music listening behavior
          {completionRate && completionRate > 80 ? ' with high commitment' : ''}.
        </p>
      </div>
    </div>
  );
}
