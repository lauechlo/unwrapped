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
    examples.push({
      label: 'Peak Hour',
      value: timeStr,
      detail: `${formatNumber(count)} plays`,
    });
  }

  // Top 3 hours list
  if (topHours.length >= 3) {
    const hoursList = topHours.map(([hour, count]) => {
      const timeStr = hour === 0 ? '12am' : hour < 12 ? `${hour}am` : hour === 12 ? '12pm' : `${hour - 12}pm`;
      return `${timeStr} (${formatNumber(count)})`;
    }).join(', ');

    examples.push({
      label: 'Top 3 Hours',
      value: hoursList,
      detail: `${((topHours[0][1] + topHours[1][1] + topHours[2][1]) / sot.meta.totalPlays * 100).toFixed(0)}% of all plays`,
    });
  }

  // Weekend vs weekday
  const dayOfWeekCounts = sot.temporal.byDayOfWeek;
  if (dayOfWeekCounts.size > 0) {
    const weekendPlays = (dayOfWeekCounts.get(0) || 0) + (dayOfWeekCounts.get(6) || 0);
    const weekdayPlays = sot.meta.totalPlays - weekendPlays;
    const weekendPercent = (weekendPlays / sot.meta.totalPlays * 100).toFixed(0);

    examples.push({
      label: 'Weekend vs Weekday',
      value: `${weekendPercent}% weekend`,
      detail: `${formatNumber(weekendPlays)} weekend, ${formatNumber(weekdayPlays)} weekday`,
    });
  }

  // Total night vs day plays
  const nightPlays = Math.round(sot.meta.totalPlays * result.nightPercentage);
  const dayPlays = sot.meta.totalPlays - nightPlays;

  examples.push({
    label: result.code === 'N' ? 'Night Plays' : 'Day Plays',
    value: formatNumber(result.code === 'N' ? nightPlays : dayPlays),
    detail: `${result.nightPercentage.toFixed(0)}% after 9pm`,
  });

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

  // Get top 5 most-replayed tracks
  const tracksByPlays = Array.from(sot.tracks.values())
    .filter(track => track.totalPlays > 1)
    .sort((a, b) => b.totalPlays - a.totalPlays)
    .slice(0, 5);

  if (tracksByPlays.length > 0) {
    // Top looped track
    const topTrack = tracksByPlays[0];
    const trackName = topTrack.name || 'Unknown Track';
    const artistName = topTrack.artistName || '';

    examples.push({
      label: 'Most Replayed',
      value: trackName,
      detail: `${topTrack.totalPlays}× plays${artistName ? ` · ${artistName}` : ''}`,
    });

    // Top 5 list
    const top5List = tracksByPlays
      .map((t, i) => `${i + 1}. ${t.name || 'Unknown'} (${t.totalPlays}×)`)
      .join('\n');

    examples.push({
      label: 'Top 5 Loops',
      value: top5List,
      detail: `${tracksByPlays.reduce((sum, t) => sum + t.totalPlays, 0)} total plays`,
    });
  }

  // Completion rate
  const totalPlays = sot.meta.totalPlays;
  const completedPlays = Array.from(sot.tracks.values())
    .reduce((sum, track) => sum + track.completedPlays, 0);
  const completionRate = (completedPlays / totalPlays * 100).toFixed(0);

  examples.push({
    label: 'Completion Rate',
    value: `${completionRate}%`,
    detail: `${formatNumber(completedPlays)} of ${formatNumber(totalPlays)} plays finished`,
  });

  // Average plays per track
  const avgPlaysPerTrack = (totalPlays / sot.meta.uniqueTracks).toFixed(1);

  examples.push({
    label: 'Plays Per Track',
    value: `${avgPlaysPerTrack}× average`,
    detail: `${formatNumber(totalPlays)} plays ÷ ${formatNumber(sot.meta.uniqueTracks)} tracks`,
    emphasis: result.replayMultiplier >= 1.5
      ? `${result.replayMultiplier.toFixed(1)}× more than average user`
      : undefined,
  });

  // Add visualization data for ReplayIntensityChart
  const chartData = tracksByPlays.slice(0, 15).map(track => ({
    name: track.name || 'Unknown Track',
    artistName: track.artistName,
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

  // Unique artists
  examples.push({
    label: 'Unique Artists',
    value: formatNumber(result.uniqueArtists),
    detail: `${result.uniqueArtistPercentage.toFixed(1)}% of total plays`,
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
      .sort((a, b) => b.newArtists - a.newArtists)
      .slice(0, 3);

    if (monthsWithNewArtists.length > 0) {
      const topMonth = monthsWithNewArtists[0];
      examples.push({
        label: 'Peak Discovery Month',
        value: topMonth.month,
        detail: `${topMonth.newArtists} new artists discovered`,
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
      detail: `${totalNewArtists} new artists over ${totalMonths} months`,
    });
  }

  // Artist concentration
  const topArtists = getTopNFromMap(
    new Map(Array.from(sot.artists.entries()).map(([name, data]) => [name, data.totalPlays])),
    5
  );

  if (topArtists.length > 0) {
    const top5Plays = topArtists.reduce((sum, [_, plays]) => sum + plays, 0);
    const top5Percent = (top5Plays / sot.meta.totalPlays * 100).toFixed(0);

    examples.push({
      label: 'Top 5 Artists',
      value: `${top5Percent}% of plays`,
      detail: `${formatNumber(top5Plays)} plays across top 5`,
      emphasis: result.code === 'R' && parseInt(top5Percent) > 60
        ? 'Highly concentrated on favorites'
        : undefined,
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

  // Top artist details
  if (result.topArtistName) {
    examples.push({
      label: 'Top Artist',
      value: result.topArtistName,
      detail: `${result.topArtistMonths.toFixed(0)} months of loyalty`,
    });
  }

  // Top artist play count and percentage
  const topArtistData = sot.artists.get(result.topArtistName);
  if (topArtistData) {
    const topArtistPlays = topArtistData.totalPlays;
    const topArtistPercent = (topArtistPlays / sot.meta.totalPlays * 100).toFixed(0);

    examples.push({
      label: 'Top Artist Plays',
      value: formatNumber(topArtistPlays),
      detail: `${topArtistPercent}% of all listening`,
    });

    // Peak month for top artist
    const monthlyPlays = topArtistData.playsByMonth;
    if (monthlyPlays && monthlyPlays.size > 0) {
      const peakMonth = getTopNFromMap(monthlyPlays, 1)[0];
      if (peakMonth) {
        const [month, plays] = peakMonth;
        examples.push({
          label: 'Peak Month',
          value: month,
          detail: `${formatNumber(plays)} plays`,
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
      label: '#1 vs #2',
      value: `${ratio}× more`,
      detail: `${formatNumber(topPlays)} vs ${formatNumber(secondPlays)} plays`,
      emphasis: result.code === 'A' && parseFloat(ratio) > 2
        ? 'Strong single-artist attachment'
        : undefined,
    });
  }

  // Add visualization data for AttachmentTimeline
  // Extract top artist per month from temporal data
  const monthlyTopArtists: Array<{ month: string; artist: string; plays: number }> = [];
  const monthlyData = sot.temporal.byMonth;

  if (monthlyData && monthlyData.size > 0) {
    for (const [month, data] of monthlyData.entries()) {
      // Find top artist for this month
      let topArtistForMonth = { name: '', plays: 0 };

      // Get all artists and their plays for this month
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
  }

  return {
    topExamples: examples,
    visualizationData: monthlyTopArtists.length > 0 ? {
      type: 'attachmentTimeline',
      monthlyTopArtists,
    } : undefined,
  };
}
