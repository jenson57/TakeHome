'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '../supabase';

const NAV_TABS = [
  { href: '/', label: 'Home', icon: '🏠' },
  { href: '/calculator', label: 'Calculator', icon: '💷' },
  { href: '/dashboard', label: 'Dashboard', icon: '📊' },
  { href: '/analytics', label: 'Analytics', icon: '📈' },
  { href: '/bills', label: 'Bills', icon: '🧾' },
  { href: '/budget', label: 'Budget', icon: '💬' },
  { href: '/debt', label: 'Debt', icon: '💳' },
  { href: '/settings', label: 'Settings', icon: '⚙️' },
];

const DEBT_TYPES = ['Credit card', 'Personal loan', 'Student loan', 'Overdraft', 'Car finance', 'Mortgage', 'Buy now pay later', 'Other'];

const EMPTY_FORM = { name: '', balance: '', interest_rate: '', minimum_payment: '', debt_type: 'Credit card' };

function fmt(n) {
  return '£' + Math.abs(parseFloat(n) || 0).toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function calcPayoffPlan(debts, monthlyBudget, strategy) {
  if (!debts.length || monthlyBudget <= 0) return null;

  // Clone debts
  let remaining = debts.map(d => ({
    ...d,
    balance: parseFloat(d.balance),
    interest_rate: parseFloat(d.interest_rate),
    minimum_payment: parseFloat(d.minimum_payment),
    totalInterestPaid: 0,
    monthsPaid: 0,
    paidOffMonth: null,
  }));

  // Sort by strategy
  if (strategy === 'avalanche') {
    remaining.sort((a, b) => b.interest_rate - a.interest_rate);
  } else {
    remaining.sort((a, b) => a.balance - b.balance);
  }

  const totalMinimums = remaining.reduce((s, d) => s + d.minimum_payment, 0);
  if (monthlyBudget < totalMinimums) return { error: `Your monthly budget of ${fmt(monthlyBudget)} is less than the total minimum payments of ${fmt(totalMinimums)}. Please increase your budget.` };

  let month = 0;
  const maxMonths = 600;
  const schedule = [];

  while (remaining.some(d => d.balance > 0) && month < maxMonths) {
    month++;
    let budgetLeft = monthlyBudget;

    // Pay minimums first
    remaining.forEach(d => {
      if (d.balance <= 0) return;
      const interest = (d.balance * (d.interest_rate / 100)) / 12;
      const minPay = Math.min(d.minimum_payment, d.balance + interest);
      d.balance = Math.max(0, d.balance + interest - minPay);
      d.totalInterestPaid += interest;
      budgetLeft -= minPay;
      if (d.balance === 0 && !d.paidOffMonth) d.paidOffMonth = month;
    });

    // Apply extra to first active debt
    const target = remaining.find(d => d.balance > 0);
    if (target && budgetLeft > 0) {
      const extra = Math.min(budgetLeft, target.balance);
      target.balance = Math.max(0, target.balance - extra);
      if (target.balance === 0 && !target.paidOffMonth) target.paidOffMonth = month;
    }

    schedule.push({
      month,
      debts: remaining.map(d => ({ name: d.name, balance: Math.max(0, d.balance) })),
    });
  }

  const totalInterestPaid = remaining.reduce((s, d) => s + d.totalInterestPaid, 0);

  // Calc interest if only minimums paid
  let minOnlyDebts = debts.map(d => ({
    balance: parseFloat(d.balance),
    interest_rate: parseFloat(d.interest_rate),
    minimum_payment: parseFloat(d.minimum_payment),
    totalInterest: 0,
  }));
  let minMonth = 0;
  while (minOnlyDebts.some(d => d.balance > 0) && minMonth < 1200) {
    minMonth++;
    minOnlyDebts.forEach(d => {
      if (d.balance <= 0) return;
      const interest = (d.balance * (d.interest_rate / 100)) / 12;
      const pay = Math.min(d.minimum_payment, d.balance + interest);
      d.balance = Math.max(0, d.balance + interest - pay);
      d.totalInterest += interest;
    });
  }
  const minOnlyInterest = minOnlyDebts.reduce((s, d) => s + d.totalInterest, 0);
  const interestSaved = minOnlyInterest - totalInterestPaid;

  const debtFreeDate = new Date();
  debtFreeDate.setMonth(debtFreeDate.getMonth() + month);

  return {
    months: month,
    debtFreeDate,
    totalInterestPaid,
    interestSaved: Math.max(0, interestSaved),
    order: remaining,
    schedule,
  };
}

export default function DebtPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [debts, setDebts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editId, setEditId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [strategy, setStrategy] = useState('avalanche');
  const [monthlyBudget, setMonthlyBudget] = useState(0);
  const [netPay, setNetPay] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push('/login'); return; }
      setUser(user);
      const [{ data: debtData }, { data: settings }] = await Promise.all([
        supabase.from('debts').select('*').eq('user_id', user.id).eq('is_active', true).order('created_at'),
        supabase.from('budget_settings').select('net_pay').eq('user_id', user.id).single(),
      ]);
      if (debtData) setDebts(debtData);
      if (settings?.net_pay) {
        setNetPay(settings.net_pay);
        const totalMin = (debtData || []).reduce((s, d) => s + parseFloat(d.minimum_payment), 0);
        setMonthlyBudget(Math.round(Math.min(settings.net_pay * 0.2, Math.max(totalMin * 1.5, totalMin + 50))));
      }
      setLoading(false);
    };
    init();
  }, []);

  async function handleSave() {
    setError('');
    if (!form.name.trim()) return setError('Please enter a debt name.');
    if (!form.balance || parseFloat(form.balance) <= 0) return setError('Please enter a valid balance.');
    if (!form.minimum_payment || parseFloat(form.minimum_payment) < 0) return setError('Please enter a minimum payment.');
    setSaving(true);
    const payload = {
      user_id: user.id,
      name: form.name.trim(),
      balance: parseFloat(form.balance),
      interest_rate: parseFloat(form.interest_rate) || 0,
      minimum_payment: parseFloat(form.minimum_payment),
      debt_type: form.debt_type,
    };
    if (editId) {
      const { data } = await supabase.from('debts').update(payload).eq('id', editId).select().single();
      if (data) setDebts(prev => prev.map(d => d.id === editId ? data : d));
    } else {
      const { data } = await supabase.from('debts').insert(payload).select().single();
      if (data) setDebts(prev => [...prev, data]);
    }
    setSaving(false);
    setShowForm(false);
    setForm(EMPTY_FORM);
    setEditId(null);
  }

  async function handleDelete(id) {
    if (!confirm('Delete this debt?')) return;
    await supabase.from('debts').update({ is_active: false }).eq('id', id);
    setDebts(prev => prev.filter(d => d.id !== id));
  }

  function handleEdit(debt) {
    setForm({ name: debt.name, balance: debt.balance, interest_rate: debt.interest_rate, minimum_payment: debt.minimum_payment, debt_type: debt.debt_type });
    setEditId(debt.id);
    setShowForm(true);
    setError('');
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push('/login');
  }

  const totalDebt = debts.reduce((s, d) => s + parseFloat(d.balance), 0);
  const totalMinimums = debts.reduce((s, d) => s + parseFloat(d.minimum_payment), 0);
  const plan = debts.length > 0 ? calcPayoffPlan(debts, monthlyBudget, strategy) : null;

  const debtTypeIcon = (type) => {
    const icons = { 'Credit card': '💳', 'Personal loan': '🏦', 'Student loan': '🎓', 'Overdraft': '⚠️', 'Car finance': '🚗', 'Mortgage': '🏠', 'Buy now pay later': '📦', 'Other': '📄' };
    return icons[type] || '📄';
  };

  const card = { background: '#fff', border: '1px solid #e8f0fe', borderRadius: 16, boxShadow: '0 2px 8px rgba(26,86,219,0.04)', padding: '24px', marginBottom: 20 };

  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#f7f9ff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Inter, sans-serif' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: 48, height: 48, borderRadius: 14, background: 'linear-gradient(135deg, #1a56db, #0e3fa8)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
          <span style={{ color: 'white', fontWeight: 800, fontSize: 22 }}>T</span>
        </div>
        <p style={{ color: '#6b7280', fontSize: 15, fontWeight: 500 }}>Loading your debt tracker...</p>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', background: '#f7f9ff', fontFamily: 'Inter, sans-serif' }}>
      <style>{`
        @media(max-width:640px){
          .desktop-nav{display:none!important}
          .mobile-menu-btn{display:flex!important}
          .mobile-bottom-nav{display:flex!important}
          .debt-grid{grid-template-columns:1fr!important}
        }
        @media(min-width:641px){
          .mobile-menu-btn{display:none!important}
          .mobile-menu{display:none!important}
          .mobile-bottom-nav{display:none!important}
        }
        * { box-sizing: border-box; }
      `}</style>

      {/* Nav */}
      <nav style={{ borderBottom: '1px solid #e8f0fe', background: 'white', padding: '0 16px', position: 'sticky', top: 0, zIndex: 50 }}>
        <div style={{ maxWidth: '72rem', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 64 }}>
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}>
            <div style={{ background: 'linear-gradient(135deg, #1a56db, #0e3fa8)', width: 32, height: 32, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ color: 'white', fontWeight: 800, fontSize: 14 }}>T</span>
            </div>
            <span style={{ fontWeight: 800, color: '#0a1628', fontSize: 18, letterSpacing: '-0.3px' }}>Takehome</span>
          </Link>
          <div className="desktop-nav" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, background: '#f0f5ff', borderRadius: 12, padding: 4 }}>
              {NAV_TABS.map(tab => (
                <Link key={tab.href} href={tab.href} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 9, fontSize: 14, fontWeight: tab.href === '/debt' ? 700 : 500, color: tab.href === '/debt' ? '#1a56db' : '#6b7280', background: tab.href === '/debt' ? 'white' : 'transparent', textDecoration: 'none', boxShadow: tab.href === '/debt' ? '0 1px 4px rgba(26,86,219,0.12)' : 'none' }}>
                  <span>{tab.icon}</span>{tab.label}
                </Link>
              ))}
            </div>
            <button onClick={handleSignOut} style={{ background: '#f3f4f6', border: 'none', borderRadius: 10, padding: '8px 16px', fontSize: 14, color: '#6b7280', cursor: 'pointer', fontWeight: 600 }}>Sign out</button>
          </div>
          <button className="mobile-menu-btn" onClick={() => setMenuOpen(!menuOpen)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', flexDirection: 'column', gap: '5px', padding: '4px', display: 'none' }}>
            <div style={{ width: '22px', height: '2px', background: '#0a1628', borderRadius: '2px' }}></div>
            <div style={{ width: '22px', height: '2px', background: '#0a1628', borderRadius: '2px' }}></div>
            <div style={{ width: '22px', height: '2px', background: '#0a1628', borderRadius: '2px' }}></div>
          </button>
        </div>
        {menuOpen && (
          <div className="mobile-menu" style={{ borderTop: '1px solid #e8f0fe', marginTop: '12px', paddingTop: '12px' }}>
            {NAV_TABS.map(tab => (
              <Link key={tab.href} href={tab.href} onClick={() => setMenuOpen(false)}
                style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 16px', borderRadius: '10px', fontSize: '15px', fontWeight: tab.href === '/debt' ? '700' : '500', color: tab.href === '/debt' ? '#1a56db' : '#0a1628', background: tab.href === '/debt' ? '#f0f5ff' : 'transparent', textDecoration: 'none', marginBottom: '4px' }}>
                <span>{tab.icon}</span>{tab.label}
              </Link>
            ))}
            <div style={{ borderTop: '1px solid #e8f0fe', marginTop: '8px', paddingTop: '8px' }}>
              <button onClick={handleSignOut} style={{ background: '#f3f4f6', border: 'none', borderRadius: '10px', padding: '8px 16px', fontSize: '14px', color: '#6b7280', cursor: 'pointer', fontWeight: '600' }}>Sign out</button>
            </div>
          </div>
        )}
      </nav>

      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '32px 16px 120px' }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32, flexWrap: 'wrap', gap: 16 }}>
          <div>
            <p style={{ fontSize: 13, fontWeight: 600, color: '#1a56db', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>Debt Tracker</p>
            <h1 style={{ fontSize: 32, fontWeight: 800, color: '#0a1628', letterSpacing: '-0.5px', marginBottom: 6 }}>Debt Payoff Planner</h1>
            <p style={{ fontSize: 15, color: '#6b7280' }}>Track your debts and get a personalised payoff plan</p>
          </div>
          <button onClick={() => { setShowForm(true); setEditId(null); setForm(EMPTY_FORM); setError(''); }}
            style={{ background: 'linear-gradient(135deg, #1a56db, #0e3fa8)', color: 'white', border: 'none', borderRadius: 12, padding: '12px 22px', fontSize: 14, fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 12px rgba(26,86,219,0.3)' }}>
            + Add debt
          </button>
        </div>

        {/* Summary cards */}
        {debts.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 24 }} className="debt-grid">
            {[
              { label: 'Total debt', value: fmt(totalDebt), icon: '💳', color: '#dc2626' },
              { label: 'Min. payments/mo', value: fmt(totalMinimums), icon: '📅', color: '#f59e0b' },
              { label: 'Number of debts', value: debts.length, icon: '📊', color: '#1a56db' },
            ].map(s => (
              <div key={s.label} style={{ background: 'white', border: '1px solid #e8f0fe', borderRadius: 16, padding: 22, boxShadow: '0 2px 8px rgba(26,86,219,0.04)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                  <p style={{ fontSize: 12, color: '#6b7280', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{s.label}</p>
                  <span style={{ fontSize: 20 }}>{s.icon}</span>
                </div>
                <p style={{ fontSize: 28, fontWeight: 800, color: s.color, letterSpacing: '-0.5px' }}>{s.value}</p>
              </div>
            ))}
          </div>
        )}

        {/* Add/Edit form */}
        {showForm && (
          <div style={{ ...card, border: '1.5px solid #1a56db' }}>
            <h3 style={{ fontSize: 16, fontWeight: 800, color: '#0a1628', marginBottom: 20 }}>{editId ? 'Edit debt' : 'Add a debt'}</h3>
            {error && <div style={{ background: '#fef2f2', border: '1px solid #dc2626', borderRadius: 8, padding: '10px 14px', color: '#dc2626', fontSize: 13, marginBottom: 14 }}>{error}</div>}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }} className="debt-grid">
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={{ fontSize: 12, color: '#374151', fontWeight: 600, display: 'block', marginBottom: 6 }}>Debt name</label>
                <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="e.g. Barclaycard, Santander loan"
                  style={{ width: '100%', border: '1px solid #d1d5db', borderRadius: 8, padding: '10px 12px', fontSize: 14 }} />
              </div>
              <div>
                <label style={{ fontSize: 12, color: '#374151', fontWeight: 600, display: 'block', marginBottom: 6 }}>Debt type</label>
                <select value={form.debt_type} onChange={e => setForm(f => ({ ...f, debt_type: e.target.value }))}
                  style={{ width: '100%', border: '1px solid #d1d5db', borderRadius: 8, padding: '10px 12px', fontSize: 14, background: 'white' }}>
                  {DEBT_TYPES.map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: 12, color: '#374151', fontWeight: 600, display: 'block', marginBottom: 6 }}>Current balance (£)</label>
                <input type="number" value={form.balance} onChange={e => setForm(f => ({ ...f, balance: e.target.value }))}
                  placeholder="0.00"
                  style={{ width: '100%', border: '1px solid #d1d5db', borderRadius: 8, padding: '10px 12px', fontSize: 14 }} />
              </div>
              <div>
                <label style={{ fontSize: 12, color: '#374151', fontWeight: 600, display: 'block', marginBottom: 6 }}>Annual interest rate (%)</label>
                <input type="number" value={form.interest_rate} onChange={e => setForm(f => ({ ...f, interest_rate: e.target.value }))}
                  placeholder="e.g. 19.9"
                  style={{ width: '100%', border: '1px solid #d1d5db', borderRadius: 8, padding: '10px 12px', fontSize: 14 }} />
              </div>
              <div>
                <label style={{ fontSize: 12, color: '#374151', fontWeight: 600, display: 'block', marginBottom: 6 }}>Minimum monthly payment (£)</label>
                <input type="number" value={form.minimum_payment} onChange={e => setForm(f => ({ ...f, minimum_payment: e.target.value }))}
                  placeholder="0.00"
                  style={{ width: '100%', border: '1px solid #d1d5db', borderRadius: 8, padding: '10px 12px', fontSize: 14 }} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
              <button onClick={handleSave} disabled={saving}
                style={{ flex: 1, background: '#1a56db', color: 'white', border: 'none', borderRadius: 8, padding: 12, fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
                {saving ? 'Saving…' : editId ? 'Save changes' : 'Add debt'}
              </button>
              <button onClick={() => { setShowForm(false); setForm(EMPTY_FORM); setEditId(null); setError(''); }}
                style={{ flex: 1, background: '#f3f4f6', color: '#374151', border: 'none', borderRadius: 8, padding: 12, fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Empty state */}
        {debts.length === 0 && !showForm && (
          <div style={{ ...card, textAlign: 'center', padding: '48px 24px' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>💳</div>
            <p style={{ fontSize: 16, fontWeight: 700, color: '#0a1628', marginBottom: 6 }}>No debts added yet</p>
            <p style={{ fontSize: 14, color: '#6b7280', marginBottom: 20 }}>Add your debts to get a personalised payoff plan with a debt-free date.</p>
            <button onClick={() => setShowForm(true)}
              style={{ background: '#1a56db', color: 'white', border: 'none', borderRadius: 10, padding: '12px 24px', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
              + Add your first debt
            </button>
          </div>
        )}

        {/* Debt list */}
        {debts.length > 0 && (
          <div style={card}>
            <p style={{ fontSize: 13, fontWeight: 600, color: '#1a56db', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>Your debts</p>
            <h2 style={{ fontSize: 18, fontWeight: 800, color: '#0a1628', marginBottom: 20 }}>All debts</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {debts.map((debt, i) => (
                <div key={debt.id}>
                  {i > 0 && <div style={{ height: 1, background: '#f3f4f6', margin: '8px 0' }} />}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                    <div style={{ width: 40, height: 40, borderRadius: 10, background: '#fef2f2', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>
                      {debtTypeIcon(debt.debt_type)}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 700, color: '#0a1628', fontSize: 14, marginBottom: 2 }}>{debt.name}</div>
                      <div style={{ fontSize: 12, color: '#6b7280' }}>{debt.debt_type} · {debt.interest_rate}% APR · Min. {fmt(debt.minimum_payment)}/mo</div>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <div style={{ fontSize: 18, fontWeight: 800, color: '#dc2626' }}>{fmt(debt.balance)}</div>
                    </div>
                    <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                      <button onClick={() => handleEdit(debt)} style={{ background: '#f0f4ff', border: 'none', borderRadius: 6, padding: '5px 10px', fontSize: 12, color: '#1a56db', cursor: 'pointer', fontWeight: 500 }}>Edit</button>
                      <button onClick={() => handleDelete(debt.id)} style={{ background: '#fef2f2', border: 'none', borderRadius: 6, padding: '5px 10px', fontSize: 12, color: '#dc2626', cursor: 'pointer', fontWeight: 500 }}>Delete</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Payoff planner */}
        {debts.length > 0 && (
          <div style={card}>
            <p style={{ fontSize: 13, fontWeight: 600, color: '#1a56db', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>Strategy</p>
            <h2 style={{ fontSize: 18, fontWeight: 800, color: '#0a1628', marginBottom: 20 }}>Payoff planner</h2>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }} className="debt-grid">
              {/* Strategy picker */}
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 10 }}>Payoff strategy</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {[
                    { value: 'avalanche', label: '🏔️ Avalanche', sub: 'Highest interest first — saves most money' },
                    { value: 'snowball', label: '⛄ Snowball', sub: 'Smallest balance first — quickest wins' },
                  ].map(s => (
                    <div key={s.value} onClick={() => setStrategy(s.value)}
                      style={{ border: `2px solid ${strategy === s.value ? '#1a56db' : '#e8f0fe'}`, borderRadius: 10, padding: '12px 14px', cursor: 'pointer', background: strategy === s.value ? '#f0f5ff' : 'white' }}>
                      <p style={{ fontSize: 14, fontWeight: 700, color: strategy === s.value ? '#1a56db' : '#0a1628', marginBottom: 2 }}>{s.label}</p>
                      <p style={{ fontSize: 12, color: '#6b7280' }}>{s.sub}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Monthly budget */}
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 10 }}>Monthly debt budget</label>
                <div style={{ background: '#f7f9ff', border: '1px solid #e8f0fe', borderRadius: 10, padding: 16, marginBottom: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                    <span style={{ fontSize: 20, fontWeight: 700, color: '#1a56db' }}>£</span>
                    <input type="number" value={monthlyBudget} onChange={e => setMonthlyBudget(parseFloat(e.target.value) || 0)}
                      style={{ flex: 1, border: 'none', background: 'transparent', fontSize: 28, fontWeight: 800, color: '#0a1628', outline: 'none' }} />
                    <span style={{ fontSize: 13, color: '#6b7280', whiteSpace: 'nowrap' }}>/ month</span>
                  </div>
                  <p style={{ fontSize: 12, color: '#6b7280' }}>Min. required: {fmt(totalMinimums)}/mo</p>
                </div>
                {netPay > 0 && (
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {[0.1, 0.15, 0.2, 0.25].map(pct => (
                      <button key={pct} onClick={() => setMonthlyBudget(Math.round(netPay * pct))}
                        style={{ background: '#f0f5ff', border: '1px solid #e8f0fe', borderRadius: 6, padding: '4px 10px', fontSize: 12, color: '#1a56db', cursor: 'pointer', fontWeight: 600 }}>
                        {pct * 100}% of income
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Plan output */}
            {plan && plan.error && (
              <div style={{ background: '#fef2f2', border: '1px solid #dc2626', borderRadius: 10, padding: '14px 18px', color: '#dc2626', fontSize: 14 }}>
                ⚠️ {plan.error}
              </div>
            )}

            {plan && !plan.error && (
              <>
                {/* Results hero */}
                <div style={{ background: 'linear-gradient(135deg, #1a56db, #0e3fa8)', borderRadius: 16, padding: 24, marginBottom: 20 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }} className="debt-grid">
                    {[
                      { label: 'Debt-free date', value: plan.debtFreeDate.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' }) },
                      { label: 'Months to freedom', value: `${plan.months} months` },
                      { label: 'Interest saved', value: fmt(plan.interestSaved) },
                    ].map(s => (
                      <div key={s.label} style={{ textAlign: 'center' }}>
                        <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>{s.label}</p>
                        <p style={{ fontSize: 20, fontWeight: 800, color: 'white' }}>{s.value}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Payoff order */}
                <div style={{ marginBottom: 20 }}>
                  <p style={{ fontSize: 14, fontWeight: 700, color: '#0a1628', marginBottom: 12 }}>
                    {strategy === 'avalanche' ? '🏔️ Avalanche order — highest interest first' : '⛄ Snowball order — smallest balance first'}
                  </p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {plan.order.map((debt, i) => (
                      <div key={debt.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', background: '#f7f9ff', borderRadius: 10, border: '1px solid #e8f0fe' }}>
                        <div style={{ width: 28, height: 28, borderRadius: '50%', background: i === 0 ? '#1a56db' : '#e8f0fe', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <span style={{ fontSize: 13, fontWeight: 800, color: i === 0 ? 'white' : '#6b7280' }}>{i + 1}</span>
                        </div>
                        <div style={{ flex: 1 }}>
                          <p style={{ fontSize: 14, fontWeight: 600, color: '#0a1628', marginBottom: 2 }}>{debt.name}</p>
                          <p style={{ fontSize: 12, color: '#6b7280' }}>
                            {debt.interest_rate}% APR · Paid off {debt.paidOffMonth ? `in ${debt.paidOffMonth} month${debt.paidOffMonth === 1 ? '' : 's'}` : '—'}
                            {i === 0 && <span style={{ color: '#1a56db', fontWeight: 700 }}> · Tackle first</span>}
                          </p>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <p style={{ fontSize: 15, fontWeight: 800, color: '#dc2626' }}>{fmt(debt.balance)}</p>
                          <p style={{ fontSize: 11, color: '#6b7280' }}>interest paid: {fmt(debt.totalInterestPaid)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Progress timeline */}
                <div>
                  <p style={{ fontSize: 14, fontWeight: 700, color: '#0a1628', marginBottom: 12 }}>📅 Balance over time</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 300, overflowY: 'auto' }}>
                    {plan.schedule.filter((_, i) => i === 0 || (i + 1) % 3 === 0 || i === plan.schedule.length - 1).map((s) => {
                      const totalRemaining = s.debts.reduce((sum, d) => sum + d.balance, 0);
                      const pct = totalDebt > 0 ? Math.max(0, 100 - (totalRemaining / totalDebt) * 100) : 100;
                      const date = new Date();
                      date.setMonth(date.getMonth() + s.month);
                      return (
                        <div key={s.month} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 0' }}>
                          <span style={{ fontSize: 12, color: '#6b7280', width: 80, flexShrink: 0 }}>
                            {date.toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })}
                          </span>
                          <div style={{ flex: 1, height: 8, background: '#f3f4f6', borderRadius: 999, overflow: 'hidden' }}>
                            <div style={{ height: '100%', width: pct + '%', background: pct === 100 ? '#16a34a' : '#1a56db', borderRadius: 999, transition: 'width 0.3s' }} />
                          </div>
                          <span style={{ fontSize: 12, fontWeight: 600, color: totalRemaining === 0 ? '#16a34a' : '#0a1628', width: 80, textAlign: 'right', flexShrink: 0 }}>
                            {totalRemaining === 0 ? '🎉 Debt free!' : fmt(totalRemaining)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Mobile bottom nav */}
      <div className="mobile-bottom-nav" style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: 'white', borderTop: '1px solid #e8f0fe', display: 'none', padding: '8px 0 20px', zIndex: 100 }}>
        {NAV_TABS.map(tab => (
          <Link key={tab.href} href={tab.href} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', textDecoration: 'none', padding: '4px 0' }}>
            <span style={{ fontSize: '20px' }}>{tab.icon}</span>
            <span style={{ fontSize: '10px', fontWeight: tab.href === '/debt' ? '700' : '500', color: tab.href === '/debt' ? '#1a56db' : '#9ca3af' }}>{tab.label}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}