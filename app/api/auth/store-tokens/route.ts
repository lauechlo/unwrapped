/**
 * Store tokens route - receives tokens from callback, stores as cookies
 */

import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const accessToken = searchParams.get('access_token');
  const refreshToken = searchParams.get('refresh_token');
  const expiresIn = searchParams.get('expires_in');

  if (!accessToken || !refreshToken || !expiresIn) {
    return NextResponse.redirect(new URL('/?error=missing_tokens', request.url));
  }

  console.log('[Store Tokens] Storing tokens in cookies');

  // Create redirect response - V1 results page
  const response = NextResponse.redirect(new URL('/v1/results', request.url));

  // Store tokens as cookies
  response.cookies.set('spotify_access_token', accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: parseInt(expiresIn),
    path: '/',
  });

  response.cookies.set('spotify_refresh_token', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 30, // 30 days
    path: '/',
  });

  return response;
}
