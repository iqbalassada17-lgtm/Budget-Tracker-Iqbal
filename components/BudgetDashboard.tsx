
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
          <h1 className="text-2xl font-black text-slate-900 uppercase italic tracking-tighter">Budget <span className="text-brand-blue">Efficiency</span></h1>
          <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mt-1 italic">Normalized Comparison System active</p>
        </div>
        
        <div className="flex gap-2 bg-white p-2 rounded-xl border border-brand-brown/10 shadow-sm">
          <select 
            value={selectedMonth} 
            onChange={e => setSelectedMonth(e.target.value)}
            className="bg-brand-cream/20 text-[10px] text-slate-900 px-4 py-2 rounded-lg border border-brand-brown/10 focus:outline-none focus:ring-1 focus:ring-brand-blue"
          >
            <option value="">SEMUA PERIODE</option>
            {uniqueMonths.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
          <button onClick={fetchData} className="p-2 bg-brand-cream/20 hover:bg-brand-cream/40 border border-brand-brown/10 rounded-lg text-slate-400">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white border border-brand-brown/10 p-8 rounded-[2rem] border-l-8 border-l-brand-blue shadow-sm">
          <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-2 italic">Total Alokasi (Budget)</p>
          <h2 className="text-2xl font-black text-slate-900 font-mono tracking-tighter">Rp {analytics.totalBudget.toLocaleString()}</h2>
        </div>
        <div className="bg-white border border-brand-brown/10 p-8 rounded-[2rem] border-l-8 border-l-brand-peach shadow-sm">
          <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-2 italic">Total Terpakai (Actual)</p>
          <h2 className="text-2xl font-black text-slate-900 font-mono tracking-tighter">Rp {analytics.totalActual.toLocaleString()}</h2>
        </div>
        <div className={`p-8 rounded-[2rem] border-l-8 shadow-sm ${analytics.balance >= 0 ? 'bg-brand-olive/10 border-brand-olive text-brand-olive' : 'bg-brand-peach/10 border-brand-peach text-brand-peach'}`}>
          <p className="text-[10px] font-black uppercase tracking-widest mb-2 italic">Sisa Anggaran</p>
          <h2 className="text-2xl font-black font-mono tracking-tighter">Rp {analytics.balance.toLocaleString()}</h2>
        </div>
      </div>

      <div className="bg-white border border-brand-brown/10 p-8 rounded-[2.5rem] shadow-sm">
        <h3 className="text-slate-900 font-bold mb-8 uppercase tracking-widest text-xs flex items-center gap-2">
          <Icons.Analytics /> Perbandingan COA (Budget vs Actual)
        </h3>
        <div className="h-[400px]">
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
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={true} vertical={false} />
              <XAxis type="number" hide />
              <YAxis dataKey="name" type="category" stroke="#94a3b8" fontSize={10} width={100} tickLine={false} axisLine={false} />
              <Tooltip 
                cursor={{fill: 'rgba(0,0,0,0.02)'}}
                contentStyle={{backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
              />
              <Legend verticalAlign="top" align="right" height={36} />
              <Bar dataKey="budget" name="Budget" fill="#DAAD86" radius={[0, 4, 4, 0]} barSize={20} />
              <Bar dataKey="actual" name="Actual" fill="#4B7447" radius={[0, 4, 4, 0]} barSize={20} className="cursor-pointer">
                {analytics.chartData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fillOpacity={selectedCategory && entry.name !== selectedCategory ? 0.3 : 1}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <p className="text-center text-[9px] text-slate-500 font-bold uppercase tracking-widest mt-4 italic">
          💡 Tip: Klik batang grafik untuk melihat rincian transaksi COA.
        </p>
      </div>

      {/* Transaction Table for Selected Category */}
      {selectedCategory && (
        <div className="bg-white border border-brand-brown/10 rounded-[2.5rem] overflow-hidden shadow-xl animate-in slide-in-from-top-4 duration-500">
          <div className="p-6 bg-brand-cream/30 border-b border-brand-brown/10 flex justify-between items-center">
            <div>
              <h3 className="text-slate-900 font-black uppercase tracking-widest text-xs">Actual Cost Detail: <span className="text-brand-blue">{selectedCategory}</span></h3>
              <p className="text-slate-500 text-[9px] uppercase font-bold mt-1 tracking-widest italic">Data Transaksi dari Sheet "INPUT COST"</p>
            </div>
            <button onClick={() => setSelectedCategory(null)} className="text-slate-500 hover:text-brand-blue transition-colors">
              <Icons.Close />
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[10px]">
              <thead className="bg-brand-cream/20">
                <tr>
                  <th className="p-4 text-slate-500 uppercase font-black tracking-widest">Tanggal</th>
                  <th className="p-4 text-slate-500 uppercase font-black tracking-widest">Keterangan</th>
                  <th className="p-4 text-slate-500 uppercase font-black tracking-widest text-right">Nominal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-brown/5">
                {categoryTransactions.map((row, i) => (
                  <tr key={i} className="hover:bg-brand-blue/5 transition-all group">
                    <td className="p-4 font-mono text-slate-500">{formatDisplayDate(row[1])}</td>
                    <td className="p-4 text-slate-700 font-medium uppercase">{row[6]}</td>
                    <td className="p-4 text-right font-mono text-brand-olive font-bold">Rp {parseIDR(row[5]).toLocaleString()}</td>
                  </tr>
                ))}
                {categoryTransactions.length === 0 && (
                  <tr>
                    <td colSpan={3} className="p-10 text-center text-slate-400 font-bold uppercase italic">No transactions found for this category.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="p-4 bg-brand-cream/10 border-t border-brand-brown/10 text-center">
            <p className="text-[9px] text-slate-500 font-black uppercase tracking-widest leading-relaxed">
              Menampilkan {categoryTransactions.length} baris pengeluaran untuk {selectedCategory}.
            </p>
          </div>
        </div>
      )}

      <div className="bg-white border border-brand-brown/10 rounded-[2.5rem] overflow-hidden shadow-sm">
        <div className="p-6 bg-brand-cream/20 border-b border-brand-brown/10">
           <h3 className="text-slate-900 font-bold uppercase tracking-widest text-xs italic">Efficiency Index per Category</h3>
        </div>
        <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-10">
          {analytics.chartData.map((item, idx) => (
            <div 
              key={idx} 
              className={`space-y-3 cursor-pointer p-4 rounded-2xl transition-all ${selectedCategory === item.name ? 'bg-brand-blue/5 ring-1 ring-brand-blue/20' : 'hover:bg-slate-50'}`}
              onClick={() => setSelectedCategory(item.name === selectedCategory ? null : item.name)}
            >
              <div className="flex justify-between items-end">
                <span className="text-[10px] font-black text-slate-900 uppercase tracking-widest">{item.name}</span>
                <span className={`text-[10px] font-bold ${item.percent > 100 ? 'text-brand-peach' : 'text-brand-blue'}`}>
                  {item.percent.toFixed(1)}% Usage
                </span>
              </div>
              <div className="w-full h-1.5 bg-brand-cream/40 rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all duration-1000 ${item.percent > 100 ? 'bg-brand-peach' : item.percent > 80 ? 'bg-brand-brown' : 'bg-brand-blue'}`}
                  style={{ width: `${Math.min(100, item.percent)}%` }}
                ></div>
              </div>
              <div className="flex justify-between text-[9px] font-mono text-slate-500 italic">
                <span>Spent: Rp {item.actual.toLocaleString()}</span>
                <span>Limit: Rp {item.budget.toLocaleString()}</span>
              </div>
            </div>
          ))}
          {analytics.chartData.length === 0 && (
            <p className="col-span-full text-center py-20 text-slate-400 font-bold uppercase italic text-[10px] tracking-[0.3em]">No budget data for selected period.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default BudgetDashboard;
