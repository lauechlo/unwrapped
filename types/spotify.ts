/**
 * Spotify API response types
 * Based on https://developer.spotify.com/documentation/web-api
 */

export interface SpotifyImage {
  url: string;
  height: number | null;
  width: number | null;
}

export interface SpotifyArtist {
  id: string;
  name: string;
  type: 'artist';
  uri: string;
  external_urls: {
    spotify: string;
  };
  href: string;
  genres?: string[];
}

export interface SpotifyAlbum {
  id: string;
  name: string;
  type: 'album';
  uri: string;
  album_type: 'album' | 'single' | 'compilation';
  artists: SpotifyArtist[];
  images: SpotifyImage[];
  release_date: string;
  external_urls: {
    spotify: string;
  };
}

export interface SpotifyTrack {
  id: string;
  name: string;
  type: 'track';
  uri: string;
  artists: SpotifyArtist[];
  album: SpotifyAlbum;
  duration_ms: number;
  preview_url: string | null;
  popularity: number;
  explicit: boolean;
  external_urls: {
    spotify: string;
  };
  href: string;
}

export interface PlayHistory {
  track: SpotifyTrack;
  played_at: string; // ISO 8601 timestamp
  context: {
    type: string;
    uri: string;
    external_urls: {
      spotify: string;
    };
    href: string;
  } | null;
}

export interface TopTracksResponse {
  items: SpotifyTrack[];
  total: number;
  limit: number;
  offset: number;
  href: string;
  next: string | null;
  previous: string | null;
}

export interface TopArtistsResponse {
  items: SpotifyArtist[];
  total: number;
  limit: number;
  offset: number;
  href: string;
  next: string | null;
  previous: string | null;
}

export interface RecentlyPlayedResponse {
  items: PlayHistory[];
  next: string | null;
  cursors: {
    after: string;
    before: string;
  };
  limit: number;
  href: string;
}

export type TimeRange = 'short_term' | 'medium_term' | 'long_term';

export interface SpotifyTokenResponse {
  access_token: string;
  token_type: 'Bearer';
  expires_in: number;
  refresh_token?: string;
  scope: string;
}

export interface SpotifyError {
  error: {
    status: number;
    message: string;
  };
}

export interface UserData {
  topTracks: {
    short: SpotifyTrack[];
    medium: SpotifyTrack[];
    long: SpotifyTrack[];
  };
  topArtists: SpotifyArtist[];
  recentlyPlayed: PlayHistory[];
}
