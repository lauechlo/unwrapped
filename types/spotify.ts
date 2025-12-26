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
  track_number?: number;
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

export interface AudioFeatures {
  id: string;
  acousticness: number;        // 0.0 to 1.0
  danceability: number;        // 0.0 to 1.0
  energy: number;              // 0.0 to 1.0
  instrumentalness: number;    // 0.0 to 1.0
  key: number;                 // -1 to 11 (pitch class notation)
  liveness: number;            // 0.0 to 1.0
  loudness: number;            // -60 to 0 dB
  mode: number;                // 0 = minor, 1 = major
  speechiness: number;         // 0.0 to 1.0
  tempo: number;               // BPM
  time_signature: number;      // 3 to 7 (beats per measure)
  valence: number;             // 0.0 to 1.0 (musical positiveness)
  duration_ms: number;
  analysis_url: string;
  track_href: string;
  type: 'audio_features';
  uri: string;
}

export interface AudioFeaturesResponse {
  audio_features: (AudioFeatures | null)[];
}

export interface UserData {
  topTracks: {
    short: SpotifyTrack[];
    medium: SpotifyTrack[];
    long: SpotifyTrack[];
  };
  topArtists: {
    short: SpotifyArtist[];
    medium: SpotifyArtist[];
    long: SpotifyArtist[];
  };
  recentlyPlayed: PlayHistory[];
  savedTracks: SpotifyTrack[];
  // audioFeatures removed: deprecated by Spotify API November 27, 2024
}
