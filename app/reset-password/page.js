"use client";
import { useState, useEffect } from "react";
import { supabase } from "../supabase";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function ResetPassword() {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [ready, setReady] = useState(false);
  const router = useRouter();

  useEffect(() => {
    supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY") setReady(true);
    });
  }, []);

  const handleReset = async () => {
    if (password !== confirm) { setError("Passwords don't match"); return; }
    if (password.length < 6) { setError("Password must be at least 6 characters"); return; }
    setLoading(true);
    setError("");
    const { error } = await supabase.auth.updateUser({ password });
    if (error) setError(error.message);
    else {
      setMessage("Password updated successfully! Redirecting...");
      setTimeout(() => router.push("/dashboard"), 2000);
    }
    setLoading(false);
  };

  return (
    <main className="min-h-screen" style={{background: 'linear-gradient(160deg, #f0f5ff 0%, #ffffff 60%)'}}>
      <nav style={{borderBottom:'1px solid #e8f0fe', background:'white'}} className="px-6 py-4">
        <div className="max-w-6xl mx-auto">
          <Link href="/" className="flex items-center gap-2" style={{textDecoration:'none', display:'inline-flex'}}>
            <div style={{background:'linear-gradient(135deg, #1a56db, #0e3fa8)', width:'32px', height:'32px', borderRadius:'8px', display:'flex', alignItems:'center', justifyContent:'center'}}>
              <span style={{color:'white', fontWeight:'800', fontSize:'14px'}}>T</span>
            </div>
            <span style={{fontWeight:'800', color:'#0a1628', fontSize:'18px', letterSpacing:'-0.3px'}}>Takehome</span>
          </Link>
        </div>
      </nav>

      <div style={{display:'flex', alignItems:'center', justifyContent:'center', minHeight:'calc(100vh - 65px)', padding:'24px'}}>
        <div style={{background:'white', border:'1px solid #e8f0fe', borderRadius:'24px', padding:'40px', width:'100%', maxWidth:'420px', boxShadow:'0 20px 60px rgba(26,86,219,0.1)'}}>
          <div style={{textAlign:'center', marginBottom:'32px'}}>
            <div style={{background:'linear-gradient(135deg, #1a56db, #0e3fa8)', width:'48px', height:'48px', borderRadius:'14px', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 16px'}}>
              <span style={{color:'white', fontWeight:'800', fontSize:'22px'}}>🔒</span>
            </div>
            <h1 style={{fontSize:'24px', fontWeight:'800', color:'#0a1628', marginBottom:'8px'}}>Set new password</h1>
            <p style={{fontSize:'14px', color:'#6b7280'}}>Choose a strong password for your account</p>
          </div>

          <div style={{display:'flex', flexDirection:'column', gap:'16px', marginBottom:'24px'}}>
            <div>
              <label style={{fontSize:'13px', fontWeight:'600', color:'#374151', display:'block', marginBottom:'8px'}}>New password</label>
              <input type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)}
                style={{width:'100%', border:'1px solid #e8f0fe', borderRadius:'10px', padding:'12px 16px', fontSize:'15px', color:'#0a1628', outline:'none', boxSizing:'border-box'}} />
            </div>
            <div>
              <label style={{fontSize:'13px', fontWeight:'600', color:'#374151', display:'block', marginBottom:'8px'}}>Confirm password</label>
              <input type="password" placeholder="••••••••" value={confirm} onChange={e => setConfirm(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleReset()}
                style={{width:'100%', border:'1px solid #e8f0fe', borderRadius:'10px', padding:'12px 16px', fontSize:'15px', color:'#0a1628', outline:'none', boxSizing:'border-box'}} />
            </div>
          </div>

          {error && (
            <div style={{background:'#fef2f2', border:'1px solid #fecaca', borderRadius:'10px', padding:'12px 16px', marginBottom:'16px'}}>
              <p style={{fontSize:'14px', color:'#dc2626', fontWeight:'500'}}>{error}</p>
            </div>
          )}
          {message && (
            <div style={{background:'#f0fdf4', border:'1px solid #bbf7d0', borderRadius:'10px', padding:'12px 16px', marginBottom:'16px'}}>
              <p style={{fontSize:'14px', color:'#16a34a', fontWeight:'500'}}>{message}</p>
            </div>
          )}

          <button onClick={handleReset} disabled={loading}
            style={{width:'100%', background:'linear-gradient(135deg, #1a56db, #0e3fa8)', color:'white', padding:'14px', borderRadius:'12px', fontSize:'15px', fontWeight:'700', border:'none', cursor: loading ? 'not-allowed' : 'pointer', boxShadow:'0 4px 12px rgba(26,86,219,0.3)', opacity: loading ? 0.7 : 1}}>
            {loading ? "Updating..." : "Update password"}
          </button>
        </div>
      </div>
    </main>
  );
}