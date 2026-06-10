import { NextResponse } from 'next/server';
import { Configuration, PlaidApi, PlaidEnvironments } from 'plaid';
import { createClient } from '@supabase/supabase-js';

const plaidClient = new PlaidApi(new Configuration({
  basePath: PlaidEnvironments[process.env.PLAID_ENV],
  baseOptions: {
    headers: {
      'PLAID-CLIENT-ID': process.env.PLAID_CLIENT_ID,
      'PLAID-SECRET': process.env.PLAID_SECRET,
    },
  },
}));

export async function POST(request) {
  try {
    console.log('Exchange token route called');

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );

    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    console.log('Auth token present:', !!token);

    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    console.log('User:', user?.id, 'Auth error:', authError?.message);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    console.log('Body keys:', Object.keys(body));
    const { public_token } = body;
    if (!public_token) return NextResponse.json({ error: 'No public_token' }, { status: 400 });

    console.log('Exchanging public token...');
    const exchangeResponse = await plaidClient.itemPublicTokenExchange({ public_token });
    const accessToken = exchangeResponse.data.access_token;
    console.log('Access token received:', !!accessToken);

    const adminSupabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    console.log('Saving to Supabase...');
    const { data, error } = await adminSupabase
      .from('bank_connections')
      .upsert({
        user_id: user.id,
        access_token: accessToken,
        provider: 'plaid',
      }, { onConflict: 'user_id' });

    console.log('Upsert result - data:', data, 'error:', error?.message);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ success: true });

  } catch (err) {
    console.error('Exchange token error:', err.response?.data || err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}