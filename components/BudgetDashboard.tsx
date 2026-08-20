
import React, { useState, useEffect, useMemo } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  Cell
} from 'recharts';
import { Icons } from '../constants';
import { fetchFromGoogleSheet } from '../services/spreadsheetService';

const BudgetDashboard: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [budgetRows, setBudgetRows] = useState<any[][]>([]);
  const [costRows, setCostRows] = useState<any[][]>([]);
  const [error, setError] = useState<string | null>(null);
  
  const [selectedMonth, setSelectedMonth] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const normalizeMonth = (m: any): string => {
    if (!m) return '';
    const s = m.toString().trim().toUpperCase();
    const map: Record<string, string> = {
      'JANUARI': 'JANUARY', 'PEBRUARI': 'FEBRUARY', 'FEBRUARI': 'FEBRUARY',
      'MARET': 'MARCH', 'APRIL': 'APRIL', 'MEI': 'MAY', 'JUNI': 'JUNE',
      'JULI': 'JULY', 'AGUSTUS': 'AUGUST', 'SEPTEMBER': 'SEPTEMBER',
      'OKTOBER': 'OCTOBER', 'NOVEMBER': 'NOVEMBER', 'DESEMBER': 'DECEMBER'
    };
    return map[s] || s;
  };

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [bData, cData] = await Promise.all([
        fetchFromGoogleSheet('BUDGET'),
        fetchFromGoogleSheet('INPUT COST')
      ]);
      setBudgetRows(bData.slice(1));
      setCostRows(cData.slice(1));
    } catch (err: any) { 
      setError("Gagal memuat data budget."); 
    } finally { 
      setLoading(false); 
    }
  };

  useEffect(() => { fetchData(); }, []);

  const parseIDR = (v: any) => {
    if (!v) return 0;
    if (typeof v === 'number') return v;
    return parseFloat(v.toString().replace(/Rp|IDR|\s/g, "").replace(/\./g, "").replace(/,/g, ".")) || 0;
  };

  const parseDate = (s: string) => {
    if (!s) return null;
    const str = s.toString().trim();
    if (str.includes('/')) {
      const p = str.split('/');
      if (p.length === 3) {
        const d = new Date(`${p[2]}-${p[1]}-${p[0]}`);
        if (!isNaN(d.getTime())) return d;
      }
    }
    const d = new Date(s);
    return isNaN(d.getTime()) ? null : d;
  };

  const formatDisplayDate = (dateStr: string) => {
    const d = parseDate(dateStr);
    if (!d) return dateStr;
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const uniqueMonths = useMemo(() => {
    const months = budgetRows.map(r => (r[0] || '').toString().trim().toUpperCase()).filter(Boolean);
    return Array.from(new Set(months)).sort();
  }, [budgetRows]);

  const analytics = useMemo(() => {
    const normSelected = normalizeMonth(selectedMonth);

    const filteredBudget = selectedMonth 
      ? budgetRows.filter(r => normalizeMonth(r[0]) === normSelected)
      : budgetRows;

    const filteredCost = selectedMonth
      ? costRows.filter(r => normalizeMonth(r[0]) === normSelected)
      : costRows;

    const catMap: Record<string, { budget: number, actual: number }> = {};

    filteredBudget.forEach(r => {
      const cat = (r[3] || 'LAINNYA').toString().toUpperCase().trim();
      if (!catMap[cat]) catMap[cat] = { budget: 0, actual: 0 };
      catMap[cat].budget += parseIDR(r[4]);
    });

    filteredCost.forEach(r => {
      const cat = (r[4] || 'LAINNYA').toString().toUpperCase().trim();
      if (!catMap[cat]) catMap[cat] = { budget: 0, actual: 0 };
      catMap[cat].actual += parseIDR(r[5]);
    });

    const chartData = Object.entries(catMap).map(([name, vals]) => ({
      name,
      budget: vals.budget,
      actual: vals.actual,
      remaining: Math.max(0, vals.budget - vals.actual),
      percent: vals.budget > 0 ? (vals.actual / vals.budget) * 100 : 0
    })).sort((a, b) => b.budget - a.budget);

    const totalBudget = chartData.reduce((a, b) => a + b.budget, 0);
    const totalActual = chartData.reduce((a, b) => a + b.actual, 0);

    return { chartData, totalBudget, totalActual, balance: totalBudget - totalActual };
  }, [budgetRows, costRows, selectedMonth]);

  const categoryTransactions = useMemo(() => {
    if (!selectedCategory) return [];
    const normSelected = normalizeMonth(selectedMonth);
    
    return costRows.filter(r => {
      const cat = (r[4] || 'LAINNYA').toString().toUpperCase().trim();
      const monthMatch = !selectedMonth || normalizeMonth(r[0]) === normSelected;
      return cat === selectedCategory && monthMatch;
    }).sort((a, b) => {
      // Sort by date descending (assuming index 1 is date)
      return b[1] > a[1] ? 1 : -1;
    });
  }, [selectedCategory, costRows, selectedMonth]);

  if (loading) return (
    <div className="p-20 text-center">
      <div className="w-12 h-12 border-4 border-brand-blue/20 border-t-brand-blue rounded-full animate-spin mx-auto mb-4"></div>
      <p className="text-slate-500 font-black uppercase tracking-[0.3em] animate-pulse">Synchronizing Budget...</p>
    </div>
  );

  return (
    <div className="space-y-8 pb-20 animate-in fade-in duration-700">
      <header className="flex flex-col md:flex-row justify-between items-start gap-4">
        <div>
          <h1 className="text-3xl font-black text-white uppercase italic tracking-tighter">Budget <span className="text-brand-blue">Efficiency</span></h1>
          <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.4em] mt-1 italic">Real-time Fiscal Control System</p>
        </div>
        
        <div className="flex gap-2 bg-slate-900/40 p-2.5 rounded-2xl border border-slate-800 backdrop-blur-xl shadow-2xl">
          <select 
            value={selectedMonth} 
            onChange={e => setSelectedMonth(e.target.value)}
            className="bg-slate-950/60 text-[10px] font-black text-white px-5 py-2.5 rounded-xl border border-slate-800 focus:outline-none focus:ring-1 focus:ring-brand-blue/50 uppercase tracking-widest shadow-inner"
          >
            <option value="">ALL PERIODS</option>
            {uniqueMonths.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
          <button onClick={fetchData} className="p-3 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-slate-400 hover:text-white transition-all shadow-xl active:scale-95">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="bg-slate-900/60 border border-slate-800 p-10 rounded-[3.5rem] border-l-8 border-l-brand-blue shadow-2xl backdrop-blur-md">
          <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.3em] mb-3 italic">Capital Allocation</p>
          <h2 className="text-3xl font-black text-white font-mono tracking-tighter italic">Rp {analytics.totalBudget.toLocaleString()}</h2>
        </div>
        <div className="bg-slate-900/60 border border-slate-800 p-10 rounded-[3.5rem] border-l-8 border-l-brand-peach shadow-2xl backdrop-blur-md">
          <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.3em] mb-3 italic">Utilized Resource</p>
          <h2 className="text-3xl font-black text-white font-mono tracking-tighter italic">Rp {analytics.totalActual.toLocaleString()}</h2>
        </div>
        <div className={`p-10 rounded-[3.5rem] border-l-8 shadow-2xl backdrop-blur-md transition-all ${analytics.balance >= 0 ? 'bg-brand-olive/5 border-brand-olive text-brand-olive' : 'bg-brand-peach/5 border-brand-peach text-brand-peach'}`}>
          <p className="text-[10px] font-black uppercase tracking-[0.3em] mb-3 italic">Fiscal Reserve</p>
          <h2 className="text-3xl font-black font-mono tracking-tighter italic">Rp {analytics.balance.toLocaleString()}</h2>
        </div>
      </div>

      <div className="bg-slate-900/40 border border-slate-800 p-12 rounded-[3.5rem] backdrop-blur-xl shadow-2xl">
        <h3 className="text-white font-black mb-10 uppercase tracking-[0.3em] text-[10px] flex items-center gap-4 italic opacity-80">
          <Icons.Analytics /> Comparative COA Extraction
        </h3>
        <div className="h-[450px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart 
              data={analytics.chartData} 
              layout="vertical" 
              margin={{ left: 40 }}
              onClick={(data) => {
                if (data && data.activeLabel) {
                  setSelectedCategory(data.activeLabel === selectedCategory ? null : data.activeLabel);
                }
              }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={true} vertical={false} />
              <XAxis type="number" hide />
              <YAxis dataKey="name" type="category" stroke="#64748b" fontSize={10} width={110} tickLine={false} axisLine={false} fontStyle="italic" fontWeight="bold" />
              <Tooltip 
                cursor={{fill: 'rgba(255,255,255,0.02)'}}
                contentStyle={{backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '16px', fontSize: '12px', color: '#fff'}}
                itemStyle={{fontWeight: '900', textTransform: 'uppercase'}}
              />
              <Legend verticalAlign="top" align="right" height={48} iconType="rect" />
              <Bar dataKey="budget" name="Allocation" fill="#3B82F6" radius={[0, 8, 8, 0]} barSize={24} />
              <Bar dataKey="actual" name="Execution" fill="#10B981" radius={[0, 8, 8, 0]} barSize={24} className="cursor-pointer">
                {analytics.chartData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fillOpacity={selectedCategory && entry.name !== selectedCategory ? 0.2 : 1}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <p className="text-center text-[9px] text-slate-600 font-black uppercase tracking-[0.3em] mt-8 italic opacity-50">
          Interaction Mode: Click segments for transaction ledger
        </p>
      </div>

      {/* Transaction Table for Selected Category */}
      {selectedCategory && (
        <div className="bg-slate-900/60 border border-slate-800 rounded-[3rem] overflow-hidden shadow-2xl animate-in slide-in-from-top-4 duration-500 backdrop-blur-md">
          <div className="p-8 bg-slate-950/40 border-b border-slate-800 flex justify-between items-center">
            <div>
              <h3 className="text-white font-black uppercase tracking-[0.3em] text-xs italic">Audit Trail: <span className="text-brand-blue">{selectedCategory}</span></h3>
              <p className="text-slate-500 text-[9px] uppercase font-black mt-1 tracking-[0.3em] italic">Granular Data Inversion from Input Cost</p>
            </div>
            <button onClick={() => setSelectedCategory(null)} className="text-slate-500 hover:text-white transition-colors p-2 bg-slate-800 rounded-xl">
              <Icons.Close />
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[10px]">
              <thead className="bg-slate-950/40">
                <tr>
                  <th className="p-6 text-slate-500 uppercase font-black tracking-[0.2em] italic">Timeline</th>
                  <th className="p-6 text-slate-500 uppercase font-black tracking-[0.2em] italic">Descriptor</th>
                  <th className="p-6 text-slate-500 uppercase font-black tracking-[0.2em] italic text-right">Nominal Value</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {categoryTransactions.map((row, i) => (
                  <tr key={i} className="hover:bg-slate-800/40 transition-all group">
                    <td className="p-6 font-mono text-slate-500 italic font-black">{formatDisplayDate(row[1])}</td>
                    <td className="p-6 text-slate-300 font-black uppercase italic tracking-widest">{row[6]}</td>
                    <td className="p-6 text-right font-mono text-brand-olive font-black italic text-sm">Rp {parseIDR(row[5]).toLocaleString()}</td>
                  </tr>
                ))}
                {categoryTransactions.length === 0 && (
                  <tr>
                    <td colSpan={3} className="p-24 text-center text-slate-600 font-black uppercase italic tracking-[0.5em] opacity-30">Null Audit Response</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="p-6 bg-slate-950/40 border-t border-slate-800 text-center">
            <p className="text-[9px] text-slate-500 font-black uppercase tracking-[0.4em] italic opacity-50">
              Synchronized {categoryTransactions.length} items for strategy {selectedCategory}.
            </p>
          </div>
        </div>
      )}

      <div className="bg-slate-900/40 border border-slate-800 rounded-[3.5rem] overflow-hidden shadow-2xl backdrop-blur-xl">
        <div className="p-8 bg-slate-950/40 border-b border-slate-800">
           <h3 className="text-white font-black uppercase tracking-[0.3em] text-[10px] italic opacity-80">Sector Efficiency Analytics</h3>
        </div>
        <div className="p-12 grid grid-cols-1 md:grid-cols-2 gap-12">
          {analytics.chartData.map((item, idx) => (
            <div 
              key={idx} 
              className={`space-y-4 cursor-pointer p-6 rounded-3xl transition-all border border-transparent ${selectedCategory === item.name ? 'bg-slate-800/40 border-slate-700 shadow-2xl' : 'hover:bg-slate-800/20 hover:border-slate-800'}`}
              onClick={() => setSelectedCategory(item.name === selectedCategory ? null : item.name)}
            >
              <div className="flex justify-between items-end">
                <span className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em] italic">{item.name}</span>
                <span className={`text-[10px] font-black italic tracking-widest ${item.percent > 100 ? 'text-brand-peach' : 'text-brand-blue'}`}>
                  {item.percent.toFixed(1)}% Usage
                </span>
              </div>
              <div className="w-full h-2.5 bg-slate-950 rounded-full overflow-hidden shadow-inner border border-slate-800">
                <div 
                  className={`h-full rounded-full transition-all duration-1000 ${item.percent > 100 ? 'bg-brand-peach' : item.percent > 80 ? 'bg-brand-brown' : 'bg-brand-blue'}`}
                  style={{ width: `${Math.min(100, item.percent)}%` }}
                ></div>
              </div>
              <div className="flex justify-between text-[9px] font-black font-mono text-slate-500 italic opacity-80 uppercase tracking-widest">
                <span>Exp: Rp {item.actual.toLocaleString()}</span>
                <span>Cap: Rp {item.budget.toLocaleString()}</span>
              </div>
            </div>
          ))}
          {analytics.chartData.length === 0 && (
            <p className="col-span-full text-center py-24 text-slate-600 font-black uppercase italic text-[10px] tracking-[0.5em] opacity-30">Strategic Void: No Budget Data</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default BudgetDashboard;
