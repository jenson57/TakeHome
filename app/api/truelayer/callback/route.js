import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const error = searchParams.get('error');

  if (error || !code) {
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard?error=bank_connection_failed`);
  }

  try {
    // Exchange code for token
    const tokenRes = await fetch('https://auth.truelayer-sandbox.com/connect/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: process.env.TRUELAYER_CLIENT_ID,
        client_secret: process.env.TRUELAYER_CLIENT_SECRET,
        code,
        redirect_uri: process.env.TRUELAYER_REDIRECT_URI,
      }),
    });

    const tokenData = await tokenRes.json();
    console.log('TrueLayer token exchange:', tokenRes.status);

    if (!tokenData.access_token) {
      console.error('No access token:', tokenData);
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard?error=token_failed`);
    }

    // We need the user — get it from the session cookie
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // Store token temporarily in a cookie and redirect to a page that saves it
    const response = NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard?bank=connected`);
    response.cookies.set('tl_access_token', tokenData.access_token, { httpOnly: true, maxAge: 3600 });
    response.cookies.set('tl_refresh_token', tokenData.refresh_token || '', { httpOnly: true, maxAge: 60 * 60 * 24 * 30 });
    return response;

  } catch (err) {
    console.error('TrueLayer callback error:', err.message);
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard?error=callback_failed`);
  }
}