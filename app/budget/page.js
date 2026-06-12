'use client';
import { useState, useEffect, useRef } from 'react';
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
  { href: '/settings', label: 'Settings', icon: '⚙️' },
];

const SUGGESTED_PROMPTS = [
  "I want to save £500/month and still have fun money",
  "Help me budget to pay off my credit card in 6 months",
  "I want to buy a house in 2 years, how should I budget?",
  "I'm living paycheck to paycheck, help me fix it",
  "I want to build a 3 month emergency fund",
];

export default function BudgetPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [context, setContext] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push('/login'); return; }
      setUser(user);

      // Load user's financial context
      const [{ data: settings }, { data: bills }, { data: txns }] = await Promise.all([
        supabase.from('budget_settings').select('*').eq('user_id', user.id).single(),
        supabase.from('bills').select('*').eq('user_id', user.id).eq('is_active', true),
        supabase.from('transactions').select('*').eq('user_id', user.id).order('date', { ascending: false }).limit(60),
      ]);

      const monthlyBills = bills ? bills.reduce((s, b) => s + parseFloat(b.amount), 0) : 0;
      const avgMonthlySpend = txns && txns.length > 0
        ? txns.reduce((s, t) => s + parseFloat(t.amount), 0) / Math.max(1, new Set(txns.map(t => t.date.slice(0, 7))).size)
        : 0;

      setContext({
        netPay: settings?.net_pay || 0,
        bills: bills || [],
        monthlyBills,
        avgMonthlySpend: Math.round(avgMonthlySpend),
        name: user.user_metadata?.full_name?.split(' ')[0] || 'there',
      });

      setMessages([{
        role: 'assistant',
        content: `Hi ${user.user_metadata?.full_name?.split(' ')[0] || 'there'}! 👋 I'm your personal budget assistant.\n\nI can see you have a monthly take-home of **£${settings?.net_pay || 0}**${bills && bills.length > 0 ? ` and **${bills.length} recurring bills** totalling **£${monthlyBills.toFixed(2)}/mo**` : ''}.\n\nTell me what you're trying to achieve — whether that's saving for something specific, paying off debt, or just getting a clearer picture of where your money should go. I'll build you a personalised budget plan.`,
        isIntro: true,
      }]);

      setPageLoading(false);
    };
    init();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  const sendMessage = async (messageText) => {
    const text = messageText || input.trim();
    if (!text || loading) return;
    setInput('');
    setLoading(true);

    const userMessage = { role: 'user', content: text };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);

    try {
      const systemPrompt = `You are a friendly, expert UK personal finance budget advisor inside the Takehome app. 

The user's financial context:
- Monthly take-home pay: £${context?.netPay || 'unknown'}
- Recurring bills: ${context?.bills?.length > 0 ? context.bills.map(b => `${b.name} £${b.amount}/mo`).join(', ') : 'none set'}
- Total monthly bills: £${context?.monthlyBills || 0}
- Average monthly spending (from transaction history): £${context?.avgMonthlySpend || 0}
- Disposable income after bills: £${Math.max(0, (context?.netPay || 0) - (context?.monthlyBills || 0))}

Your job is to create personalised, actionable UK budget plans. Always:
1. Start with a brief empathetic response to their goal
2. Show a clear budget breakdown table with categories, £ amounts per month, and % of take-home
3. Give 3-5 specific, practical saving tips tailored to their situation
4. Use UK context (£, ISA, council tax, etc.)
5. Be encouraging and realistic — don't suggest impossible cuts
6. Format your response clearly with headers and the breakdown in a readable way
7. If their take-home is 0 or unknown, ask them to set it on the dashboard first

Keep responses focused and actionable. Use markdown formatting with **bold** for key numbers.`;

      const conversationMessages = newMessages
        .filter(m => !m.isIntro)
        .map(m => ({ role: m.role, content: m.content }));

      if (conversationMessages.length === 0 || conversationMessages[0].role !== 'user') {
        conversationMessages.push({ role: 'user', content: text });
      }

      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-6',
          max_tokens: 1000,
          system: systemPrompt,
          messages: conversationMessages,
        }),
      });

      const data = await response.json();
      const reply = data.content?.[0]?.text || 'Sorry, I could not generate a response. Please try again.';

      setMessages(prev => [...prev, { role: 'assistant', content: reply }]);
    } catch (err) {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, something went wrong. Please try again.' }]);
    }
    setLoading(false);
  };

  const formatMessage = (text) => {
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/^### (.*)/gm, '<h4 style="font-size:14px;font-weight:800;color:#0a1628;margin:16px 0 8px">$1</h4>')
      .replace(/^## (.*)/gm, '<h3 style="font-size:16px;font-weight:800;color:#0a1628;margin:16px 0 8px">$1</h3>')
      .replace(/^# (.*)/gm, '<h2 style="font-size:18px;font-weight:800;color:#0a1628;margin:16px 0 8px">$1</h2>')
      .replace(/^- (.*)/gm, '<div style="display:flex;gap:8px;margin:4px 0"><span style="color:#1a56db;flex-shrink:0">•</span><span>$1</span></div>')
      .replace(/\n\n/g, '<br/><br/>')
      .replace(/\n/g, '<br/>');
  };

  if (pageLoading) return (
    <div style={{minHeight:'100vh', background:'#f7f9ff', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'Inter, sans-serif'}}>
      <div style={{textAlign:'center'}}>
        <div style={{width:'48px', height:'48px', borderRadius:'14px', background:'linear-gradient(135deg, #1a56db, #0e3fa8)', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 16px'}}>
          <span style={{color:'white', fontWeight:'800', fontSize:'22px'}}>T</span>
        </div>
        <p style={{color:'#6b7280', fontSize:'15px', fontWeight:'500'}}>Loading your budget assistant...</p>
      </div>
    </div>
  );

  return (
    <div style={{minHeight:'100vh', background:'#f7f9ff', fontFamily:'Inter, sans-serif', display:'flex', flexDirection:'column'}}>
      <style>{`
        @media(max-width:640px){
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
      <nav style={{borderBottom:'1px solid #e8f0fe', background:'white', padding:'0 16px', position:'sticky', top:0, zIndex:50}}>
        <div style={{maxWidth:'72rem', margin:'0 auto', display:'flex', alignItems:'center', justifyContent:'space-between', height:64}}>
          <Link href="/" style={{display:'flex', alignItems:'center', gap:8, textDecoration:'none'}}>
            <div style={{background:'linear-gradient(135deg, #1a56db, #0e3fa8)', width:32, height:32, borderRadius:8, display:'flex', alignItems:'center', justifyContent:'center'}}>
              <span style={{color:'white', fontWeight:800, fontSize:14}}>T</span>
            </div>
            <span style={{fontWeight:800, color:'#0a1628', fontSize:18, letterSpacing:'-0.3px'}}>Takehome</span>
          </Link>
          <div className="desktop-nav" style={{display:'flex', alignItems:'center', gap:12}}>
            <div style={{display:'flex', alignItems:'center', gap:4, background:'#f0f5ff', borderRadius:12, padding:4}}>
              {NAV_TABS.map(tab => (
                <Link key={tab.href} href={tab.href} style={{display:'flex', alignItems:'center', gap:6, padding:'8px 16px', borderRadius:9, fontSize:14, fontWeight: tab.href === '/budget' ? 700 : 500, color: tab.href === '/budget' ? '#1a56db' : '#6b7280', background: tab.href === '/budget' ? 'white' : 'transparent', textDecoration:'none', boxShadow: tab.href === '/budget' ? '0 1px 4px rgba(26,86,219,0.12)' : 'none'}}>
                  <span>{tab.icon}</span>{tab.label}
                </Link>
              ))}
            </div>
            <button onClick={handleSignOut} style={{background:'#f3f4f6', border:'none', borderRadius:10, padding:'8px 16px', fontSize:14, color:'#6b7280', cursor:'pointer', fontWeight:600}}>
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
            {NAV_TABS.map(tab => (
              <Link key={tab.href} href={tab.href} onClick={() => setMenuOpen(false)}
                style={{display:'flex', alignItems:'center', gap:'10px', padding:'12px 16px', borderRadius:'10px', fontSize:'15px', fontWeight: tab.href === '/budget' ? '700' : '500', color: tab.href === '/budget' ? '#1a56db' : '#0a1628', background: tab.href === '/budget' ? '#f0f5ff' : 'transparent', textDecoration:'none', marginBottom:'4px'}}>
                <span>{tab.icon}</span>{tab.label}
              </Link>
            ))}
            <div style={{borderTop:'1px solid #e8f0fe', marginTop:'8px', paddingTop:'8px'}}>
              <button onClick={handleSignOut} style={{background:'#f3f4f6', border:'none', borderRadius:'10px', padding:'8px 16px', fontSize:'14px', color:'#6b7280', cursor:'pointer', fontWeight:'600'}}>Sign out</button>
            </div>
          </div>
        )}
      </nav>

      {/* Page header */}
      <div style={{maxWidth:'800px', margin:'0 auto', padding:'32px 16px 0', width:'100%'}}>
        <p style={{fontSize:'13px', fontWeight:'600', color:'#1a56db', textTransform:'uppercase', letterSpacing:'1px', marginBottom:'6px'}}>AI Assistant</p>
        <h1 style={{fontSize:'32px', fontWeight:'800', color:'#0a1628', letterSpacing:'-0.5px', marginBottom:'6px'}}>Budget Planner</h1>
        <p style={{fontSize:'15px', color:'#6b7280', marginBottom:'24px'}}>Describe your goals and get a personalised budget plan</p>

        {/* Context pill */}
        {context?.netPay > 0 && (
          <div style={{display:'flex', gap:8, flexWrap:'wrap', marginBottom:'24px'}}>
            <span style={{background:'#f0f5ff', color:'#1a56db', fontSize:'12px', fontWeight:'600', padding:'6px 12px', borderRadius:'20px', border:'1px solid #e8f0fe'}}>
              💰 Take-home: £{context.netPay}/mo
            </span>
            {context.monthlyBills > 0 && (
              <span style={{background:'#f0f5ff', color:'#1a56db', fontSize:'12px', fontWeight:'600', padding:'6px 12px', borderRadius:'20px', border:'1px solid #e8f0fe'}}>
                🧾 Bills: £{context.monthlyBills.toFixed(0)}/mo
              </span>
            )}
            <span style={{background:'#f0fdf4', color:'#16a34a', fontSize:'12px', fontWeight:'600', padding:'6px 12px', borderRadius:'20px', border:'1px solid #bbf7d0'}}>
              💵 Disposable: £{Math.max(0, context.netPay - context.monthlyBills).toFixed(0)}/mo
            </span>
          </div>
        )}
      </div>

      {/* Chat area */}
      <div style={{maxWidth:'800px', margin:'0 auto', padding:'0 16px', width:'100%', flex:1, display:'flex', flexDirection:'column', paddingBottom:'180px'}}>

        {/* Messages */}
        <div style={{display:'flex', flexDirection:'column', gap:'16px', marginBottom:'16px'}}>
          {messages.map((msg, i) => (
            <div key={i} style={{display:'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start'}}>
              {msg.role === 'assistant' && (
                <div style={{width:32, height:32, borderRadius:10, background:'linear-gradient(135deg, #1a56db, #0e3fa8)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, marginRight:10, marginTop:4}}>
                  <span style={{color:'white', fontWeight:800, fontSize:14}}>T</span>
                </div>
              )}
              <div style={{
                maxWidth:'85%',
                background: msg.role === 'user' ? 'linear-gradient(135deg, #1a56db, #0e3fa8)' : 'white',
                color: msg.role === 'user' ? 'white' : '#0a1628',
                border: msg.role === 'user' ? 'none' : '1px solid #e8f0fe',
                borderRadius: msg.role === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                padding:'14px 18px',
                fontSize:'14px',
                lineHeight:'1.6',
                boxShadow: msg.role === 'assistant' ? '0 2px 8px rgba(26,86,219,0.04)' : 'none',
              }}
                dangerouslySetInnerHTML={{ __html: formatMessage(msg.content) }}
              />
            </div>
          ))}

          {loading && (
            <div style={{display:'flex', alignItems:'flex-start', gap:10}}>
              <div style={{width:32, height:32, borderRadius:10, background:'linear-gradient(135deg, #1a56db, #0e3fa8)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0}}>
                <span style={{color:'white', fontWeight:800, fontSize:14}}>T</span>
              </div>
              <div style={{background:'white', border:'1px solid #e8f0fe', borderRadius:'16px 16px 16px 4px', padding:'14px 18px', boxShadow:'0 2px 8px rgba(26,86,219,0.04)'}}>
                <div style={{display:'flex', gap:4, alignItems:'center'}}>
                  {[0,1,2].map(i => (
                    <div key={i} style={{width:8, height:8, borderRadius:'50%', background:'#1a56db', animation:`bounce 1.2s ${i*0.2}s infinite`, opacity:0.7}}></div>
                  ))}
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Suggested prompts — only show before first user message */}
        {messages.filter(m => m.role === 'user').length === 0 && (
          <div style={{marginBottom:'16px'}}>
            <p style={{fontSize:'12px', color:'#9ca3af', fontWeight:'600', textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:'10px'}}>Try asking...</p>
            <div style={{display:'flex', flexWrap:'wrap', gap:'8px'}}>
              {SUGGESTED_PROMPTS.map((prompt, i) => (
                <button key={i} onClick={() => sendMessage(prompt)}
                  style={{background:'white', border:'1px solid #e8f0fe', borderRadius:'20px', padding:'8px 16px', fontSize:'13px', color:'#1a56db', cursor:'pointer', fontWeight:'500', boxShadow:'0 1px 4px rgba(26,86,219,0.06)', textAlign:'left'}}>
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Input bar — fixed at bottom */}
      <div style={{position:'fixed', bottom:0, left:0, right:0, background:'white', borderTop:'1px solid #e8f0fe', padding:'16px', zIndex:100}}>
        <div style={{maxWidth:'800px', margin:'0 auto', display:'flex', gap:'12px', alignItems:'flex-end'}}>
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }}}
            placeholder="Describe your budget goal... (e.g. I want to save £400/month and go on holiday in December)"
            rows={2}
            style={{flex:1, border:'1px solid #e8f0fe', borderRadius:'12px', padding:'12px 16px', fontSize:'14px', color:'#0a1628', outline:'none', resize:'none', fontFamily:'Inter, sans-serif', lineHeight:'1.5', boxSizing:'border-box'}}
          />
          <button
            onClick={() => sendMessage()}
            disabled={loading || !input.trim()}
            style={{background:'linear-gradient(135deg, #1a56db, #0e3fa8)', color:'white', border:'none', borderRadius:'12px', padding:'12px 20px', fontSize:'14px', fontWeight:'700', cursor: loading || !input.trim() ? 'not-allowed' : 'pointer', opacity: loading || !input.trim() ? 0.6 : 1, whiteSpace:'nowrap', boxShadow:'0 4px 12px rgba(26,86,219,0.3)', flexShrink:0}}>
            Send →
          </button>
        </div>
        <p style={{maxWidth:'800px', margin:'8px auto 0', fontSize:'11px', color:'#9ca3af', textAlign:'center'}}>Press Enter to send · Shift+Enter for new line</p>
      </div>

      <style>{`
        @keyframes bounce {
          0%, 60%, 100% { transform: translateY(0); }
          30% { transform: translateY(-6px); }
        }
      `}</style>

    </div>
  );
}