"use client";
import { useState } from "react";
import { supabase } from "../supabase";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  const handleSubmit = async () => {
    setLoading(true);
    setError("");
    setMessage("");

    if (isSignUp) {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) setError(error.message);
      else setMessage("Check your email for a confirmation link!");
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setError(error.message);
      else router.push("/dashboard");
    }
    setLoading(false);
  };

  return (
    <main className="min-h-screen" style={{background: 'linear-gradient(160deg, #f0f5ff 0%, #ffffff 60%)'}}>

      {/* Nav */}
      <nav style={{borderBottom:'1px solid #e8f0fe', background:'white'}} className="px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2" style={{textDecoration:'none'}}>
            <div style={{background:'linear-gradient(135deg, #1a56db, #0e3fa8)', width:'32px', height:'32px', borderRadius:'8px', display:'flex', alignItems:'center', justifyContent:'center'}}>
              <span style={{color:'white', fontWeight:'800', fontSize:'14px'}}>T</span>
            </div>
            <span style={{fontWeight:'800', color:'#0a1628', fontSize:'18px', letterSpacing:'-0.3px'}}>Takehome</span>
          </Link>
        </div>
      </nav>

      <div style={{display:'flex', alignItems:'center', justifyContent:'center', minHeight:'calc(100vh - 65px)', padding:'24px'}}>
        <div style={{background:'white', border:'1px solid #e8f0fe', borderRadius:'24px', padding:'40px', width:'100%', maxWidth:'420px', boxShadow:'0 20px 60px rgba(26,86,219,0.1)'}}>

          {/* Header */}
          <div style={{textAlign:'center', marginBottom:'32px'}}>
            <div style={{background:'linear-gradient(135deg, #1a56db, #0e3fa8)', width:'48px', height:'48px', borderRadius:'14px', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 16px'}}>
              <span style={{color:'white', fontWeight:'800', fontSize:'22px'}}>T</span>
            </div>
            <h1 style={{fontSize:'24px', fontWeight:'800', color:'#0a1628', marginBottom:'8px', letterSpacing:'-0.3px'}}>
              {isSignUp ? "Create your account" : "Welcome back"}
            </h1>
            <p style={{fontSize:'14px', color:'#6b7280'}}>
              {isSignUp ? "Start tracking your take-home pay" : "Sign in to your Takehome account"}
            </p>
          </div>

          {/* Form */}
          <div style={{display:'flex', flexDirection:'column', gap:'16px', marginBottom:'24px'}}>
            <div>
              <label style={{fontSize:'13px', fontWeight:'600', color:'#374151', display:'block', marginBottom:'8px'}}>Email address</label>
              <input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                style={{width:'100%', border:'1px solid #e8f0fe', borderRadius:'10px', padding:'12px 16px', fontSize:'15px', color:'#0a1628', outline:'none', boxSizing:'border-box'}}
              />
            </div>
            <div>
              <label style={{fontSize:'13px', fontWeight:'600', color:'#374151', display:'block', marginBottom:'8px'}}>Password</label>
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                style={{width:'100%', border:'1px solid #e8f0fe', borderRadius:'10px', padding:'12px 16px', fontSize:'15px', color:'#0a1628', outline:'none', boxSizing:'border-box'}}
              />
            </div>
          </div>

          {/* Error / success messages */}
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

          {/* Submit button */}
          <button onClick={handleSubmit} disabled={loading}
            style={{width:'100%', background:'linear-gradient(135deg, #1a56db, #0e3fa8)', color:'white', padding:'14px', borderRadius:'12px', fontSize:'15px', fontWeight:'700', border:'none', cursor: loading ? 'not-allowed' : 'pointer', boxShadow:'0 4px 12px rgba(26,86,219,0.3)', opacity: loading ? 0.7 : 1, marginBottom:'16px'}}>
            {loading ? "Please wait..." : isSignUp ? "Create account" : "Sign in"}
          </button>

          {/* Toggle sign up / sign in */}
          <p style={{textAlign:'center', fontSize:'14px', color:'#6b7280'}}>
            {isSignUp ? "Already have an account? " : "Don't have an account? "}
            <button onClick={() => { setIsSignUp(!isSignUp); setError(""); setMessage(""); }}
              style={{background:'none', border:'none', color:'#1a56db', fontWeight:'700', cursor:'pointer', fontSize:'14px'}}>
              {isSignUp ? "Sign in" : "Sign up for free"}
            </button>
          </p>

        </div>
      </div>
    </main>
  );
}