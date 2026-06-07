"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { supabase } from "../supabase";
import { useRouter } from "next/navigation";

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

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [netPay, setNetPay] = useState(0);
  const [transactions, setTransactions] = useState([]);
  const [alertSettings, setAlertSettings] = useState(null);
  const [form, setForm] = useState({ date: "", description: "", amount: "", category: "" });
  const [editingId, setEditingId] = useState(null);
  const [filterCat, setFilterCat] = useState("All");
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const router = useRouter();

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

  const filtered = filterCat === "All" ? transactions : transactions.filter(t => t.category === filterCat);
  const sorted = [...filtered].sort((a, b) => new Date(b.date) - new Date(a.date));

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

  if (loading) return (
    <main className="min-h-screen" style={{background:'#f7f9ff', display:'flex', alignItems:'center', justifyContent:'center'}}>
      <div style={{textAlign:'center'}}>
        <div style={{width:'48px', height:'48px', borderRadius:'14px', background:'linear-gradient(135deg, #1a56db, #0e3fa8)', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 16px'}}>
          <span style={{color:'white', fontWeight:'800', fontSize:'22px'}}>T</span>
        </div>
        <p style={{color:'#6b7280', fontSize:'15px', fontWeight:'500'}}>Loading your dashboard...</p>
      </div>
      {/* Mobile bottom tabs */}
      <div style={{position:'fixed', bottom:0, left:0, right:0, background:'white', borderTop:'1px solid #e8f0fe', display:'flex', padding:'8px 0 20px', zIndex:100}} className="mobile-bottom-nav">
        <style>{`.mobile-bottom-nav{display:none!important} @media(max-width:640px){.mobile-bottom-nav{display:flex!important}}`}</style>
        {[
          { href:'/', label:'Home', icon:'🏠' },
          { href:'/calculator', label:'Calculator', icon:'💷' },
          { href:'/dashboard', label:'Dashboard', icon:'📊', active:true },
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

  return (
    <main className="min-h-screen" style={{background: '#f7f9ff'}}>
      <style>{`@media(max-width:640px){.dash-grid{grid-template-columns:1fr!important}.summary-grid{grid-template-columns:1fr 1fr!important}.header-row{flex-direction:column!important;align-items:flex-start!important}.form-grid{grid-template-columns:1fr!important}}`}</style>

      {/* Nav */}
      <nav style={{borderBottom:'1px solid #e8f0fe', background:'white'}} className="px-4 py-4 sticky top-0 z-50">
        <style>{`
          @media(max-width:640px){
            .desktop-nav{display:none!important}
            .mobile-menu-btn{display:flex!important}
          }
          @media(min-width:641px){
            .mobile-menu-btn{display:none!important}
            .mobile-menu{display:none!important}
          }
        `}</style>
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
            style={{background:'none', border:'none', cursor:'pointer', flexDirection:'column', gap:'5px', padding:'4px'}}>
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

      <div className="max-w-6xl mx-auto px-4 py-10" style={{paddingBottom:'100px'}}>

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
            <p style={{fontSize:'15px', color:'#6b7280'}}>Welcome back, {user?.email}</p>
          </div>
          <div style={{display:'flex', alignItems:'center', gap:'12px', flexWrap:'wrap'}}>
            <div style={{display:'flex', alignItems:'center', gap:'8px', background:'white', border:'1px solid #e8f0fe', borderRadius:'12px', padding:'10px 16px', boxShadow:'0 2px 8px rgba(26,86,219,0.06)'}}>
              <span style={{fontSize:'13px', color:'#6b7280', fontWeight:'500'}}>Monthly take-home</span>
              <div style={{display:'flex', alignItems:'center', gap:'4px'}}>
                <span style={{color:'#1a56db', fontSize:'15px', fontWeight:'700'}}>£</span>
                <input type="number" value={netPay} onChange={e => setNetPay(parseFloat(e.target.value) || 0)}
                  style={{width:'75px', border:'none', outline:'none', fontSize:'15px', fontWeight:'700', color:'#0a1628'}} />
              </div>
            </div>
            <button onClick={() => { setShowForm(true); setEditingId(null); setForm({ date:"", description:"", amount:"", category:"" }); }}
              style={{background:'linear-gradient(135deg, #1a56db, #0e3fa8)', color:'white', padding:'12px 22px', borderRadius:'12px', fontSize:'14px', fontWeight:'700', border:'none', cursor:'pointer', boxShadow:'0 4px 12px rgba(26,86,219,0.3)'}}>
              + Add transaction
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

        {/* Category breakdown + pie chart */}
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
              : <div style={{display:'flex', gap:'20px', alignItems:'center', flexWrap:'wrap'}}>
                  <svg viewBox="0 0 200 200" style={{width:'170px', height:'170px', flexShrink:0}}>
                    {pieSlices.map((s, i) => <path key={i} d={s.d} fill={s.color} />)}
                    <circle cx="100" cy="100" r="52" fill="white" />
                    <text x="100" y="95" textAnchor="middle" fontSize="12" fill="#0a1628" fontWeight="800">{fmt(totalSpent)}</text>
                    <text x="100" y="112" textAnchor="middle" fontSize="10" fill="#6b7280">total spent</text>
                  </svg>
                  <div style={{display:'flex', flexDirection:'column', gap:'10px', flex:1}}>
                    {pieSlices.map((s, i) => (
                      <div key={i} style={{display:'flex', alignItems:'center', gap:'10px'}}>
                        <div style={{width:'10px', height:'10px', borderRadius:'3px', background:s.color, flexShrink:0}}></div>
                        <span style={{fontSize:'13px', color:'#4a5568', flex:1}}>{s.name}</span>
                        <span style={{fontSize:'13px', fontWeight:'700', color:'#0a1628'}}>{s.pct}%</span>
                      </div>
                    ))}
                  </div>
                </div>
            }
          </div>
        </div>

        {/* Transactions */}
        <div style={{background:'white', border:'1px solid #e8f0fe', borderRadius:'16px', padding:'24px', boxShadow:'0 2px 8px rgba(26,86,219,0.04)'}}>
          <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'20px', flexWrap:'wrap', gap:'12px'}}>
            <div>
              <p style={{fontSize:'13px', fontWeight:'600', color:'#1a56db', textTransform:'uppercase', letterSpacing:'1px', marginBottom:'4px'}}>History</p>
              <h2 style={{fontSize:'18px', fontWeight:'800', color:'#0a1628'}}>Transactions</h2>
            </div>
            <select value={filterCat} onChange={e => setFilterCat(e.target.value)}
              style={{border:'1px solid #e8f0fe', borderRadius:'10px', padding:'8px 14px', fontSize:'13px', color:'#0a1628', background:'white', fontWeight:'500', outline:'none'}}>
              <option value="All">All categories</option>
              {CATEGORIES.map(c => <option key={c.name} value={c.name}>{c.icon} {c.name}</option>)}
            </select>
          </div>
          {sorted.length === 0
            ? <div style={{textAlign:'center', padding:'40px 0'}}>
                <p style={{fontSize:'32px', marginBottom:'12px'}}>🧾</p>
                <p style={{color:'#9ca3af', fontSize:'15px', fontWeight:'500'}}>No transactions yet</p>
                <p style={{color:'#c4c9d4', fontSize:'13px', marginTop:'4px'}}>Click "Add transaction" to get started</p>
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
    </main>
  );
}