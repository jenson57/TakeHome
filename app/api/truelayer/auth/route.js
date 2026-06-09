import { NextResponse } from 'next/server';

export async function GET(request) {
  const clientId = process.env.TRUELAYER_CLIENT_ID;
  const redirectUri = process.env.NEXT_PUBLIC_APP_URL + '/api/truelayer/callback';

  const params = new URLSearchParams({
    response_type: 'code',
    client_id: clientId,
    scope: 'info accounts balance cards transactions direct_debits standing_orders offline_access',
    redirect_uri: redirectUri,
    providers: 'uk-ob-all uk-oauth-all',
  });

  const authUrl = `https://auth.truelayer-sandbox.com/?${params.toString()}`;
  
  return new NextResponse(
    `<html><head><meta http-equiv="refresh" content="0;url=${authUrl}"></head><body><a href="${authUrl}">Click here to connect your bank</a></body></html>`,
    {
      headers: { 'Content-Type': 'text/html' },
    }
  );
}
