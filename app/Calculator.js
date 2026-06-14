"use client";
import { useState } from "react";

function calcTax(gross) {
  const pa = 12570, basic = 50270, higher = 125140;
  if (gross <= pa) return 0;
  if (gross <= basic) return (gross - pa) * 0.2;
  if (gross <= higher) return (basic - pa) * 0.2 + (gross - basic) * 0.4;
  return (basic - pa) * 0.2 + (higher - basic) * 0.4 + (gross - higher) * 0.45;
}

function calcNI(gross) {
  const lower = 12570, upper = 50270;
  if (gross <= lower) return 0;
  if (gross <= upper) return (gross - lower) * 0.08;
  return (upper - lower) * 0.08 + (gross - upper) * 0.02;
}

function toAnnual(amount, freq, hoursPerWeek) {
  if (freq === "hourly") return amount * hoursPerWeek * 52;
  if (freq === 1) return amount;
  return amount * freq;
}

function fmt(n) {
  return "£" + Math.abs(Math.round(n)).toLocaleString("en-GB");
}

function freqLabel(f) {
  if (f === "hourly") return "hour";
  if (f === 1) return "year";
  if (f === 52) return "week";
  if (f === 26) return "fortnight";
  return "month";
}

const card = {
  background: 'white',
  border: '1px solid #e8f0fe',
  borderRadius: 16,
  boxShadow: '0 2px 8px rgba(26,86,219,0.04)',
  padding: '24px',
  marginBottom: 20,
};

