"use client";
import Link from "next/link";
import { supabase } from "./supabase";
import { useRouter } from "next/navigation";
import { useState } from "react";

function LogoutButton() {
  const router = useRouter();
  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };
  return (
    <button onClick={handleSignOut} style={{background:'#f3f4f6', border:'none', borderRadius:'10px', padding:'8px 16px', fontSize:'14px', color:'#6b7280', cursor:'pointer', fontWeight:'600'}}>
      Sign out
    </button>
  );
}

const TABS = [
  { href:'/', label:'Home', icon:'🏠', active:true },
  { href:'/calculator', label:'Calculator', icon:'💷' },
  { href:'/dashboard', label:'Dashboard', icon:'📊' },
  { href:'/settings', label:'Settings', icon:'⚙️' },
];

export default function Home() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <main className="min-h-screen bg-white">
      <style>{`
        @media (max-width: 640px) {
          .feature-grid { grid-template-columns: 1fr !important; }
          .stats-grid { grid-template-columns: 1fr !important; }
          .testimonial-grid { grid-template-columns: 1fr !important; }
          .preview-grid { grid-template-columns: repeat(2, 1fr) !important; }
          .hero-title { font-size: 36px !important; letter-spacing: -0.5px !important; }
          .hero-section { padding-top: 48px !important; padding-bottom: 48px !important; }
          .desktop-nav { display: none !important; }
          .mobile-menu-btn { display: flex !important; }
          .mobile-bottom-nav { display: flex !important; }
        }
        @media (min-width: 641px) {
          .mobile-menu-btn { display: none !important; }
          .mobile-menu { display: none !important; }
          .mobile-bottom-nav { display: none !important; }
        }
      `}</style>

      {/* Nav */}
      <nav style={{borderBottom: '1px solid #e8f0fe'}} className="px-4 py-4 bg-white sticky top-0 z-50">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div style={{background: 'linear-gradient(135deg, #1a56db, #0e3fa8)'}} className="w-8 h-8 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">T</span>
            </div>
            <span className="font-bold text-black text-lg tracking-tight">Takehome</span>
          </div>

          {/* Desktop nav */}
          <div className="desktop-nav" style={{display:'flex', alignItems:'center', gap:'12px'}}>
            <div style={{display:'flex', alignItems:'center', gap:'4px', background:'#f0f5ff', borderRadius:'12px', padding:'4px'}}>
              {TABS.map(tab => (
                <Link key={tab.href} href={tab.href} style={{display:'flex', alignItems:'center', gap:'6px', padding:'8px 16px', borderRadius:'9px', fontSize:'14px', fontWeight: tab.active ? '700' : '500', color: tab.active ? '#1a56db' : '#6b7280', background: tab.active ? 'white' : 'transparent', textDecoration:'none', boxShadow: tab.active ? '0 1px 4px rgba(26,86,219,0.12)' : 'none'}}>
                  <span>{tab.icon}</span>{tab.label}
                </Link>
              ))}
            </div>
            <Link href="/calculator" style={{background:'linear-gradient(135deg, #1a56db, #0e3fa8)', color:'white', padding:'10px 22px', borderRadius:'8px', fontSize:'14px', fontWeight:'600', textDecoration:'none', boxShadow:'0 2px 8px rgba(26,86,219,0.3)'}}>
              Get started free
            </Link>
            <LogoutButton />
          </div>

          {/* Mobile hamburger */}
          <button className="mobile-menu-btn" onClick={() => setMenuOpen(!menuOpen)}
            style={{background:'none', border:'none', cursor:'pointer', flexDirection:'column', gap:'5px', padding:'4px', display:'none'}}>
            <div style={{width:'22px', height:'2px', background:'#0a1628', borderRadius:'2px'}}></div>
            <div style={{width:'22px', height:'2px', background:'#0a1628', borderRadius:'2px'}}></div>
            <div style={{width:'22px', height:'2px', background:'#0a1628', borderRadius:'2px'}}></div>
          </button>
        </div>

        {/* Mobile dropdown menu */}
        {menuOpen && (
          <div className="mobile-menu" style={{borderTop:'1px solid #e8f0fe', marginTop:'12px', paddingTop:'12px'}}>
            {TABS.map(tab => (
              <Link key={tab.href} href={tab.href} onClick={() => setMenuOpen(false)}
                style={{display:'flex', alignItems:'center', gap:'10px', padding:'12px 16px', borderRadius:'10px', fontSize:'15px', fontWeight: tab.active ? '700' : '500', color: tab.active ? '#1a56db' : '#0a1628', background: tab.active ? '#f0f5ff' : 'transparent', textDecoration:'none', marginBottom:'4px'}}>
                <span>{tab.icon}</span>{tab.label}
              </Link>
            ))}
            <div style={{borderTop:'1px solid #e8f0fe', marginTop:'8px', paddingTop:'8px'}}>
              <LogoutButton />
            </div>
          </div>
        )}
      </nav>

      {/* Hero */}
      <section className="hero-section" style={{background: 'linear-gradient(160deg, #f0f5ff 0%, #ffffff 60%)', padding: '96px 24px 80px'}}>
        <div className="max-w-4xl mx-auto text-center">
          <div style={{display: 'inline-flex', alignItems: 'center', gap: '8px', background: '#e8f0fe', borderRadius: '999px', padding: '6px 16px', marginBottom: '28px'}}>
            <div style={{width: '8px', height: '8px', borderRadius: '50%', background: '#1a56db'}}></div>
            <span style={{fontSize: '13px', color: '#1a56db', fontWeight: '600'}}>Free · No sign up required · UK tax rates 2024/25</span>
          </div>
          <h1 className="hero-title" style={{fontSize: '58px', fontWeight: '800', lineHeight: '1.1', color: '#0a1628', letterSpacing: '-1.5px', marginBottom: '24px'}}>
            Know exactly what<br />
            <span style={{background: 'linear-gradient(135deg, #1a56db, #0e3fa8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'}}>lands in your pocket</span>
          </h1>
          <p style={{fontSize: '20px', color: '#4a5568', lineHeight: '1.7', maxWidth: '580px', margin: '0 auto 40px'}}>
            Takehome calculates your real after-tax salary, breaks down every deduction, and helps you build a budget that works for your life.
          </p>
          <div className="flex items-center justify-center gap-4 flex-wrap">
            <Link href="/calculator" style={{background: 'linear-gradient(135deg, #1a56db, #0e3fa8)', color: 'white', padding: '16px 36px', borderRadius: '12px', fontWeight: '700', fontSize: '17px', textDecoration: 'none', boxShadow: '0 4px 20px rgba(26,86,219,0.35)', display: 'inline-block'}}>
              Calculate my take-home
            </Link>
            <span style={{fontSize: '14px', color: '#718096'}}>Takes less than 30 seconds</span>
          </div>
        </div>

        {/* Mock preview card */}
        <div className="max-w-2xl mx-auto mt-16">
          <div style={{background: 'white', borderRadius: '20px', boxShadow: '0 20px 60px rgba(26,86,219,0.12)', border: '1px solid #e8f0fe', padding: '28px'}}>
            <p style={{fontSize: '13px', fontWeight: '600', color: '#718096', marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '0.5px'}}>Live preview</p>
            <div className="preview-grid" style={{display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '20px'}}>
              {[['Gross pay', '£2,917', '#0a1628'], ['Income tax', '-£384', '#0a1628'], ['Nat. Insurance', '-£243', '#0a1628'], ['Take-home', '£2,290', '#1a56db']].map(([label, value, color]) => (
                <div key={label} style={{background: '#f7f9ff', borderRadius: '12px', padding: '14px', textAlign: 'center'}}>
                  <p style={{fontSize: '11px', color: '#718096', marginBottom: '6px'}}>{label}</p>
                  <p style={{fontSize: '16px', fontWeight: '700', color}}>{value}</p>
                </div>
              ))}
            </div>
            <div style={{background: '#f7f9ff', borderRadius: '12px', padding: '16px'}}>
              <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '10px'}}>
                <span style={{fontSize: '13px', color: '#4a5568', fontWeight: '500'}}>Budget used</span>
                <span style={{fontSize: '13px', color: '#1a56db', fontWeight: '700'}}>68%</span>
              </div>
              <div style={{height: '8px', background: '#e2e8f0', borderRadius: '999px', overflow: 'hidden'}}>
                <div style={{height: '100%', width: '68%', background: 'linear-gradient(90deg, #1a56db, #4f83f7)', borderRadius: '999px'}}></div>
              </div>
              <div style={{display: 'flex', gap: '8px', marginTop: '14px', flexWrap: 'wrap'}}>
                {[['Housing', '£875'], ['Food', '£275'], ['Transport', '£184'], ['Savings', '£229']].map(([cat, amt]) => (
                  <div key={cat} style={{background: 'white', border: '1px solid #e8f0fe', borderRadius: '8px', padding: '6px 12px', fontSize: '12px', color: '#4a5568'}}>
                    {cat} · <span style={{fontWeight: '600', color: '#1a56db'}}>{amt}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats bar */}
      <section style={{background: 'linear-gradient(135deg, #1a56db, #0e3fa8)', padding: '28px 24px'}}>
        <div className="max-w-4xl mx-auto">
          <div className="stats-grid" style={{display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px', textAlign: 'center'}}>
            {[['100% Free', 'No hidden costs ever'], ['UK Accurate', '2024/25 tax rates'], ['Instant Results', 'No sign up needed']].map(([stat, label]) => (
              <div key={stat}>
                <p style={{fontSize: '22px', fontWeight: '800', color: 'white', marginBottom: '4px'}}>{stat}</p>
                <p style={{fontSize: '14px', color: 'rgba(255,255,255,0.75)'}}>{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <p style={{fontSize: '13px', fontWeight: '600', color: '#1a56db', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '12px'}}>Features</p>
            <h2 style={{fontSize: '38px', fontWeight: '800', color: '#0a1628', letterSpacing: '-0.5px'}}>Everything you need to understand your pay</h2>
          </div>
          <div className="feature-grid" style={{display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px'}}>
            {[
              { icon: "💷", title: "Accurate tax calculations", desc: "Up to date with the latest UK income tax bands and National Insurance rates for 2024/25." },
              { icon: "📊", title: "Visual budget planner", desc: "Drag sliders to allocate your take-home across categories like rent, food, savings and more." },
              { icon: "🏦", title: "Multiple income sources", desc: "Add salary, hourly, weekly or fortnightly pay. Even combine multiple jobs for a full picture." },
              { icon: "🎯", title: "Instant breakdown", desc: "See exactly how much goes to HMRC and how much lands in your pocket every month." },
              { icon: "📈", title: "Hourly rate converter", desc: "Enter your hourly rate and hours per week. We calculate your annual and monthly equivalent." },
              { icon: "✅", title: "Always free", desc: "No sign up, no subscription, no credit card. Takehome is completely free to use, forever." },
            ].map(f => (
              <div key={f.title} style={{background: 'white', border: '1px solid #e8f0fe', borderRadius: '16px', padding: '28px'}}
                onMouseEnter={e => e.currentTarget.style.boxShadow='0 8px 30px rgba(26,86,219,0.1)'}
                onMouseLeave={e => e.currentTarget.style.boxShadow='none'}>
                <div style={{fontSize: '32px', marginBottom: '16px'}}>{f.icon}</div>
                <h3 style={{fontSize: '16px', fontWeight: '700', color: '#0a1628', marginBottom: '8px'}}>{f.title}</h3>
                <p style={{fontSize: '14px', color: '#718096', lineHeight: '1.6'}}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section style={{background: '#f7f9ff', borderTop: '1px solid #e8f0fe', borderBottom: '1px solid #e8f0fe'}} className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <p style={{fontSize: '13px', fontWeight: '600', color: '#1a56db', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '12px'}}>Testimonials</p>
            <h2 style={{fontSize: '38px', fontWeight: '800', color: '#0a1628', letterSpacing: '-0.5px'}}>Trusted by people across the UK</h2>
          </div>
          <div className="testimonial-grid" style={{display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px'}}>
            {[
              { quote: "Finally a tool that just works. I checked my payslip against it and it was spot on.", name: "Sarah M.", role: "Marketing Manager, London" },
              { quote: "I use it every time I consider a new job offer. Helps me compare salaries properly.", name: "James T.", role: "Software Engineer, Manchester" },
              { quote: "The budget planner made me realise how much I was overspending on subscriptions!", name: "Priya K.", role: "Nurse, Birmingham" },
            ].map(t => (
              <div key={t.name} style={{background: 'white', border: '1px solid #e8f0fe', borderRadius: '16px', padding: '28px'}}>
                <div style={{fontSize: '24px', color: '#1a56db', marginBottom: '12px'}}>❝</div>
                <p style={{fontSize: '15px', color: '#4a5568', lineHeight: '1.7', marginBottom: '20px'}}>{t.quote}</p>
                <div style={{display: 'flex', alignItems: 'center', gap: '12px'}}>
                  <div style={{width: '40px', height: '40px', borderRadius: '50%', background: 'linear-gradient(135deg, #1a56db, #0e3fa8)', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                    <span style={{color: 'white', fontWeight: '700', fontSize: '16px'}}>{t.name[0]}</span>
                  </div>
                  <div>
                    <p style={{fontSize: '14px', fontWeight: '700', color: '#0a1628'}}>{t.name}</p>
                    <p style={{fontSize: '12px', color: '#718096'}}>{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{background: 'linear-gradient(160deg, #f0f5ff 0%, #ffffff 100%)'}} className="py-24 px-6 text-center">
        <div className="max-w-2xl mx-auto">
          <h2 style={{fontSize: '42px', fontWeight: '800', color: '#0a1628', letterSpacing: '-1px', marginBottom: '16px'}}>Ready to take control?</h2>
          <p style={{fontSize: '18px', color: '#718096', marginBottom: '36px'}}>No sign up. No credit card. Just clarity about your money.</p>
          <Link href="/calculator" style={{background: 'linear-gradient(135deg, #1a56db, #0e3fa8)', color: 'white', padding: '18px 44px', borderRadius: '14px', fontWeight: '700', fontSize: '18px', textDecoration: 'none', boxShadow: '0 4px 24px rgba(26,86,219,0.35)', display: 'inline-block'}}>
            Calculate my take-home
          </Link>
          <p style={{fontSize: '13px', color: '#a0aec0', marginTop: '16px'}}>Free forever · UK tax rates · No account needed</p>
        </div>
      </section>

      {/* Footer */}
      <footer style={{borderTop: '1px solid #e8f0fe', padding: '32px 24px 100px'}}>
        <div className="max-w-6xl mx-auto flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <div style={{background: 'linear-gradient(135deg, #1a56db, #0e3fa8)'}} className="w-7 h-7 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xs">T</span>
            </div>
            <span className="font-bold text-black">Takehome</span>
          </div>
          <p style={{fontSize: '13px', color: '#a0aec0'}}>© 2026 Takehome · Built for UK residents · Tax calculations are estimates only</p>
        </div>
      </footer>

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