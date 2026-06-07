"use client";
import { useState, useEffect } from "react";

const COLORS = ["#534AB7","#1D9E75","#D85A30","#D4537E","#6B8ADD","#378ADD","#639922","#BA7517","#E24B4A","#7F77DD"];

const DEFAULT_CATEGORIES = [
  { name: "Housing / rent", pct: 30 },
  { name: "Food & groceries", pct: 12 },
  { name: "Transport & fuel", pct: 8 },
  { name: "Social & eating out", pct: 8 },
  { name: "Savings", pct: 10 },
  { name: "Subscriptions", pct: 5 },
];

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

export default function Calculator() {
  const [incomes, setIncomes] = useState([
    { id: 0, label: "Primary income", amount: 0, freq: "", hoursPerWeek: 40 }
  ]);
  const [displayFreq, setDisplayFreq] = useState(12);
  const [categories, setCategories] = useState(
    DEFAULT_CATEGORIES.map((c, i) => ({ ...c, id: i, amount: 0 }))
  );

  const totalAnnualGross = incomes.reduce((s, inc) =>
    s + toAnnual(parseFloat(inc.amount) || 0, inc.freq, inc.hoursPerWeek), 0);

  const totalTax = calcTax(totalAnnualGross);
  const totalNI = calcNI(totalAnnualGross);
  const totalAnnualNet = totalAnnualGross - totalTax - totalNI;

  const periodNet = totalAnnualNet / displayFreq;
  const periodGross = totalAnnualGross / displayFreq;
  const periodTax = totalTax / displayFreq;
  const periodNI = totalNI / displayFreq;

  useEffect(() => {
    setCategories(prev =>
      prev.map(c => ({ ...c, amount: Math.round(periodNet * (c.pct / 100)) }))
    );
  }, [totalAnnualGross, displayFreq]);

  const total = categories.reduce((s, c) => s + (parseFloat(c.amount) || 0), 0);
  const remaining = periodNet - total;
  const pct = periodNet > 0 ? Math.round((total / periodNet) * 100) : 0;

  const pieSlices = () => {
    const items = categories
      .filter(c => parseFloat(c.amount) > 0)
      .map((c, i) => ({ name: c.name, value: parseFloat(c.amount), color: COLORS[i % COLORS.length] }));
    if (remaining > 0) items.push({ name: "Unallocated", value: remaining, color: "#E5E5E0" });
    const total2 = items.reduce((s, i) => s + i.value, 0);
    if (total2 <= 0) return [];
    let cumulative = 0;
    return items.map(item => {
      const share = item.value / total2;
      const start = cumulative;
      cumulative += share;
      const startAngle = start * 2 * Math.PI - Math.PI / 2;
      const endAngle = cumulative * 2 * Math.PI - Math.PI / 2;
      const r = 80, cx = 100, cy = 100;
      const x1 = cx + r * Math.cos(startAngle);
      const y1 = cy + r * Math.sin(startAngle);
      const x2 = cx + r * Math.cos(endAngle);
      const y2 = cy + r * Math.sin(endAngle);
      const largeArc = share > 0.5 ? 1 : 0;
      return { ...item, d: `M${cx},${cy} L${x1},${y1} A${r},${r} 0 ${largeArc} 1 ${x2},${y2} Z`, share };
    });
  };

  const updateIncome = (id, field, value) => {
    setIncomes(prev => prev.map(inc => inc.id === id ? { ...inc, [field]: value } : inc));
  };

  const addIncome = () => {
    setIncomes(prev => [...prev, { id: Date.now(), label: `Income ${prev.length + 1}`, amount: 0, freq: 12, hoursPerWeek: 40 }]);
  };

  const removeIncome = (id) => {
    if (incomes.length === 1) return;
    setIncomes(prev => prev.filter(inc => inc.id !== id));
  };

  const updateAmount = (id, val) => {
    setCategories(prev => prev.map(c => c.id === id ? { ...c, amount: val } : c));
  };

  const removeCategory = (id) => {
    setCategories(prev => prev.filter(c => c.id !== id));
  };

  const addCategory = () => {
    const name = prompt("Category name:");
    if (name && name.trim()) {
      setCategories(prev => [...prev, { name: name.trim(), pct: 5, amount: Math.round(periodNet * 0.05), id: Date.now() }]);
    }
  };

  const freqLabel = (f) => {
    if (f === "hourly") return "hour";
    if (f === 1) return "year";
    if (f === 52) return "week";
    if (f === 26) return "fortnight";
    return "month";
  };

  

  return (
    <div className="space-y-4">

      {/* Income card */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-medium text-black">Your income</h2>
          <div className="flex items-center gap-2">
            <span className="text-sm text-black">Show per</span>
            <select value={displayFreq} onChange={e => setDisplayFreq(parseInt(e.target.value))}
              className="border border-gray-200 rounded-lg px-2 py-1 text-sm bg-white text-black">
              <option value={12}>Month</option>
              <option value={52}>Week</option>
              <option value={26}>Fortnight</option>
            </select>
          </div>
        </div>

        <div className="space-y-4">
          {incomes.map((inc, idx) => (
            <div key={inc.id} className="bg-gray-50 rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <input
                  value={inc.label}
                  onChange={e => updateIncome(inc.id, "label", e.target.value)}
                  className="font-medium text-black bg-transparent border-none outline-none text-sm w-40"
                />
                {incomes.length > 1 && (
                  <button onClick={() => removeIncome(inc.id)} className="text-gray-300 hover:text-red-400 text-lg leading-none">×</button>
                )}
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs text-black mb-1 block">Pay type</label>
                  <select value={inc.freq} onChange={e => {
                    const val = e.target.value === "hourly" ? "hourly" : parseInt(e.target.value);
                    updateIncome(inc.id, "freq", val);
                  }} className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-sm bg-white text-black">
                    <option value="" disabled>Select pay type</option>
<option value={1}>Yearly salary</option>
<option value={12}>Monthly salary</option>
<option value={52}>Weekly salary</option>
<option value={26}>Fortnightly salary</option>
<option value="hourly">Hourly rate</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-black mb-1 block">
                    Amount (£/{freqLabel(inc.freq)})
                  </label>
                  <input
                    type="number"
                    value={inc.amount}
                    onChange={e => updateIncome(inc.id, "amount", parseFloat(e.target.value) || 0)}
                    className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-sm text-black"
                  />
                </div>
                {inc.freq === "hourly" && (
                  <div>
                    <label className="text-xs text-black mb-1 block">Hours per week</label>
                    <input
                      type="number"
                      value={inc.hoursPerWeek}
                      onChange={e => updateIncome(inc.id, "hoursPerWeek", parseFloat(e.target.value) || 0)}
                      className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-sm text-black"
                    />
                  </div>
                )}
              </div>
              <div className="flex gap-4 mt-2 flex-wrap">
                <p className="text-xs text-black">Annual: £{Math.round(toAnnual(inc.amount, inc.freq, inc.hoursPerWeek)).toLocaleString("en-GB")}</p>
                <p className="text-xs text-black">Net monthly: £{Math.round((toAnnual(inc.amount, inc.freq, inc.hoursPerWeek) - calcTax(toAnnual(inc.amount, inc.freq, inc.hoursPerWeek)) - calcNI(toAnnual(inc.amount, inc.freq, inc.hoursPerWeek))) / 12).toLocaleString("en-GB")}</p>
                <p className="text-xs text-black">Hourly equivalent: £{(toAnnual(inc.amount, inc.freq, inc.hoursPerWeek) / 52 / (inc.hoursPerWeek || 40)).toFixed(2)}</p>
              </div>
            </div>
          ))}
        </div>

        <button onClick={addIncome} className="mt-4 text-sm text-blue-600 hover:text-blue-800">+ Add another income</button>

        <div className="grid grid-cols-4 gap-3 mt-4">
          {[
            ["Gross pay", fmt(periodGross), "text-black"],
            ["Income tax", "-" + fmt(periodTax), "text-black"],
            ["Nat. insurance", "-" + fmt(periodNI), "text-black"],
            ["Take-home", fmt(periodNet), "text-green-600"]
          ].map(([label, value, color]) => (
            <div key={label} className="bg-gray-50 rounded-xl p-3 text-center">
              <p className="text-xs text-black mb-1">{label}</p>
              <p className={`font-medium text-sm ${color}`}>{value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Budget card */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <h2 className="font-medium text-black mb-4">Budget categories</h2>
        <div className="space-y-3">
          {categories.map((cat) => (
            <div key={cat.id} className="flex items-center gap-3">
              <span className="text-sm text-black w-36 shrink-0">{cat.name}</span>
              <input type="range" min={0} max={Math.max(1, Math.round(periodNet * 1.5))} step={1}
                value={parseFloat(cat.amount) || 0}
                onChange={e => updateAmount(cat.id, parseFloat(e.target.value))}
                className="flex-1 min-w-0" />
              <input type="number" min={0} value={cat.amount}
                onChange={e => updateAmount(cat.id, parseFloat(e.target.value) || 0)}
                className="w-20 border border-gray-200 rounded-lg px-2 py-1 text-sm text-right text-black shrink-0" />
              <button onClick={() => removeCategory(cat.id)} className="text-gray-300 hover:text-red-400 text-lg leading-none shrink-0">×</button>
            </div>
          ))}
        </div>
        <button onClick={addCategory} className="mt-4 text-sm text-blue-600 hover:text-blue-800">+ Add category</button>
      </div>

      {/* Summary card */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <h2 className="font-medium text-black mb-4">Summary</h2>
        <div className="flex gap-6 items-center flex-wrap mb-4">
          <svg viewBox="0 0 200 200" className="w-40 h-40 shrink-0">
            {pieSlices().map((s, i) => <path key={i} d={s.d} fill={s.color} />)}
            <circle cx="100" cy="100" r="50" fill="white" />
            <text x="100" y="96" textAnchor="middle" fontSize="14" fill={pct > 100 ? "#dc2626" : "#000000"} fontWeight="500">{pct}%</text>
            <text x="100" y="112" textAnchor="middle" fontSize="10" fill="#000000">budgeted</text>
          </svg>
          <div className="space-y-2 flex-1 min-w-0">
            {pieSlices().map((s, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ background: s.color }}></span>
                <span className="text-xs text-black truncate">{s.name}</span>
                <span className="text-xs font-medium text-black ml-auto shrink-0">{fmt(s.value)}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-gray-50 rounded-xl p-3 text-center">
            <p className="text-xs text-black mb-1">Total budgeted</p>
            <p className="font-medium text-sm text-black">{fmt(total)}</p>
          </div>
          <div className="bg-gray-50 rounded-xl p-3 text-center">
            <p className="text-xs text-black mb-1">Remaining</p>
            <p style={{fontWeight: '600', fontSize: '16px', color: remaining < 0 ? '#dc2626' : '#16a34a'}}>
              {remaining < 0 ? "-" : ""}{fmt(remaining)}
            </p>
          </div>
        </div>
        <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
<div style={{ height: '100%', borderRadius: '999px', transition: 'width 0.3s', width: total > periodNet ? "100%" : pct + "%", backgroundColor: total > periodNet ? '#dc2626' : pct >= 76 ? '#facc15' : '#4ade80' }}></div>        </div>
      </div>

    </div>
  );
}