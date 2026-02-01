'use client';

import { useMemo } from 'react';

interface TemporalHeatmapProps {
  uploadedData: any[];
}

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thur', 'Fri', 'Sat'];
const HOURS = Array.from({ length: 24 }, (_, i) => i);

export default function TemporalHeatmap({ uploadedData }: TemporalHeatmapProps) {
  // Calculate heat map data
  const { heatmapData, maxPlays, totalPlays, peakHour, peakDay, punchyInsight } = useMemo(() => {
    // Create 2D array: [day][hour] = playCount
    const data: number[][] = Array.from({ length: 7 }, () => Array(24).fill(0));
    let max = 0;
    let total = 0;
    let peakCount = 0;
    let peakH = 0;
    let peakD = 0;

    uploadedData.forEach((play) => {
      const timestamp = new Date(play.timestamp || play.ts || play.endTime);
      if (isNaN(timestamp.getTime())) return;

      const day = timestamp.getDay(); // 0-6
      const hour = timestamp.getHours(); // 0-23

      data[day][hour]++;
      total++;

      if (data[day][hour] > max) {
        max = data[day][hour];
      }

      if (data[day][hour] > peakCount) {
        peakCount = data[day][hour];
        peakH = hour;
        peakD = day;
      }
    });

    // Calculate punchy insight
    let insight = '';

    // Night owl check (9pm-4am)
    let nightPlays = 0;
    let dayPlays = 0;
    for (let d = 0; d < 7; d++) {
      for (let h = 0; h < 24; h++) {
        if (h >= 21 || h < 5) {
          nightPlays += data[d][h];
        } else {
          dayPlays += data[d][h];
        }
      }
    }
    const nightRatio = nightPlays / total;

    // Weekend check
    let weekendPlays = 0;
    for (let h = 0; h < 24; h++) {
      weekendPlays += data[0][h] + data[6][h]; // Sun + Sat
    }
    const weekendRatio = weekendPlays / total;

    // Generate insight
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const peakPct = ((peakCount / total) * 100).toFixed(1);

    if (nightRatio > 0.4) {
      insight = `Night owl energy: ${Math.round(nightRatio * 100)}% of your listening happens after 9pm`;
    } else if (weekendRatio > 0.4) {
      insight = `Weekend warrior: ${Math.round(weekendRatio * 100)}% of listening on Sat/Sun`;
    } else if (peakH >= 6 && peakH <= 9) {
      insight = `Early bird vibes: Your peak listening is during the morning commute`;
    } else if (peakH >= 17 && peakH <= 20) {
      insight = `Wind-down hours: You listen most during the evening transition`;
    } else {
      const timeLabel = peakH === 0 ? '12am' : peakH < 12 ? `${peakH}am` : peakH === 12 ? '12pm' : `${peakH - 12}pm`;
      insight = `${dayNames[peakD]} at ${timeLabel} = your most active slot (${peakPct}% of all listening)`;
    }

    return {
      heatmapData: data,
      maxPlays: max,
      totalPlays: total,
      peakHour: peakH,
      peakDay: peakD,
      punchyInsight: insight,
    };
  }, [uploadedData]);

  // Get color intensity based on play count
  const getColor = (count: number): string => {
    if (count === 0) return 'bg-zinc-900';

    const intensity = count / maxPlays;

    if (intensity >= 0.8) return 'bg-purple-500';
    if (intensity >= 0.6) return 'bg-purple-600';
    if (intensity >= 0.4) return 'bg-purple-700';
    if (intensity >= 0.2) return 'bg-purple-800';
    return 'bg-purple-900';
  };

  // Format hour for display
  const formatHour = (hour: number): string => {
    if (hour === 0) return '12a';
    if (hour < 12) return `${hour}a`;
    if (hour === 12) return '12p';
    return `${hour - 12}p`;
  };

  return (
    <section className="py-16 px-4 md:px-8 bg-zinc-950">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-3">
            When You Listen
          </h2>
          <p className="text-gray-300 mb-4">
            Your overall listening rhythm across all plays
          </p>
          <p className="text-xs text-gray-500 mb-6">
            Times shown in your local timezone
          </p>

          {/* Summary Stats - Integrated into header */}
          <div className="flex flex-wrap justify-center gap-4 text-sm text-gray-300 bg-zinc-900/50 border border-zinc-800 p-4 rounded-lg mb-6 max-w-2xl mx-auto">
            <div className="flex items-center gap-2">
              <span className="text-purple-400 text-xl">📅</span>
              <span><strong className="text-white">Most Active Day:</strong> {DAYS[peakDay]}s</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-purple-400 text-xl">🕐</span>
              <span><strong className="text-white">Peak Hour:</strong> {formatHour(peakHour)}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-purple-400 text-xl">🎵</span>
              <span><strong className="text-white">Total Plays:</strong> {totalPlays.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Heatmap */}
        <div className="bg-zinc-900 border border-zinc-700 rounded-xl p-4 md:p-8 overflow-x-auto">
          <div className="min-w-[600px]">
            {/* Hour Labels (Top) */}
            <div className="flex mb-2">
              <div className="w-12" /> {/* Spacer for day labels */}
              {HOURS.filter((h) => h % 3 === 0).map((hour) => (
                <div
                  key={hour}
                  className="flex-1 text-center text-xs text-gray-500"
                  style={{ marginLeft: hour === 0 ? 0 : 'calc(200% + 0.5rem)' }}
                >
                  {formatHour(hour)}
                </div>
              ))}
            </div>

            {/* Heatmap Grid */}
            <div className="space-y-1">
              {DAYS.map((day, dayIndex) => (
                <div key={day} className="flex items-center gap-1">
                  {/* Day Label */}
                  <div className="w-12 text-xs font-semibold text-gray-300">
                    {day}
                  </div>

                  {/* Hour Cells */}
                  <div className="flex gap-1 flex-1">
                    {HOURS.map((hour) => {
                      const count = heatmapData[dayIndex][hour];
                      const percentage = maxPlays > 0 ? (count / maxPlays) * 100 : 0;

                      return (
                        <div
                          key={hour}
                          className={`flex-1 aspect-square rounded ${getColor(count)} hover:ring-2 hover:ring-purple-400 transition-all cursor-pointer group relative`}
                          title={`${day} ${formatHour(hour)}: ${count} plays`}
                        >
                          {/* Tooltip on Hover */}
                          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-black border border-zinc-700 rounded text-xs text-white whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                            {count} plays
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            {/* Legend */}
            <div className="mt-6 flex items-center justify-center gap-2">
              <span className="text-xs text-gray-500">Less</span>
              <div className="flex gap-1">
                <div className="w-4 h-4 rounded bg-zinc-900" />
                <div className="w-4 h-4 rounded bg-purple-900" />
                <div className="w-4 h-4 rounded bg-purple-800" />
                <div className="w-4 h-4 rounded bg-purple-700" />
                <div className="w-4 h-4 rounded bg-purple-600" />
                <div className="w-4 h-4 rounded bg-purple-500" />
              </div>
              <span className="text-xs text-gray-500">More</span>
            </div>
          </div>
        </div>

        {/* Punchy Insight Callout */}
        <div className="mt-8 bg-purple-500/10 border border-purple-500/30 rounded-xl p-5 text-center">
          <div className="text-lg md:text-xl font-semibold text-purple-300">
            {punchyInsight}
          </div>
        </div>
      </div>
    </section>
  );
}
