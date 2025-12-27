/**
 * Spotify API client with Zod validation and error handling
 */

import { z } from 'zod';
import axios, { AxiosError } from 'axios';
import {
  SpotifyTrack,
  SpotifyArtist,
  PlayHistory,
  TopTracksResponse,
  TopArtistsResponse,
  RecentlyPlayedResponse,
  AudioFeatures,
  AudioFeaturesResponse,
  TimeRange,
  UserData,
  SpotifyError,
} from '@/types/spotify';

const SPOTIFY_BASE_URL = 'https://api.spotify.com/v1';
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // ms

/**
 * Zod schemas for runtime validation
 */

const SpotifyImageSchema = z.object({
  url: z.string(),
  height: z.number().nullable(),
  width: z.number().nullable(),
});

const SpotifyArtistSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.literal('artist'),
  uri: z.string(),
  external_urls: z.object({
    spotify: z.string(),
  }),
  href: z.string(),
  genres: z.array(z.string()).optional(),
});

const SpotifyAlbumSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.literal('album'),
  uri: z.string(),
  album_type: z.enum(['album', 'single', 'compilation']),
  artists: z.array(SpotifyArtistSchema),
  images: z.array(SpotifyImageSchema),
  release_date: z.string(),
  external_urls: z.object({
    spotify: z.string(),
  }),
});

const SpotifyTrackSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.literal('track'),
  uri: z.string(),
  artists: z.array(SpotifyArtistSchema),
  album: SpotifyAlbumSchema,
  duration_ms: z.number(),
  preview_url: z.string().nullable(),
  popularity: z.number(),
  explicit: z.boolean(),
  external_urls: z.object({
    spotify: z.string(),
  }),
  href: z.string(),
});

const PlayHistorySchema = z.object({
  track: SpotifyTrackSchema,
  played_at: z.string(),
  context: z
    .object({
      type: z.string(),
      uri: z.string(),
      external_urls: z.object({
        spotify: z.string(),
      }),
      href: z.string(),
    })
    .nullable(),
});

const TopTracksResponseSchema = z.object({
  items: z.array(SpotifyTrackSchema),
  total: z.number(),
  limit: z.number(),
  offset: z.number(),
  href: z.string(),
  next: z.string().nullable(),
  previous: z.string().nullable(),
});

const TopArtistsResponseSchema = z.object({
  items: z.array(SpotifyArtistSchema),
  total: z.number(),
  limit: z.number(),
  offset: z.number(),
  href: z.string(),
  next: z.string().nullable(),
  previous: z.string().nullable(),
});

const RecentlyPlayedResponseSchema = z.object({
  items: z.array(PlayHistorySchema),
  next: z.string().nullable(),
  cursors: z.object({
    after: z.string(),
    before: z.string(),
  }),
  limit: z.number(),
  href: z.string(),
});

const AudioFeaturesSchema = z.object({
  id: z.string(),
  acousticness: z.number(),
  danceability: z.number(),
  energy: z.number(),
  instrumentalness: z.number(),
  key: z.number(),
  liveness: z.number(),
  loudness: z.number(),
  mode: z.number(),
  speechiness: z.number(),
  tempo: z.number(),
  time_signature: z.number(),
  valence: z.number(),
  duration_ms: z.number(),
  analysis_url: z.string(),
  track_href: z.string(),
  type: z.literal('audio_features'),
  uri: z.string(),
});

const AudioFeaturesResponseSchema = z.object({
  audio_features: z.array(AudioFeaturesSchema.nullable()),
});

/**
 * Custom error class for Spotify API errors
 */
export class SpotifyAPIError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public cause?: Error
  ) {
    super(message);
    this.name = 'SpotifyAPIError';
  }
}

