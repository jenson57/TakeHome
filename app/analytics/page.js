"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { supabase } from "../supabase";
import { useRouter } from "next/navigation";

const CATEGORIES = [
  { name: "Housing", color: "#1a56db", icon: "🏠" },
  { name: "Food & Groceries", color: "#1D9E75", icon: "🛒" },
  { name: "Transport", color: "#D85A30", icon: "🚗" },
  { name: "Eating Out", color: "#D4537E", icon: "🍽️" },
  { name: "Entertainment", color: "#7C3AED", icon: "🎬" },
  { name: "Shopping", color: "#D97706", icon: "🛍️" },
  { name: "Health", color: "#059669", icon: "💊" },
  { name: "Savings", color: "#0891B2", icon: "🏦" },
  { name: "Bills & Utilities", color: "#6B7280", icon: "📱" },
  { name: "Other", color: "#9CA3AF", icon: "📦" },
];

function fmt(n) {
  return "£" + Math.abs(parseFloat(n) || 0).toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function Analytics() {
  const [user, setUser] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState("All");
  const router = useRouter();

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }
      setUser(user);
      const { data: txns } = await supabase.from("transactions").select("*").eq("user_id", user.id).order("date", { ascending: false });
      if (txns) setTransactions(txns);
      setLoading(false);
    };
    init();
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  const months = [...new Set(transactions.map(t => t.date.slice(0, 7)))].sort().reverse();
  const formatMonth = (m) => new Date(m + '-01').toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });

  const getMonthTotal = (month) =>
    transactions.filter(t => month === "All" || t.date.startsWith(month)).reduce((s, t) => s + parseFloat(t.amount), 0);

  const getCatTotal = (month, cat) =>
    transactions.filter(t => (month === "All" || t.date.startsWith(month)) && t.category === cat).reduce((s, t) => s + parseFloat(t.amount), 0);

  const currentMonthTotal = getMonthTotal(selectedMonth);

  const categoryData = CATEGORIES.map(cat => {
    const total = getCatTotal(selectedMonth, cat.name);
    const pct = currentMonthTotal > 0 ? Math.round((total / currentMonthTotal) * 100) : 0;
    const prevMonth = months[months.indexOf(selectedMonth) + 1];
    const prev = prevMonth ? getCatTotal(prevMonth, cat.name) : 0;
    const change = prev > 0 ? Math.round(((total - prev) / prev) * 100) : total > 0 ? 100 : 0;
    return { ...cat, total, pct, prev, change };
  }).filter(c => c.total > 0 || c.prev > 0).sort((a, b) => b.total - a.total);

  const monthlyTotals = months.map(m => ({
    month: m,
    total: getMonthTotal(m),
    label: formatMonth(m),
  }));

  const maxMonthTotal = Math.max(...monthlyTotals.map(m => m.total), 1);

  const insights = (() => {
    if (months.length < 2) return [];
    const curr = months[0];
    const prev = months[1];
    const currTotal = getMonthTotal(curr);
    const prevTotal = getMonthTotal(prev);
    const overallChange = prevTotal > 0 ? Math.round(((currTotal - prevTotal) / prevTotal) * 100) : 0;
    const list = [];

    if (overallChange > 10) list.push({ icon: '📈', text: `Overall spending up ${overallChange}% vs ${formatMonth(prev)}`, color: '#dc2626' });
    else if (overallChange < -10) list.push({ icon: '📉', text: `Overall spending down ${Math.abs(overallChange)}% vs ${formatMonth(prev)}`, color: '#16a34a' });
    else list.push({ icon: '✅', text: `Spending is stable vs ${formatMonth(prev)} (${overallChange > 0 ? '+' : ''}${overallChange}%)`, color: '#1a56db' });

    CATEGORIES.forEach(cat => {
      const c = getCatTotal(curr, cat.name);
      const p = getCatTotal(prev, cat.name);
      if (c === 0 && p === 0) return;
      const change = p > 0 ? Math.round(((c - p) / p) * 100) : 0;
      if (change >= 50) list.push({ icon: '⚠️', text: `${cat.name} up ${change}% — ${fmt(p)} → ${fmt(c)}`, color: '#dc2626' });
      else if (change <= -30) list.push({ icon: '💚', text: `${cat.name} down ${Math.abs(change)}% — ${fmt(p)} → ${fmt(c)}`, color: '#16a34a' });
      if (c > 0 && p === 0) list.push({ icon: '🆕', text: `New ${cat.name} spending this month — ${fmt(c)}`, color: '#d97706' });
      if (c === 0 && p > 0) list.push({ icon: '🎉', text: `No ${cat.name} this month — saved ${fmt(p)} vs last month`, color: '#16a34a' });
    });

    return list.slice(0, 8);
  })();

  const TABS = [
    { href:'/', label:'Home', icon:'🏠' },
    { href:'/calculator', label:'Calculator', icon:'💷' },
    { href:'/dashboard', label:'Dashboard', icon:'📊' },
    { href:'/analytics', label:'Analytics', icon:'📈', active:true },
    { href: '/bills', label: 'Bills', icon: '🧾' },
    { href: '/budget', label: 'Budget', icon: '💬' },
    { href: '/debt', label: 'Debt', icon: '💳' },
    { href:'/settings', label:'Settings', icon:'⚙️' },
  ];

  if (loading) return (
    <main className="min-h-screen" style={{background:'#f7f9ff', display:'flex', alignItems:'center', justifyContent:'center'}}>
      <div style={{textAlign:'center'}}>
        <div style={{width:'48px', height:'48px', borderRadius:'14px', background:'linear-gradient(135deg, #1a56db, #0e3fa8)', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 16px'}}>
          <span style={{color:'white', fontWeight:'800', fontSize:'22px'}}>T</span>
        </div>
        <p style={{color:'#6b7280', fontSize:'15px', fontWeight:'500'}}>Loading analytics...</p>
      </div>
    </main>
  );

  return (
    <main className="min-h-screen" style={{background:'#f7f9ff'}}>
      <style>{`
        @media(max-width:640px){
          .desktop-nav{display:none!important}
          .mobile-menu-btn{display:flex!important}
          .mobile-bottom-nav{display:flex!important}
          .analytics-grid{grid-template-columns:1fr!important}
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
              {TABS.map(tab => (
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
            {TABS.map(tab => (
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

        {/* Header */}
        <div style={{marginBottom:'32px', display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:'16px'}}>
          <div>
            <p style={{fontSize:'13px', fontWeight:'600', color:'#1a56db', textTransform:'uppercase', letterSpacing:'1px', marginBottom:'6px'}}>Finance Analytics</p>
            <h1 style={{fontSize:'32px', fontWeight:'800', color:'#0a1628', letterSpacing:'-0.5px', marginBottom:'6px'}}>Spending Analytics</h1>
            <p style={{fontSize:'15px', color:'#6b7280'}}>Track trends and compare your spending month by month</p>
          </div>
          <select value={selectedMonth} onChange={e => setSelectedMonth(e.target.value)}
            style={{border:'1px solid #e8f0fe', borderRadius:'12px', padding:'10px 16px', fontSize:'14px', color:'#0a1628', background:'white', outline:'none', fontWeight:'600'}}>
            <option value="All">All time</option>
            {months.map(m => <option key={m} value={m}>{formatMonth(m)}</option>)}
          </select>
        </div>

        {transactions.length === 0 ? (
          <div style={{textAlign:'center', padding:'80px 0'}}>
            <p style={{fontSize:'48px', marginBottom:'16px'}}>📊</p>
            <p style={{fontSize:'18px', fontWeight:'700', color:'#0a1628', marginBottom:'8px'}}>No data yet</p>
            <p style={{fontSize:'15px', color:'#6b7280', marginBottom:'24px'}}>Add transactions on the dashboard to see your analytics</p>
            <Link href="/dashboard" style={{background:'linear-gradient(135deg, #1a56db, #0e3fa8)', color:'white', padding:'12px 28px', borderRadius:'12px', fontSize:'14px', fontWeight:'700', textDecoration:'none'}}>
              Go to Dashboard
            </Link>
          </div>
        ) : (
          <>
            {/* Monthly spending chart */}
            {monthlyTotals.length > 1 && (
              <div style={{background:'white', border:'1px solid #e8f0fe', borderRadius:'16px', padding:'24px', marginBottom:'24px', boxShadow:'0 2px 8px rgba(26,86,219,0.04)'}}>
                <p style={{fontSize:'13px', fontWeight:'600', color:'#1a56db', textTransform:'uppercase', letterSpacing:'1px', marginBottom:'4px'}}>Trend</p>
                <h2 style={{fontSize:'18px', fontWeight:'800', color:'#0a1628', marginBottom:'24px'}}>Monthly spending</h2>
                <div style={{display:'flex', alignItems:'flex-end', gap:'12px', height:'160px'}}>
                  {monthlyTotals.slice(0, 6).reverse().map((m, i) => (
                    <div key={i} style={{flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:'8px', height:'100%', justifyContent:'flex-end'}}>
                      <span style={{fontSize:'11px', fontWeight:'700', color:'#0a1628'}}>{fmt(m.total)}</span>
                      <div style={{width:'100%', background: m.month === months[0] ? '#1a56db' : '#e8f0fe', borderRadius:'6px 6px 0 0', height:`${Math.max(8, (m.total / maxMonthTotal) * 120)}px`, transition:'height 0.3s'}}></div>
                      <span style={{fontSize:'11px', color:'#9ca3af', textAlign:'center'}}>{m.label.split(' ')[0]}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Insights */}
            {insights.length > 0 && (
              <div style={{background:'white', border:'1px solid #e8f0fe', borderRadius:'16px', padding:'24px', marginBottom:'24px', boxShadow:'0 2px 8px rgba(26,86,219,0.04)'}}>
                <p style={{fontSize:'13px', fontWeight:'600', color:'#1a56db', textTransform:'uppercase', letterSpacing:'1px', marginBottom:'4px'}}>Insights</p>
                <h2 style={{fontSize:'18px', fontWeight:'800', color:'#0a1628', marginBottom:'20px'}}>💡 What's changed</h2>
                <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(280px, 1fr))', gap:'12px'}}>
                  {insights.map((insight, i) => (
                    <div key={i} style={{display:'flex', alignItems:'flex-start', gap:'12px', padding:'14px 16px', background:'#f7f9ff', borderRadius:'10px', border:'1px solid #e8f0fe'}}>
                      <span style={{fontSize:'20px', flexShrink:0}}>{insight.icon}</span>
                      <p style={{fontSize:'13px', color:insight.color, fontWeight:'500', lineHeight:'1.5', margin:0}}>{insight.text}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Category breakdown */}
            <div style={{background:'white', border:'1px solid #e8f0fe', borderRadius:'16px', padding:'24px', marginBottom:'24px', boxShadow:'0 2px 8px rgba(26,86,219,0.04)'}}>
              <p style={{fontSize:'13px', fontWeight:'600', color:'#1a56db', textTransform:'uppercase', letterSpacing:'1px', marginBottom:'4px'}}>Breakdown</p>
              <h2 style={{fontSize:'18px', fontWeight:'800', color:'#0a1628', marginBottom:'20px'}}>Spending by category</h2>
              <div style={{display:'flex', flexDirection:'column', gap:'16px'}}>
                {categoryData.map(cat => (
                  <div key={cat.name} style={{padding:'16px', background:'#f7f9ff', borderRadius:'12px', border:'1px solid #e8f0fe'}}>
                    <div style={{display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'12px'}}>
                      <div style={{display:'flex', alignItems:'center', gap:'10px'}}>
                        <div style={{width:'36px', height:'36px', borderRadius:'10px', background:cat.color+'18', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'18px'}}>{cat.icon}</div>
                        <span style={{fontSize:'15px', fontWeight:'700', color:'#0a1628'}}>{cat.name}</span>
                      </div>
                      <div style={{display:'flex', alignItems:'center', gap:'12px'}}>
                        {cat.prev > 0 && <span style={{fontSize:'13px', color:'#9ca3af', textDecoration:'line-through'}}>{fmt(cat.prev)}</span>}
                        <span style={{fontSize:'16px', fontWeight:'800', color:'#0a1628'}}>{fmt(cat.total)}</span>
                        {cat.prev > 0 && (
                          <span style={{fontSize:'12px', fontWeight:'700', padding:'3px 10px', borderRadius:'999px', background: cat.change > 0 ? '#fef2f2' : '#f0fdf4', color: cat.change > 0 ? '#dc2626' : '#16a34a'}}>
                            {cat.change > 0 ? '+' : ''}{cat.change}%
                          </span>
                        )}
                      </div>
                    </div>
                    <div style={{height:'8px', background:'#e8f0fe', borderRadius:'999px', overflow:'hidden'}}>
                      <div style={{height:'100%', width:`${cat.pct}%`, background:cat.color, borderRadius:'999px'}}></div>
                    </div>
                    <p style={{fontSize:'12px', color:'#9ca3af', marginTop:'6px'}}>{cat.pct}% of total spending</p>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Mobile bottom tabs */}
      <div className="mobile-bottom-nav" style={{position:'fixed', bottom:0, left:0, right:0, background:'white', borderTop:'1px solid #e8f0fe', display:'none', padding:'8px 0 20px', zIndex:100}}>
        {TABS.map(tab => (
          <Link key={tab.href} href={tab.href} style={{flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:'4px', textDecoration:'none', padding:'4px 0'}}>
            <span style={{fontSize:'22px'}}>{tab.icon}</span>
            <span style={{fontSize:'11px', fontWeight: tab.active ? '700' : '500', color: tab.active ? '#1a56db' : '#9ca3af'}}>{tab.label}</span>
          </Link>
        ))}
      </div>

    </main>
  );
}