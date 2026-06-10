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

export async function GET(request) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );

    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    const { data: { user } } = await supabase.auth.getUser(token);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const adminSupabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    const { data: connection } = await adminSupabase
      .from('bank_connections')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (!connection) return NextResponse.json({ error: 'No bank connected' }, { status: 404 });

    // Force refresh transactions
    try {
      await plaidClient.transactionsRefresh({ access_token: connection.access_token });
      await new Promise(resolve => setTimeout(resolve, 3000));
    } catch (e) {
      console.log('Refresh note:', e.message);
    }

    const syncResponse = await plaidClient.transactionsSync({
      access_token: connection.access_token,
    });

    console.log('Plaid sync returned', syncResponse.data.added.length, 'transactions');

    const transactions = syncResponse.data.added
      .filter(t => t.amount > 0)
      .map(t => ({
        user_id: user.id,
        date: t.date,
        description: t.merchant_name || t.name,
        amount: t.amount,
        category: 'Other',
      }));

    if (transactions.length > 0) {
      await adminSupabase.from('transactions').insert(transactions);
    }

    return NextResponse.json({ imported: transactions.length });
  } catch (err) {
    console.error('Transactions error:', err.response?.data || err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