/**
 * Delay helper for retries
 */
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Retry wrapper with exponential backoff
 */
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  retries = MAX_RETRIES
): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    if (retries === 0) throw error;

    const axiosError = error as AxiosError<SpotifyError>;

    // Don't retry on auth errors or client errors (except 429)
    if (
      axiosError.response?.status === 401 ||
      (axiosError.response?.status &&
        axiosError.response.status >= 400 &&
        axiosError.response.status < 500 &&
        axiosError.response.status !== 429)
    ) {
      throw error;
    }

    // Exponential backoff
    const waitTime = RETRY_DELAY * (MAX_RETRIES - retries + 1);
    await delay(waitTime);

    return retryWithBackoff(fn, retries - 1);
  }
}

/**
 * Make authenticated request to Spotify API
 */
async function makeSpotifyRequest<T>(
  endpoint: string,
  accessToken: string,
  params?: Record<string, string | number>
): Promise<T> {
  try {
    const response = await axios.get(`${SPOTIFY_BASE_URL}${endpoint}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      params,
    });

    return response.data;
  } catch (error) {
    const axiosError = error as AxiosError<SpotifyError>;

    if (axiosError.response) {
      throw new SpotifyAPIError(
        axiosError.response.data?.error?.message ||
          `HTTP ${axiosError.response.status}`,
        axiosError.response.status,
        axiosError
      );
    }

    throw new SpotifyAPIError(
      'Network error',
      0,
      axiosError as Error
    );
  }
}

/**
 * Get user's top tracks
 */
export async function getTopTracks(
  accessToken: string,
  timeRange: TimeRange = 'short_term',
  limit: number = 50
): Promise<SpotifyTrack[]> {
  const getData = async () => {
    const data = await makeSpotifyRequest<TopTracksResponse>(
      '/me/top/tracks',
      accessToken,
      { time_range: timeRange, limit }
    );

    // Validate with Zod
    const validated = TopTracksResponseSchema.parse(data);
    return validated.items;
  };

  return retryWithBackoff(getData);
}

/**
 * Get user's top artists
 */
export async function getTopArtists(
  accessToken: string,
  timeRange: TimeRange = 'short_term',
  limit: number = 50
): Promise<SpotifyArtist[]> {
  const getData = async () => {
    const data = await makeSpotifyRequest<TopArtistsResponse>(
      '/me/top/artists',
      accessToken,
      { time_range: timeRange, limit }
    );

    const validated = TopArtistsResponseSchema.parse(data);
    return validated.items;
  };

  return retryWithBackoff(getData);
}

/**
 * Get user's recently played tracks
 */
export async function getRecentlyPlayed(
  accessToken: string,
  limit: number = 50
): Promise<PlayHistory[]> {
  const getData = async () => {
    const data = await makeSpotifyRequest<RecentlyPlayedResponse>(
      '/me/player/recently-played',
      accessToken,
      { limit }
    );

    const validated = RecentlyPlayedResponseSchema.parse(data);
    return validated.items;
  };

  return retryWithBackoff(getData);
}

/**
 * Get user's saved (liked) tracks
 */
export async function getSavedTracks(
  accessToken: string,
  limit: number = 50
): Promise<SpotifyTrack[]> {
  const getData = async () => {
    const data = await makeSpotifyRequest<any>(
      '/me/tracks',
      accessToken,
      { limit }
    );

    // Spotify returns { items: [{ track: SpotifyTrack, added_at: string }] }
    return data.items.map((item: any) => item.track);
  };

  return retryWithBackoff(getData);
}

/**
 * Get audio features for multiple tracks
 * Batches requests to handle up to 100 tracks at once
 */
export async function getAudioFeatures(
  accessToken: string,
  trackIds: string[]
): Promise<Map<string, AudioFeatures>> {
  if (trackIds.length === 0) {
    return new Map();
  }

  const getData = async () => {
    const features = new Map<string, AudioFeatures>();

    // Spotify allows up to 100 track IDs per request
    const batchSize = 100;
    for (let i = 0; i < trackIds.length; i += batchSize) {
      const batch = trackIds.slice(i, i + batchSize);
      const ids = batch.join(',');

      const data = await makeSpotifyRequest<AudioFeaturesResponse>(
        '/audio-features',
        accessToken,
        { ids }
      );

      const validated = AudioFeaturesResponseSchema.parse(data);

      // Map non-null features by track ID
      validated.audio_features.forEach((feature) => {
        if (feature) {
          features.set(feature.id, feature);
        }
      });
    }

    return features;
  };

  return retryWithBackoff(getData);
}

/**
 * Fetch all user data in parallel
 */
export async function fetchUserData(accessToken: string): Promise<UserData> {
  try {
    console.log('[Spotify API] Fetching user data...');

    // Fetch all base data in parallel with individual error logging
    const results = await Promise.allSettled([
      getTopTracks(accessToken, 'short_term', 50).catch(e => { console.error('[Spotify API] Failed: topTracksShort', e); throw e; }),
      getTopTracks(accessToken, 'medium_term', 50).catch(e => { console.error('[Spotify API] Failed: topTracksMedium', e); throw e; }),
      getTopTracks(accessToken, 'long_term', 50).catch(e => { console.error('[Spotify API] Failed: topTracksLong', e); throw e; }),
      getTopArtists(accessToken, 'short_term', 50).catch(e => { console.error('[Spotify API] Failed: topArtistsShort', e); throw e; }),
      getTopArtists(accessToken, 'medium_term', 50).catch(e => { console.error('[Spotify API] Failed: topArtistsMedium', e); throw e; }),
      getTopArtists(accessToken, 'long_term', 50).catch(e => { console.error('[Spotify API] Failed: topArtistsLong', e); throw e; }),
      getRecentlyPlayed(accessToken, 50).catch(e => { console.error('[Spotify API] Failed: recentlyPlayed', e); throw e; }),
      getSavedTracks(accessToken, 50).catch(e => { console.error('[Spotify API] Failed: savedTracks', e); throw e; }),
    ]);

    // Check for failures
    const failures = results.filter(r => r.status === 'rejected');
    if (failures.length > 0) {
      console.error(`[Spotify API] ${failures.length} API call(s) failed`);
      failures.forEach((f, i) => {
        if (f.status === 'rejected') {
          console.error(`  - Call ${i}: ${f.reason}`);
        }
      });
      throw new Error(`${failures.length} Spotify API calls failed`);
    }

    // Extract values with proper typing
    const topTracksShort = results[0].status === 'fulfilled' ? results[0].value : [];
    const topTracksMedium = results[1].status === 'fulfilled' ? results[1].value : [];
    const topTracksLong = results[2].status === 'fulfilled' ? results[2].value : [];
    const topArtistsShort = results[3].status === 'fulfilled' ? results[3].value : [];
    const topArtistsMedium = results[4].status === 'fulfilled' ? results[4].value : [];
    const topArtistsLong = results[5].status === 'fulfilled' ? results[5].value : [];
    const recentlyPlayed = results[6].status === 'fulfilled' ? results[6].value : [];
    const savedTracks = results[7].status === 'fulfilled' ? results[7].value : [];

    console.log('[Spotify API] Data fetched successfully');
    console.log(`  - Top Tracks: ${topTracksShort.length} short, ${topTracksMedium.length} medium, ${topTracksLong.length} long`);
    console.log(`  - Top Artists: ${topArtistsShort.length} short, ${topArtistsMedium.length} medium, ${topArtistsLong.length} long`);
    console.log(`  - Recently Played: ${recentlyPlayed.length} tracks`);
    console.log(`  - Saved Tracks: ${savedTracks.length} tracks`);
    console.log(`  - Audio features: unavailable (deprecated by Spotify Nov 2024)`);

    return {
      topTracks: {
        short: topTracksShort,
        medium: topTracksMedium,
        long: topTracksLong,
      },
      topArtists: {
        short: topArtistsShort,
        medium: topArtistsMedium,
        long: topArtistsLong,
      },
      recentlyPlayed,
      savedTracks,
      // audioFeatures removed: deprecated by Spotify Nov 27, 2024
    };
  } catch (error) {
    if (error instanceof SpotifyAPIError) {
      throw error;
    }

    throw new SpotifyAPIError(
      'Failed to fetch user data',
      0,
      error as Error
    );
  }
}
