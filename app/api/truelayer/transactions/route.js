import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

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

    // Fetch accounts
    const accountsRes = await fetch('https://api.truelayer-sandbox.com/data/v1/accounts', {
      headers: { Authorization: `Bearer ${connection.access_token}` },
    });
    const accountsData = await accountsRes.json();
    const accounts = accountsData.results || [];

    const allTransactions = [];

    for (const account of accounts) {
      const txRes = await fetch(
        `https://api.truelayer-sandbox.com/data/v1/accounts/${account.account_id}/transactions`,
        { headers: { Authorization: `Bearer ${connection.access_token}` } }
      );
      const txData = await txRes.json();
      const txs = txData.results || [];

      for (const tx of txs) {
        if (tx.amount < 0) {
          allTransactions.push({
            user_id: user.id,
            date: tx.timestamp.slice(0, 10),
            description: tx.description,
            amount: Math.abs(tx.amount),
            category: 'Other',
          });
        }
      }
    }

    // Insert transactions
    if (allTransactions.length > 0) {
      await adminSupabase.from('transactions').insert(allTransactions);
    }

    return NextResponse.json({ imported: allTransactions.length });
  } catch (err) {
    console.error('Transactions error:', err);
    return NextResponse.json({ error: 'Failed to fetch transactions' }, { status: 500 });
  }
}