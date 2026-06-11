"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { supabase } from "../supabase";
import { useRouter } from "next/navigation";
import { usePlaidLink } from "react-plaid-link";

const CATEGORIES = [
  { name: "Housing", keywords: ["rent", "mortgage", "letting", "estate"], color: "#1a56db", icon: "🏠" },
  { name: "Food & Groceries", keywords: ["tesco", "sainsbury", "asda", "morrisons", "aldi", "lidl", "waitrose", "marks", "grocery", "supermarket", "food"], color: "#1D9E75", icon: "🛒" },
  { name: "Transport", keywords: ["fuel", "petrol", "diesel", "uber", "taxi", "tfl", "trainline", "national rail", "bus", "parking", "mot"], color: "#D85A30", icon: "🚗" },
  { name: "Eating Out", keywords: ["restaurant", "cafe", "coffee", "starbucks", "costa", "mcdonalds", "kfc", "nando", "deliveroo", "just eat", "uber eats", "takeaway"], color: "#D4537E", icon: "🍽️" },
  { name: "Entertainment", keywords: ["netflix", "spotify", "cinema", "amazon prime", "disney", "apple tv", "game", "steam", "ticket"], color: "#7C3AED", icon: "🎬" },
  { name: "Shopping", keywords: ["amazon", "ebay", "asos", "zara", "h&m", "primark", "next", "john lewis", "argos", "ikea"], color: "#D97706", icon: "🛍️" },
  { name: "Health", keywords: ["pharmacy", "boots", "gym", "fitness", "doctor", "dentist", "hospital", "medical"], color: "#059669", icon: "💊" },
  { name: "Savings", keywords: ["savings", "transfer", "investment", "stocks", "isa", "pension"], color: "#0891B2", icon: "🏦" },
  { name: "Bills & Utilities", keywords: ["electric", "gas", "water", "broadband", "wifi", "phone", "council tax", "tv licence", "sky", "virgin"], color: "#6B7280", icon: "📱" },
  { name: "Other", keywords: [], color: "#9CA3AF", icon: "📦" },
];

function categorise(description) {
  const lower = description.toLowerCase();
  for (const cat of CATEGORIES) {
    if (cat.keywords.some(k => lower.includes(k))) return cat.name;
  }
  return "Other";
}

