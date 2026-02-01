// Temporal aggregation
import { SanitizedStreamingRecord, TemporalAggregate, WeekAggregate, MonthAggregate } from '../types';
import { getWeekKey, getMonthKey } from './utils';

/**
 * Build temporal aggregates from streaming records
 */
export function buildTemporalAggregates(
  records: SanitizedStreamingRecord[]
): TemporalAggregate {
  const temporal: TemporalAggregate = {
    byHour: new Map(),
    byDayOfWeek: new Map(),
    byWeek: new Map(),
    byMonth: new Map(),
    dateRange: { start: new Date(), end: new Date() },
  };

  // Track all timestamps
  const timestamps: Date[] = [];

  // First pass: collect basic temporal data
  for (const record of records) {
    const timestamp = new Date(record.ts);
    timestamps.push(timestamp);

    const hour = timestamp.getHours();
    const dayOfWeek = timestamp.getDay();

    // By hour
    temporal.byHour.set(hour, (temporal.byHour.get(hour) || 0) + 1);

    // By day of week
    temporal.byDayOfWeek.set(dayOfWeek, (temporal.byDayOfWeek.get(dayOfWeek) || 0) + 1);
  }

  // Calculate date range
  if (timestamps.length > 0) {
    temporal.dateRange.start = new Date(Math.min(...timestamps.map(d => d.getTime())));
    temporal.dateRange.end = new Date(Math.max(...timestamps.map(d => d.getTime())));
  }

  // Second pass: build week aggregates
  const weekData = new Map<string, {
    plays: SanitizedStreamingRecord[];
    artists: Set<string>;
  }>();

  for (const record of records) {
    const timestamp = new Date(record.ts);
    const weekKey = getWeekKey(timestamp);

    if (!weekData.has(weekKey)) {
      weekData.set(weekKey, { plays: [], artists: new Set() });
    }

    const week = weekData.get(weekKey)!;
    week.plays.push(record);
    if (record.master_metadata_album_artist_name) {
      week.artists.add(record.master_metadata_album_artist_name);
    }
  }

  // Build week aggregates with new artist detection
  const sortedWeeks = Array.from(weekData.keys()).sort();
  const seenArtists = new Set<string>();

  for (const weekKey of sortedWeeks) {
    const week = weekData.get(weekKey)!;
    const newArtists = new Set<string>();

    for (const artist of week.artists) {
      if (!seenArtists.has(artist)) {
        newArtists.add(artist);
        seenArtists.add(artist);
      }
    }

    // Calculate skip rate and avg ms played
    const skipped = week.plays.filter(p => p.skipped).length;
    const totalMs = week.plays.reduce((sum, p) => sum + p.ms_played, 0);

    const weekAgg: WeekAggregate = {
      weekKey,
      playCount: week.plays.length,
      artists: week.artists,
      newArtists,
      skipRate: skipped / week.plays.length,
      avgMsPlayed: totalMs / week.plays.length,
    };

    temporal.byWeek.set(weekKey, weekAgg);
  }

  // Third pass: build month aggregates
  const monthData = new Map<string, {
    plays: SanitizedStreamingRecord[];
    artistCounts: Map<string, number>;
  }>();

  for (const record of records) {
    const timestamp = new Date(record.ts);
    const monthKey = getMonthKey(timestamp);

    if (!monthData.has(monthKey)) {
      monthData.set(monthKey, { plays: [], artistCounts: new Map() });
    }

    const month = monthData.get(monthKey)!;
    month.plays.push(record);

    const artist = record.master_metadata_album_artist_name;
    if (artist) {
      month.artistCounts.set(artist, (month.artistCounts.get(artist) || 0) + 1);
    }
  }

  // Sort months chronologically and track new artists per month
  const sortedMonths = Array.from(monthData.keys()).sort();
  const seenArtistsForMonths = new Set<string>();

  for (const monthKey of sortedMonths) {
    const month = monthData.get(monthKey)!;

    // Count new artists this month
    let newArtistsCount = 0;
    for (const artist of month.artistCounts.keys()) {
      if (!seenArtistsForMonths.has(artist)) {
        newArtistsCount++;
        seenArtistsForMonths.add(artist);
      }
    }

    // Sort artists by play count
    const topArtists = Array.from(month.artistCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([name, plays]) => ({ name, plays }));

    // Calculate skip rate and avg ms played
    const skipped = month.plays.filter(p => p.skipped).length;
    const totalMs = month.plays.reduce((sum, p) => sum + p.ms_played, 0);

    const monthAgg: MonthAggregate = {
      monthKey,
      playCount: month.plays.length,
      artists: new Set(month.artistCounts.keys()),
      newArtists: newArtistsCount,
      topArtists,
      skipRate: skipped / month.plays.length,
      avgMsPlayed: totalMs / month.plays.length,
    };

    temporal.byMonth.set(monthKey, monthAgg);
  }

  return temporal;
}
