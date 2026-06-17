'use client';
import { useState } from 'react';
import Link from 'next/link';


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

function toAnnual(amount, freq) {
  if (freq === 'monthly') return amount * 12;
  if (freq === 'weekly') return amount * 52;
  if (freq === 'daily') return amount * 260;
  return amount;
}

function fmt(n, showSign = false) {
  const abs = Math.abs(Math.round(n)).toLocaleString('en-GB');
  if (showSign) return (n >= 0 ? '+' : '-') + '£' + abs;
  return '£' + abs;
}

function calcOffer(offer) {
  const gross = toAnnual(parseFloat(offer.salary) || 0, offer.freq);
  const bonus = parseFloat(offer.bonus) || 0;
  const carAllowance = parseFloat(offer.carAllowance) || 0;
  const totalGross = gross + bonus + carAllowance;
  const tax = calcTax(totalGross);
  const ni = calcNI(totalGross);
  const pensionEmployee = totalGross * (parseFloat(offer.pensionEmployee) || 0) / 100;
  const pensionEmployer = totalGross * (parseFloat(offer.pensionEmployer) || 0) / 100;
  const commuteAnnual = (parseFloat(offer.commuteCost) || 0) * (parseFloat(offer.commuteDays) || 0) * 52;
  const netPay = totalGross - tax - ni - pensionEmployee;
  const trueValue = netPay - commuteAnnual + pensionEmployer + (offer.healthInsurance ? 1500 : 0);
  return {
    gross, totalGross, tax, ni,
    pensionEmployee, pensionEmployer,
    netPay, commuteAnnual, trueValue,
    netMonthly: netPay / 12,
    holidays: parseInt(offer.holidays) || 0,
  };
}

const EMPTY_OFFER = {
  title: '',
  salary: '',
  freq: 'yearly',
  bonus: '',
  carAllowance: '',
  pensionEmployee: '5',
  pensionEmployer: '3',
  commuteCost: '',
  commuteDays: '5',
  holidays: '25',
  healthInsurance: false,
  flexibleWorking: false,
  remoteWorking: false,
};

const NAV_TABS = [
  { href: '/', label: 'Home', icon: '🏠' },
  { href: '/calculator', label: 'Calculator', icon: '💷' },
  { href: '/dashboard', label: 'Dashboard', icon: '📊' },
  { href: '/analytics', label: 'Analytics', icon: '📈' },
  { href: '/bills', label: 'Bills', icon: '🧾' },
  { href: '/budget', label: 'Budget', icon: '💬' },
  { href: '/debt', label: 'Debt', icon: '💳' },
  { href: '/settings', label: 'Settings', icon: '⚙️' },
];

const inputStyle = {
  width: '100%',
  border: '1px solid #e8f0fe',
  borderRadius: 8,
  padding: '9px 12px',
  fontSize: 13,
  color: '#0a1628',
  outline: 'none',
  boxSizing: 'border-box',
  background: 'white',
};

const labelStyle = {
  fontSize: 12,
  fontWeight: 600,
  color: '#374151',
  display: 'block',
  marginBottom: 5,
};

