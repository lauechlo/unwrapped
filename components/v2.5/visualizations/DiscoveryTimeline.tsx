'use client';

interface MonthData {
  month: string;
  newArtists: number;
}

interface DiscoveryTimelineProps {
  monthlyData: MonthData[];
}

/**
 * Line chart showing new artists discovered per month
 * Pure CSS/SVG implementation
 */
export default function DiscoveryTimeline({ monthlyData }: DiscoveryTimelineProps) {
  if (monthlyData.length === 0) {
    return (
      <div className="text-gray-300 text-sm py-4">
        No discovery data available
      </div>
    );
  }

  // Sort by month
  const sortedData = [...monthlyData].sort((a, b) => a.month.localeCompare(b.month));

  // Calculate chart dimensions
  const maxArtists = Math.max(...sortedData.map(d => d.newArtists), 1);
  const chartHeight = 200;
  const chartWidth = 100; // percentage

  // Calculate points for line
  const points = sortedData.map((data, idx) => {
    // Guard against single data point (avoid division by zero)
    const x = sortedData.length === 1 ? 50 : (idx / (sortedData.length - 1)) * 100;
    const y = 100 - ((data.newArtists / maxArtists) * 100);
    return { x, y, data };
  });

  // Create SVG path for line
  const linePath = points
    .map((point, idx) => {
      if (idx === 0) return `M ${point.x} ${point.y}`;
      return `L ${point.x} ${point.y}`;
    })
    .join(' ');

  // Create area path (line + bottom)
  const areaPath = `${linePath} L 100 100 L 0 100 Z`;

  // Calculate total and average
  const totalDiscovered = sortedData.reduce((sum, d) => sum + d.newArtists, 0);
  const avgPerMonth = (totalDiscovered / sortedData.length).toFixed(1);

  // Format month labels (show max 6 labels)
  const labelIndices = sortedData.length <= 6
    ? sortedData.map((_, i) => i)
    : [0, Math.floor(sortedData.length / 5), Math.floor(sortedData.length * 2 / 5), Math.floor(sortedData.length * 3 / 5), Math.floor(sortedData.length * 4 / 5), sortedData.length - 1];

  return (
    <div className="space-y-4">
      {/* Chart */}
      <div className="relative" style={{ height: `${chartHeight}px` }}>
        {/* Y-axis labels */}
        <div className="absolute left-0 top-0 bottom-0 w-8 flex flex-col justify-between text-xs text-gray-500 pr-2">
          <span>{maxArtists}</span>
          <span>{Math.floor(maxArtists / 2)}</span>
          <span>0</span>
        </div>

        {/* SVG Chart */}
        <div className="absolute left-10 right-0 top-0 bottom-0">
          <svg
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            className="w-full h-full"
          >
            {/* Grid lines */}
            <line x1="0" y1="0" x2="100" y2="0" stroke="currentColor" strokeWidth="0.2" className="text-zinc-700" />
            <line x1="0" y1="50" x2="100" y2="50" stroke="currentColor" strokeWidth="0.2" className="text-zinc-700" />
            <line x1="0" y1="100" x2="100" y2="100" stroke="currentColor" strokeWidth="0.2" className="text-zinc-700" />

            {/* Area fill */}
            <path
              d={areaPath}
              fill="url(#discoveryGradient)"
              opacity="0.3"
            />

            {/* Line */}
            <path
              d={linePath}
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-green-400"
            />

            {/* Data points */}
            {points.map((point, idx) => (
              <g key={idx}>
                <circle
                  cx={point.x}
                  cy={point.y}
                  r="2"
                  fill="currentColor"
                  className="text-green-400"
                />
                <title>{`${point.data.month}: ${point.data.newArtists} new artists`}</title>
              </g>
            ))}

            {/* Gradient definition */}
            <defs>
              <linearGradient id="discoveryGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="rgb(34, 197, 94)" stopOpacity="0.5" />
                <stop offset="100%" stopColor="rgb(34, 197, 94)" stopOpacity="0" />
              </linearGradient>
            </defs>
          </svg>
        </div>
      </div>

      {/* X-axis labels */}
      <div className="relative pl-10">
        <div className="flex justify-between text-xs text-gray-500">
          {labelIndices.map(idx => {
            const month = sortedData[idx].month;
            // Format YYYY-MM to short format
            const [year, monthNum] = month.split('-');
            const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            const shortMonth = monthNames[parseInt(monthNum) - 1] || monthNum;
            return (
              <span key={idx} className="flex-shrink-0">
                {shortMonth} '{year.slice(2)}
              </span>
            );
          })}
        </div>
      </div>

      {/* Stats */}
      <div className="pt-4 border-t border-zinc-700 grid grid-cols-2 gap-4">
        <div>
          <div className="text-xs text-gray-500 mb-1">Average per Month</div>
          <div className="text-white font-bold">{avgPerMonth} artists</div>
        </div>
        <div>
          <div className="text-xs text-gray-500 mb-1">Total Discovered</div>
          <div className="text-white font-bold">{totalDiscovered} artists</div>
        </div>
      </div>

      {/* Peak month callout */}
      {(() => {
        const peakMonth = sortedData.reduce((max, curr) =>
          curr.newArtists > max.newArtists ? curr : max
        );
        return (
          <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3">
            <div className="text-xs text-green-300">
              🎯 Peak Discovery: <span className="font-bold">{peakMonth.month}</span> with {peakMonth.newArtists} new artists
            </div>
          </div>
        );
      })()}
    </div>
  );
}
