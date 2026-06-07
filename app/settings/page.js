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

export default function Settings() {
  const [user, setUser] = useState(null);
  const [email, setEmail] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [emailMessage, setEmailMessage] = useState("");
  const [emailError, setEmailError] = useState("");
  const [passwordMessage, setPasswordMessage] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [emailLoading, setEmailLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }
      setUser(user);
      setEmail(user.email);
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
    else {
      setPasswordMessage("Password updated successfully!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    }
    setPasswordLoading(false);
  };

  return (
    <main className="min-h-screen" style={{background:'#f7f9ff'}}>

      {/* Nav */}
      <nav style={{borderBottom:'1px solid #e8f0fe', background:'white'}} className="px-6 py-4 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2" style={{textDecoration:'none'}}>
            <div style={{background:'linear-gradient(135deg, #1a56db, #0e3fa8)', width:'32px', height:'32px', borderRadius:'8px', display:'flex', alignItems:'center', justifyContent:'center'}}>
              <span style={{color:'white', fontWeight:'800', fontSize:'14px'}}>T</span>
            </div>
            <span style={{fontWeight:'800', color:'#0a1628', fontSize:'18px', letterSpacing:'-0.3px'}}>Takehome</span>
          </Link>
          <div style={{display:'flex', alignItems:'center', gap:'12px'}}>
            <div style={{display:'flex', alignItems:'center', gap:'4px', background:'#f0f5ff', borderRadius:'12px', padding:'4px'}}>
              {[
                { href:'/', label:'Home', icon:'🏠' },
                { href:'/calculator', label:'Calculator', icon:'💷' },
                { href:'/dashboard', label:'Dashboard', icon:'📊' },
                { href:'/settings', label:'Settings', icon:'⚙️', active:true },
              ].map(tab => (
                <Link key={tab.href} href={tab.href} style={{
                  display:'flex', alignItems:'center', gap:'6px',
                  padding:'8px 16px', borderRadius:'9px', fontSize:'14px', fontWeight: tab.active ? '700' : '500',
                  color: tab.active ? '#1a56db' : '#6b7280',
                  background: tab.active ? 'white' : 'transparent',
                  textDecoration:'none',
                  boxShadow: tab.active ? '0 1px 4px rgba(26,86,219,0.12)' : 'none',
                }}>
                  <span>{tab.icon}</span>{tab.label}
                </Link>
              ))}
            </div>
            <LogoutButton />
          </div>
        </div>
      </nav>

      <div className="max-w-2xl mx-auto px-4 py-10">

        {/* Header */}
        <div style={{marginBottom:'32px'}}>
          <p style={{fontSize:'13px', fontWeight:'600', color:'#1a56db', textTransform:'uppercase', letterSpacing:'1px', marginBottom:'6px'}}>Account</p>
          <h1 style={{fontSize:'32px', fontWeight:'800', color:'#0a1628', letterSpacing:'-0.5px', marginBottom:'6px'}}>Settings</h1>
          <p style={{fontSize:'15px', color:'#6b7280'}}>Manage your account details and security</p>
        </div>

        {/* Account info card */}
        <div style={{background:'white', border:'1px solid #e8f0fe', borderRadius:'16px', padding:'24px', marginBottom:'24px', boxShadow:'0 2px 8px rgba(26,86,219,0.04)'}}>
          <div style={{display:'flex', alignItems:'center', gap:'16px', marginBottom:'8px'}}>
            <div style={{width:'52px', height:'52px', borderRadius:'14px', background:'linear-gradient(135deg, #1a56db, #0e3fa8)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0}}>
              <span style={{color:'white', fontWeight:'800', fontSize:'22px'}}>{email ? email[0].toUpperCase() : '?'}</span>
            </div>
            <div>
              <p style={{fontSize:'16px', fontWeight:'700', color:'#0a1628', marginBottom:'2px'}}>{email}</p>
              <p style={{fontSize:'13px', color:'#9ca3af'}}>Takehome account</p>
            </div>
          </div>
        </div>

        {/* Change email card */}
        <div style={{background:'white', border:'1px solid #e8f0fe', borderRadius:'16px', padding:'24px', marginBottom:'24px', boxShadow:'0 2px 8px rgba(26,86,219,0.04)'}}>
          <p style={{fontSize:'13px', fontWeight:'600', color:'#1a56db', textTransform:'uppercase', letterSpacing:'1px', marginBottom:'4px'}}>Email</p>
          <h2 style={{fontSize:'18px', fontWeight:'800', color:'#0a1628', marginBottom:'20px'}}>Change email address</h2>
          <div style={{display:'flex', flexDirection:'column', gap:'16px', marginBottom:'20px'}}>
            <div>
              <label style={{fontSize:'13px', fontWeight:'600', color:'#374151', display:'block', marginBottom:'8px'}}>Current email</label>
              <input type="email" value={email} disabled
                style={{width:'100%', border:'1px solid #e8f0fe', borderRadius:'10px', padding:'12px 16px', fontSize:'15px', color:'#9ca3af', background:'#f9fafb', boxSizing:'border-box'}} />
            </div>
            <div>
              <label style={{fontSize:'13px', fontWeight:'600', color:'#374151', display:'block', marginBottom:'8px'}}>New email address</label>
              <input type="email" placeholder="new@example.com" value={newEmail} onChange={e => setNewEmail(e.target.value)}
                style={{width:'100%', border:'1px solid #e8f0fe', borderRadius:'10px', padding:'12px 16px', fontSize:'15px', color:'#0a1628', outline:'none', boxSizing:'border-box'}} />
            </div>
          </div>
          {emailError && (
            <div style={{background:'#fef2f2', border:'1px solid #fecaca', borderRadius:'10px', padding:'12px 16px', marginBottom:'16px'}}>
              <p style={{fontSize:'14px', color:'#dc2626', fontWeight:'500'}}>{emailError}</p>
            </div>
          )}
          {emailMessage && (
            <div style={{background:'#f0fdf4', border:'1px solid #bbf7d0', borderRadius:'10px', padding:'12px 16px', marginBottom:'16px'}}>
              <p style={{fontSize:'14px', color:'#16a34a', fontWeight:'500'}}>{emailMessage}</p>
            </div>
          )}
          <button onClick={handleEmailUpdate} disabled={emailLoading}
            style={{background:'linear-gradient(135deg, #1a56db, #0e3fa8)', color:'white', padding:'12px 28px', borderRadius:'10px', fontSize:'14px', fontWeight:'700', border:'none', cursor: emailLoading ? 'not-allowed' : 'pointer', opacity: emailLoading ? 0.7 : 1, boxShadow:'0 2px 8px rgba(26,86,219,0.25)'}}>
            {emailLoading ? "Updating..." : "Update email"}
          </button>
        </div>

        {/* Change password card */}
        <div style={{background:'white', border:'1px solid #e8f0fe', borderRadius:'16px', padding:'24px', marginBottom:'24px', boxShadow:'0 2px 8px rgba(26,86,219,0.04)'}}>
          <p style={{fontSize:'13px', fontWeight:'600', color:'#1a56db', textTransform:'uppercase', letterSpacing:'1px', marginBottom:'4px'}}>Security</p>
          <h2 style={{fontSize:'18px', fontWeight:'800', color:'#0a1628', marginBottom:'20px'}}>Change password</h2>
          <div style={{display:'flex', flexDirection:'column', gap:'16px', marginBottom:'20px'}}>
            <div>
              <label style={{fontSize:'13px', fontWeight:'600', color:'#374151', display:'block', marginBottom:'8px'}}>New password</label>
              <input type="password" placeholder="••••••••" value={newPassword} onChange={e => setNewPassword(e.target.value)}
                style={{width:'100%', border:'1px solid #e8f0fe', borderRadius:'10px', padding:'12px 16px', fontSize:'15px', color:'#0a1628', outline:'none', boxSizing:'border-box'}} />
            </div>
            <div>
              <label style={{fontSize:'13px', fontWeight:'600', color:'#374151', display:'block', marginBottom:'8px'}}>Confirm new password</label>
              <input type="password" placeholder="••••••••" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
                style={{width:'100%', border:'1px solid #e8f0fe', borderRadius:'10px', padding:'12px 16px', fontSize:'15px', color:'#0a1628', outline:'none', boxSizing:'border-box'}} />
            </div>
          </div>
          {passwordError && (
            <div style={{background:'#fef2f2', border:'1px solid #fecaca', borderRadius:'10px', padding:'12px 16px', marginBottom:'16px'}}>
              <p style={{fontSize:'14px', color:'#dc2626', fontWeight:'500'}}>{passwordError}</p>
            </div>
          )}
          {passwordMessage && (
            <div style={{background:'#f0fdf4', border:'1px solid #bbf7d0', borderRadius:'10px', padding:'12px 16px', marginBottom:'16px'}}>
              <p style={{fontSize:'14px', color:'#16a34a', fontWeight:'500'}}>{passwordMessage}</p>
            </div>
          )}
          <button onClick={handlePasswordUpdate} disabled={passwordLoading}
            style={{background:'linear-gradient(135deg, #1a56db, #0e3fa8)', color:'white', padding:'12px 28px', borderRadius:'10px', fontSize:'14px', fontWeight:'700', border:'none', cursor: passwordLoading ? 'not-allowed' : 'pointer', opacity: passwordLoading ? 0.7 : 1, boxShadow:'0 2px 8px rgba(26,86,219,0.25)'}}>
            {passwordLoading ? "Updating..." : "Update password"}
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
    </main>
  );
}