export default function ComparePage() {
  const [offers, setOffers] = useState([
    { ...EMPTY_OFFER, title: 'Current job' },
    { ...EMPTY_OFFER, title: 'New offer' },
  ]);
  const [menuOpen, setMenuOpen] = useState(false);

  const updateOffer = (index, field, value) => {
    setOffers(prev => prev.map((o, i) => i === index ? { ...o, [field]: value } : o));
  };

  const results = offers.map(calcOffer);
  const bothEntered = offers.every(o => parseFloat(o.salary) > 0);
  const diff = bothEntered ? results[1].trueValue - results[0].trueValue : 0;
  const netDiff = bothEntered ? results[1].netPay - results[0].netPay : 0;
  const holidayDiff = bothEntered ? results[1].holidays - results[0].holidays : 0;

  const card = (color) => ({
    background: 'white',
    border: `2px solid ${color}`,
    borderRadius: 16,
    padding: 24,
    flex: 1,
  });

  return (
    <main style={{ minHeight: '100vh', background: '#f7f9ff', fontFamily: 'Inter, sans-serif' }}>
      <style>{`
        @media(max-width:640px){
          .compare-grid{grid-template-columns:1fr!important}
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
        input::placeholder { color: #9ca3af; }
      `}</style>

      {/* Nav */}
      <nav style={{ borderBottom: '1px solid #e8f0fe', background: 'white', padding: '0 16px', position: 'sticky', top: 0, zIndex: 50 }}>
        <div style={{ maxWidth: '72rem', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 64 }}>
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}>
            <div style={{ background: 'linear-gradient(135deg, #1a56db, #0e3fa8)', width: 32, height: 32, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ color: 'white', fontWeight: 800, fontSize: 14 }}>T</span>
            </div>
            <span style={{ fontWeight: 800, color: '#0a1628', fontSize: 18, letterSpacing: '-0.3px' }}>Takehome</span>
          </Link>
          <div className="desktop-nav" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, background: '#f0f5ff', borderRadius: 12, padding: 4 }}>
              {NAV_TABS.map(tab => (
                <Link key={tab.href} href={tab.href} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 9, fontSize: 14, fontWeight: 500, color: '#6b7280', background: 'transparent', textDecoration: 'none' }}>
                  <span>{tab.icon}</span>{tab.label}
                </Link>
              ))}
            </div>
          </div>
          <button className="mobile-menu-btn" onClick={() => setMenuOpen(!menuOpen)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', flexDirection: 'column', gap: '5px', padding: '4px', display: 'none' }}>
            <div style={{ width: '22px', height: '2px', background: '#0a1628', borderRadius: '2px' }}></div>
            <div style={{ width: '22px', height: '2px', background: '#0a1628', borderRadius: '2px' }}></div>
            <div style={{ width: '22px', height: '2px', background: '#0a1628', borderRadius: '2px' }}></div>
          </button>
        </div>
        {menuOpen && (
          <div className="mobile-menu" style={{ borderTop: '1px solid #e8f0fe', marginTop: '12px', paddingTop: '12px' }}>
            {NAV_TABS.map(tab => (
              <Link key={tab.href} href={tab.href} onClick={() => setMenuOpen(false)}
                style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 16px', borderRadius: '10px', fontSize: '15px', fontWeight: '500', color: '#0a1628', background: 'transparent', textDecoration: 'none', marginBottom: '4px' }}>
                <span>{tab.icon}</span>{tab.label}
              </Link>
            ))}
          </div>
        )}
      </nav>

      <div style={{ maxWidth: 1000, margin: '0 auto', padding: '40px 16px 100px' }}>

        {/* Header */}
        <div style={{ marginBottom: 32 }}>
          <Link href="/calculator" style={{ fontSize: 13, color: '#1a56db', textDecoration: 'none', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 4, marginBottom: 16 }}>
            ← Back to calculator
          </Link>
          <p style={{ fontSize: 13, fontWeight: 600, color: '#1a56db', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>Career Tools</p>
          <h1 style={{ fontSize: 32, fontWeight: 800, color: '#0a1628', letterSpacing: '-0.5px', marginBottom: 6 }}>Job Offer Comparison</h1>
          <p style={{ fontSize: 15, color: '#6b7280' }}>Compare two job offers and see the real take-home difference after tax, NI, pension and benefits</p>
        </div>

        {/* Offer input cards */}
        <div className="compare-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 32 }}>
          {offers.map((offer, idx) => (
            <div key={idx} style={card(idx === 0 ? '#e8f0fe' : '#1a56db')}>
              <div style={{ marginBottom: 20 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                  <div style={{ width: 32, height: 32, borderRadius: 8, background: idx === 0 ? '#f0f5ff' : '#1a56db', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>
                    {idx === 0 ? '💼' : '✨'}
                  </div>
                  <input
                    value={offer.title}
                    onChange={e => updateOffer(idx, 'title', e.target.value)}
                    style={{ ...inputStyle, border: 'none', background: 'transparent', fontSize: 16, fontWeight: 800, color: '#0a1628', padding: '4px 0' }}
                    placeholder={idx === 0 ? 'Current job' : 'New offer'}
                  />
                </div>

                {/* Salary */}
                <div style={{ background: '#f7f9ff', borderRadius: 12, padding: 16, marginBottom: 12, border: '1px solid #e8f0fe' }}>
                  <p style={{ fontSize: 12, fontWeight: 700, color: '#1a56db', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>💰 Salary</p>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                    <div>
                      <label style={labelStyle}>Base salary (£)</label>
                      <input type="number" value={offer.salary || ''} onChange={e => updateOffer(idx, 'salary', e.target.value)}
                        onFocus={e => setTimeout(() => e.target.select(), 0)}
                        placeholder="e.g. 35000" style={inputStyle} />
                    </div>
                    <div>
                      <label style={labelStyle}>Pay frequency</label>
                      <select value={offer.freq} onChange={e => updateOffer(idx, 'freq', e.target.value)} style={inputStyle}>
                        <option value="yearly">Per year</option>
                        <option value="monthly">Per month</option>
                        <option value="weekly">Per week</option>
                        <option value="daily">Per day</option>
                      </select>
                    </div>
                    <div>
                      <label style={labelStyle}>Annual bonus (£)</label>
                      <input type="number" value={offer.bonus || ''} onChange={e => updateOffer(idx, 'bonus', e.target.value)}
                        onFocus={e => setTimeout(() => e.target.select(), 0)}
                        placeholder="0" style={inputStyle} />
                    </div>
                    <div>
                      <label style={labelStyle}>Car allowance/yr (£)</label>
                      <input type="number" value={offer.carAllowance || ''} onChange={e => updateOffer(idx, 'carAllowance', e.target.value)}
                        onFocus={e => setTimeout(() => e.target.select(), 0)}
                        placeholder="0" style={inputStyle} />
                    </div>
                  </div>
                </div>

                {/* Pension */}
                <div style={{ background: '#f7f9ff', borderRadius: 12, padding: 16, marginBottom: 12, border: '1px solid #e8f0fe' }}>
                  <p style={{ fontSize: 12, fontWeight: 700, color: '#1a56db', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>🏦 Pension</p>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                    <div>
                      <label style={labelStyle}>Your contribution (%)</label>
                      <input type="number" value={offer.pensionEmployee || ''} onChange={e => updateOffer(idx, 'pensionEmployee', e.target.value)}
                        onFocus={e => setTimeout(() => e.target.select(), 0)}
                        placeholder="5" style={inputStyle} />
                    </div>
                    <div>
                      <label style={labelStyle}>Employer contribution (%)</label>
                      <input type="number" value={offer.pensionEmployer || ''} onChange={e => updateOffer(idx, 'pensionEmployer', e.target.value)}
                        onFocus={e => setTimeout(() => e.target.select(), 0)}
                        placeholder="3" style={inputStyle} />
                    </div>
                  </div>
                </div>

                {/* Commute */}
                <div style={{ background: '#f7f9ff', borderRadius: 12, padding: 16, marginBottom: 12, border: '1px solid #e8f0fe' }}>
                  <p style={{ fontSize: 12, fontWeight: 700, color: '#1a56db', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>🚗 Commute cost</p>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                    <div>
                      <label style={labelStyle}>Daily commute cost (£)</label>
                      <input type="number" value={offer.commuteCost || ''} onChange={e => updateOffer(idx, 'commuteCost', e.target.value)}
                        onFocus={e => setTimeout(() => e.target.select(), 0)}
                        placeholder="0" style={inputStyle} />
                    </div>
                    <div>
                      <label style={labelStyle}>Days in office/week</label>
                      <select value={offer.commuteDays} onChange={e => updateOffer(idx, 'commuteDays', e.target.value)} style={inputStyle}>
                        {[0,1,2,3,4,5].map(d => <option key={d} value={d}>{d} day{d !== 1 ? 's' : ''}</option>)}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Benefits */}
                <div style={{ background: '#f7f9ff', borderRadius: 12, padding: 16, border: '1px solid #e8f0fe' }}>
                  <p style={{ fontSize: 12, fontWeight: 700, color: '#1a56db', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>🎁 Benefits</p>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
                    <div>
                      <label style={labelStyle}>Holiday days/year</label>
                      <input type="number" value={offer.holidays || ''} onChange={e => updateOffer(idx, 'holidays', e.target.value)}
                        onFocus={e => setTimeout(() => e.target.select(), 0)}
                        placeholder="25" style={inputStyle} />
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {[
                      { field: 'healthInsurance', label: '🏥 Private health insurance (~£1,500/yr value)' },
                      { field: 'flexibleWorking', label: '⏰ Flexible working hours' },
                      { field: 'remoteWorking', label: '🏠 Remote/hybrid working' },
                    ].map(b => (
                      <label key={b.field} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13, color: '#374151' }}>
                        <input type="checkbox" checked={offer[b.field]} onChange={e => updateOffer(idx, b.field, e.target.checked)}
                          style={{ width: 16, height: 16, accentColor: '#1a56db' }} />
                        {b.label}
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              {/* Quick result */}
              {parseFloat(offer.salary) > 0 && (
                <div style={{ background: idx === 0 ? '#f0f5ff' : '#1a56db', borderRadius: 12, padding: 16, marginTop: 4 }}>
                  <p style={{ fontSize: 12, color: idx === 0 ? '#6b7280' : 'rgba(255,255,255,0.7)', marginBottom: 4 }}>Monthly take-home</p>
                  <p style={{ fontSize: 28, fontWeight: 800, color: idx === 0 ? '#0a1628' : 'white', letterSpacing: '-0.5px' }}>
                    {fmt(results[idx].netMonthly)}
                  </p>
                  <p style={{ fontSize: 12, color: idx === 0 ? '#6b7280' : 'rgba(255,255,255,0.7)', marginTop: 4 }}>
                    {fmt(results[idx].netPay)}/yr after tax & NI
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Results */}
        {bothEntered && (
          <>
            {/* Verdict */}
            <div style={{
              background: diff >= 0 ? 'linear-gradient(135deg, #16a34a, #15803d)' : 'linear-gradient(135deg, #dc2626, #b91c1c)',
              borderRadius: 20, padding: 32, marginBottom: 24, textAlign: 'center'
            }}>
              <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.8)', marginBottom: 8, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1 }}>
                Verdict
              </p>
              <p style={{ fontSize: 36, fontWeight: 800, color: 'white', letterSpacing: '-0.5px', marginBottom: 8 }}>
                {diff >= 0
                  ? `The new offer is worth ${fmt(Math.abs(diff))} more per year`
                  : `The new offer is worth ${fmt(Math.abs(diff))} less per year`}
              </p>
              <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.8)' }}>
                in real terms after tax, NI, pension, commute and benefits
              </p>
            </div>

            {/* Comparison table */}
            <div style={{ background: 'white', border: '1px solid #e8f0fe', borderRadius: 16, padding: 24, marginBottom: 24, boxShadow: '0 2px 8px rgba(26,86,219,0.04)' }}>
              <p style={{ fontSize: 13, fontWeight: 600, color: '#1a56db', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>Breakdown</p>
              <h2 style={{ fontSize: 18, fontWeight: 800, color: '#0a1628', marginBottom: 20 }}>Full comparison</h2>

              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: 0 }}>
                {/* Header */}
                {['', offers[0].title || 'Current job', offers[1].title || 'New offer', 'Difference'].map((h, i) => (
                  <div key={i} style={{ padding: '10px 12px', background: '#f7f9ff', fontWeight: 700, fontSize: 13, color: '#0a1628', borderBottom: '2px solid #e8f0fe', borderRight: i < 3 ? '1px solid #e8f0fe' : 'none' }}>
                    {h}
                  </div>
                ))}

                {[
                  { label: 'Gross salary', values: [results[0].gross, results[1].gross], format: fmt },
                  { label: 'Total package (inc. bonus)', values: [results[0].totalGross, results[1].totalGross], format: fmt },
                  { label: 'Income tax', values: [results[0].tax, results[1].tax], format: fmt, negative: true },
                  { label: 'National Insurance', values: [results[0].ni, results[1].ni], format: fmt, negative: true },
                  { label: 'Pension (your contribution)', values: [results[0].pensionEmployee, results[1].pensionEmployee], format: fmt, negative: true },
                  { label: 'Net take-home pay', values: [results[0].netPay, results[1].netPay], format: fmt, bold: true },
                  { label: 'Monthly take-home', values: [results[0].netMonthly, results[1].netMonthly], format: fmt, bold: true },
                  { label: 'Commute cost/year', values: [results[0].commuteAnnual, results[1].commuteAnnual], format: fmt, negative: true },
                  { label: 'Employer pension/year', values: [results[0].pensionEmployer, results[1].pensionEmployer], format: fmt },
                  { label: 'Holiday days', values: [results[0].holidays, results[1].holidays], format: (n) => `${n} days`, noFmt: true },
                  { label: 'True annual value', values: [results[0].trueValue, results[1].trueValue], format: fmt, bold: true, highlight: true },
                ].map((row, i) => {
                  const diff = row.values[1] - row.values[0];
                  const isPositive = diff >= 0;
                  return (
                    <div key={i} style={{ display: 'contents' }}>
                      {[
                        <div style={{ padding: '12px', fontSize: 13, fontWeight: row.bold ? 700 : 400, color: '#0a1628', borderBottom: '1px solid #f3f4f6', borderRight: '1px solid #e8f0fe', background: row.highlight ? '#f0f5ff' : 'white' }}>{row.label}</div>,
                        <div style={{ padding: '12px', fontSize: 13, fontWeight: row.bold ? 700 : 400, color: '#0a1628', borderBottom: '1px solid #f3f4f6', borderRight: '1px solid #e8f0fe', background: row.highlight ? '#f0f5ff' : 'white', textAlign: 'right' }}>{row.format(row.values[0])}</div>,
                        <div style={{ padding: '12px', fontSize: 13, fontWeight: row.bold ? 700 : 400, color: '#0a1628', borderBottom: '1px solid #f3f4f6', borderRight: '1px solid #e8f0fe', background: row.highlight ? '#f0f5ff' : 'white', textAlign: 'right' }}>{row.format(row.values[1])}</div>,
                        <div style={{ padding: '12px', fontSize: 13, fontWeight: 700, color: diff === 0 ? '#6b7280' : isPositive ? '#16a34a' : '#dc2626', borderBottom: '1px solid #f3f4f6', background: row.highlight ? '#f0f5ff' : 'white', textAlign: 'right' }}>
                          {diff === 0 ? '—' : (isPositive ? '+' : '') + (row.noFmt ? `${Math.round(diff)} days` : fmt(diff))}
                        </div>
                      ].map((cell, j) => <div key={j}>{cell}</div>)}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Benefits comparison */}
            <div style={{ background: 'white', border: '1px solid #e8f0fe', borderRadius: 16, padding: 24, marginBottom: 24, boxShadow: '0 2px 8px rgba(26,86,219,0.04)' }}>
              <p style={{ fontSize: 13, fontWeight: 600, color: '#1a56db', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>Perks</p>
              <h2 style={{ fontSize: 18, fontWeight: 800, color: '#0a1628', marginBottom: 20 }}>Benefits comparison</h2>
              <div className="compare-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                {offers.map((offer, idx) => (
                  <div key={idx} style={{ background: '#f7f9ff', borderRadius: 12, padding: 16, border: '1px solid #e8f0fe' }}>
                    <p style={{ fontSize: 14, fontWeight: 700, color: '#0a1628', marginBottom: 12 }}>{offer.title || (idx === 0 ? 'Current job' : 'New offer')}</p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                        <span style={{ color: '#6b7280' }}>🏖️ Holidays</span>
                        <span style={{ fontWeight: 700, color: '#0a1628' }}>{offer.holidays || 0} days</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                        <span style={{ color: '#6b7280' }}>🏦 Employer pension</span>
                        <span style={{ fontWeight: 700, color: '#0a1628' }}>{offer.pensionEmployer || 0}%</span>
                      </div>
                      {offer.healthInsurance && <div style={{ fontSize: 13, color: '#16a34a', fontWeight: 600 }}>✅ Private health insurance</div>}
                      {offer.flexibleWorking && <div style={{ fontSize: 13, color: '#16a34a', fontWeight: 600 }}>✅ Flexible working</div>}
                      {offer.remoteWorking && <div style={{ fontSize: 13, color: '#16a34a', fontWeight: 600 }}>✅ Remote/hybrid working</div>}
                      {!offer.healthInsurance && !offer.flexibleWorking && !offer.remoteWorking && (
                        <div style={{ fontSize: 13, color: '#9ca3af' }}>No additional benefits selected</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Key insights */}
            <div style={{ background: 'white', border: '1px solid #e8f0fe', borderRadius: 16, padding: 24, boxShadow: '0 2px 8px rgba(26,86,219,0.04)' }}>
              <p style={{ fontSize: 13, fontWeight: 600, color: '#1a56db', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>Insights</p>
              <h2 style={{ fontSize: 18, fontWeight: 800, color: '#0a1628', marginBottom: 20 }}>Key takeaways</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {[
                  netDiff !== 0 && {
                    icon: netDiff > 0 ? '💰' : '⚠️',
                    text: `The new offer gives you ${fmt(Math.abs(netDiff / 12))} ${netDiff > 0 ? 'more' : 'less'} per month in take-home pay`,
                    color: netDiff > 0 ? '#16a34a' : '#dc2626',
                  },
                  results[1].commuteAnnual > results[0].commuteAnnual && {
                    icon: '🚗',
                    text: `The new role costs ${fmt(results[1].commuteAnnual - results[0].commuteAnnual)} more per year in commuting`,
                    color: '#f59e0b',
                  },
                  results[0].commuteAnnual > results[1].commuteAnnual && {
                    icon: '🚗',
                    text: `The new role saves you ${fmt(results[0].commuteAnnual - results[1].commuteAnnual)} per year in commuting`,
                    color: '#16a34a',
                  },
                  results[1].pensionEmployer > results[0].pensionEmployer && {
                    icon: '🏦',
                    text: `The new employer contributes ${fmt(results[1].pensionEmployer - results[0].pensionEmployer)} more to your pension annually`,
                    color: '#1a56db',
                  },
                  holidayDiff !== 0 && {
                    icon: '🏖️',
                    text: `The new role offers ${Math.abs(holidayDiff)} ${holidayDiff > 0 ? 'more' : 'fewer'} holiday days per year`,
                    color: holidayDiff > 0 ? '#16a34a' : '#f59e0b',
                  },
                  offers[1].healthInsurance && !offers[0].healthInsurance && {
                    icon: '🏥',
                    text: 'The new role includes private health insurance worth approximately £1,500/year',
                    color: '#16a34a',
                  },
                  offers[1].remoteWorking && !offers[0].remoteWorking && {
                    icon: '🏠',
                    text: 'The new role offers remote/hybrid working which could save significant commute time and costs',
                    color: '#16a34a',
                  },
                  {
                    icon: diff > 0 ? '✅' : '❌',
                    text: diff > 0
                      ? `Overall the new offer is worth ${fmt(diff)} more per year in real terms — it's a better deal`
                      : `Overall the new offer is worth ${fmt(Math.abs(diff))} less per year in real terms — think carefully`,
                    color: diff > 0 ? '#16a34a' : '#dc2626',
                  },
                ].filter(Boolean).map((insight, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '12px 16px', background: '#f7f9ff', borderRadius: 10, border: '1px solid #e8f0fe' }}>
                    <span style={{ fontSize: 20, flexShrink: 0 }}>{insight.icon}</span>
                    <p style={{ fontSize: 14, color: insight.color, fontWeight: 500, lineHeight: '1.5', margin: 0 }}>{insight.text}</p>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {!bothEntered && (
          <div style={{ background: 'white', border: '1px solid #e8f0fe', borderRadius: 16, padding: '48px 24px', textAlign: 'center', boxShadow: '0 2px 8px rgba(26,86,219,0.04)' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>💼</div>
            <p style={{ fontSize: 16, fontWeight: 700, color: '#0a1628', marginBottom: 6 }}>Enter both salaries to see the comparison</p>
            <p style={{ fontSize: 14, color: '#6b7280' }}>Fill in the salary fields above for both jobs and we'll calculate the real difference</p>
          </div>
        )}
      </div>

      {/* Mobile bottom nav */}
      <div className="mobile-bottom-nav" style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: 'white', borderTop: '1px solid #e8f0fe', display: 'none', padding: '8px 0 20px', zIndex: 100 }}>
        {NAV_TABS.map(tab => (
          <Link key={tab.href} href={tab.href} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', textDecoration: 'none', padding: '4px 0' }}>
            <span style={{ fontSize: '20px' }}>{tab.icon}</span>
            <span style={{ fontSize: '10px', fontWeight: '500', color: '#9ca3af' }}>{tab.label}</span>
          </Link>
        ))}
      </div>
    </main>
  );
}