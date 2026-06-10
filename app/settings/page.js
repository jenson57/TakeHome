"use client";
import { useState, useEffect } from "react";
import { supabase } from "../supabase";
import { useRouter } from "next/navigation";
import Link from "next/link";

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
{ href:'/calculator', label:'Calculator', icon:'💷' },
{ href:'/dashboard', label:'Dashboard', icon:'📊' },
{ href:'/analytics', label:'Analytics', icon:'📈' },
{ href: '/bills', label: 'Bills', icon: '🧾' },
{ href:'/settings', label:'Settings', icon:'⚙️' , active:true},
];

export default function Settings() {
  const [user, setUser] = useState(null);
  const [email, setEmail] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [emailMessage, setEmailMessage] = useState("");
  const [emailError, setEmailError] = useState("");
  const [passwordMessage, setPasswordMessage] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [emailLoading, setEmailLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [spendingAlert, setSpendingAlert] = useState(true);
  const [savingsAlert, setSavingsAlert] = useState(true);
  const [savingsGoal, setSavingsGoal] = useState(0);
  const [savingsCategory, setSavingsCategory] = useState("Savings");
  const [alertMessage, setAlertMessage] = useState("");
  const [alertLoading, setAlertLoading] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }
      setUser(user);
      setEmail(user.email);
      const { data: alerts } = await supabase.from("alert_settings").select("*").eq("user_id", user.id).single();
      if (alerts) {
        setSpendingAlert(alerts.spending_alert);
        setSavingsAlert(alerts.savings_alert);
        setSavingsGoal(alerts.savings_goal);
        setSavingsCategory(alerts.savings_category);
      }
    };
    init();
  }, []);

  const handleEmailUpdate = async () => {
    setEmailLoading(true);
    setEmailError("");
    setEmailMessage("");
    if (!newEmail) { setEmailError("Please enter a new email address"); setEmailLoading(false); return; }
    const { error } = await supabase.auth.updateUser({ email: newEmail });
    if (error) setEmailError(error.message);
    else setEmailMessage("Confirmation sent to your new email address. Click the link to confirm the change.");
    setEmailLoading(false);
  };

  const handlePasswordUpdate = async () => {
    setPasswordLoading(true);
    setPasswordError("");
    setPasswordMessage("");
    if (!newPassword) { setPasswordError("Please enter a new password"); setPasswordLoading(false); return; }
    if (newPassword !== confirmPassword) { setPasswordError("Passwords don't match"); setPasswordLoading(false); return; }
    if (newPassword.length < 6) { setPasswordError("Password must be at least 6 characters"); setPasswordLoading(false); return; }
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) setPasswordError(error.message);
    else { setPasswordMessage("Password updated successfully!"); setNewPassword(""); setConfirmPassword(""); }
    setPasswordLoading(false);
  };

  const handleAlertSave = async () => {
    if (!user) return;
    setAlertLoading(true);
    setAlertMessage("");
    const { error } = await supabase.from("alert_settings").upsert({
      user_id: user.id,
      spending_alert: spendingAlert,
      savings_alert: savingsAlert,
      savings_goal: savingsGoal,
      savings_category: savingsCategory,
    }, { onConflict: "user_id" });
    if (error) setAlertMessage("Error saving alerts — please try again.");
    else setAlertMessage("Alert settings saved!");
    setAlertLoading(false);
  };

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
        body { overflow-x: hidden; }
        main { overflow-x: hidden; max-width: 100vw; }
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
          <div className="desktop-nav" style={{display:'flex', alignItems:'center', gap:'12px', flexShrink:0}}>
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

      <div className="max-w-2xl mx-auto px-4 py-10" style={{paddingBottom:'160px'}}>

        {/* Header */}
        <div style={{marginBottom:'32px'}}>
          <p style={{fontSize:'13px', fontWeight:'600', color:'#1a56db', textTransform:'uppercase', letterSpacing:'1px', marginBottom:'6px'}}>Account</p>
          <h1 style={{fontSize:'32px', fontWeight:'800', color:'#0a1628', letterSpacing:'-0.5px', marginBottom:'6px'}}>Settings</h1>
          <p style={{fontSize:'15px', color:'#6b7280'}}>Manage your account details, security and alerts</p>
        </div>

        {/* Account info */}
        <div style={{background:'white', border:'1px solid #e8f0fe', borderRadius:'16px', padding:'24px', marginBottom:'24px', boxShadow:'0 2px 8px rgba(26,86,219,0.04)'}}>
          <div style={{display:'flex', alignItems:'center', gap:'16px'}}>
            <div style={{width:'52px', height:'52px', borderRadius:'14px', background:'linear-gradient(135deg, #1a56db, #0e3fa8)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0}}>
              <span style={{color:'white', fontWeight:'800', fontSize:'22px'}}>{email ? email[0].toUpperCase() : '?'}</span>
            </div>
            <div>
              <p style={{fontSize:'16px', fontWeight:'700', color:'#0a1628', marginBottom:'2px'}}>{email}</p>
              <p style={{fontSize:'13px', color:'#9ca3af'}}>Takehome account</p>
            </div>
          </div>
        </div>

        {/* Change email */}
        <div style={{background:'white', border:'1px solid #e8f0fe', borderRadius:'16px', padding:'24px', marginBottom:'24px', boxShadow:'0 2px 8px rgba(26,86,219,0.04)'}}>
          <p style={{fontSize:'13px', fontWeight:'600', color:'#1a56db', textTransform:'uppercase', letterSpacing:'1px', marginBottom:'4px'}}>Email</p>
          <h2 style={{fontSize:'18px', fontWeight:'800', color:'#0a1628', marginBottom:'20px'}}>Change email address</h2>
          <div style={{display:'flex', flexDirection:'column', gap:'16px', marginBottom:'20px'}}>
            <div>
              <label style={{fontSize:'13px', fontWeight:'600', color:'#374151', display:'block', marginBottom:'8px'}}>Current email</label>
              <input type="email" value={email} disabled style={{width:'100%', border:'1px solid #e8f0fe', borderRadius:'10px', padding:'12px 16px', fontSize:'15px', color:'#9ca3af', background:'#f9fafb', boxSizing:'border-box'}} />
            </div>
            <div>
              <label style={{fontSize:'13px', fontWeight:'600', color:'#374151', display:'block', marginBottom:'8px'}}>New email address</label>
              <input type="email" placeholder="new@example.com" value={newEmail} onChange={e => setNewEmail(e.target.value)} style={{width:'100%', border:'1px solid #e8f0fe', borderRadius:'10px', padding:'12px 16px', fontSize:'15px', color:'#0a1628', outline:'none', boxSizing:'border-box'}} />
            </div>
          </div>
          {emailError && <div style={{background:'#fef2f2', border:'1px solid #fecaca', borderRadius:'10px', padding:'12px 16px', marginBottom:'16px'}}><p style={{fontSize:'14px', color:'#dc2626', fontWeight:'500'}}>{emailError}</p></div>}
          {emailMessage && <div style={{background:'#f0fdf4', border:'1px solid #bbf7d0', borderRadius:'10px', padding:'12px 16px', marginBottom:'16px'}}><p style={{fontSize:'14px', color:'#16a34a', fontWeight:'500'}}>{emailMessage}</p></div>}
          <button onClick={handleEmailUpdate} disabled={emailLoading} style={{background:'linear-gradient(135deg, #1a56db, #0e3fa8)', color:'white', padding:'12px 28px', borderRadius:'10px', fontSize:'14px', fontWeight:'700', border:'none', cursor: emailLoading ? 'not-allowed' : 'pointer', opacity: emailLoading ? 0.7 : 1, boxShadow:'0 2px 8px rgba(26,86,219,0.25)'}}>
            {emailLoading ? "Updating..." : "Update email"}
          </button>
        </div>

        {/* Change password */}
        <div style={{background:'white', border:'1px solid #e8f0fe', borderRadius:'16px', padding:'24px', marginBottom:'24px', boxShadow:'0 2px 8px rgba(26,86,219,0.04)'}}>
          <p style={{fontSize:'13px', fontWeight:'600', color:'#1a56db', textTransform:'uppercase', letterSpacing:'1px', marginBottom:'4px'}}>Security</p>
          <h2 style={{fontSize:'18px', fontWeight:'800', color:'#0a1628', marginBottom:'20px'}}>Change password</h2>
          <div style={{display:'flex', flexDirection:'column', gap:'16px', marginBottom:'20px'}}>
            <div>
              <label style={{fontSize:'13px', fontWeight:'600', color:'#374151', display:'block', marginBottom:'8px'}}>New password</label>
              <input type="password" placeholder="••••••••" value={newPassword} onChange={e => setNewPassword(e.target.value)} style={{width:'100%', border:'1px solid #e8f0fe', borderRadius:'10px', padding:'12px 16px', fontSize:'15px', color:'#0a1628', outline:'none', boxSizing:'border-box'}} />
            </div>
            <div>
              <label style={{fontSize:'13px', fontWeight:'600', color:'#374151', display:'block', marginBottom:'8px'}}>Confirm new password</label>
              <input type="password" placeholder="••••••••" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} style={{width:'100%', border:'1px solid #e8f0fe', borderRadius:'10px', padding:'12px 16px', fontSize:'15px', color:'#0a1628', outline:'none', boxSizing:'border-box'}} />
            </div>
          </div>
          {passwordError && <div style={{background:'#fef2f2', border:'1px solid #fecaca', borderRadius:'10px', padding:'12px 16px', marginBottom:'16px'}}><p style={{fontSize:'14px', color:'#dc2626', fontWeight:'500'}}>{passwordError}</p></div>}
          {passwordMessage && <div style={{background:'#f0fdf4', border:'1px solid #bbf7d0', borderRadius:'10px', padding:'12px 16px', marginBottom:'16px'}}><p style={{fontSize:'14px', color:'#16a34a', fontWeight:'500'}}>{passwordMessage}</p></div>}
          <button onClick={handlePasswordUpdate} disabled={passwordLoading} style={{background:'linear-gradient(135deg, #1a56db, #0e3fa8)', color:'white', padding:'12px 28px', borderRadius:'10px', fontSize:'14px', fontWeight:'700', border:'none', cursor: passwordLoading ? 'not-allowed' : 'pointer', opacity: passwordLoading ? 0.7 : 1, boxShadow:'0 2px 8px rgba(26,86,219,0.25)'}}>
            {passwordLoading ? "Updating..." : "Update password"}
          </button>
        </div>

        {/* Alert settings */}
        <div style={{background:'white', border:'1px solid #e8f0fe', borderRadius:'16px', padding:'24px', marginBottom:'24px', boxShadow:'0 2px 8px rgba(26,86,219,0.04)'}}>
          <p style={{fontSize:'13px', fontWeight:'600', color:'#1a56db', textTransform:'uppercase', letterSpacing:'1px', marginBottom:'4px'}}>Alerts</p>
          <h2 style={{fontSize:'18px', fontWeight:'800', color:'#0a1628', marginBottom:'6px'}}>Notification preferences</h2>
          <p style={{fontSize:'14px', color:'#6b7280', marginBottom:'24px'}}>Choose when to be alerted about your spending and savings</p>
          <div style={{display:'flex', flexDirection:'column', gap:'20px'}}>
            <div style={{display:'flex', alignItems:'center', justifyContent:'space-between', padding:'16px', background:'#f7f9ff', borderRadius:'12px', border:'1px solid #e8f0fe'}}>
              <div>
                <p style={{fontSize:'15px', fontWeight:'700', color:'#0a1628', marginBottom:'4px'}}>⚠️ Overspending alert</p>
                <p style={{fontSize:'13px', color:'#6b7280'}}>Alert me when total spending exceeds my take-home pay</p>
              </div>
              <div onClick={() => setSpendingAlert(!spendingAlert)} style={{width:'48px', height:'26px', borderRadius:'999px', background: spendingAlert ? '#1a56db' : '#d1d5db', cursor:'pointer', position:'relative', transition:'background 0.2s', flexShrink:0}}>
                <div style={{position:'absolute', top:'3px', left: spendingAlert ? '25px' : '3px', width:'20px', height:'20px', borderRadius:'50%', background:'white', transition:'left 0.2s', boxShadow:'0 1px 3px rgba(0,0,0,0.2)'}}></div>
              </div>
            </div>
            <div style={{padding:'16px', background:'#f7f9ff', borderRadius:'12px', border:'1px solid #e8f0fe'}}>
              <div style={{display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom: savingsAlert ? '16px' : '0'}}>
                <div>
                  <p style={{fontSize:'15px', fontWeight:'700', color:'#0a1628', marginBottom:'4px'}}>🎯 Savings goal alert</p>
                  <p style={{fontSize:'13px', color:'#6b7280'}}>Alert me when my savings are below my monthly goal</p>
                </div>
                <div onClick={() => setSavingsAlert(!savingsAlert)} style={{width:'48px', height:'26px', borderRadius:'999px', background: savingsAlert ? '#1a56db' : '#d1d5db', cursor:'pointer', position:'relative', transition:'background 0.2s', flexShrink:0}}>
                  <div style={{position:'absolute', top:'3px', left: savingsAlert ? '25px' : '3px', width:'20px', height:'20px', borderRadius:'50%', background:'white', transition:'left 0.2s', boxShadow:'0 1px 3px rgba(0,0,0,0.2)'}}></div>
                </div>
              </div>
              {savingsAlert && (
                <div style={{display:'flex', flexDirection:'column', gap:'12px'}}>
                  <div>
                    <label style={{fontSize:'13px', fontWeight:'600', color:'#374151', display:'block', marginBottom:'8px'}}>Monthly savings goal (£)</label>
                    <input type="number" placeholder="e.g. 300" value={savingsGoal} onChange={e => setSavingsGoal(parseFloat(e.target.value) || 0)} style={{width:'100%', border:'1px solid #e8f0fe', borderRadius:'10px', padding:'10px 14px', fontSize:'14px', color:'#0a1628', outline:'none', boxSizing:'border-box', background:'white'}} />
                  </div>
                  <div>
                    <label style={{fontSize:'13px', fontWeight:'600', color:'#374151', display:'block', marginBottom:'8px'}}>Savings category to track</label>
                    <input type="text" placeholder="e.g. Savings" value={savingsCategory} onChange={e => setSavingsCategory(e.target.value)} style={{width:'100%', border:'1px solid #e8f0fe', borderRadius:'10px', padding:'10px 14px', fontSize:'14px', color:'#0a1628', outline:'none', boxSizing:'border-box', background:'white'}} />
                  </div>
                </div>
              )}
            </div>
          </div>
          {alertMessage && <div style={{background:'#f0fdf4', border:'1px solid #bbf7d0', borderRadius:'10px', padding:'12px 16px', marginTop:'16px'}}><p style={{fontSize:'14px', color:'#16a34a', fontWeight:'500'}}>{alertMessage}</p></div>}
          <button onClick={handleAlertSave} disabled={alertLoading} style={{marginTop:'20px', background:'linear-gradient(135deg, #1a56db, #0e3fa8)', color:'white', padding:'12px 28px', borderRadius:'10px', fontSize:'14px', fontWeight:'700', border:'none', cursor: alertLoading ? 'not-allowed' : 'pointer', opacity: alertLoading ? 0.7 : 1, boxShadow:'0 2px 8px rgba(26,86,219,0.25)'}}>
            {alertLoading ? "Saving..." : "Save alert settings"}
          </button>
        </div>

        {/* Danger zone */}
        <div style={{background:'white', border:'1px solid #fecaca', borderRadius:'16px', padding:'24px', boxShadow:'0 2px 8px rgba(220,38,38,0.04)'}}>
          <p style={{fontSize:'13px', fontWeight:'600', color:'#dc2626', textTransform:'uppercase', letterSpacing:'1px', marginBottom:'4px'}}>Danger zone</p>
          <h2 style={{fontSize:'18px', fontWeight:'800', color:'#0a1628', marginBottom:'8px'}}>Delete account</h2>
          <p style={{fontSize:'14px', color:'#6b7280', marginBottom:'20px'}}>Permanently delete your account and all your data. This cannot be undone.</p>
          <button onClick={() => { if (window.confirm("Are you sure? This will permanently delete your account and all data.")) { supabase.auth.signOut(); router.push("/login"); } }}
            style={{background:'#fef2f2', color:'#dc2626', padding:'12px 28px', borderRadius:'10px', fontSize:'14px', fontWeight:'700', border:'1px solid #fecaca', cursor:'pointer'}}>
            Delete my account
          </button>
        </div>

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