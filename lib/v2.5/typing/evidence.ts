/**
 * V2.5 Evidence Extraction
 *
 * Extracts concrete, citable evidence from SourceOfTruth for each dimension.
 * Focus: SHOW THE DATA, minimal prose.
 */

import type { SourceOfTruth } from '@/lib/v2/types';
import type { TemporalResult, ProcessingResult, DiscoveryResult, AttachmentResult } from './types';

// ============================================================================
// Evidence Data Structures
// ============================================================================

export interface ConcreteExample {
  label: string;      // "Peak Hour"
  value: string;      // "11pm"
  detail: string;     // "1,247 plays"
  emphasis?: string;  // Optional: "23 hours of the same song"
}

export interface DimensionEvidence {
  topExamples: ConcreteExample[];
  insights?: string[];  // Optional minimal insights
  visualizationData?: any;  // Raw data for charts
}

// ============================================================================
// Helper Functions
// ============================================================================

function formatNumber(num: number): string {
  return num.toLocaleString();
}

function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
}

function getTopNFromMap<K>(map: Map<K, number>, n: number): Array<[K, number]> {
  return Array.from(map.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, n);
}

// ============================================================================
// Temporal Evidence
// ============================================================================

export function extractTemporalEvidence(
  sot: SourceOfTruth,
  result: TemporalResult
): DimensionEvidence {
  const examples: ConcreteExample[] = [];

  // Get top 3 peak hours
  const hourCounts = sot.temporal.byHour;
  const topHours = getTopNFromMap(hourCounts, 3);

  if (topHours.length > 0) {
    const [hour, count] = topHours[0];
    const timeStr = hour === 0 ? '12am' : hour < 12 ? `${hour}am` : hour === 12 ? '12pm' : `${hour - 12}pm`;
    const isNightHour = hour >= 21 || hour < 5;
    const isDiurnal = result.code === 'D';

    // Self-comparison: peak hour vs average hour
    const avgHourPlays = sot.meta.totalPlays / 24;
    const peakVsAvg = (count / avgHourPlays).toFixed(1);

    examples.push({
      label: 'Peak Hour',
      value: timeStr,
      detail: `${formatNumber(count)} plays — ${peakVsAvg}× your hourly average`,
      emphasis: isDiurnal && isNightHour
        ? 'Peak hour ≠ overall pattern'
        : undefined,
    });
  }

  // Top 3 hours as full list
  if (topHours.length >= 3) {
    const hoursList = topHours.map(([hour, count]) => {
      const timeStr = hour === 0 ? '12am' : hour < 12 ? `${hour}am` : hour === 12 ? '12pm' : `${hour - 12}pm`;
      return `${timeStr} — ${formatNumber(count)} plays`;
    }).join('\n');

    examples.push({
      label: 'Top 3 Hours',
      value: hoursList,
      detail: `${((topHours[0][1] + topHours[1][1] + topHours[2][1]) / sot.meta.totalPlays * 100).toFixed(0)}% of all plays`,
    });
  }

  // Most active day of the week
  const dayOfWeekCounts = sot.temporal.byDayOfWeek;
  if (dayOfWeekCounts.size > 0) {
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const topDays = getTopNFromMap(dayOfWeekCounts, 3);
    if (topDays.length > 0) {
      const [topDay, topDayPlays] = topDays[0];
      // Self-comparison: top day vs average day
      const avgDayPlays = sot.meta.totalPlays / 7;
      const dayVsAvg = (topDayPlays / avgDayPlays).toFixed(1);

      examples.push({
        label: 'Most Active Day',
        value: dayNames[topDay],
        detail: `${formatNumber(topDayPlays)} plays — ${dayVsAvg}× your daily average`,
      });
    }

    // Weekend vs weekday
    const weekendPlays = (dayOfWeekCounts.get(0) || 0) + (dayOfWeekCounts.get(6) || 0);
    const weekdayPlays = sot.meta.totalPlays - weekendPlays;
    const weekendPercent = (weekendPlays / sot.meta.totalPlays * 100).toFixed(0);

    examples.push({
      label: 'Weekend vs Weekday',
      value: `${weekendPercent}% weekend`,
      detail: `${formatNumber(weekendPlays)} weekend, ${formatNumber(weekdayPlays)} weekday`,
    });
  }

  // Time of day breakdown
  let morningPlays = 0, afternoonPlays = 0, eveningPlays = 0, nightPlays = 0;
  for (const [hour, count] of hourCounts.entries()) {
    if (hour >= 5 && hour < 12) morningPlays += count;
    else if (hour >= 12 && hour < 17) afternoonPlays += count;
    else if (hour >= 17 && hour < 21) eveningPlays += count;
    else nightPlays += count;
  }
  const total = sot.meta.totalPlays;

  examples.push({
    label: 'Time of Day Breakdown',
    value: `Morning (5a-12p): ${(morningPlays / total * 100).toFixed(0)}%\nAfternoon (12p-5p): ${(afternoonPlays / total * 100).toFixed(0)}%\nEvening (5p-9p): ${(eveningPlays / total * 100).toFixed(0)}%\nNight (9p-5a): ${(nightPlays / total * 100).toFixed(0)}%`,
    detail: `${formatNumber(total)} total plays analyzed`,
  });

  // Data range
  const dateRange = sot.meta.dateRange;
  examples.push({
    label: 'Data Range',
    value: `${formatDate(new Date(dateRange.start))} → ${formatDate(new Date(dateRange.end))}`,
    detail: `${Math.round((new Date(dateRange.end).getTime() - new Date(dateRange.start).getTime()) / (30 * 24 * 60 * 60 * 1000))} months of listening history`,
  });

  // Find top track for late night/day listening
  const topTracks = Array.from(sot.tracks.values())
    .sort((a, b) => b.totalPlays - a.totalPlays)
    .slice(0, 1);

  if (topTracks.length > 0) {
    const topTrack = topTracks[0];
    examples.push({
      label: result.code === 'N' ? 'Late Night Favorite' : 'Go-To Track',
      value: topTrack.name || 'Unknown',
      detail: `${topTrack.totalPlays}× plays · ${topTrack.artist || 'Unknown Artist'}`,
    });
  }

  return { topExamples: examples };
}

