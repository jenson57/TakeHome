import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request) {
  try {
    console.log('Step 1: Route called');
    console.log('PLAID_ENV:', process.env.PLAID_ENV);
    console.log('PLAID_CLIENT_ID:', !!process.env.PLAID_CLIENT_ID);
    console.log('SUPABASE_SERVICE_ROLE_KEY:', !!process.env.SUPABASE_SERVICE_ROLE_KEY);

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );

    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    console.log('Step 2: Token present:', !!token);

    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    console.log('Step 3: User:', user?.id, 'Error:', authError?.message);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    console.log('Step 4: Body received, keys:', Object.keys(body));

    const adminSupabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    console.log('Step 5: Attempting insert...');
    const { data, error } = await adminSupabase
      .from('bank_connections')
      .insert({
        user_id: user.id,
        access_token: 'test_token_123',
        provider: 'plaid',
      });

    console.log('Step 6: Insert done - error:', error?.message, 'data:', JSON.stringify(data));

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true, test: true });

  } catch (err) {
    console.error('CATCH ERROR:', err.message, err.stack);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}