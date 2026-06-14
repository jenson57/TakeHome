"use client";
import Calculator from "../Calculator";
import Link from "next/link";
import { supabase } from "../supabase";
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
  { href:'/', label:'Home', icon:'🏠' },
  { href:'/calculator', label:'Calculator', icon:'💷', active:true },
  { href:'/dashboard', label:'Dashboard', icon:'📊' },
  { href:'/analytics', label:'Analytics', icon:'📈' },
  { href:'/bills', label:'Bills', icon:'🧾' },
  { href:'/budget', label:'Budget', icon:'💬' },
  { href: '/debt', label: 'Debt', icon: '💳' },
  { href:'/settings', label:'Settings', icon:'⚙️' },
];

export default function CalculatorPage() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <main className="min-h-screen" style={{background:'#f7f9ff'}}>
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
        * { box-sizing: border-box; }
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
            <LogoutButton />
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
              <LogoutButton />
            </div>
          </div>
        )}
      </nav>

      <div className="max-w-2xl mx-auto px-4 py-10" style={{paddingBottom:'100px'}}>
        <p style={{fontSize:'13px', fontWeight:'600', color:'#1a56db', textTransform:'uppercase', letterSpacing:'1px', marginBottom:'6px'}}>UK Tax Calculator</p>
        <h1 style={{fontSize:'32px', fontWeight:'800', color:'#0a1628', letterSpacing:'-0.5px', marginBottom:'6px'}}>Take-home Pay</h1>
        <p style={{fontSize:'15px', color:'#6b7280', marginBottom:'32px'}}>Based on 2024/25 UK tax rates · Income tax + National Insurance</p>
        <Calculator />
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