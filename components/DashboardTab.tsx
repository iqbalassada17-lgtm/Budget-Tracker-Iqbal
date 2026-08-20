
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
          <h1 className="text-3xl font-black text-white uppercase italic tracking-tighter">
            Strategic <span className="text-brand-peach">Cost Matrix</span>
          </h1>
          <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.3em] mt-1 italic">Real-time analysis active</p>
        </div>
        
        <div className="flex flex-wrap gap-2 bg-slate-900/40 p-2 rounded-2xl border border-slate-800 shadow-2xl backdrop-blur-xl">
          <select 
            value={selectedMonth} 
            onChange={e => setSelectedMonth(e.target.value)}
            className="bg-slate-950/60 text-[10px] text-slate-300 px-4 py-2 rounded-xl border border-slate-800 focus:outline-none focus:ring-1 focus:ring-brand-peach/50 font-bold"
          >
            <option value="">SEMUA BULAN</option>
            {uniqueMonths.map(m => <option key={m} value={m}>{m}</option>)}
          </select>

          <select 
            value={selectedCOA || ''} 
            onChange={e => setSelectedCOA(e.target.value || null)}
            className="bg-slate-950/60 text-[10px] text-slate-300 px-4 py-2 rounded-xl border border-slate-800 focus:outline-none focus:ring-1 focus:ring-brand-peach/50 font-bold"
          >
            <option value="">SEMUA KATEGORI</option>
            {uniqueCOAs.map(c => <option key={c} value={c}>{c}</option>)}
          </select>

          <div className="w-px h-6 bg-slate-800 self-center hidden md:block"></div>

          <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="bg-slate-950/60 text-[10px] text-slate-300 px-3 py-2 rounded-xl border border-slate-800 font-bold" />
          <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="bg-slate-950/60 text-[10px] text-slate-300 px-3 py-2 rounded-xl border border-slate-800 font-bold" />
          
          <button onClick={() => {setStartDate(''); setEndDate(''); setSelectedMonth(''); setSelectedCOA(null); setSelectedDate(null); fetchData();}} className="text-[10px] bg-slate-800 hover:bg-slate-700 px-4 py-2 rounded-xl font-black text-white uppercase tracking-widest transition-all">Reset</button>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-slate-900/60 border border-slate-800 p-8 rounded-[3rem] border-l-8 border-l-brand-peach shadow-2xl backdrop-blur-md relative overflow-hidden group">
          <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.3em] mb-2 italic">Gross Expenditure</p>
          <h2 className="text-4xl font-black text-white font-mono tracking-tighter italic">Rp {analytics.total.toLocaleString('id-ID')}</h2>
          <div className="absolute -bottom-4 -right-4 opacity-5 group-hover:scale-110 transition-transform duration-500 text-brand-peach">
            <Icons.Analytics />
          </div>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 p-8 rounded-[3rem] shadow-2xl backdrop-blur-md relative overflow-hidden group border-l-8 border-l-brand-olive">
          <div className="relative z-10">
            <p className="text-brand-olive text-[10px] font-black uppercase tracking-[0.3em] mb-3 flex items-center gap-2 italic">
              <span className="w-2.5 h-2.5 bg-brand-olive rounded-full animate-pulse shadow-[0_0_10px_#10b981]"></span>
              TOP SECTOR ALLOCATION
            </p>
            {analytics.topCOA ? (
              <>
                <h2 className="text-3xl font-black text-white uppercase tracking-tighter mb-2 truncate group-hover:text-brand-olive transition-colors italic" title={analytics.topCOA.name}>
                  {analytics.topCOA.name}
                </h2>
                <div className="flex items-baseline gap-3">
                  <p className="text-white font-mono font-black text-2xl italic">
                    Rp {analytics.topCOA.value.toLocaleString('id-ID')}
                  </p>
                  <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">
                    ({((analytics.topCOA.value / (analytics.total || 1)) * 100).toFixed(1)}%)
                  </p>
                </div>
              </>
            ) : (
              <p className="text-slate-600 italic text-sm font-black uppercase tracking-[0.3em] opacity-30">NO DATA STREAM</p>
            )}
          </div>
          <div className="absolute -bottom-6 -right-6 opacity-5 group-hover:scale-125 group-hover:rotate-12 transition-all duration-700 text-brand-olive">
            <Icons.TrendingDown />
          </div>
        </div>
      </div>

      <div className="bg-slate-900/40 border border-slate-800 p-10 rounded-[3.5rem] shadow-2xl backdrop-blur-xl">
        <h3 className="text-white font-black mb-10 uppercase tracking-[0.4em] text-xs flex items-center gap-3 italic">
          <Icons.Growth />
          TREND SPENDING
        </h3>
        <div className="h-[350px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={analytics.trend} onClick={(d) => d && d.activeLabel && setSelectedDate(selectedDate === d.activeLabel ? null : d.activeLabel)}>
              <defs>
                <linearGradient id="colorCost" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#F59E0B" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
              <XAxis dataKey="name" stroke="#64748b" fontSize={10} tickFormatter={(val) => formatDisplayDate(val)} tickLine={false} axisLine={false} fontStyle="italic" fontWeight="bold" />
              <YAxis stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(val) => `Rp${(val/1000).toFixed(0)}k`} fontStyle="italic" fontWeight="bold" />
              <Tooltip 
                labelFormatter={(val) => formatDisplayDate(val)}
                contentStyle={{backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '16px', fontSize: '12px', boxShadow: '0 25px 50px -12px rgb(0 0 0 / 0.5)', color: '#fff'}}
                itemStyle={{color: '#F59E0B', fontWeight: '900', textTransform: 'uppercase'}}
              />
              <Area type="monotone" dataKey="total" stroke="#F59E0B" fill="url(#colorCost)" strokeWidth={4} dot={{r: 4, fill: '#F59E0B', strokeWidth: 2, stroke: '#020617'}} activeDot={{r: 8, shadow: '0 0 20px #f59e0b'}} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-slate-900/60 border border-slate-800 rounded-[3rem] overflow-hidden shadow-2xl backdrop-blur-md">
        <div className="p-8 bg-slate-950/40 border-b border-slate-800 flex justify-between items-center">
          <h3 className="text-white font-black uppercase tracking-[0.3em] text-xs italic">
            Personal Cost Stream (Terupdate)
            {!analytics.isFilterActive && analytics.tableRows.length > 0 && (
              <span className="ml-2 text-brand-peach normal-case font-bold tracking-normal italic opacity-80"> (T-0 Latest Batch)</span>
            )}
          </h3>
          <span className="bg-slate-900 px-4 py-2 rounded-xl text-[10px] text-slate-400 font-black tracking-widest border border-slate-800 shadow-inner">
            {analytics.tableRows.length} RECORDS INDEXED
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/40">
              <tr>
                <th className="p-8 text-slate-500 uppercase font-black tracking-[0.2em] italic">Timestamp</th>
                <th className="p-8 text-slate-500 uppercase font-black tracking-[0.2em] italic">Classification</th>
                <th className="p-8 text-slate-500 uppercase font-black tracking-[0.2em] italic">Description</th>
                <th className="p-8 text-slate-500 uppercase font-black tracking-[0.2em] italic text-right">Amount (IDR)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {analytics.tableRows.map((r, i) => (
                <tr key={i} className="hover:bg-slate-800/40 transition-all group">
                  <td className="p-8 text-slate-400 font-mono tracking-tighter">{formatDisplayDate(r[analytics.DATE_IDX])}</td>
                  <td className="p-8">
                    <span className="font-black text-slate-300 uppercase group-hover:text-brand-peach transition-colors tracking-widest italic">{r[analytics.COA_IDX]}</span>
                  </td>
                  <td className="p-8 text-slate-500 italic font-medium group-hover:text-slate-300 transition-colors">{r[analytics.DESC_IDX]}</td>
                  <td className="p-8 text-right font-mono font-black text-brand-peach text-sm italic">
                    Rp {parseIDRCurrency(r[analytics.COST_IDX]).toLocaleString('id-ID')}
                  </td>
                </tr>
              ))}
              {analytics.tableRows.length === 0 && (
                <tr>
                  <td colSpan={4} className="p-24 text-center text-slate-600 font-black uppercase italic tracking-[0.4em] opacity-20">NULL DATA SET</td>
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
