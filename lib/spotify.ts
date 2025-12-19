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
 * Fetch all user data in parallel
 */
export async function fetchUserData(accessToken: string): Promise<UserData> {
  try {
    const [
      topTracksShort,
      topTracksMedium,
      topTracksLong,
      topArtistsShort,
      recentlyPlayed,
    ] = await Promise.all([
      getTopTracks(accessToken, 'short_term', 50),
      getTopTracks(accessToken, 'medium_term', 50),
      getTopTracks(accessToken, 'long_term', 50),
      getTopArtists(accessToken, 'short_term', 50),
      getRecentlyPlayed(accessToken, 50),
    ]);

    return {
      topTracks: {
        short: topTracksShort,
        medium: topTracksMedium,
        long: topTracksLong,
      },
      topArtists: topArtistsShort,
      recentlyPlayed,
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
