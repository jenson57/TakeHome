import { NextResponse } from 'next/server';

export async function GET(request) {
  const authUrl = new URL('https://auth.truelayer-sandbox.com/');
  authUrl.searchParams.set('response_type', 'code');
  authUrl.searchParams.set('client_id', process.env.TRUELAYER_CLIENT_ID);
  authUrl.searchParams.set('scope', 'info accounts balance transactions offline_access');
  authUrl.searchParams.set('redirect_uri', process.env.TRUELAYER_REDIRECT_URI);
  authUrl.searchParams.set('enable_mock', 'true');
  authUrl.searchParams.set('providers', 'uk-ob-all uk-oauth-all');

  return NextResponse.redirect(authUrl.toString());
}