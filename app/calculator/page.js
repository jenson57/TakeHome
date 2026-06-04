import Calculator from "../Calculator";
import Link from "next/link";

export default function CalculatorPage() {
  return (
    <main className="min-h-screen bg-gray-50">
      <nav style={{borderBottom:'1px solid #e8f0fe', background:'white'}} className="px-6 py-4 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2" style={{textDecoration:'none'}}>
            <div style={{background:'linear-gradient(135deg, #1a56db, #0e3fa8)', width:'32px', height:'32px', borderRadius:'8px', display:'flex', alignItems:'center', justifyContent:'center'}}>
              <span style={{color:'white', fontWeight:'800', fontSize:'14px'}}>T</span>
            </div>
            <span style={{fontWeight:'800', color:'#0a1628', fontSize:'18px', letterSpacing:'-0.3px'}}>Takehome</span>
          </Link>
          <div style={{display:'flex', alignItems:'center', gap:'4px', background:'#f0f5ff', borderRadius:'12px', padding:'4px'}}>
            {[
              { href:'/', label:'Home', icon:'🏠' },
              { href:'/calculator', label:'Calculator', icon:'💷', active:true },
              { href:'/dashboard', label:'Dashboard', icon:'📊' },
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
        </div>
      </nav>
      <div className="max-w-2xl mx-auto px-4 py-10">
        <h1 className="text-2xl font-semibold text-gray-900 mb-1">Your take-home calculator</h1>
        <p className="text-gray-500 mb-8 text-sm">Based on 2024/25 UK tax rates</p>
        <Calculator />
      </div>
    </main>
  );
}