// ============================================================================
// Processing Evidence
// ============================================================================

export function extractProcessingEvidence(
  sot: SourceOfTruth,
  result: ProcessingResult
): DimensionEvidence {
  const examples: ConcreteExample[] = [];

  // Get top 10 most-replayed tracks (show 5 in list, use 10 for chart)
  const tracksByPlays = Array.from(sot.tracks.values())
    .filter(track => track.totalPlays > 1)
    .sort((a, b) => b.totalPlays - a.totalPlays)
    .slice(0, 10);

  // Calculate average plays per track for self-comparison
  const avgPlays = sot.meta.totalPlays / sot.meta.uniqueTracks;

  if (tracksByPlays.length > 0) {
    // Top looped track with timestamps
    const topTrack = tracksByPlays[0];
    const trackName = topTrack.name || 'Unknown Track';
    const artistName = topTrack.artist || '';
    const firstPlayed = topTrack.firstPlayed ? formatDate(new Date(topTrack.firstPlayed)) : 'Unknown';
    const lastPlayed = topTrack.lastPlayed ? formatDate(new Date(topTrack.lastPlayed)) : 'Unknown';

    // Self-comparison: top track vs average plays
    const topVsAvg = (topTrack.totalPlays / avgPlays).toFixed(0);

    examples.push({
      label: 'Most Replayed',
      value: trackName,
      detail: `${topTrack.totalPlays}× plays — ${topVsAvg}× your average track${artistName ? ` · ${artistName}` : ''}`,
      emphasis: `First played: ${firstPlayed}`,
    });

    // Top 5 list with artist names
    const top5List = tracksByPlays
      .slice(0, 5)
      .map((t, i) => `${i + 1}. ${t.name || 'Unknown'} — ${t.totalPlays}× · ${t.artist || 'Unknown'}`)
      .join('\n');

    examples.push({
      label: 'Top 5 Loops',
      value: top5List,
      detail: `${tracksByPlays.slice(0, 5).reduce((sum, t) => sum + t.totalPlays, 0)} total plays from top 5`,
    });
  }

  // Completion rate
  const totalPlays = sot.meta.totalPlays;
  const completedPlays = Array.from(sot.tracks.values())
    .reduce((sum, track) => sum + track.completedPlays, 0);
  const completionRate = (completedPlays / totalPlays * 100).toFixed(0);
  const skippedPlays = totalPlays - completedPlays;

  examples.push({
    label: 'Completion Rate',
    value: `${completionRate}%`,
    detail: `${formatNumber(completedPlays)} finished · ${formatNumber(skippedPlays)} skipped`,
    emphasis: parseInt(completionRate) >= 70 ? 'You listen to full songs' : parseInt(completionRate) < 50 ? 'You skip around a lot' : undefined,
  });

  // Average plays per track
  const avgPlaysPerTrack = (totalPlays / sot.meta.uniqueTracks).toFixed(1);

  examples.push({
    label: 'Plays Per Track',
    value: `${avgPlaysPerTrack}× average`,
    detail: `${formatNumber(totalPlays)} plays across ${formatNumber(sot.meta.uniqueTracks)} unique tracks`,
    emphasis: result.replayMultiplier >= 1.5
      ? `You really commit to your favorites`
      : undefined,
  });

  // One-hit wonders vs heavy rotation
  const oneTimeTracks = Array.from(sot.tracks.values()).filter(t => t.totalPlays === 1).length;
  const heavyRotation = Array.from(sot.tracks.values()).filter(t => t.totalPlays >= 10).length;

  examples.push({
    label: 'Track Distribution',
    value: `${formatNumber(oneTimeTracks)} played once\n${formatNumber(heavyRotation)} played 10+ times`,
    detail: `${((oneTimeTracks / sot.meta.uniqueTracks) * 100).toFixed(0)}% one-time listens · ${((heavyRotation / sot.meta.uniqueTracks) * 100).toFixed(0)}% heavy rotation`,
  });

  // Add visualization data for ReplayIntensityChart
  const chartData = tracksByPlays.slice(0, 15).map(track => ({
    name: track.name || 'Unknown Track',
    artistName: track.artist,
    totalPlays: track.totalPlays,
  }));

  return {
    topExamples: examples,
    visualizationData: {
      type: 'replayIntensity',
      tracks: chartData,
    },
  };
}

