import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;

  if (!code) {
    return NextResponse.redirect(appUrl + '/dashboard?error=no_code');
  }

  try {
    // Exchange code for tokens
    const tokenRes = await fetch('https://auth.truelayer-sandbox.com/connect/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: process.env.TRUELAYER_CLIENT_ID,
        client_secret: process.env.TRUELAYER_CLIENT_SECRET,
        redirect_uri: appUrl + '/api/truelayer/callback',
        code,
      }),
    });

    const tokens = await tokenRes.json();

    if (!tokens.access_token) {
      return NextResponse.redirect(appUrl + '/dashboard?error=token_failed');
    }

    // Get user from cookie
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );

    const authHeader = request.headers.get('cookie') || '';
    const { data: { user } } = await supabase.auth.getUser();

    // Store tokens — we'll use service role for this
    const adminSupabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    const expiresAt = new Date(Date.now() + tokens.expires_in * 1000).toISOString();

    await adminSupabase.from('bank_connections').upsert({
      user_id: user?.id,
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      expires_at: expiresAt,
      provider: 'truelayer',
    }, { onConflict: 'user_id' });

    return NextResponse.redirect(appUrl + '/dashboard?bank=connected');
  } catch (err) {
    console.error('TrueLayer callback error:', err);
    return NextResponse.redirect(appUrl + '/dashboard?error=callback_failed');
  }
}