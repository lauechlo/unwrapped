/**
 * Spotify OAuth Authorization Route
 * Redirects user to Spotify authorization page
 */

import { NextRequest, NextResponse } from 'next/server';

const SPOTIFY_AUTH_URL = 'https://accounts.spotify.com/authorize';

const REQUIRED_SCOPES = [
  'user-top-read',
  'user-read-recently-played',
  'user-library-read',
];

export async function GET(request: NextRequest) {
  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const redirectUri = process.env.SPOTIFY_REDIRECT_URI;

  if (!clientId || !redirectUri) {
    return NextResponse.json(
      { error: 'Missing Spotify configuration' },
      { status: 500 }
    );
  }

  const params = new URLSearchParams({
    response_type: 'code',
    client_id: clientId,
    scope: REQUIRED_SCOPES.join(' '),
    redirect_uri: redirectUri,
    show_dialog: 'false',
  });

  const authUrl = `${SPOTIFY_AUTH_URL}?${params.toString()}`;

  return NextResponse.redirect(authUrl);
}