// ============================================================================
// Discovery Evidence
// ============================================================================

export function extractDiscoveryEvidence(
  sot: SourceOfTruth,
  result: DiscoveryResult
): DimensionEvidence {
  const examples: ConcreteExample[] = [];

  // Unique artists with context
  const artistsPerPlay = (sot.meta.totalPlays / result.uniqueArtists).toFixed(1);
  examples.push({
    label: 'Unique Artists',
    value: formatNumber(result.uniqueArtists),
    detail: `1 new artist every ~${artistsPerPlay} plays`,
    emphasis: result.code === 'E' ? 'Active music explorer' : 'Loyal to your favorites',
  });

  // New artists per month (if temporal data available)
  const monthlyData = sot.temporal.byMonth;
  if (monthlyData && monthlyData.size > 0) {
    const monthsWithNewArtists = Array.from(monthlyData.entries())
      .map(([monthKey, data]) => ({
        month: monthKey,
        newArtists: data.newArtists || 0,
      }))
      .filter(m => m.newArtists > 0)
      .sort((a, b) => b.newArtists - a.newArtists);

    // Peak discovery month
    if (monthsWithNewArtists.length > 0) {
      const topMonth = monthsWithNewArtists[0];
      const [year, monthNum] = topMonth.month.split('-');
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const monthName = monthNames[parseInt(monthNum) - 1];

      examples.push({
        label: 'Peak Discovery Month',
        value: `${monthName} ${year}`,
        detail: `${topMonth.newArtists} new artists discovered`,
        emphasis: 'Your biggest exploration period',
      });
    }

    // Average discovery rate
    const totalMonths = monthlyData.size;
    const totalNewArtists = Array.from(monthlyData.values())
      .reduce((sum, data) => sum + (data.newArtists || 0), 0);
    const avgPerMonth = (totalNewArtists / totalMonths).toFixed(1);

    examples.push({
      label: 'Discovery Rate',
      value: `${avgPerMonth} artists/month`,
      detail: `${formatNumber(totalNewArtists)} new artists over ${totalMonths} months`,
    });

    // Top 3 discovery months
    const top3Months = monthsWithNewArtists.slice(0, 3);
    if (top3Months.length >= 3) {
      const monthsList = top3Months.map(m => {
        const [y, mo] = m.month.split('-');
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        return `${monthNames[parseInt(mo) - 1]} '${y.slice(2)} — ${m.newArtists} artists`;
      }).join('\n');

      examples.push({
        label: 'Top 3 Discovery Months',
        value: monthsList,
        detail: 'Your biggest exploration periods',
      });
    }
  }

  // Artist concentration - Top 5 with play details
  const topArtists = getTopNFromMap(
    new Map(Array.from(sot.artists.entries()).map(([name, data]) => [name, data.totalPlays])),
    5
  );

  if (topArtists.length > 0) {
    const top5Plays = topArtists.reduce((sum, [_, plays]) => sum + plays, 0);
    const top5Percent = (top5Plays / sot.meta.totalPlays * 100).toFixed(0);

    // Show actual artist names with percentages
    const artistList = topArtists
      .map(([name, plays], i) => {
        const pct = ((plays / sot.meta.totalPlays) * 100).toFixed(0);
        return `${i + 1}. ${name} — ${formatNumber(plays)}× (${pct}%)`;
      })
      .join('\n');

    examples.push({
      label: 'Your Top 5 Artists',
      value: artistList,
      detail: `${top5Percent}% of all ${formatNumber(sot.meta.totalPlays)} plays`,
      emphasis: result.code === 'R' && parseInt(top5Percent) > 60
        ? 'Highly concentrated on favorites'
        : undefined,
    });
  }

  // #1 Artist with first/last played
  if (topArtists.length > 0) {
    const [topArtistName, topArtistPlays] = topArtists[0];
    const artistData = sot.artists.get(topArtistName);
    const trackCount = artistData?.uniqueTracks || 0;
    const firstPlayed = artistData?.firstPlayed ? formatDate(new Date(artistData.firstPlayed)) : 'Unknown';

    examples.push({
      label: '#1 Artist',
      value: topArtistName,
      detail: `${formatNumber(topArtistPlays)} plays across ${trackCount} tracks`,
      emphasis: `Listening since ${firstPlayed}`,
    });
  }

  // Add visualization data for DiscoveryTimeline
  const monthlyDiscoveryData: Array<{ month: string; newArtists: number }> = [];
  if (monthlyData && monthlyData.size > 0) {
    Array.from(monthlyData.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .forEach(([month, data]) => {
        monthlyDiscoveryData.push({
          month,
          newArtists: data.newArtists || 0,
        });
      });
  }

  return {
    topExamples: examples,
    visualizationData: monthlyDiscoveryData.length > 0 ? {
      type: 'discoveryTimeline',
      monthlyData: monthlyDiscoveryData,
    } : undefined,
  };
}

// ============================================================================
// Attachment Evidence
// ============================================================================

export function extractAttachmentEvidence(
  sot: SourceOfTruth,
  result: AttachmentResult
): DimensionEvidence {
  const examples: ConcreteExample[] = [];

  // Top artist with listening history details
  const topArtistData = sot.artists.get(result.topArtistName);
  if (result.topArtistName && topArtistData) {
    const firstPlayed = topArtistData.firstPlayed ? formatDate(new Date(topArtistData.firstPlayed)) : 'Unknown';
    const lastPlayed = topArtistData.lastPlayed ? formatDate(new Date(topArtistData.lastPlayed)) : 'Unknown';

    examples.push({
      label: 'Top Artist',
      value: result.topArtistName,
      detail: `${result.topArtistMonths.toFixed(0)} months of loyalty`,
      emphasis: `First listened: ${firstPlayed}`,
    });

    const topArtistPlays = topArtistData.totalPlays;
    const topArtistPercent = (topArtistPlays / sot.meta.totalPlays * 100).toFixed(0);
    const trackCount = topArtistData.uniqueTracks || 0;

    // Self-comparison: top artist vs average artist
    const avgArtistPlays = sot.meta.totalPlays / sot.meta.uniqueArtists;
    const topVsAvg = (topArtistPlays / avgArtistPlays).toFixed(0);

    examples.push({
      label: 'Top Artist Stats',
      value: `${formatNumber(topArtistPlays)} plays`,
      detail: `${topArtistPercent}% of all listening — ${topVsAvg}× your average artist · ${trackCount} tracks`,
    });

    // Peak month for top artist with formatted date
    const monthlyPlays = topArtistData.playsByMonth;
    if (monthlyPlays && monthlyPlays.size > 0) {
      const peakMonth = getTopNFromMap(monthlyPlays, 1)[0];
      if (peakMonth) {
        const [month, plays] = peakMonth;
        const [year, monthNum] = month.split('-');
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const monthName = monthNames[parseInt(monthNum) - 1];

        examples.push({
          label: 'Peak Month',
          value: `${monthName} ${year}`,
          detail: `${formatNumber(plays)} plays of ${result.topArtistName}`,
          emphasis: 'Your most intense listening period',
        });
      }
    }
  }

  // Top 5 artists comparison
  const topArtists = getTopNFromMap(
    new Map(Array.from(sot.artists.entries()).map(([name, data]) => [name, data.totalPlays])),
    5
  );

  if (topArtists.length >= 2) {
    const [topName, topPlays] = topArtists[0];
    const [secondName, secondPlays] = topArtists[1];
    const ratio = (topPlays / secondPlays).toFixed(1);

    examples.push({
      label: '#1 vs #2 Artist',
      value: `${topName} vs ${secondName}`,
      detail: `${formatNumber(topPlays)} vs ${formatNumber(secondPlays)} plays (${ratio}× more)`,
      emphasis: result.code === 'A' && parseFloat(ratio) > 2
        ? 'Strong single-artist attachment'
        : undefined,
    });
  }

  // Calculate artist churn from monthly data
  const monthlyData = sot.temporal.byMonth;
  const monthlyTopArtists: Array<{ month: string; artist: string; plays: number }> = [];

  if (monthlyData && monthlyData.size > 0) {
    for (const [month, data] of monthlyData.entries()) {
      let topArtistForMonth = { name: '', plays: 0 };

      for (const [artistName, artistData] of sot.artists.entries()) {
        if (artistData.playsByMonth) {
          const playsThisMonth = artistData.playsByMonth.get(month) || 0;
          if (playsThisMonth > topArtistForMonth.plays) {
            topArtistForMonth = { name: artistName, plays: playsThisMonth };
          }
        }
      }

      if (topArtistForMonth.name) {
        monthlyTopArtists.push({
          month,
          artist: topArtistForMonth.name,
          plays: topArtistForMonth.plays,
        });
      }
    }

    // Calculate artist changes
    if (monthlyTopArtists.length > 1) {
      const sortedMonthly = [...monthlyTopArtists].sort((a, b) => a.month.localeCompare(b.month));
      let changes = 0;
      let longestStreak = 1;
      let currentStreak = 1;
      let streakArtist = sortedMonthly[0]?.artist;
      let longestStreakArtist = streakArtist;

      for (let i = 1; i < sortedMonthly.length; i++) {
        if (sortedMonthly[i].artist !== sortedMonthly[i - 1].artist) {
          changes++;
          if (currentStreak > longestStreak) {
            longestStreak = currentStreak;
            longestStreakArtist = sortedMonthly[i - 1].artist;
          }
          currentStreak = 1;
        } else {
          currentStreak++;
        }
      }
      if (currentStreak > longestStreak) {
        longestStreak = currentStreak;
        longestStreakArtist = sortedMonthly[sortedMonthly.length - 1].artist;
      }

      examples.push({
        label: 'Artist Loyalty Pattern',
        value: `${changes} artist changes`,
        detail: `Over ${sortedMonthly.length} months of listening`,
        emphasis: result.code === 'A' ? 'You stick with favorites' : 'Your tastes evolve',
      });

      examples.push({
        label: 'Longest #1 Streak',
        value: `${longestStreakArtist}`,
        detail: `${longestStreak} consecutive months as #1`,
      });
    }
  }

  // Build artist dominance data for the new chart
  const artistDominanceData = topArtists.map(([name, plays]) => ({
    name,
    totalPlays: plays,
  }));

  return {
    topExamples: examples,
    visualizationData: {
      type: 'attachmentTimeline',
      monthlyTopArtists,
      artistDominance: {
        topArtists: artistDominanceData,
        totalPlays: sot.meta.totalPlays,
        topArtistMonths: result.topArtistMonths,
      },
    },
  };
}