function fmt(n) {
  return "£" + Math.abs(parseFloat(n) || 0).toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function FloatingInsights({ insights }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{position:'fixed', bottom:'90px', right:'24px', zIndex:200}}>
      {open && (
        <div style={{background:'white', border:'1px solid #e8f0fe', borderRadius:'16px', padding:'20px', marginBottom:'12px', width:'300px', boxShadow:'0 8px 30px rgba(26,86,219,0.15)', maxHeight:'400px', overflowY:'auto'}}>
          <div style={{display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'16px'}}>
            <p style={{fontSize:'14px', fontWeight:'800', color:'#0a1628'}}>💡 Spending Insights</p>
            <button onClick={() => setOpen(false)} style={{background:'none', border:'none', cursor:'pointer', fontSize:'18px', color:'#9ca3af'}}>×</button>
          </div>
          {insights.length === 0
            ? <p style={{fontSize:'13px', color:'#9ca3af'}}>Add transactions from 2+ months to see insights.</p>
            : <div style={{display:'flex', flexDirection:'column', gap:'10px'}}>
                {insights.map((insight, i) => (
                  <div key={i} style={{display:'flex', alignItems:'flex-start', gap:'10px', padding:'10px 12px', background:'#f7f9ff', borderRadius:'10px', border:'1px solid #e8f0fe'}}>
                    <span style={{fontSize:'16px', flexShrink:0}}>{insight.icon}</span>
                    <p style={{fontSize:'12px', color:insight.color, fontWeight:'500', lineHeight:'1.5', margin:0}}>{insight.text}</p>
                  </div>
                ))}
              </div>
          }
        </div>
      )}
      <button onClick={() => setOpen(!open)}
        style={{background:'linear-gradient(135deg, #1a56db, #0e3fa8)', color:'white', border:'none', borderRadius:'999px', width:'52px', height:'52px', fontSize:'22px', cursor:'pointer', boxShadow:'0 4px 16px rgba(26,86,219,0.4)', display:'flex', alignItems:'center', justifyContent:'center', marginLeft:'auto'}}>
        {open ? '×' : '💡'}
      </button>
    </div>
  );
}
export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [netPay, setNetPay] = useState(0);
  const [transactions, setTransactions] = useState([]);
  const [alertSettings, setAlertSettings] = useState(null);
  const [form, setForm] = useState({ date: "", description: "", amount: "", category: "" });
  const [editingId, setEditingId] = useState(null);
  const [filterCat, setFilterCat] = useState("All");
  const [filterMonth, setFilterMonth] = useState("All");
  const [filterSort, setFilterSort] = useState("date-desc");
  const [filterSearch, setFilterSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const [bankConnected, setBankConnected] = useState(false);
  const [importing, setImporting] = useState(false);
  const [linkToken, setLinkToken] = useState(null);
  const [subscriptions, setSubscriptions] = useState([]);
  const [showSubForm, setShowSubForm] = useState(false);
  const [subForm, setSubForm] = useState({ name: '', amount: '' });
  const [subSaving, setSubSaving] = useState(false);
  const router = useRouter();

  const createLinkToken = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    const res = await fetch('/api/plaid/create-link-token', {
      method: 'POST',
      headers: { Authorization: `Bearer ${session.access_token}` }
    });
    const data = await res.json();
    if (data.link_token) setLinkToken(data.link_token);
  };

  const onPlaidSuccess = async (public_token) => {
    const { data: { session } } = await supabase.auth.getSession();
    await fetch('/api/plaid/exchange-token', {
      method: 'POST',
      headers: { Authorization: `Bearer ${session.access_token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ public_token })
    });
    setBankConnected(true);
  };

  const { open: openPlaid, ready: plaidReady } = usePlaidLink({
    token: linkToken,
    onSuccess: onPlaidSuccess,
  });

  useEffect(() => {
    if (linkToken && plaidReady) openPlaid();
  }, [linkToken, plaidReady]);

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }
      setUser(user);
      const { data: txns } = await supabase.from("transactions").select("*").eq("user_id", user.id).order("date", { ascending: false });
      if (txns) setTransactions(txns);
      const { data: settings } = await supabase.from("budget_settings").select("*").eq("user_id", user.id).single();
      if (settings) setNetPay(settings.net_pay);
      const { data: alerts } = await supabase.from("alert_settings").select("*").eq("user_id", user.id).single();
      if (alerts) setAlertSettings(alerts);
      const { data: bankConn } = await supabase.from("bank_connections").select("id").eq("user_id", user.id).single();
      if (bankConn) setBankConnected(true);
      const { data: subs } = await supabase.from("subscriptions").select("*").eq("user_id", user.id).eq("is_active", true);
      if (subs) setSubscriptions(subs);
      setLoading(false);
    };
    init();
  }, []);

  useEffect(() => {
    if (!user) return;
    supabase.from("budget_settings").upsert({ user_id: user.id, net_pay: netPay }, { onConflict: "user_id" });
  }, [netPay, user]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  const loadTestData = async () => {
    const testTransactions = [
      { date: "2026-06-01", description: "Rent payment", amount: 950, category: "Housing" },
      { date: "2026-06-02", description: "Tesco", amount: 85.50, category: "Food & Groceries" },
      { date: "2026-06-02", description: "Uber", amount: 12.40, category: "Transport" },
      { date: "2026-06-03", description: "Netflix", amount: 10.99, category: "Entertainment" },
      { date: "2026-06-03", description: "Deliveroo", amount: 24.50, category: "Eating Out" },
      { date: "2026-06-04", description: "Spotify", amount: 9.99, category: "Entertainment" },
      { date: "2026-06-04", description: "Sainsbury", amount: 62.30, category: "Food & Groceries" },
      { date: "2026-06-05", description: "Amazon", amount: 34.99, category: "Shopping" },
      { date: "2026-06-05", description: "BP Fuel", amount: 65.00, category: "Transport" },
      { date: "2026-06-06", description: "Costa Coffee", amount: 8.50, category: "Eating Out" },
      { date: "2026-06-06", description: "Sky Broadband", amount: 42.00, category: "Bills & Utilities" },
      { date: "2026-06-07", description: "EDF Energy", amount: 89.00, category: "Bills & Utilities" },
      { date: "2026-06-07", description: "Boots", amount: 23.40, category: "Health" },
      { date: "2026-06-08", description: "JD Sports", amount: 75.00, category: "Shopping" },
      { date: "2026-06-08", description: "Nandos", amount: 32.00, category: "Eating Out" },
      { date: "2026-06-09", description: "Savings transfer", amount: 300, category: "Savings" },
      { date: "2026-06-09", description: "Aldi", amount: 45.20, category: "Food & Groceries" },
      { date: "2026-06-10", description: "TfL", amount: 38.40, category: "Transport" },
      { date: "2026-06-10", description: "Disney+", amount: 4.99, category: "Entertainment" },
      { date: "2026-06-11", description: "ASOS", amount: 67.99, category: "Shopping" },
      { date: "2026-06-11", description: "Gym membership", amount: 35.00, category: "Health" },
      { date: "2026-06-12", description: "Waitrose", amount: 92.10, category: "Food & Groceries" },
      { date: "2026-06-12", description: "Uber Eats", amount: 28.50, category: "Eating Out" },
      { date: "2026-06-13", description: "Amazon Prime", amount: 8.99, category: "Entertainment" },
      { date: "2026-06-13", description: "Shell Fuel", amount: 71.00, category: "Transport" },
      { date: "2026-06-14", description: "Council Tax", amount: 145.00, category: "Bills & Utilities" },
      { date: "2026-06-14", description: "Starbucks", amount: 6.80, category: "Eating Out" },
      { date: "2026-06-15", description: "John Lewis", amount: 120.00, category: "Shopping" },
      { date: "2026-06-15", description: "Dentist", amount: 65.00, category: "Health" },
      { date: "2026-06-16", description: "Lidl", amount: 38.60, category: "Food & Groceries" },
      { date: "2026-05-01", description: "Rent payment", amount: 950, category: "Housing" },
      { date: "2026-05-03", description: "Tesco", amount: 120.00, category: "Food & Groceries" },
      { date: "2026-05-05", description: "Netflix", amount: 10.99, category: "Entertainment" },
      { date: "2026-05-06", description: "Uber", amount: 8.50, category: "Transport" },
      { date: "2026-05-08", description: "Deliveroo", amount: 45.00, category: "Eating Out" },
      { date: "2026-05-10", description: "Sky Broadband", amount: 42.00, category: "Bills & Utilities" },
      { date: "2026-05-12", description: "Savings transfer", amount: 200, category: "Savings" },
      { date: "2026-05-15", description: "Amazon", amount: 89.99, category: "Shopping" },
      { date: "2026-05-18", description: "Boots", amount: 15.00, category: "Health" },
      { date: "2026-05-20", description: "Shell Fuel", amount: 60.00, category: "Transport" },
    ].map(t => ({ ...t, user_id: user.id }));
    const { error } = await supabase.from("transactions").insert(testTransactions);
    if (!error) {
      const { data: txns } = await supabase.from("transactions").select("*").eq("user_id", user.id).order("date", { ascending: false });
      if (txns) setTransactions(txns);
      alert("30 test transactions loaded!");
    }
  };

  const importTransactions = async () => {
    setImporting(true);
    const { data: { session } } = await supabase.auth.getSession();
    const res = await fetch("/api/plaid/transactions", {
      headers: { Authorization: `Bearer ${session.access_token}` }
    });
    const data = await res.json();
    if (data.imported > 0) {
      const { data: txns } = await supabase.from("transactions").select("*").eq("user_id", user.id).order("date", { ascending: false });
      if (txns) setTransactions(txns);
      alert(`Successfully imported ${data.imported} transactions!`);
    } else {
      alert("No new transactions found.");
    }
    setImporting(false);
  };

  const totalSpent = transactions.reduce((s, t) => s + parseFloat(t.amount), 0);
  const remaining = netPay - totalSpent;
  const spentPct = netPay > 0 ? Math.round((totalSpent / netPay) * 100) : 0;
  const barColor = spentPct >= 101 ? '#dc2626' : spentPct >= 76 ? '#f59e0b' : '#1a56db';

  const categoryTotals = CATEGORIES.map(cat => {
    const total = transactions.filter(t => t.category === cat.name).reduce((s, t) => s + parseFloat(t.amount), 0);
    const pct = netPay > 0 ? Math.round((total / netPay) * 100) : 0;
    return { ...cat, total, pct };
  }).filter(c => c.total > 0).sort((a, b) => b.total - a.total);

  const handleDescriptionChange = (val) => {
    const cat = categorise(val);
    setForm(f => ({ ...f, description: val, category: cat }));
  };

  const addTransaction = async () => {
    if (!form.description || !form.amount || !form.date) return;
    const category = form.category || categorise(form.description);
    if (editingId !== null) {
      const { data } = await supabase.from("transactions").update({ ...form, amount: parseFloat(form.amount), category }).eq("id", editingId).select().single();
      if (data) setTransactions(prev => prev.map(t => t.id === editingId ? data : t));
      setEditingId(null);
    } else {
      const { data } = await supabase.from("transactions").insert({ ...form, amount: parseFloat(form.amount), category, user_id: user.id }).select().single();
      if (data) setTransactions(prev => [data, ...prev]);
    }
    setForm({ date: "", description: "", amount: "", category: "" });
    setShowForm(false);
  };

  const deleteTransaction = async (id) => {
    await supabase.from("transactions").delete().eq("id", id);
    setTransactions(prev => prev.filter(t => t.id !== id));
  };

  const editTransaction = (t) => {
    setForm({ date: t.date, description: t.description, amount: t.amount, category: t.category });
    setEditingId(t.id);
    setShowForm(true);
  };

  const months = [...new Set(transactions.map(t => t.date.slice(0, 7)))].sort().reverse();

  const filtered = transactions
    .filter(t => filterCat === "All" || t.category === filterCat)
    .filter(t => filterMonth === "All" || t.date.startsWith(filterMonth))
    .filter(t => filterSearch === "" || t.description.toLowerCase().includes(filterSearch.toLowerCase()));

  const sorted = [...filtered].sort((a, b) => {
    if (filterSort === "date-desc") return new Date(b.date) - new Date(a.date);
    if (filterSort === "date-asc") return new Date(a.date) - new Date(b.date);
    if (filterSort === "amount-desc") return parseFloat(b.amount) - parseFloat(a.amount);
    if (filterSort === "amount-asc") return parseFloat(a.amount) - parseFloat(b.amount);
    if (filterSort === "name-asc") return a.description.localeCompare(b.description);
    return 0;
  });

  const pieSlices = (() => {
    if (categoryTotals.length === 0) return [];
    let cumulative = 0;
    return categoryTotals.map(cat => {
      const share = cat.total / totalSpent;
      const start = cumulative;
      cumulative += share;
      const startAngle = start * 2 * Math.PI - Math.PI / 2;
      const endAngle = cumulative * 2 * Math.PI - Math.PI / 2;
      const r = 80, cx = 100, cy = 100;
      const x1 = cx + r * Math.cos(startAngle);
      const y1 = cy + r * Math.sin(startAngle);
      const x2 = cx + r * Math.cos(endAngle);
      const y2 = cy + r * Math.sin(endAngle);
      const largeArc = share > 0.5 ? 1 : 0;
      return { ...cat, d: `M${cx},${cy} L${x1},${y1} A${r},${r} 0 ${largeArc} 1 ${x2},${y2} Z` };
    });
  })();

  const savingsTotal = alertSettings ? transactions.filter(t => t.category === alertSettings.savings_category).reduce((s, t) => s + parseFloat(t.amount), 0) : 0;

  const getInsights = () => {
    const allMonths = [...new Set(transactions.map(t => t.date.slice(0, 7)))].sort().reverse();
    const currentMonth = allMonths[0];
    const prevMonth = allMonths[1];
    if (!prevMonth || !currentMonth) return [];

    const getMonthCatTotal = (month, category) =>
      transactions.filter(t => t.date.startsWith(month) && t.category === category).reduce((s, t) => s + parseFloat(t.amount), 0);

    const currentTotal = transactions.filter(t => t.date.startsWith(currentMonth)).reduce((s, t) => s + parseFloat(t.amount), 0);
    const prevTotal = transactions.filter(t => t.date.startsWith(prevMonth)).reduce((s, t) => s + parseFloat(t.amount), 0);
    const overallChange = prevTotal > 0 ? Math.round(((currentTotal - prevTotal) / prevTotal) * 100) : 0;
    const formatMonth = (m) => new Date(m + '-01').toLocaleDateString('en-GB', { month: 'long' });

    const insights = [];

    if (overallChange > 10) insights.push({ icon: '📈', text: `Overall spending up ${overallChange}% vs ${formatMonth(prevMonth)}`, color: '#dc2626' });
    else if (overallChange < -10) insights.push({ icon: '📉', text: `Overall spending down ${Math.abs(overallChange)}% vs ${formatMonth(prevMonth)}`, color: '#16a34a' });
    else insights.push({ icon: '✅', text: `Spending is stable vs ${formatMonth(prevMonth)} (${overallChange > 0 ? '+' : ''}${overallChange}%)`, color: '#1a56db' });

    CATEGORIES.forEach(cat => {
      const curr = getMonthCatTotal(currentMonth, cat.name);
      const prev = getMonthCatTotal(prevMonth, cat.name);
      if (curr === 0 && prev === 0) return;
      const change = prev > 0 ? Math.round(((curr - prev) / prev) * 100) : 0;
      if (change >= 50) insights.push({ icon: '⚠️', text: `${cat.name} up ${change}% — ${fmt(prev)} → ${fmt(curr)}`, color: '#dc2626' });
      else if (change <= -30) insights.push({ icon: '💚', text: `${cat.name} down ${Math.abs(change)}% — ${fmt(prev)} → ${fmt(curr)}`, color: '#16a34a' });
      if (curr > 0 && prev === 0) insights.push({ icon: '🆕', text: `New ${cat.name} spending this month — ${fmt(curr)}`, color: '#d97706' });
      if (curr === 0 && prev > 0) insights.push({ icon: '🎉', text: `No ${cat.name} this month — saved ${fmt(prev)} vs last month`, color: '#16a34a' });
    });

    const topCat = categoryTotals[0];
    if (topCat && netPay > 0 && (topCat.total / netPay) > 0.3) {
      insights.push({ icon: '💡', text: `${topCat.name} is your biggest expense at ${Math.round((topCat.total / netPay) * 100)}% of take-home`, color: '#d97706' });
    }

    return insights.slice(0, 6);
  };

  const getAutoDetectedSubs = () => {
    const merchantCounts = {};
    transactions.forEach(t => {
      const key = t.description.toLowerCase().trim();
      if (!merchantCounts[key]) merchantCounts[key] = [];
      merchantCounts[key].push(t);
    });
    return Object.entries(merchantCounts)
      .filter(([_, txns]) => txns.length >= 2)
      .map(([name, txns]) => {
        const amounts = txns.map(t => parseFloat(t.amount));
        const avgAmount = amounts.reduce((a, b) => a + b, 0) / amounts.length;
        const isConsistent = Math.max(...amounts) - Math.min(...amounts) < 2;
        return { name: txns[0].description, amount: avgAmount, consistent: isConsistent, count: txns.length };
      })
      .filter(s => s.consistent && s.amount < 100)
      .sort((a, b) => b.amount - a.amount);
  };

  const handleAddSub = async () => {
    if (!subForm.name.trim() || !subForm.amount) return;
    setSubSaving(true);
    const { data } = await supabase.from("subscriptions").insert({
      user_id: user.id,
      name: subForm.name.trim(),
      amount: parseFloat(subForm.amount),
      frequency: 'monthly',
    }).select().single();
    if (data) setSubscriptions(prev => [...prev, data]);
    setSubForm({ name: '', amount: '' });
    setShowSubForm(false);
    setSubSaving(false);
  };

  const handleDeleteSub = async (id) => {
    await supabase.from("subscriptions").update({ is_active: false }).eq("id", id);
    setSubscriptions(prev => prev.filter(s => s.id !== id));
  };

  if (loading) return (
    <main className="min-h-screen" style={{background:'#f7f9ff', display:'flex', alignItems:'center', justifyContent:'center'}}>
      <div style={{textAlign:'center'}}>
        <div style={{width:'48px', height:'48px', borderRadius:'14px', background:'linear-gradient(135deg, #1a56db, #0e3fa8)', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 16px'}}>
          <span style={{color:'white', fontWeight:'800', fontSize:'22px'}}>T</span>
        </div>
        <p style={{color:'#6b7280', fontSize:'15px', fontWeight:'500'}}>Loading your dashboard...</p>
      </div>
    </main>
  );

  return (
    <main className="min-h-screen" style={{background: '#f7f9ff'}}>
      <style>{`
        @media(max-width:640px){
          .dash-grid{grid-template-columns:1fr!important}
          .summary-grid{grid-template-columns:1fr 1fr!important}
          .header-row{flex-direction:column!important;align-items:flex-start!important}
          .form-grid{grid-template-columns:1fr!important}
          .desktop-nav{display:none!important}
          .mobile-menu-btn{display:flex!important}
          .mobile-bottom-nav{display:flex!important}
        }
        @media(min-width:641px){
          .mobile-menu-btn{display:none!important}
          .mobile-menu{display:none!important}
          .mobile-bottom-nav{display:none!important}
        }
      `}</style>

      {/* Nav */}
      <nav style={{borderBottom:'1px solid #e8f0fe', background:'white'}} className="px-4 py-4 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2" style={{textDecoration:'none'}}>
            <div style={{background:'linear-gradient(135deg, #1a56db, #0e3fa8)', width:'32px', height:'32px', borderRadius:'8px', display:'flex', alignItems:'center', justifyContent:'center'}}>
              <span style={{color:'white', fontWeight:'800', fontSize:'14px'}}>T</span>
            </div>
            <span style={{fontWeight:'800', color:'#0a1628', fontSize:'18px', letterSpacing:'-0.3px'}}>Takehome</span>
          </Link>
          <div className="desktop-nav" style={{display:'flex', alignItems:'center', gap:'12px'}}>
            <div style={{display:'flex', alignItems:'center', gap:'4px', background:'#f0f5ff', borderRadius:'12px', padding:'4px'}}>
              {[
 { href:'/', label:'Home', icon:'🏠' },
{ href:'/calculator', label:'Calculator', icon:'💷' },
{ href:'/dashboard', label:'Dashboard', icon:'📊', active:true },
{ href:'/analytics', label:'Analytics', icon:'📈' },
{ href: '/bills', label: 'Bills', icon: '🧾' },
{ href:'/settings', label:'Settings', icon:'⚙️' },

              ].map(tab => (
                <Link key={tab.href} href={tab.href} style={{display:'flex', alignItems:'center', gap:'6px', padding:'8px 16px', borderRadius:'9px', fontSize:'14px', fontWeight: tab.active ? '700' : '500', color: tab.active ? '#1a56db' : '#6b7280', background: tab.active ? 'white' : 'transparent', textDecoration:'none', boxShadow: tab.active ? '0 1px 4px rgba(26,86,219,0.12)' : 'none'}}>
                  <span>{tab.icon}</span>{tab.label}
                </Link>
              ))}
            </div>
            <button onClick={handleSignOut} style={{background:'#f3f4f6', border:'none', borderRadius:'10px', padding:'8px 16px', fontSize:'14px', color:'#6b7280', cursor:'pointer', fontWeight:'600'}}>
              Sign out
            </button>
          </div>
          <button className="mobile-menu-btn" onClick={() => setMenuOpen(!menuOpen)}
            style={{background:'none', border:'none', cursor:'pointer', flexDirection:'column', gap:'5px', padding:'4px', display:'none'}}>
            <div style={{width:'22px', height:'2px', background:'#0a1628', borderRadius:'2px'}}></div>
            <div style={{width:'22px', height:'2px', background:'#0a1628', borderRadius:'2px'}}></div>
            <div style={{width:'22px', height:'2px', background:'#0a1628', borderRadius:'2px'}}></div>
          </button>
        </div>
        {menuOpen && (
          <div className="mobile-menu" style={{borderTop:'1px solid #e8f0fe', marginTop:'12px', paddingTop:'12px'}}>
            {[
{ href:'/', label:'Home', icon:'🏠' },
{ href:'/calculator', label:'Calculator', icon:'💷' },
{ href:'/dashboard', label:'Dashboard', icon:'📊', active:true },
{ href:'/analytics', label:'Analytics', icon:'📈' },
{ href: '/bills', label: 'Bills', icon: '🧾' },
{ href:'/settings', label:'Settings', icon:'⚙️' },
            ].map(tab => (
              <Link key={tab.href} href={tab.href} onClick={() => setMenuOpen(false)}
                style={{display:'flex', alignItems:'center', gap:'10px', padding:'12px 16px', borderRadius:'10px', fontSize:'15px', fontWeight: tab.active ? '700' : '500', color: tab.active ? '#1a56db' : '#0a1628', background: tab.active ? '#f0f5ff' : 'transparent', textDecoration:'none', marginBottom:'4px'}}>
                <span>{tab.icon}</span>{tab.label}
              </Link>
            ))}
            <div style={{borderTop:'1px solid #e8f0fe', marginTop:'8px', paddingTop:'8px'}}>
              <button onClick={handleSignOut} style={{background:'#f3f4f6', border:'none', borderRadius:'10px', padding:'8px 16px', fontSize:'14px', color:'#6b7280', cursor:'pointer', fontWeight:'600'}}>Sign out</button>
            </div>
          </div>
        )}
      </nav>

      <div className="max-w-6xl mx-auto px-4 py-10" style={{paddingBottom:'160px'}}>

        {/* Alert banners */}
        {alertSettings?.spending_alert && totalSpent > netPay && netPay > 0 && (
          <div style={{background:'#fef2f2', border:'1px solid #fecaca', borderRadius:'14px', padding:'16px 20px', marginBottom:'24px', display:'flex', alignItems:'center', gap:'12px'}}>
            <span style={{fontSize:'24px'}}>⚠️</span>
            <div>
              <p style={{fontSize:'15px', fontWeight:'700', color:'#dc2626', marginBottom:'2px'}}>Overspending alert</p>
              <p style={{fontSize:'13px', color:'#ef4444'}}>Your spending of {fmt(totalSpent)} exceeds your take-home pay of {fmt(netPay)} this month.</p>
            </div>
          </div>
        )}
        {alertSettings?.savings_alert && alertSettings?.savings_goal > 0 && (
          savingsTotal < alertSettings.savings_goal ? (
            <div style={{background:'#fffbeb', border:'1px solid #fcd34d', borderRadius:'14px', padding:'16px 20px', marginBottom:'24px', display:'flex', alignItems:'center', gap:'12px'}}>
              <span style={{fontSize:'24px'}}>🎯</span>
              <div>
                <p style={{fontSize:'15px', fontWeight:'700', color:'#d97706', marginBottom:'2px'}}>Savings goal not met</p>
                <p style={{fontSize:'13px', color:'#f59e0b'}}>You've saved {fmt(savingsTotal)} towards your {fmt(alertSettings.savings_goal)} monthly goal. You need {fmt(alertSettings.savings_goal - savingsTotal)} more.</p>
              </div>
            </div>
          ) : (
            <div style={{background:'#f0fdf4', border:'1px solid #bbf7d0', borderRadius:'14px', padding:'16px 20px', marginBottom:'24px', display:'flex', alignItems:'center', gap:'12px'}}>
              <span style={{fontSize:'24px'}}>✅</span>
              <div>
                <p style={{fontSize:'15px', fontWeight:'700', color:'#16a34a', marginBottom:'2px'}}>Savings goal met!</p>
                <p style={{fontSize:'13px', color:'#22c55e'}}>You've saved {fmt(savingsTotal)} this month, hitting your {fmt(alertSettings.savings_goal)} goal!</p>
              </div>
            </div>
          )
        )}

        {/* Page header */}
        <div className="header-row" style={{display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'32px', flexWrap:'wrap', gap:'16px'}}>
          <div>
            <p style={{fontSize:'13px', fontWeight:'600', color:'#1a56db', textTransform:'uppercase', letterSpacing:'1px', marginBottom:'6px'}}>Finance Tracker</p>
            <h1 style={{fontSize:'32px', fontWeight:'800', color:'#0a1628', letterSpacing:'-0.5px', marginBottom:'6px'}}>Spending Dashboard</h1>
<p style={{fontSize:'15px', color:'#6b7280'}}>Welcome back, {user?.user_metadata?.full_name || user?.email}</p>          </div>
          <div style={{display:'flex', alignItems:'center', gap:'12px', flexWrap:'wrap'}}>
            <div style={{display:'flex', alignItems:'center', gap:'8px', background:'white', border:'1px solid #e8f0fe', borderRadius:'12px', padding:'10px 16px', boxShadow:'0 2px 8px rgba(26,86,219,0.06)'}}>
              <span style={{fontSize:'13px', color:'#6b7280', fontWeight:'500'}}>Monthly take-home</span>
              <div style={{display:'flex', alignItems:'center', gap:'4px'}}>
                <span style={{color:'#1a56db', fontSize:'15px', fontWeight:'700'}}>£</span>
                <input type="text" inputMode="numeric" value={netPay || ''}
                  onChange={e => setNetPay(parseFloat(e.target.value.replace(/[^0-9.]/g, '')) || 0)}
                  onFocus={e => setTimeout(() => e.target.select(), 0)}
                  placeholder="0"
                  style={{width:'75px', border:'none', outline:'none', fontSize:'15px', fontWeight:'700', color:'#0a1628'}} />
              </div>
            </div>
            <button onClick={() => { setShowForm(true); setEditingId(null); setForm({ date:"", description:"", amount:"", category:"" }); }}
              style={{background:'linear-gradient(135deg, #1a56db, #0e3fa8)', color:'white', padding:'12px 22px', borderRadius:'12px', fontSize:'14px', fontWeight:'700', border:'none', cursor:'pointer', boxShadow:'0 4px 12px rgba(26,86,219,0.3)'}}>
              + Add transaction
            </button>
            <button onClick={createLinkToken} disabled={!user}
              style={{background:'white', color:'#1a56db', padding:'12px 22px', borderRadius:'12px', fontSize:'14px', fontWeight:'700', border:'2px solid #1a56db', cursor:'pointer'}}>
              🏦 {bankConnected ? "Reconnect bank" : "Connect bank"}
            </button>
            {bankConnected && (
              <button onClick={importTransactions} disabled={importing}
                style={{background:'#f0fdf4', color:'#16a34a', padding:'12px 22px', borderRadius:'12px', fontSize:'14px', fontWeight:'700', border:'2px solid #16a34a', cursor: importing ? 'not-allowed' : 'pointer'}}>
                {importing ? "Importing..." : "↓ Import transactions"}
              </button>
            )}
            <button onClick={loadTestData}
              style={{background:'#f5f3ff', color:'#7C3AED', padding:'12px 22px', borderRadius:'12px', fontSize:'14px', fontWeight:'700', border:'2px solid #7C3AED', cursor:'pointer'}}>
              🧪 Load test data
            </button>
          </div>
        </div>

        {/* Add/edit form */}
        {showForm && (
          <div style={{background:'white', border:'1px solid #e8f0fe', borderRadius:'20px', padding:'28px', marginBottom:'28px', boxShadow:'0 8px 30px rgba(26,86,219,0.08)'}}>
            <h3 style={{fontSize:'18px', fontWeight:'800', color:'#0a1628', marginBottom:'20px'}}>{editingId !== null ? "Edit transaction" : "New transaction"}</h3>
            <div className="form-grid" style={{display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:'16px', marginBottom:'20px'}}>
              {[
                { label:'Date', content: <input type="date" value={form.date} onChange={e => setForm(f => ({...f, date:e.target.value}))} style={{width:'100%', border:'1px solid #e8f0fe', borderRadius:'10px', padding:'10px 14px', fontSize:'14px', color:'#0a1628', outline:'none'}} /> },
                { label:'Description', content: <input type="text" placeholder="e.g. Tesco, Netflix..." value={form.description} onChange={e => handleDescriptionChange(e.target.value)} style={{width:'100%', border:'1px solid #e8f0fe', borderRadius:'10px', padding:'10px 14px', fontSize:'14px', color:'#0a1628', outline:'none'}} /> },
                { label:'Amount (£)', content: <input type="number" placeholder="0.00" value={form.amount} onChange={e => setForm(f => ({...f, amount:e.target.value}))} style={{width:'100%', border:'1px solid #e8f0fe', borderRadius:'10px', padding:'10px 14px', fontSize:'14px', color:'#0a1628', outline:'none'}} /> },
                { label: <span>Category <span style={{color:'#1a56db', fontSize:'11px', fontWeight:'600'}}>AUTO-DETECTED</span></span>, content: <select value={form.category} onChange={e => setForm(f => ({...f, category:e.target.value}))} style={{width:'100%', border:'1px solid #e8f0fe', borderRadius:'10px', padding:'10px 14px', fontSize:'14px', color:'#0a1628', background:'white', outline:'none'}}>{CATEGORIES.map(c => <option key={c.name} value={c.name}>{c.icon} {c.name}</option>)}</select> },
              ].map((field, i) => (
                <div key={i}>
                  <label style={{fontSize:'12px', color:'#6b7280', fontWeight:'600', display:'block', marginBottom:'8px', textTransform:'uppercase', letterSpacing:'0.5px'}}>{field.label}</label>
                  {field.content}
                </div>
              ))}
            </div>
            <div style={{display:'flex', gap:'10px'}}>
              <button onClick={addTransaction} style={{background:'linear-gradient(135deg, #1a56db, #0e3fa8)', color:'white', padding:'11px 28px', borderRadius:'10px', fontSize:'14px', fontWeight:'700', border:'none', cursor:'pointer'}}>
                {editingId !== null ? "Save changes" : "Add transaction"}
              </button>
              <button onClick={() => { setShowForm(false); setEditingId(null); }} style={{background:'#f3f4f6', color:'#6b7280', padding:'11px 28px', borderRadius:'10px', fontSize:'14px', fontWeight:'600', border:'none', cursor:'pointer'}}>
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Summary cards */}
        <div className="summary-grid" style={{display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:'16px', marginBottom:'24px'}}>
          {[
            { label:"Take-home pay", value:fmt(netPay), sub:"this month", valueColor:'#0a1628', icon:'💰' },
            { label:"Total spent", value:fmt(totalSpent), sub:`${spentPct}% of income`, valueColor: spentPct >= 101 ? '#dc2626' : '#0a1628', icon:'💳' },
            { label:"Remaining", value:fmt(remaining), sub: remaining < 0 ? "Over budget" : "left to spend", valueColor: remaining < 0 ? '#dc2626' : '#1a56db', icon:'📊' },
            { label:"Transactions", value:transactions.length, sub:"this month", valueColor:'#0a1628', icon:'🧾' },
          ].map(s => (
            <div key={s.label} style={{background:'white', border:'1px solid #e8f0fe', borderRadius:'16px', padding:'22px', boxShadow:'0 2px 8px rgba(26,86,219,0.04)'}}>
              <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'12px'}}>
                <p style={{fontSize:'12px', color:'#6b7280', fontWeight:'600', textTransform:'uppercase', letterSpacing:'0.5px'}}>{s.label}</p>
                <span style={{fontSize:'20px'}}>{s.icon}</span>
              </div>
              <p style={{fontSize:'28px', fontWeight:'800', color:s.valueColor, marginBottom:'4px', letterSpacing:'-0.5px'}}>{s.value}</p>
              <p style={{fontSize:'12px', color:'#9ca3af'}}>{s.sub}</p>
            </div>
          ))}
        </div>

        {/* Progress bar */}
        <div style={{background:'white', border:'1px solid #e8f0fe', borderRadius:'16px', padding:'24px', marginBottom:'24px', boxShadow:'0 2px 8px rgba(26,86,219,0.04)'}}>
          <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'14px'}}>
            <div>
              <p style={{fontSize:'15px', fontWeight:'700', color:'#0a1628', marginBottom:'2px'}}>Monthly budget used</p>
              <p style={{fontSize:'13px', color:'#9ca3af'}}>{fmt(totalSpent)} of {fmt(netPay)}</p>
            </div>
            <span style={{fontSize:'28px', fontWeight:'800', color:barColor, letterSpacing:'-0.5px'}}>{spentPct}%</span>
          </div>
          <div style={{height:'12px', background:'#f3f4f6', borderRadius:'999px', overflow:'hidden'}}>
            <div style={{height:'100%', width:Math.min(spentPct, 100)+'%', backgroundColor: totalSpent > netPay ? '#dc2626' : spentPct >= 76 ? '#f59e0b' : '#4ade80', borderRadius:'999px', transition:'width 0.3s'}}></div>
          </div>
          <div style={{display:'flex', justifyContent:'space-between', marginTop:'8px'}}>
            <span style={{fontSize:'12px', color:'#9ca3af'}}>£0</span>
            <span style={{fontSize:'12px', color:'#9ca3af'}}>{fmt(netPay)}</span>
          </div>
        </div>

        {/* Category breakdown + pie chart with insights */}
        <div className="dash-grid" style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'24px', marginBottom:'24px'}}>
          <div style={{background:'white', border:'1px solid #e8f0fe', borderRadius:'16px', padding:'24px', boxShadow:'0 2px 8px rgba(26,86,219,0.04)'}}>
            <p style={{fontSize:'13px', fontWeight:'600', color:'#1a56db', textTransform:'uppercase', letterSpacing:'1px', marginBottom:'4px'}}>Breakdown</p>
            <h2 style={{fontSize:'18px', fontWeight:'800', color:'#0a1628', marginBottom:'20px'}}>Spending by category</h2>
            {categoryTotals.length === 0
              ? <p style={{color:'#9ca3af', fontSize:'14px'}}>No transactions yet</p>
              : <div style={{display:'flex', flexDirection:'column', gap:'16px'}}>
                  {categoryTotals.map(cat => (
                    <div key={cat.name}>
                      <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'8px'}}>
                        <div style={{display:'flex', alignItems:'center', gap:'10px'}}>
                          <div style={{width:'34px', height:'34px', borderRadius:'10px', background:cat.color+'18', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'16px'}}>{cat.icon}</div>
                          <span style={{fontSize:'14px', fontWeight:'600', color:'#0a1628'}}>{cat.name}</span>
                        </div>
                        <div style={{textAlign:'right'}}>
                          <span style={{fontSize:'15px', fontWeight:'800', color:'#0a1628'}}>{fmt(cat.total)}</span>
                          <span style={{fontSize:'12px', color:'#9ca3af', marginLeft:'6px', fontWeight:'500'}}>{cat.pct}%</span>
                        </div>
                      </div>
                      <div style={{height:'6px', background:'#f3f4f6', borderRadius:'999px', overflow:'hidden'}}>
                        <div style={{height:'100%', width:Math.min(cat.pct, 100)+'%', background:cat.color, borderRadius:'999px'}}></div>
                      </div>
                    </div>
                  ))}
                </div>
            }
          </div>

          <div style={{background:'white', border:'1px solid #e8f0fe', borderRadius:'16px', padding:'24px', boxShadow:'0 2px 8px rgba(26,86,219,0.04)'}}>
            <p style={{fontSize:'13px', fontWeight:'600', color:'#1a56db', textTransform:'uppercase', letterSpacing:'1px', marginBottom:'4px'}}>Visual</p>
            <h2 style={{fontSize:'18px', fontWeight:'800', color:'#0a1628', marginBottom:'20px'}}>Spending breakdown</h2>
            {pieSlices.length === 0
              ? <p style={{color:'#9ca3af', fontSize:'14px'}}>No transactions yet</p>
              : <>
                  <div style={{display:'flex', gap:'20px', alignItems:'center', flexWrap:'wrap', marginBottom:'20px'}}>
                    <svg viewBox="0 0 200 200" style={{width:'150px', height:'150px', flexShrink:0}}>
                      {pieSlices.map((s, i) => <path key={i} d={s.d} fill={s.color} />)}
                      <circle cx="100" cy="100" r="52" fill="white" />
                      <text x="100" y="95" textAnchor="middle" fontSize="12" fill="#0a1628" fontWeight="800">{fmt(totalSpent)}</text>
                      <text x="100" y="112" textAnchor="middle" fontSize="10" fill="#6b7280">total spent</text>
                    </svg>
                    <div style={{display:'flex', flexDirection:'column', gap:'8px', flex:1}}>
                      {pieSlices.map((s, i) => (
                        <div key={i} style={{display:'flex', alignItems:'center', gap:'8px'}}>
                          <div style={{width:'10px', height:'10px', borderRadius:'3px', background:s.color, flexShrink:0}}></div>
                          <span style={{fontSize:'12px', color:'#4a5568', flex:1}}>{s.name}</span>
                          <span style={{fontSize:'12px', fontWeight:'700', color:'#0a1628'}}>{s.pct}%</span>
                        </div>
                      ))}
                    </div>
                  </div>

                </>
            }
          </div>
        </div>

        {/* Spending Insights */}
        {getInsights().length > 0 && (
          <div style={{background:'white', border:'1px solid #e8f0fe', borderRadius:'16px', padding:'24px', marginBottom:'24px', boxShadow:'0 2px 8px rgba(26,86,219,0.04)'}}>
            <p style={{fontSize:'13px', fontWeight:'600', color:'#1a56db', textTransform:'uppercase', letterSpacing:'1px', marginBottom:'4px'}}>Analytics</p>
            <h2 style={{fontSize:'18px', fontWeight:'800', color:'#0a1628', marginBottom:'20px'}}>💡 Spending Insights</h2>
            <div style={{display:'flex', flexDirection:'column', gap:'12px'}}>
              {getInsights().map((insight, i) => (
                <div key={i} style={{display:'flex', alignItems:'flex-start', gap:'12px', padding:'12px 16px', background:'#f7f9ff', borderRadius:'10px', border:'1px solid #e8f0fe'}}>
                  <span style={{fontSize:'20px', flexShrink:0}}>{insight.icon}</span>
                  <p style={{fontSize:'14px', color:insight.color, fontWeight:'500', lineHeight:'1.5', margin:0}}>{insight.text}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Subscriptions */}
        {(() => {
          const autoSubs = getAutoDetectedSubs();
          const manualTotal = subscriptions.reduce((s, sub) => s + parseFloat(sub.amount), 0);
          const autoTotal = autoSubs.reduce((s, sub) => s + sub.amount, 0);
          const totalSubSpend = manualTotal + autoTotal;
          return (
            <div style={{background:'white', border:'1px solid #e8f0fe', borderRadius:'16px', padding:'24px', marginBottom:'24px', boxShadow:'0 2px 8px rgba(26,86,219,0.04)'}}>
              <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'20px', flexWrap:'wrap', gap:'12px'}}>
                <div>
                  <p style={{fontSize:'13px', fontWeight:'600', color:'#1a56db', textTransform:'uppercase', letterSpacing:'1px', marginBottom:'4px'}}>Recurring</p>
                  <h2 style={{fontSize:'18px', fontWeight:'800', color:'#0a1628', marginBottom:'2px'}}>🔄 Subscriptions</h2>
                  <p style={{fontSize:'13px', color:'#6b7280'}}>{fmt(totalSubSpend)}/month across {autoSubs.length + subscriptions.length} subscriptions</p>
                </div>
                <button onClick={() => setShowSubForm(!showSubForm)}
                  style={{background:'#1a56db', color:'white', border:'none', borderRadius:'10px', padding:'10px 18px', fontSize:'14px', fontWeight:'600', cursor:'pointer'}}>
                  + Add manually
                </button>
              </div>

              {showSubForm && (
                <div style={{background:'#f7f9ff', border:'1px solid #e8f0fe', borderRadius:'12px', padding:'16px', marginBottom:'20px', display:'flex', gap:'12px', flexWrap:'wrap', alignItems:'flex-end'}}>
                  <div style={{flex:1, minWidth:'160px'}}>
                    <label style={{fontSize:'12px', fontWeight:'600', color:'#374151', display:'block', marginBottom:'6px'}}>Name</label>
                    <input value={subForm.name} onChange={e => setSubForm(f => ({...f, name: e.target.value}))}
                      placeholder="e.g. iCloud, Xbox Game Pass"
                      style={{width:'100%', border:'1px solid #d1d5db', borderRadius:'8px', padding:'10px 12px', fontSize:'14px', boxSizing:'border-box'}} />
                  </div>
                  <div style={{width:'120px'}}>
                    <label style={{fontSize:'12px', fontWeight:'600', color:'#374151', display:'block', marginBottom:'6px'}}>Monthly cost (£)</label>
                    <input type="number" value={subForm.amount} onChange={e => setSubForm(f => ({...f, amount: e.target.value}))}
                      placeholder="0.00"
                      style={{width:'100%', border:'1px solid #d1d5db', borderRadius:'8px', padding:'10px 12px', fontSize:'14px', boxSizing:'border-box'}} />
                  </div>
                  <button onClick={handleAddSub} disabled={subSaving}
                    style={{background:'#1a56db', color:'white', border:'none', borderRadius:'8px', padding:'10px 18px', fontSize:'14px', fontWeight:'600', cursor:'pointer', whiteSpace:'nowrap'}}>
                    {subSaving ? 'Saving...' : 'Add'}
                  </button>
                  <button onClick={() => setShowSubForm(false)}
                    style={{background:'#f3f4f6', color:'#374151', border:'none', borderRadius:'8px', padding:'10px 18px', fontSize:'14px', fontWeight:'600', cursor:'pointer'}}>
                    Cancel
                  </button>
                </div>
              )}

              <div style={{display:'flex', flexDirection:'column', gap:'2px'}}>
                {autoSubs.length === 0 && subscriptions.length === 0 && (
                  <p style={{color:'#9ca3af', fontSize:'14px', textAlign:'center', padding:'20px 0'}}>No recurring payments detected yet. Add more transactions or add manually.</p>
                )}
                {autoSubs.map((sub, i) => (
                  <div key={i} style={{display:'flex', alignItems:'center', gap:'12px', padding:'12px', borderRadius:'10px', background:'#f7f9ff', marginBottom:'6px'}}>
                    <div style={{width:'36px', height:'36px', borderRadius:'10px', background:'#7C3AED18', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'16px', flexShrink:0}}>🔄</div>
                    <div style={{flex:1}}>
                      <p style={{fontSize:'14px', fontWeight:'600', color:'#0a1628', marginBottom:'2px'}}>{sub.name}</p>
                      <p style={{fontSize:'12px', color:'#6b7280'}}>Auto-detected · {sub.count} payments</p>
                    </div>
                    <span style={{fontSize:'15px', fontWeight:'700', color:'#0a1628'}}>{fmt(sub.amount)}/mo</span>
                    <span style={{background:'#f0fdf4', color:'#16a34a', fontSize:'11px', fontWeight:'600', padding:'3px 8px', borderRadius:'20px'}}>Detected</span>
                  </div>
                ))}
                {subscriptions.map(sub => (
                  <div key={sub.id} style={{display:'flex', alignItems:'center', gap:'12px', padding:'12px', borderRadius:'10px', background:'#f0f5ff', marginBottom:'6px'}}>
                    <div style={{width:'36px', height:'36px', borderRadius:'10px', background:'#1a56db18', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'16px', flexShrink:0}}>📌</div>
                    <div style={{flex:1}}>
                      <p style={{fontSize:'14px', fontWeight:'600', color:'#0a1628', marginBottom:'2px'}}>{sub.name}</p>
                      <p style={{fontSize:'12px', color:'#6b7280'}}>Added manually · monthly</p>
                    </div>
                    <span style={{fontSize:'15px', fontWeight:'700', color:'#0a1628'}}>{fmt(sub.amount)}/mo</span>
                    <button onClick={() => handleDeleteSub(sub.id)}
                      style={{background:'#fef2f2', border:'none', borderRadius:'6px', padding:'5px 10px', fontSize:'12px', color:'#dc2626', cursor:'pointer', fontWeight:'500'}}>
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            </div>
          );
        })()}

        {/* Transactions */}
        <div style={{background:'white', border:'1px solid #e8f0fe', borderRadius:'16px', padding:'24px', boxShadow:'0 2px 8px rgba(26,86,219,0.04)'}}>
          <div style={{marginBottom:'20px'}}>
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'16px', flexWrap:'wrap', gap:'12px'}}>
              <div>
                <p style={{fontSize:'13px', fontWeight:'600', color:'#1a56db', textTransform:'uppercase', letterSpacing:'1px', marginBottom:'4px'}}>History</p>
                <h2 style={{fontSize:'18px', fontWeight:'800', color:'#0a1628'}}>Transactions</h2>
              </div>
              <p style={{fontSize:'13px', color:'#9ca3af'}}>{sorted.length} transaction{sorted.length !== 1 ? 's' : ''}</p>
            </div>
            <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(160px, 1fr))', gap:'10px'}}>
              <input type="text" placeholder="Search by name..." value={filterSearch} onChange={e => setFilterSearch(e.target.value)}
                style={{border:'1px solid #e8f0fe', borderRadius:'10px', padding:'8px 14px', fontSize:'13px', color:'#0a1628', background:'white', outline:'none'}} />
              <select value={filterMonth} onChange={e => setFilterMonth(e.target.value)}
                style={{border:'1px solid #e8f0fe', borderRadius:'10px', padding:'8px 14px', fontSize:'13px', color:'#0a1628', background:'white', outline:'none'}}>
                <option value="All">All months</option>
                {months.map(m => <option key={m} value={m}>{new Date(m + '-01').toLocaleDateString('en-GB', {month:'long', year:'numeric'})}</option>)}
              </select>
              <select value={filterCat} onChange={e => setFilterCat(e.target.value)}
                style={{border:'1px solid #e8f0fe', borderRadius:'10px', padding:'8px 14px', fontSize:'13px', color:'#0a1628', background:'white', outline:'none'}}>
                <option value="All">All categories</option>
                {CATEGORIES.map(c => <option key={c.name} value={c.name}>{c.icon} {c.name}</option>)}
              </select>
              <select value={filterSort} onChange={e => setFilterSort(e.target.value)}
                style={{border:'1px solid #e8f0fe', borderRadius:'10px', padding:'8px 14px', fontSize:'13px', color:'#0a1628', background:'white', outline:'none'}}>
                <option value="date-desc">Newest first</option>
                <option value="date-asc">Oldest first</option>
                <option value="amount-desc">Highest amount</option>
                <option value="amount-asc">Lowest amount</option>
                <option value="name-asc">Name A-Z</option>
              </select>
            </div>
          </div>
          {sorted.length === 0
            ? <div style={{textAlign:'center', padding:'40px 0'}}>
                <p style={{fontSize:'32px', marginBottom:'12px'}}>🧾</p>
                <p style={{color:'#9ca3af', fontSize:'15px', fontWeight:'500'}}>No transactions found</p>
                <p style={{color:'#c4c9d4', fontSize:'13px', marginTop:'4px'}}>Try adjusting your filters or add a transaction</p>
              </div>
            : <div style={{display:'flex', flexDirection:'column', gap:'4px'}}>
                {sorted.map(t => {
                  const cat = CATEGORIES.find(c => c.name === t.category) || CATEGORIES[CATEGORIES.length - 1];
                  return (
                    <div key={t.id} style={{display:'flex', alignItems:'center', gap:'14px', padding:'14px 12px', borderRadius:'12px', transition:'background 0.15s'}}
                      onMouseEnter={e => e.currentTarget.style.background='#f7f9ff'}
                      onMouseLeave={e => e.currentTarget.style.background='transparent'}>
                      <div style={{width:'42px', height:'42px', borderRadius:'12px', background:cat.color+'18', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'20px', flexShrink:0}}>
                        {cat.icon}
                      </div>
                      <div style={{flex:1, minWidth:0}}>
                        <p style={{fontSize:'15px', fontWeight:'700', color:'#0a1628', marginBottom:'3px'}}>{t.description}</p>
                        <p style={{fontSize:'12px', color:'#9ca3af'}}>{t.date} · <span style={{color:cat.color, fontWeight:'600'}}>{t.category}</span></p>
                      </div>
                      <p style={{fontSize:'17px', fontWeight:'800', color:'#0a1628', flexShrink:0, letterSpacing:'-0.3px'}}>{fmt(t.amount)}</p>
                      <div style={{display:'flex', gap:'6px', flexShrink:0}}>
                        <button onClick={() => editTransaction(t)} style={{background:'#f0f5ff', border:'none', borderRadius:'8px', padding:'7px 12px', fontSize:'12px', color:'#1a56db', cursor:'pointer', fontWeight:'600'}}>Edit</button>
                        <button onClick={() => deleteTransaction(t.id)} style={{background:'#fef2f2', border:'none', borderRadius:'8px', padding:'7px 12px', fontSize:'12px', color:'#dc2626', cursor:'pointer', fontWeight:'600'}}>Delete</button>
                      </div>
                    </div>
                  );
                })}
              </div>
          }
        </div>
      </div>

{/* Floating insights popup */}
      {transactions.length > 0 && (
        <FloatingInsights insights={getInsights()} />
      )}
      {/* Mobile bottom tabs */}
      <div className="mobile-bottom-nav" style={{position:'fixed', bottom:0, left:0, right:0, background:'white', borderTop:'1px solid #e8f0fe', display:'none', padding:'8px 0 20px', zIndex:100}}>
        {[
{ href:'/', label:'Home', icon:'🏠' },
{ href:'/calculator', label:'Calculator', icon:'💷' },
{ href:'/dashboard', label:'Dashboard', icon:'📊', active:true },
{ href:'/analytics', label:'Analytics', icon:'📈' },
{ href: '/bills', label: 'Bills', icon: '🧾' },
{ href:'/settings', label:'Settings', icon:'⚙️' },
        ].map(tab => (
          <Link key={tab.href} href={tab.href} style={{flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:'4px', textDecoration:'none', padding:'4px 0'}}>
            <span style={{fontSize:'22px'}}>{tab.icon}</span>
            <span style={{fontSize:'11px', fontWeight: tab.active ? '700' : '500', color: tab.active ? '#1a56db' : '#9ca3af'}}>{tab.label}</span>
          </Link>
        ))}
      </div>

    </main>
  );
}