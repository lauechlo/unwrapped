'use client';

interface Track {
  name: string;
  artistName?: string;
  totalPlays: number;
}

interface ReplayIntensityChartProps {
  tracks: Track[];
  maxDisplay?: number;
}

/**
 * Data-first visualization showing most-replayed tracks
 * Pure CSS bars, no charting library
 */
export default function ReplayIntensityChart({
  tracks,
  maxDisplay = 10
}: ReplayIntensityChartProps) {
  // Sort by play count and take top N
  const topTracks = [...tracks]
    .sort((a, b) => b.totalPlays - a.totalPlays)
    .slice(0, maxDisplay);

  if (topTracks.length === 0) {
    return (
      <div className="text-gray-300 text-sm py-4">
        No replay data available
      </div>
    );
  }

  const maxPlays = topTracks[0].totalPlays;

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between text-xs text-gray-500 uppercase tracking-wide pb-2 border-b border-zinc-700">
        <span>Track</span>
        <span>Plays</span>
      </div>

      {/* Bars */}
      <div className="space-y-2.5">
        {topTracks.map((track, idx) => {
          const percentage = (track.totalPlays / maxPlays) * 100;
          const barWidth = Math.max(percentage, 10); // Min 10% width for visibility

          return (
            <div key={idx} className="group">
              {/* Track info */}
              <div className="flex items-baseline justify-between mb-1.5">
                <div className="flex-1 min-w-0 mr-4">
                  <div className="text-white font-medium text-sm truncate">
                    {track.name || 'Unknown Track'}
                  </div>
                  {track.artistName && (
                    <div className="text-gray-500 text-xs truncate">
                      {track.artistName}
                    </div>
                  )}
                </div>
                <div className="text-blue-400 font-bold text-sm tabular-nums flex-shrink-0">
                  {track.totalPlays}×
                </div>
              </div>

              {/* Bar */}
              <div className="relative h-2 bg-zinc-800 rounded-full overflow-hidden">
                <div
                  className="absolute inset-y-0 left-0 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full transition-all duration-500 group-hover:from-blue-400 group-hover:to-cyan-400"
                  style={{ width: `${barWidth}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Summary stats */}
      <div className="pt-4 mt-4 border-t border-zinc-700 text-xs text-gray-300">
        <div className="flex items-center justify-between">
          <span>Total plays across top {topTracks.length}</span>
          <span className="font-bold text-white">
            {topTracks.reduce((sum, t) => sum + t.totalPlays, 0).toLocaleString()}
          </span>
        </div>
      </div>
    </div>
  );
}
