'use client';

interface ArtistStats {
  name: string;
  totalPlays: number;
  monthsAsNumber1?: number;
}

interface ArtistDominanceChartProps {
  topArtists: ArtistStats[];
  totalPlays: number;
  topArtistMonths: number;
}

/**
 * Horizontal bar chart showing artist dominance
 * Visualizes how concentrated listening is on top artists
 */
export default function ArtistDominanceChart({
  topArtists,
  totalPlays,
  topArtistMonths,
}: ArtistDominanceChartProps) {
  if (topArtists.length === 0) {
    return (
      <div className="text-gray-300 text-sm py-4">
        No artist data available
      </div>
    );
  }

  // Take top 5 artists
  const displayArtists = topArtists.slice(0, 5);
  const maxPlays = displayArtists[0]?.totalPlays || 1;

  // Calculate dominance ratio (#1 vs #2)
  const dominanceRatio = displayArtists.length >= 2
    ? (displayArtists[0].totalPlays / displayArtists[1].totalPlays).toFixed(1)
    : 'N/A';

  // Calculate concentration (top artist % of total)
  const topArtistPercent = ((displayArtists[0]?.totalPlays || 0) / totalPlays * 100).toFixed(0);
  const top3Percent = ((displayArtists.slice(0, 3).reduce((sum, a) => sum + a.totalPlays, 0)) / totalPlays * 100).toFixed(0);

  return (
    <div className="space-y-4">
      {/* Dominance Stats */}
      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="bg-zinc-800/50 rounded-lg p-3">
          <div className="text-2xl font-black text-orange-400">{topArtistMonths}</div>
          <div className="text-xs text-gray-400">months as #1</div>
        </div>
        <div className="bg-zinc-800/50 rounded-lg p-3">
          <div className="text-2xl font-black text-orange-400">{topArtistPercent}%</div>
          <div className="text-xs text-gray-400">of all plays</div>
        </div>
        <div className="bg-zinc-800/50 rounded-lg p-3">
          <div className="text-2xl font-black text-orange-400">{dominanceRatio}×</div>
          <div className="text-xs text-gray-400">#1 vs #2</div>
        </div>
      </div>

      {/* Horizontal Bar Chart */}
      <div className="space-y-3">
        {displayArtists.map((artist, idx) => {
          const percentage = (artist.totalPlays / maxPlays) * 100;
          const playPercent = ((artist.totalPlays / totalPlays) * 100).toFixed(0);

          // Color gets progressively lighter for lower ranks
          const barOpacity = 100 - (idx * 15);
          const isTopArtist = idx === 0;

          return (
            <div key={artist.name} className="space-y-1">
              {/* Artist name and stats */}
              <div className="flex items-baseline justify-between">
                <div className="flex items-center gap-2">
                  <span className={`
                    w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold
                    ${isTopArtist ? 'bg-orange-500 text-white' : 'bg-zinc-700 text-gray-400'}
                  `}>
                    {idx + 1}
                  </span>
                  <span className={`text-sm font-medium truncate max-w-[180px] ${isTopArtist ? 'text-white' : 'text-gray-300'}`}>
                    {artist.name}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs tabular-nums">
                  <span className="text-gray-400">{artist.totalPlays.toLocaleString()}</span>
                  <span className={`font-bold ${isTopArtist ? 'text-orange-400' : 'text-gray-500'}`}>
                    {playPercent}%
                  </span>
                </div>
              </div>

              {/* Bar */}
              <div className="relative h-3 bg-zinc-800 rounded-full overflow-hidden">
                <div
                  className={`absolute inset-y-0 left-0 rounded-full transition-all duration-500`}
                  style={{
                    width: `${percentage}%`,
                    backgroundColor: isTopArtist
                      ? '#f97316' // orange-500
                      : `rgba(249, 115, 22, ${barOpacity / 100})`, // orange with decreasing opacity
                  }}
                />
                {isTopArtist && (
                  <div
                    className="absolute inset-y-0 left-0 bg-gradient-to-r from-orange-500 to-orange-600 rounded-full"
                    style={{ width: `${percentage}%` }}
                  />
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Concentration Summary */}
      <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-3 mt-4">
        <div className="text-sm text-orange-300">
          <span className="font-bold">{displayArtists[0]?.name}</span> accounts for {topArtistPercent}% of your listening.
          {parseFloat(dominanceRatio) >= 2 && (
            <span> That's {dominanceRatio}× more than your #2 artist.</span>
          )}
        </div>
      </div>

      {/* Top 3 concentration */}
      <div className="text-xs text-gray-400 text-center">
        Your top 3 artists = {top3Percent}% of all listening
      </div>
    </div>
  );
}
