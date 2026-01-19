'use client';

interface MonthArtist {
  month: string;
  artist: string;
  plays: number;
}

interface AttachmentTimelineProps {
  monthlyTopArtists: MonthArtist[];
  maxDisplay?: number;
}

/**
 * Timeline showing which artist was #1 each month
 * Visualizes "eras" and loyalty patterns
 */
export default function AttachmentTimeline({
  monthlyTopArtists,
  maxDisplay = 12
}: AttachmentTimelineProps) {
  if (monthlyTopArtists.length === 0) {
    return (
      <div className="text-gray-300 text-sm py-4">
        No loyalty data available
      </div>
    );
  }

  // Sort by month and take most recent N months
  const sortedData = [...monthlyTopArtists]
    .sort((a, b) => b.month.localeCompare(a.month))
    .slice(0, maxDisplay)
    .reverse(); // Show oldest to newest

  // Assign colors to artists (consistent across timeline)
  const uniqueArtists = Array.from(new Set(sortedData.map(d => d.artist)));
  const artistColors: Record<string, string> = {};
  const colorPalette = [
    'from-purple-500 to-purple-600',
    'from-blue-500 to-blue-600',
    'from-green-500 to-green-600',
    'from-orange-500 to-orange-600',
    'from-pink-500 to-pink-600',
    'from-cyan-500 to-cyan-600',
    'from-red-500 to-red-600',
    'from-yellow-500 to-yellow-600',
  ];

  uniqueArtists.forEach((artist, idx) => {
    artistColors[artist] = colorPalette[idx % colorPalette.length];
  });

  // Calculate "era" streaks (consecutive months with same artist)
  const eras: Array<{ artist: string; start: number; end: number; months: number }> = [];
  let currentEra: { artist: string; start: number; end: number } | null = null;

  sortedData.forEach((data, idx) => {
    if (!currentEra || currentEra.artist !== data.artist) {
      if (currentEra) {
        eras.push({
          ...currentEra,
          months: currentEra.end - currentEra.start + 1,
        });
      }
      currentEra = { artist: data.artist, start: idx, end: idx };
    } else {
      currentEra.end = idx;
    }
  });

  if (currentEra) {
    eras.push({
      ...currentEra,
      months: currentEra.end - currentEra.start + 1,
    });
  }

  // Find longest era
  const longestEra = eras.reduce((max, era) => era.months > max.months ? era : max, eras[0]);

  // Calculate max plays for bar scaling
  const maxPlays = Math.max(...sortedData.map(d => d.plays), 1);

  return (
    <div className="space-y-4">
      {/* Timeline */}
      <div className="space-y-2">
        {sortedData.map((data, idx) => {
          const percentage = (data.plays / maxPlays) * 100;
          const barWidth = Math.max(percentage, 15); // Min 15% width
          const [year, monthNum] = data.month.split('-');
          const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
          const shortMonth = monthNames[parseInt(monthNum) - 1] || monthNum;
          const label = `${shortMonth} '${year.slice(2)}`;

          // Check if artist changed from previous month
          const isSwitch = idx > 0 && sortedData[idx - 1].artist !== data.artist;

          return (
            <div key={idx} className="group">
              {/* Month label + Artist info */}
              <div className="flex items-baseline justify-between mb-1">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="text-xs text-gray-500 w-16 flex-shrink-0">
                    {label}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-white text-sm font-medium truncate">
                      {data.artist}
                    </div>
                  </div>
                </div>
                <div className="text-orange-400 text-xs font-bold tabular-nums flex-shrink-0 ml-2">
                  {data.plays.toLocaleString()}
                </div>
              </div>

              {/* Bar with switch indicator */}
              <div className="flex items-center gap-2 ml-16">
                <div className="relative flex-1 h-2 bg-zinc-800 rounded-full overflow-hidden">
                  <div
                    className={`absolute inset-y-0 left-0 bg-gradient-to-r ${artistColors[data.artist]} rounded-full transition-all duration-300`}
                    style={{ width: `${barWidth}%` }}
                  />
                </div>
                {isSwitch && (
                  <div className="text-xs text-orange-400 flex-shrink-0">
                    🔄
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="pt-3 border-t border-zinc-700">
        <div className="text-xs text-gray-500 mb-2">Artists</div>
        <div className="flex flex-wrap gap-2">
          {uniqueArtists.map(artist => (
            <div
              key={artist}
              className="flex items-center gap-2 bg-zinc-800/50 rounded-full px-3 py-1"
            >
              <div className={`w-3 h-3 rounded-full bg-gradient-to-r ${artistColors[artist]}`} />
              <span className="text-xs text-white truncate max-w-[150px]">
                {artist}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 pt-3 border-t border-zinc-700">
        <div>
          <div className="text-xs text-gray-500 mb-1">Longest Era</div>
          <div className="text-white font-bold text-sm">{longestEra.artist}</div>
          <div className="text-gray-300 text-xs">{longestEra.months} months</div>
        </div>
        <div>
          <div className="text-xs text-gray-500 mb-1">Artist Changes</div>
          <div className="text-white font-bold text-sm">{eras.length - 1} switches</div>
          <div className="text-gray-300 text-xs">in {sortedData.length} months</div>
        </div>
      </div>

      {/* Insight callout */}
      {longestEra.months >= 3 && (
        <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-3">
          <div className="text-xs text-orange-300">
            ⚓ Your longest loyalty: <span className="font-bold">{longestEra.artist}</span> dominated for {longestEra.months} consecutive months
          </div>
        </div>
      )}
    </div>
  );
}
