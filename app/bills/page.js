'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '../supabase';

const CATEGORIES = ['Bills', 'Housing', 'Subscriptions', 'Utilities', 'Insurance', 'Transport', 'Other'];

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

const EMPTY_FORM = { name: '', amount: '', due_day: '', category: 'Bills' };

export default function BillsPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editId, setEditId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data?.user) { router.push('/login'); return; }
      setUser(data.user);
      fetchBills(data.user.id);
    });
  }, []);

  async function fetchBills(uid) {
    const { data } = await supabase
      .from('bills')
      .select('*')
      .eq('user_id', uid)
      .eq('is_active', true)
      .order('due_day', { ascending: true });
    setBills(data || []);
    setLoading(false);
  }

  function getDaysUntilDue(dueDay) {
    const today = new Date();
    const thisMonth = new Date(today.getFullYear(), today.getMonth(), dueDay);
    const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, dueDay);
    const target = thisMonth >= today ? thisMonth : nextMonth;
    return Math.ceil((target - today) / (1000 * 60 * 60 * 24));
  }

  const dueSoon = bills.filter(b => getDaysUntilDue(b.due_day) <= 7);
  const totalMonthly = bills.reduce((sum, b) => sum + Number(b.amount), 0);

  async function handleSave() {
    setError('');
    if (!form.name.trim()) return setError('Please enter a bill name.');
    if (!form.amount || isNaN(form.amount) || Number(form.amount) <= 0) return setError('Please enter a valid amount.');
    if (!form.due_day || form.due_day < 1 || form.due_day > 31) return setError('Due day must be between 1 and 31.');
    setSaving(true);
    const payload = {
      user_id: user.id,
      name: form.name.trim(),
      amount: Number(form.amount),
      due_day: Number(form.due_day),
      category: form.category,
    };
    if (editId) {
      await supabase.from('bills').update(payload).eq('id', editId);
    } else {
      await supabase.from('bills').insert(payload);
    }
    setSaving(false);
    setShowForm(false);
    setForm(EMPTY_FORM);
    setEditId(null);
    fetchBills(user.id);
  }

  async function handleDelete(id) {
    if (!confirm('Delete this bill?')) return;
    await supabase.from('bills').update({ is_active: false }).eq('id', id);
    fetchBills(user.id);
  }

  function handleEdit(bill) {
    setForm({ name: bill.name, amount: bill.amount, due_day: bill.due_day, category: bill.category });
    setEditId(bill.id);
    setShowForm(true);
    setError('');
  }

  function handleCancel() {
    setShowForm(false);
    setForm(EMPTY_FORM);
    setEditId(null);
    setError('');
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push('/login');
  }

  const cardStyle = {
    background: '#fff',
    border: '1px solid #e8f0fe',
    borderRadius: 16,
    boxShadow: '0 2px 8px rgba(26,86,219,0.04)',
    padding: '24px',
    marginBottom: 20,
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f7f9ff', fontFamily: 'Inter, sans-serif' }}>
      {/* Header */}
      <nav style={{ borderBottom: '1px solid #e8f0fe', background: 'white', padding: '0 16px', position: 'sticky', top: 0, zIndex: 50 }}>
        <div style={{ maxWidth: '72rem', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 64 }}>
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}>
            <div style={{ background: 'linear-gradient(135deg, #1a56db, #0e3fa8)', width: 32, height: 32, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ color: 'white', fontWeight: 800, fontSize: 14 }}>T</span>
            </div>
            <span style={{ fontWeight: 800, color: '#0a1628', fontSize: 18, letterSpacing: '-0.3px' }}>Takehome</span>
          </Link>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, background: '#f0f5ff', borderRadius: 12, padding: 4 }}>
              {NAV_TABS.map(tab => (
                <Link key={tab.href} href={tab.href} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 9, fontSize: 14, fontWeight: tab.href === '/bills' ? 700 : 500, color: tab.href === '/bills' ? '#1a56db' : '#6b7280', background: tab.href === '/bills' ? 'white' : 'transparent', textDecoration: 'none', boxShadow: tab.href === '/bills' ? '0 1px 4px rgba(26,86,219,0.12)' : 'none' }}>
                  <span>{tab.icon}</span>{tab.label}
                </Link>
              ))}
            </div>
            <button onClick={handleSignOut} style={{ background: '#f3f4f6', border: 'none', borderRadius: 10, padding: '8px 16px', fontSize: 14, color: '#6b7280', cursor: 'pointer', fontWeight: 600 }}>
              Sign out
            </button>
          </div>
        </div>
      </nav>

      <div style={{ maxWidth: 480, margin: '0 auto', padding: '24px 16px 100px' }}>

        {/* Due Soon Alert */}
        {dueSoon.length > 0 && (
          <div style={{ background: '#fffbeb', border: '1px solid #f59e0b', borderRadius: 12, padding: '14px 18px', marginBottom: 20, display: 'flex', gap: 10, alignItems: 'flex-start' }}>
            <span style={{ fontSize: 18 }}>⚠️</span>
            <div>
              <div style={{ fontWeight: 600, color: '#92400e', fontSize: 14 }}>Bills due soon</div>
              <div style={{ color: '#92400e', fontSize: 13, marginTop: 2 }}>
                {dueSoon.map(b => `${b.name} (${getDaysUntilDue(b.due_day) === 0 ? 'today' : `in ${getDaysUntilDue(b.due_day)} day${getDaysUntilDue(b.due_day) === 1 ? '' : 's'}`})`).join(' · ')}
              </div>
            </div>
          </div>
        )}

        {/* Summary Card */}
        <div style={cardStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: 13, color: '#6b7280', marginBottom: 4 }}>Total monthly bills</div>
              <div style={{ fontSize: 32, fontWeight: 700, color: '#0a1628' }}>£{totalMonthly.toFixed(2)}</div>
              <div style={{ fontSize: 13, color: '#6b7280', marginTop: 4 }}>{bills.length} bill{bills.length !== 1 ? 's' : ''} tracked</div>
            </div>
            <button
              onClick={() => { setShowForm(true); setEditId(null); setForm(EMPTY_FORM); setError(''); }}
              style={{ background: '#1a56db', color: '#fff', border: 'none', borderRadius: 10, padding: '10px 18px', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}
            >
              + Add bill
            </button>
          </div>
        </div>

        {/* Add/Edit Form */}
        {showForm && (
          <div style={{ ...cardStyle, border: '1.5px solid #1a56db' }}>
            <div style={{ fontWeight: 600, fontSize: 16, color: '#0a1628', marginBottom: 16 }}>
              {editId ? 'Edit bill' : 'New bill'}
            </div>
            {error && <div style={{ background: '#fef2f2', border: '1px solid #dc2626', borderRadius: 8, padding: '10px 14px', color: '#dc2626', fontSize: 13, marginBottom: 14 }}>{error}</div>}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label style={{ fontSize: 13, color: '#374151', fontWeight: 500 }}>Bill name</label>
                <input
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="e.g. Netflix, Rent, Council Tax"
                  style={{ width: '100%', marginTop: 4, padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 14, boxSizing: 'border-box' }}
                />
              </div>
              <div style={{ display: 'flex', gap: 12 }}>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: 13, color: '#374151', fontWeight: 500 }}>Amount (£)</label>
                  <input
                    type="number"
                    value={form.amount}
                    onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
                    placeholder="0.00"
                    style={{ width: '100%', marginTop: 4, padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 14, boxSizing: 'border-box' }}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: 13, color: '#374151', fontWeight: 500 }}>Due day</label>
                  <input
                    type="number"
                    value={form.due_day}
                    onChange={e => setForm(f => ({ ...f, due_day: e.target.value }))}
                    placeholder="1–31"
                    min="1" max="31"
                    style={{ width: '100%', marginTop: 4, padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 14, boxSizing: 'border-box' }}
                  />
                </div>
              </div>
              <div>
                <label style={{ fontSize: 13, color: '#374151', fontWeight: 500 }}>Category</label>
                <select
                  value={form.category}
                  onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                  style={{ width: '100%', marginTop: 4, padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 14, boxSizing: 'border-box' }}
                >
                  {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  style={{ flex: 1, background: '#1a56db', color: '#fff', border: 'none', borderRadius: 8, padding: '11px', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}
                >
                  {saving ? 'Saving…' : editId ? 'Save changes' : 'Add bill'}
                </button>
                <button
                  onClick={handleCancel}
                  style={{ flex: 1, background: '#f3f4f6', color: '#374151', border: 'none', borderRadius: 8, padding: '11px', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Bills List */}
        {loading ? (
          <div style={{ textAlign: 'center', color: '#6b7280', padding: 40 }}>Loading…</div>
        ) : bills.length === 0 ? (
          <div style={{ ...cardStyle, textAlign: 'center', padding: '40px 24px' }}>
            <div style={{ fontSize: 36, marginBottom: 12 }}>🧾</div>
            <div style={{ fontWeight: 600, color: '#0a1628', marginBottom: 6 }}>No bills yet</div>
            <div style={{ color: '#6b7280', fontSize: 14 }}>Add your recurring bills to track what's coming up.</div>
          </div>
        ) : (
          <div style={cardStyle}>
            <div style={{ fontWeight: 600, fontSize: 15, color: '#0a1628', marginBottom: 16 }}>Upcoming this month</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {bills.map((bill, i) => {
                const days = getDaysUntilDue(bill.due_day);
                const dueSoonFlag = days <= 7;
                return (
                  <div key={bill.id}>
                    {i > 0 && <div style={{ height: 1, background: '#f3f4f6', margin: '8px 0' }} />}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontWeight: 600, color: '#0a1628', fontSize: 15 }}>{bill.name}</span>
                          {dueSoonFlag && <span style={{ background: '#fef3c7', color: '#92400e', fontSize: 11, fontWeight: 600, padding: '2px 7px', borderRadius: 20 }}>Due soon</span>}
                        </div>
                        <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>
                          {bill.category} · Due {bill.due_day}{['st','nd','rd'][((bill.due_day % 10) - 1)] || 'th'} of each month
                          {' · '}
                          <span style={{ color: dueSoonFlag ? '#d97706' : '#6b7280' }}>
                            {days === 0 ? 'Due today' : `${days} day${days === 1 ? '' : 's'} away`}
                          </span>
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span style={{ fontWeight: 700, color: '#0a1628', fontSize: 16 }}>£{Number(bill.amount).toFixed(2)}</span>
                        <button onClick={() => handleEdit(bill)} style={{ background: '#f0f4ff', border: 'none', borderRadius: 6, padding: '5px 10px', fontSize: 12, color: '#1a56db', cursor: 'pointer', fontWeight: 500 }}>Edit</button>
                        <button onClick={() => handleDelete(bill.id)} style={{ background: '#fef2f2', border: 'none', borderRadius: 6, padding: '5px 10px', fontSize: 12, color: '#dc2626', cursor: 'pointer', fontWeight: 500 }}>Delete</button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

    </div>
  );
}