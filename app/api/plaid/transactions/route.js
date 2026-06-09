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

    const endDate = new Date().toISOString().slice(0, 10);
    const startDate = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

    const response = await plaidClient.transactionsGet({
      access_token: connection.access_token,
      start_date: startDate,
      end_date: endDate,
      options: { count: 100 }
    });

    const transactions = response.data.transactions
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
    return NextResponse.json({ error: 'Failed to fetch transactions' }, { status: 500 });
  }
}
