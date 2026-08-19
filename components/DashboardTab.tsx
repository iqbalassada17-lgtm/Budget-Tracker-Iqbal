
import React, { useState, useEffect, useMemo } from 'react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import { fetchFromGoogleSheet } from '../services/spreadsheetService';
import { Icons } from '../constants';

const DashboardTab: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [rawRows, setRawRows] = useState<any[][]>([]);
  const [fetchError, setFetchError] = useState<string | null>(null);
  
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('');
  const [selectedCOA, setSelectedCOA] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

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
    setFetchError(null);
    try {
      const data = await fetchFromGoogleSheet('INPUT COST');
      if (data && data.length > 0) setRawRows(data.slice(1));
    } catch (err: any) {
      setFetchError(err.message || 'Gagal sinkron.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const parseIDRCurrency = (value: any): number => {
    if (!value) return 0;
    if (typeof value === 'number') return value;
    let clean = value.toString().replace(/Rp|IDR|\s/g, "").replace(/\./g, "").replace(/,/g, ".");
    return parseFloat(clean) || 0;
  };

  const parseDate = (dateStr: string) => {
    if (!dateStr) return null;
    const s = dateStr.toString().trim();
    if (s.includes('/')) {
      const p = s.split('/');
      if (p.length === 3) {
        const d = new Date(`${p[2]}-${p[1]}-${p[0]}`);
        if (!isNaN(d.getTime())) return d;
      }
    }
    const d = new Date(dateStr);
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
    const months = rawRows.map(row => (row[0] || '').toString().trim().toUpperCase()).filter(Boolean);
    return Array.from(new Set(months)).sort();
  }, [rawRows]);

  const uniqueCOAs = useMemo(() => {
    const coas = rawRows.map(row => (row[4] || 'LAINNYA').toString().trim().toUpperCase()).filter(Boolean);
    return Array.from(new Set(coas)).sort();
  }, [rawRows]);

  const analytics = useMemo(() => {
    const BULAN_IDX = 0; const DATE_IDX = 1; const COA_IDX = 4; const COST_IDX = 5; const DESC_IDX = 6;
    const normSelected = normalizeMonth(selectedMonth);
    
    const filtered = rawRows.filter(row => {
      if (selectedMonth && normalizeMonth(row[BULAN_IDX]) !== normSelected) return false;
      if (selectedCOA && (row[COA_IDX] || 'LAINNYA').toString().toUpperCase().trim() !== selectedCOA) return false;
      const rowDate = parseDate(row[DATE_IDX]);
      if (rowDate) {
        if (startDate) {
          const s = new Date(startDate); s.setHours(0,0,0,0);
          if (rowDate < s) return false;
        }
        if (endDate) {
          const e = new Date(endDate); e.setHours(23,59,59,999);
          if (rowDate > e) return false;
        }
      }
      return true;
    });

    const categoryMap: Record<string, number> = {};
    filtered.forEach(row => {
      const coa = (row[COA_IDX] || 'LAINNYA').toString().toUpperCase().trim();
      categoryMap[coa] = (categoryMap[coa] || 0) + parseIDRCurrency(row[COST_IDX]);
    });

    const categoryData = Object.entries(categoryMap)
      .map(([name, value]) => ({ name, value }))
      .sort((a,b) => b.value - a.value);
    
    const topCOA = categoryData.length > 0 ? categoryData[0] : null;
    
    const trendMap: Record<string, number> = {};
    filtered.forEach(row => {
      const date = row[DATE_IDX] || 'N/A';
      trendMap[date] = (trendMap[date] || 0) + parseIDRCurrency(row[COST_IDX]);
    });

    const trendData = Object.entries(trendMap).map(([name, total]) => ({ name, total }))
      .sort((a,b) => (parseDate(a.name)?.getTime() || 0) - (parseDate(b.name)?.getTime() || 0));

    const isFilterActive = !!(startDate || endDate || selectedMonth || selectedCOA || selectedDate);

    let tableRows = filtered.filter(row => {
      if (selectedDate && row[DATE_IDX] !== selectedDate) return false;
      return true;
    });

    // Initial view logic: if no filters, only show latest day in the table
    if (!isFilterActive && tableRows.length > 0) {
      const dates = tableRows.map(r => {
        const d = parseDate(r[DATE_IDX]);
        return d ? d.getTime() : 0;
      }).filter(t => t > 0);
      
      if (dates.length > 0) {
        const latestTime = Math.max(...dates);
        tableRows = tableRows.filter(r => {
          const d = parseDate(r[DATE_IDX]);
          return d && d.getTime() === latestTime;
        });
      }
    }

    return {
      trend: trendData, 
      byCategory: categoryData, 
      topCOA,
      total: filtered.reduce((a,r) => a + parseIDRCurrency(r[COST_IDX]), 0),
      tableRows, DATE_IDX, COA_IDX, COST_IDX, DESC_IDX,
      isFilterActive
    };
  }, [rawRows, startDate, endDate, selectedMonth, selectedCOA, selectedDate]);

  if (loading) return (
    <div className="p-20 text-center animate-pulse">
        <div className="w-12 h-12 border-4 border-brand-peach/20 border-t-brand-peach rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-slate-500 font-black uppercase tracking-widest">Memuat Dashboard...</p>
    </div>
  );

  return (
    <div className="space-y-8 pb-20 animate-in fade-in duration-500">
      <header className="flex flex-col md:flex-row justify-between items-start gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 uppercase italic tracking-tighter">
            Dashboard <span className="text-brand-peach">Cost</span>
          </h1>
          <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mt-1 italic">Normalized Filter Applied</p>
        </div>
        
        <div className="flex flex-wrap gap-2 bg-white p-2 rounded-xl border border-brand-brown/10 shadow-sm">
          <select 
            value={selectedMonth} 
            onChange={e => setSelectedMonth(e.target.value)}
            className="bg-brand-cream/20 text-[10px] text-slate-900 px-3 py-1.5 rounded-lg border border-brand-brown/10 focus:outline-none focus:ring-1 focus:ring-brand-peach/50"
          >
            <option value="">SEMUA BULAN</option>
            {uniqueMonths.map(m => <option key={m} value={m}>{m}</option>)}
          </select>

          <select 
            value={selectedCOA || ''} 
            onChange={e => setSelectedCOA(e.target.value || null)}
            className="bg-brand-cream/20 text-[10px] text-slate-900 px-3 py-1.5 rounded-lg border border-brand-brown/10 focus:outline-none focus:ring-1 focus:ring-brand-peach/50"
          >
            <option value="">SEMUA KATEGORI</option>
            {uniqueCOAs.map(c => <option key={c} value={c}>{c}</option>)}
          </select>

          <div className="w-px h-6 bg-brand-brown/10 self-center hidden md:block"></div>

          <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="bg-brand-cream/20 text-[10px] text-slate-900 px-2 py-1.5 rounded-lg border border-brand-brown/10" />
          <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="bg-brand-cream/20 text-[10px] text-slate-900 px-2 py-1.5 rounded-lg border border-brand-brown/10" />
          
          <button onClick={() => {setStartDate(''); setEndDate(''); setSelectedMonth(''); setSelectedCOA(null); setSelectedDate(null); fetchData();}} className="text-[10px] bg-slate-200 hover:bg-slate-300 px-3 py-1.5 rounded-lg font-bold text-slate-700 transition-colors">Reset</button>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white border border-brand-brown/10 p-8 rounded-[2rem] border-l-8 border-l-brand-peach shadow-sm relative overflow-hidden group">
          <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-2 italic">Total Pengeluaran Filtered</p>
          <h2 className="text-3xl font-black text-slate-900 font-mono tracking-tighter">Rp {analytics.total.toLocaleString('id-ID')}</h2>
          <div className="absolute -bottom-4 -right-4 opacity-5 group-hover:scale-110 transition-transform duration-500">
            <Icons.Analytics />
          </div>
        </div>

        <div className="bg-white border border-brand-brown/10 p-8 rounded-[2rem] shadow-sm relative overflow-hidden group border-l-8 border-l-brand-olive">
          <div className="relative z-10">
            <p className="text-brand-olive text-[10px] font-black uppercase tracking-widest mb-3 flex items-center gap-2">
              <span className="w-2 h-2 bg-brand-olive rounded-full animate-pulse"></span>
              TOP SPENDING CATEGORY
            </p>
            {analytics.topCOA ? (
              <>
                <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tighter mb-2 truncate group-hover:text-brand-olive transition-colors" title={analytics.topCOA.name}>
                  {analytics.topCOA.name}
                </h2>
                <div className="flex items-baseline gap-2">
                  <p className="text-slate-900 font-mono font-black text-xl">
                    Rp {analytics.topCOA.value.toLocaleString('id-ID')}
                  </p>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                    ({((analytics.topCOA.value / (analytics.total || 1)) * 100).toFixed(1)}%)
                  </p>
                </div>
              </>
            ) : (
              <p className="text-slate-500 italic text-sm font-bold uppercase tracking-widest opacity-30">No data available.</p>
            )}
          </div>
          <div className="absolute -bottom-6 -right-6 opacity-5 group-hover:scale-125 group-hover:rotate-12 transition-all duration-700 text-brand-olive">
            <Icons.TrendingDown />
          </div>
        </div>
      </div>

      <div className="bg-white border border-brand-brown/10 p-8 rounded-[2.5rem] shadow-sm">
        <h3 className="text-slate-900 font-bold mb-8 uppercase tracking-widest text-xs flex items-center gap-3">
          <Icons.Growth />
          Spending Trend Evolution
        </h3>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={analytics.trend} onClick={(d) => d && d.activeLabel && setSelectedDate(selectedDate === d.activeLabel ? null : d.activeLabel)}>
              <defs>
                <linearGradient id="colorCost" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#DAAD86" stopOpacity={0.2}/>
                  <stop offset="95%" stopColor="#DAAD86" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} tickFormatter={(val) => formatDisplayDate(val)} tickLine={false} axisLine={false} />
              <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(val) => `Rp${(val/1000).toFixed(0)}k`} />
              <Tooltip 
                labelFormatter={(val) => formatDisplayDate(val)}
                contentStyle={{backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', fontSize: '12px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                itemStyle={{color: '#DAAD86', fontWeight: 'bold'}}
              />
              <Area type="monotone" dataKey="total" stroke="#DAAD86" fill="url(#colorCost)" strokeWidth={3} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white border border-brand-brown/10 rounded-[2.5rem] overflow-hidden shadow-sm">
        <div className="p-6 bg-brand-cream/20 border-b border-brand-brown/10 flex justify-between items-center">
          <h3 className="text-slate-900 font-bold uppercase tracking-widest text-xs italic">
            Filtered Transaction Log
            {!analytics.isFilterActive && analytics.tableRows.length > 0 && (
              <span className="ml-2 text-brand-peach normal-case font-medium tracking-normal"> (Latest Day Only)</span>
            )}
          </h3>
          <span className="bg-white px-3 py-1.5 rounded-full text-[10px] text-slate-500 font-black tracking-widest border border-brand-brown/10">
            {analytics.tableRows.length} RECORDS FOUND
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-brand-cream/10">
              <tr>
                <th className="p-6 text-slate-500 uppercase font-black tracking-widest">Date</th>
                <th className="p-6 text-slate-500 uppercase font-black tracking-widest">COA Category</th>
                <th className="p-6 text-slate-500 uppercase font-black tracking-widest">Description</th>
                <th className="p-6 text-slate-500 uppercase font-black tracking-widest text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-brown/5">
              {analytics.tableRows.map((r, i) => (
                <tr key={i} className="hover:bg-brand-peach/5 transition-colors group">
                  <td className="p-6 text-slate-500 font-mono tracking-tighter">{formatDisplayDate(r[analytics.DATE_IDX])}</td>
                  <td className="p-6">
                    <span className="font-black text-slate-700 uppercase group-hover:text-brand-peach transition-colors tracking-widest">{r[analytics.COA_IDX]}</span>
                  </td>
                  <td className="p-6 text-slate-500 italic font-medium">{r[analytics.DESC_IDX]}</td>
                  <td className="p-6 text-right font-mono font-bold text-brand-peach">
                    Rp {parseIDRCurrency(r[analytics.COST_IDX]).toLocaleString('id-ID')}
                  </td>
                </tr>
              ))}
              {analytics.tableRows.length === 0 && (
                <tr>
                  <td colSpan={4} className="p-20 text-center text-slate-400 font-bold uppercase italic tracking-[0.3em] opacity-30">No matching data.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default DashboardTab;
