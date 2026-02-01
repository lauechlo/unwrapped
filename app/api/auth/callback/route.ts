/**
 * Spotify OAuth Callback Route
 * Exchanges authorization code for access token
 */

import { NextRequest, NextResponse } from 'next/server';

const SPOTIFY_TOKEN_URL = 'https://accounts.spotify.com/api/token';

interface SpotifyTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token: string;
  scope: string;
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get('code');
  const error = searchParams.get('error');

  if (error) {
    return NextResponse.redirect(
      new URL(`/v1?error=${error}`, request.url)
    );
  }

  if (!code) {
    return NextResponse.redirect(
      new URL('/v1?error=no_code', request.url)
    );
  }

  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
  const redirectUri = process.env.SPOTIFY_REDIRECT_URI;

  if (!clientId || !clientSecret || !redirectUri) {
    return NextResponse.redirect(
      new URL('/v1?error=server_config', request.url)
    );
  }

  try {
    // Exchange code for access token
    const tokenResponse = await fetch(SPOTIFY_TOKEN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: redirectUri,
      }),
    });

    if (!tokenResponse.ok) {
      throw new Error(`Token exchange failed: ${tokenResponse.status}`);
    }

    const tokenData: SpotifyTokenResponse = await tokenResponse.json();

    console.log('[OAuth Callback] Token received, access_token length:', tokenData.access_token.length);

    // Redirect to store-tokens which will handle the cookie race condition
    const storeUrl = new URL('/api/auth/store-tokens', request.url);
    storeUrl.searchParams.set('access_token', tokenData.access_token);
    storeUrl.searchParams.set('refresh_token', tokenData.refresh_token);
    storeUrl.searchParams.set('expires_in', tokenData.expires_in.toString());

    return NextResponse.redirect(storeUrl);
  } catch (error) {
    console.error('OAuth callback error:', error);
    return NextResponse.redirect(
      new URL('/v1?error=token_exchange_failed', request.url)
    );
  }
}