export default function Calculator() {
  const [incomes, setIncomes] = useState([
    { id: 0, label: "Primary income", amount: "", freq: "", hoursPerWeek: 40 }
  ]);
  const [displayFreq, setDisplayFreq] = useState(12);

  const totalAnnualGross = incomes.reduce((s, inc) =>
    s + toAnnual(parseFloat(inc.amount) || 0, inc.freq || 12, inc.hoursPerWeek), 0);

  const totalTax = calcTax(totalAnnualGross);
  const totalNI = calcNI(totalAnnualGross);
  const totalAnnualNet = totalAnnualGross - totalTax - totalNI;

  const periodNet = totalAnnualNet / displayFreq;
  const periodGross = totalAnnualGross / displayFreq;
  const periodTax = totalTax / displayFreq;
  const periodNI = totalNI / displayFreq;
  const effectiveRate = totalAnnualGross > 0 ? Math.round(((totalTax + totalNI) / totalAnnualGross) * 100) : 0;

  const updateIncome = (id, field, value) =>
    setIncomes(prev => prev.map(inc => inc.id === id ? { ...inc, [field]: value } : inc));

  const addIncome = () =>
    setIncomes(prev => [...prev, { id: Date.now(), label: `Income ${prev.length + 1}`, amount: "", freq: "", hoursPerWeek: 40 }]);

  const removeIncome = (id) => {
    if (incomes.length === 1) return;
    setIncomes(prev => prev.filter(inc => inc.id !== id));
  };

  const displayLabel = displayFreq === 12 ? 'month' : displayFreq === 52 ? 'week' : 'fortnight';

  return (
    <div>
      {/* Income sources */}
      <div style={card}>
        <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20, flexWrap:'wrap', gap:12}}>
          <div>
            <p style={{fontSize:13, fontWeight:600, color:'#1a56db', textTransform:'uppercase', letterSpacing:1, marginBottom:4}}>Income</p>
            <h2 style={{fontSize:18, fontWeight:800, color:'#0a1628'}}>Your earnings</h2>
          </div>
          <div style={{display:'flex', alignItems:'center', gap:8}}>
            <span style={{fontSize:13, color:'#6b7280', fontWeight:500}}>Show per</span>
            <select value={displayFreq} onChange={e => setDisplayFreq(parseInt(e.target.value))}
              style={{border:'1px solid #e8f0fe', borderRadius:8, padding:'6px 10px', fontSize:13, color:'#0a1628', background:'white', outline:'none'}}>
              <option value={12}>Month</option>
              <option value={52}>Week</option>
              <option value={26}>Fortnight</option>
            </select>
          </div>
        </div>

        <div style={{display:'flex', flexDirection:'column', gap:12}}>
          {incomes.map((inc) => (
            <div key={inc.id} style={{background:'#f7f9ff', borderRadius:12, padding:16, border:'1px solid #e8f0fe'}}>
              <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12}}>
                <input
                  value={inc.label}
                  onChange={e => updateIncome(inc.id, "label", e.target.value)}
                  style={{fontWeight:700, fontSize:14, color:'#0a1628', background:'transparent', border:'none', outline:'none'}}
                />
                {incomes.length > 1 && (
                  <button onClick={() => removeIncome(inc.id)}
                    style={{background:'#fef2f2', border:'none', borderRadius:6, padding:'4px 8px', fontSize:12, color:'#dc2626', cursor:'pointer', fontWeight:600}}>
                    Remove
                  </button>
                )}
              </div>
              <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:12}}>
                <div>
                  <label style={{fontSize:12, color:'#6b7280', fontWeight:600, display:'block', marginBottom:6}}>Pay type</label>
                  <select value={inc.freq} onChange={e => {
                    const val = e.target.value === "hourly" ? "hourly" : e.target.value === "" ? "" : parseInt(e.target.value);
                    updateIncome(inc.id, "freq", val);
                  }} style={{width:'100%', border:'1px solid #e8f0fe', borderRadius:8, padding:'9px 12px', fontSize:13, color:'#0a1628', background:'white', outline:'none', boxSizing:'border-box'}}>
                    <option value="" disabled>Select pay type</option>
                    <option value={1}>Yearly salary</option>
                    <option value={12}>Monthly salary</option>
                    <option value={52}>Weekly salary</option>
                    <option value={26}>Fortnightly salary</option>
                    <option value="hourly">Hourly rate</option>
                  </select>
                </div>
                <div>
                  <label style={{fontSize:12, color:'#6b7280', fontWeight:600, display:'block', marginBottom:6}}>
                    Amount (£/{freqLabel(inc.freq)})
                  </label>
                  <input
                    type="number"
                    placeholder="0"
                    value={inc.amount}
                    onChange={e => updateIncome(inc.id, "amount", e.target.value)}
                    style={{width:'100%', border:'1px solid #e8f0fe', borderRadius:8, padding:'9px 12px', fontSize:13, color:'#0a1628', outline:'none', boxSizing:'border-box'}}
                  />
                </div>
                {inc.freq === "hourly" && (
                  <div>
                    <label style={{fontSize:12, color:'#6b7280', fontWeight:600, display:'block', marginBottom:6}}>Hours per week</label>
                    <input
                      type="number"
                      value={inc.hoursPerWeek}
                      onChange={e => updateIncome(inc.id, "hoursPerWeek", parseFloat(e.target.value) || 0)}
                      style={{width:'100%', border:'1px solid #e8f0fe', borderRadius:8, padding:'9px 12px', fontSize:13, color:'#0a1628', outline:'none', boxSizing:'border-box'}}
                    />
                  </div>
                )}
              </div>
              {(parseFloat(inc.amount) > 0) && (
                <div style={{display:'flex', gap:16, marginTop:10, flexWrap:'wrap'}}>
                  <span style={{fontSize:12, color:'#6b7280'}}>Annual: <strong style={{color:'#0a1628'}}>£{Math.round(toAnnual(inc.amount, inc.freq || 12, inc.hoursPerWeek)).toLocaleString('en-GB')}</strong></span>
                  <span style={{fontSize:12, color:'#6b7280'}}>Net/mo: <strong style={{color:'#16a34a'}}>£{Math.round((toAnnual(inc.amount, inc.freq || 12, inc.hoursPerWeek) - calcTax(toAnnual(inc.amount, inc.freq || 12, inc.hoursPerWeek)) - calcNI(toAnnual(inc.amount, inc.freq || 12, inc.hoursPerWeek))) / 12).toLocaleString('en-GB')}</strong></span>
                </div>
              )}
            </div>
          ))}
        </div>

        <button onClick={addIncome}
          style={{marginTop:14, background:'none', border:'1px dashed #1a56db', borderRadius:8, padding:'8px 16px', fontSize:13, color:'#1a56db', cursor:'pointer', fontWeight:600, width:'100%'}}>
          + Add another income source
        </button>
      </div>

      {/* Results */}
      {totalAnnualGross > 0 && (
        <>
          {/* Main result */}
          <div style={{...card, background:'linear-gradient(135deg, #1a56db, #0e3fa8)', border:'none'}}>
            <p style={{fontSize:13, fontWeight:600, color:'rgba(255,255,255,0.7)', textTransform:'uppercase', letterSpacing:1, marginBottom:8}}>Your take-home pay</p>
            <div style={{display:'flex', alignItems:'baseline', gap:8, marginBottom:4}}>
              <span style={{fontSize:48, fontWeight:800, color:'white', letterSpacing:'-1px'}}>{fmt(periodNet)}</span>
              <span style={{fontSize:16, color:'rgba(255,255,255,0.7)', fontWeight:500}}>per {displayLabel}</span>
            </div>
            <p style={{fontSize:13, color:'rgba(255,255,255,0.6)', marginTop:4}}>{fmt(totalAnnualNet)} per year · {effectiveRate}% effective tax rate</p>
          </div>

          {/* Breakdown */}
          <div style={card}>
            <p style={{fontSize:13, fontWeight:600, color:'#1a56db', textTransform:'uppercase', letterSpacing:1, marginBottom:4}}>Breakdown</p>
            <h2 style={{fontSize:18, fontWeight:800, color:'#0a1628', marginBottom:20}}>Where your money goes</h2>

            <div style={{display:'flex', flexDirection:'column', gap:0}}>
              {[
                { label: 'Gross pay', value: periodGross, color: '#0a1628', sub: fmt(totalAnnualGross) + '/yr', bold: false },
                { label: 'Income tax', value: -periodTax, color: '#dc2626', sub: fmt(totalTax) + '/yr', bold: false },
                { label: 'National Insurance', value: -periodNI, color: '#f59e0b', sub: fmt(totalNI) + '/yr', bold: false },
                { label: 'Take-home pay', value: periodNet, color: '#16a34a', sub: fmt(totalAnnualNet) + '/yr', bold: true },
              ].map((row, i) => (
                <div key={i} style={{display:'flex', justifyContent:'space-between', alignItems:'center', padding:'14px 0', borderBottom: i < 3 ? '1px solid #f3f4f6' : 'none'}}>
                  <div style={{display:'flex', alignItems:'center', gap:10}}>
                    <div style={{width:4, height:32, borderRadius:4, background: row.color, flexShrink:0}}></div>
                    <div>
                      <p style={{fontSize:14, fontWeight: row.bold ? 700 : 500, color:'#0a1628'}}>{row.label}</p>
                      <p style={{fontSize:12, color:'#9ca3af'}}>{row.sub}</p>
                    </div>
                  </div>
                  <span style={{fontSize: row.bold ? 20 : 16, fontWeight: row.bold ? 800 : 600, color: row.color}}>
                    {row.value < 0 ? '-' : ''}{fmt(Math.abs(row.value))}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* All periods */}
          <div style={card}>
            <p style={{fontSize:13, fontWeight:600, color:'#1a56db', textTransform:'uppercase', letterSpacing:1, marginBottom:4}}>All periods</p>
            <h2 style={{fontSize:18, fontWeight:800, color:'#0a1628', marginBottom:20}}>Take-home by period</h2>
            <div style={{display:'grid', gridTemplateColumns:'repeat(2, 1fr)', gap:12}}>
              {[
                { label: 'Annual', value: totalAnnualNet },
                { label: 'Monthly', value: totalAnnualNet / 12 },
                { label: 'Weekly', value: totalAnnualNet / 52 },
                { label: 'Daily', value: totalAnnualNet / 260 },
              ].map(p => (
                <div key={p.label} style={{background:'#f7f9ff', borderRadius:12, padding:'16px', border:'1px solid #e8f0fe'}}>
                  <p style={{fontSize:12, color:'#6b7280', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:6}}>{p.label}</p>
                  <p style={{fontSize:22, fontWeight:800, color:'#0a1628', letterSpacing:'-0.5px'}}>{fmt(p.value)}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Tax bands info */}
          <div style={card}>
            <p style={{fontSize:13, fontWeight:600, color:'#1a56db', textTransform:'uppercase', letterSpacing:1, marginBottom:4}}>2024/25 Tax Bands</p>
            <h2 style={{fontSize:18, fontWeight:800, color:'#0a1628', marginBottom:20}}>UK income tax rates</h2>
            <div style={{display:'flex', flexDirection:'column', gap:8}}>
              {[
                { band: 'Personal allowance', range: 'Up to £12,570', rate: '0%', color: '#16a34a', active: totalAnnualGross > 0 },
                { band: 'Basic rate', range: '£12,571 – £50,270', rate: '20%', color: '#1a56db', active: totalAnnualGross > 12570 },
                { band: 'Higher rate', range: '£50,271 – £125,140', rate: '40%', color: '#f59e0b', active: totalAnnualGross > 50270 },
                { band: 'Additional rate', range: 'Over £125,140', rate: '45%', color: '#dc2626', active: totalAnnualGross > 125140 },
              ].map((band, i) => (
                <div key={i} style={{display:'flex', alignItems:'center', gap:12, padding:'12px', borderRadius:10, background: band.active ? '#f7f9ff' : '#fafafa', border:'1px solid', borderColor: band.active ? '#e8f0fe' : '#f3f4f6', opacity: band.active ? 1 : 0.5}}>
                  <div style={{width:36, height:36, borderRadius:10, background:band.color+'18', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0}}>
                    <span style={{fontSize:13, fontWeight:800, color:band.color}}>{band.rate}</span>
                  </div>
                  <div style={{flex:1}}>
                    <p style={{fontSize:13, fontWeight:600, color:'#0a1628', marginBottom:2}}>{band.band}</p>
                    <p style={{fontSize:12, color:'#6b7280'}}>{band.range}</p>
                  </div>
                  {band.active && <span style={{fontSize:11, fontWeight:600, color:band.color, background:band.color+'18', padding:'3px 8px', borderRadius:20}}>Applies</span>}
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {totalAnnualGross === 0 && (
        <div style={{...card, textAlign:'center', padding:'48px 24px'}}>
          <div style={{fontSize:40, marginBottom:12}}>💷</div>
          <p style={{fontSize:16, fontWeight:700, color:'#0a1628', marginBottom:6}}>Enter your income above</p>
          <p style={{fontSize:14, color:'#6b7280'}}>Select your pay type and enter an amount to see your take-home pay calculated instantly.</p>
        </div>
      )}
    </div>
  );
}