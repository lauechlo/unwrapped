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
  console.log('[Store Tokens] Access token length:', accessToken.length);
  console.log('[Store Tokens] Expires in:', expiresIn, 'seconds');

  // Create redirect response
  const response = NextResponse.redirect(new URL('/results', request.url));
  console.log('[Store Tokens] Redirect URL:', new URL('/results', request.url).toString());

  // Store tokens as cookies
  // Note: sameSite 'none' requires secure: true
  const isProduction = process.env.NODE_ENV === 'production';

  response.cookies.set('spotify_access_token', accessToken, {
    httpOnly: true,
    secure: true, // Always true (required for sameSite: 'none')
    sameSite: isProduction ? 'none' : 'lax', // 'none' for production cross-site, 'lax' for localhost
    maxAge: parseInt(expiresIn),
    path: '/',
  });

  response.cookies.set('spotify_refresh_token', refreshToken, {
    httpOnly: true,
    secure: true, // Always true (required for sameSite: 'none')
    sameSite: isProduction ? 'none' : 'lax', // 'none' for production cross-site, 'lax' for localhost
    maxAge: 60 * 60 * 24 * 30, // 30 days
    path: '/',
  });

  return response;
}
