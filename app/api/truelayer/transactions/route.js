import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

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

    const baseUrl = process.env.TRUELAYER_ENV === 'sandbox'
      ? 'https://api.truelayer-sandbox.com'
      : 'https://api.truelayer.com';

    // Get accounts first
    const accountsRes = await fetch(`${baseUrl}/data/v1/accounts`, {
      headers: { Authorization: `Bearer ${connection.access_token}` },
    });
    const accountsData = await accountsRes.json();
    console.log('TrueLayer accounts:', accountsRes.status, JSON.stringify(accountsData));

    if (!accountsData.results?.length) {
      return NextResponse.json({ error: 'No accounts found', details: accountsData }, { status: 400 });
    }

    const from = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    const to = new Date().toISOString().slice(0, 10);

    let allTransactions = [];

    for (const account of accountsData.results) {
      const txnRes = await fetch(
        `${baseUrl}/data/v1/accounts/${account.account_id}/transactions?from=${from}&to=${to}`,
        { headers: { Authorization: `Bearer ${connection.access_token}` } }
      );
      const txnData = await txnRes.json();
      console.log(`Account ${account.account_id} transactions:`, txnRes.status, txnData.results?.length);

      if (txnData.results) {
        allTransactions = [...allTransactions, ...txnData.results];
      }
    }

    const transactions = allTransactions
      .filter(t => t.amount < 0) // negative = money out
      .map(t => ({
        user_id: user.id,
        date: t.timestamp.slice(0, 10),
        description: t.description || t.merchant_name || 'Transaction',
        amount: Math.abs(t.amount),
        category: 'Other',
      }));

    if (transactions.length > 0) {
      const { error: insertError } = await adminSupabase
        .from('transactions')
        .insert(transactions);
      if (insertError) {
        console.error('Insert error:', insertError.message);
        return NextResponse.json({ error: insertError.message }, { status: 500 });
      }
    }

    return NextResponse.json({ imported: transactions.length });
  } catch (err) {
    console.error('TrueLayer transactions error:', err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}