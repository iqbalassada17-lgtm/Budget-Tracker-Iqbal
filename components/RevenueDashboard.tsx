
import React, { useState, useEffect, useMemo } from 'react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import { Icons } from '../constants';
import { fetchFromGoogleSheet } from '../services/spreadsheetService';

const RevenueDashboard: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [revenueRows, setRevenueRows] = useState<any[][]>([]);
  const [costRows, setCostRows] = useState<any[][]>([]);
  const [error, setError] = useState<string | null>(null);
  
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [revData, costData] = await Promise.all([
        fetchFromGoogleSheet('REVENUE'),
        fetchFromGoogleSheet('INPUT COST')
      ]);
      setRevenueRows(revData.slice(1));
      setCostRows(costData.slice(1));
    } catch { setError("Gagal sinkron data."); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const parseIDRCurrency = (v: any) => {
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

  const analytics = useMemo(() => {
    const DATE_IDX = 1; const PARAM_IDX = 4; const REV_VAL_IDX = 5;
    
    const revF = revenueRows.filter(r => {
      const d = parseDate(r[DATE_IDX]);
      if (!d) return true;
      if (startDate) { const s = new Date(startDate); s.setHours(0,0,0,0); if (d < s) return false; }
      if (endDate) { const e = new Date(endDate); e.setHours(23,59,59,999); if (d > e) return false; }
      return true;
    });

    const costF = costRows.filter(r => {
      const d = parseDate(r[DATE_IDX]);
      if (!d) return true;
      if (startDate) { const s = new Date(startDate); s.setHours(0,0,0,0); if (d < s) return false; }
      if (endDate) { const e = new Date(endDate); e.setHours(23,59,59,999); if (d > e) return false; }
      return true;
    });

    const totalRev = revF.reduce((a,r) => a + parseIDRCurrency(r[REV_VAL_IDX]), 0);
    const totalCost = costF.reduce((a,r) => a + parseIDRCurrency(r[5]), 0);

    const trendMap: Record<string, number> = {};
    revF.forEach(r => {
      const date = r[DATE_IDX];
      trendMap[date] = (trendMap[date] || 0) + parseIDRCurrency(r[REV_VAL_IDX]);
    });

    const tableRows = revF.filter(r => {
      if (selectedDate && r[DATE_IDX] !== selectedDate) return false;
      return true;
    });

    return {
      totalRev, totalCost, netProfit: totalRev - totalCost,
      trend: Object.entries(trendMap).map(([name, total]) => ({ name, total }))
        .sort((a,b) => (parseDate(a.name)?.getTime() || 0) - (parseDate(b.name)?.getTime() || 0)),
      tableRows, DATE_IDX, PARAM_IDX, REV_VAL_IDX
    };
  }, [revenueRows, costRows, startDate, endDate, selectedDate]);

  if (loading) return (
    <div className="p-20 text-center">
      <div className="w-12 h-12 border-4 border-brand-olive/20 border-t-brand-olive rounded-full animate-spin mx-auto mb-4"></div>
      <p className="text-slate-500 font-black uppercase tracking-[0.3em] animate-pulse">Synchronizing Data...</p>
    </div>
  );

  return (
    <div className="space-y-8 pb-20 animate-in fade-in duration-500">
      <header className="flex flex-col md:flex-row justify-between items-start gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 uppercase italic tracking-tighter">Profit <span className="text-brand-olive">Analysis</span></h1>
          <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mt-1 italic">Real-time Performance Metrics</p>
        </div>
        <div className="flex gap-2 bg-white p-2 rounded-xl border border-brand-brown/10 shadow-sm">
          <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="bg-brand-cream/20 text-[10px] text-slate-900 px-2 py-1.5 rounded-lg border border-brand-brown/10 focus:outline-none" />
          <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="bg-brand-cream/20 text-[10px] text-slate-900 px-2 py-1.5 rounded-lg border border-brand-brown/10 focus:outline-none" />
          <button onClick={() => {setStartDate(''); setEndDate(''); setSelectedDate(null); fetchData();}} className="text-[10px] bg-slate-200 hover:bg-slate-300 px-3 py-1.5 rounded-lg font-bold text-slate-700 transition-colors">Reset</button>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className={`p-8 rounded-[2rem] shadow-xl border-l-8 transition-all ${analytics.netProfit >= 0 ? 'bg-brand-olive/10 border-brand-olive text-brand-olive' : 'bg-brand-peach/10 border-brand-peach text-brand-peach'}`}>
          <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-2 italic">Net Profit (Revenue - Cost)</p>
          <h2 className="text-3xl font-black font-mono tracking-tighter">Rp {analytics.netProfit.toLocaleString()}</h2>
        </div>
        <div className="bg-white border border-brand-brown/10 p-8 rounded-[2rem] border-l-8 border-l-brand-olive shadow-sm">
          <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-2 italic">Total Revenue</p>
          <h2 className="text-2xl font-black text-slate-900 font-mono tracking-tighter">Rp {analytics.totalRev.toLocaleString()}</h2>
        </div>
        <div className="bg-white border border-brand-brown/10 p-8 rounded-[2rem] border-l-8 border-l-brand-peach shadow-sm">
          <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-2 italic">Total Cost</p>
          <h2 className="text-2xl font-black text-slate-900 font-mono tracking-tighter">Rp {analytics.totalCost.toLocaleString()}</h2>
        </div>
      </div>

      <div className="bg-white border border-brand-brown/10 p-8 rounded-[2.5rem] shadow-sm">
        <h3 className="text-slate-900 font-bold mb-8 uppercase tracking-widest text-xs flex items-center gap-3">
          <Icons.TrendingUp />
          Revenue Trend Evolution
          {selectedDate && (
            <button 
              onClick={() => setSelectedDate(null)}
              className="ml-auto text-[10px] bg-brand-olive/10 text-brand-olive px-3 py-1 rounded-full border border-brand-olive/20 hover:bg-brand-olive/20 transition-all"
            >
              Clear Filter: {formatDisplayDate(selectedDate)} &times;
            </button>
          )}
        </h3>
        <div className="h-[350px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart 
              data={analytics.trend}
              onClick={(d) => d && d.activeLabel && setSelectedDate(selectedDate === d.activeLabel ? null : d.activeLabel)}
              style={{ cursor: 'pointer' }}
            >
              <defs>
                <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8D8741" stopOpacity={0.2}/>
                  <stop offset="95%" stopColor="#8D8741" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis 
                dataKey="name" 
                stroke="#94a3b8" 
                fontSize={10} 
                tickFormatter={(val) => formatDisplayDate(val)} 
                tickLine={false} 
                axisLine={false} 
              />
              <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(val) => `Rp${(val/1000).toFixed(0)}k`} />
              <Tooltip 
                labelFormatter={(val) => formatDisplayDate(val)}
                contentStyle={{backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                itemStyle={{color: '#8D8741', fontWeight: 'bold'}}
              />
              <Area type="monotone" dataKey="total" stroke="#8D8741" fill="url(#colorRev)" strokeWidth={3} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Revenue Table Section */}
      <div className="bg-white border border-brand-brown/10 rounded-[2.5rem] overflow-hidden shadow-sm animate-in slide-in-from-top-4 duration-500">
        <div className="p-6 bg-brand-cream/20 border-b border-brand-brown/10 flex justify-between items-center">
          <h3 className="text-slate-900 font-bold uppercase tracking-widest text-xs italic">
            Revenue Details
            {selectedDate && <span className="ml-2 text-brand-olive normal-case font-medium tracking-normal"> (Filtered by {formatDisplayDate(selectedDate)})</span>}
          </h3>
          <span className="bg-white px-3 py-1.5 rounded-full text-[10px] text-slate-500 font-black tracking-widest border border-brand-brown/10">
            {analytics.tableRows.length} RECORDS
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-brand-cream/10">
              <tr>
                <th className="p-6 text-slate-500 uppercase font-black tracking-widest">Date</th>
                <th className="p-6 text-slate-500 uppercase font-black tracking-widest">Parameter</th>
                <th className="p-6 text-slate-500 uppercase font-black tracking-widest text-right">Revenue</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-brown/5">
              {analytics.tableRows.map((r, i) => (
                <tr key={i} className="hover:bg-brand-olive/5 transition-colors group">
                  <td className="p-6 text-slate-500 font-mono tracking-tighter">{formatDisplayDate(r[analytics.DATE_IDX])}</td>
                  <td className="p-6">
                    <span className="font-black text-slate-700 uppercase group-hover:text-brand-olive transition-colors tracking-widest">{r[analytics.PARAM_IDX]}</span>
                  </td>
                  <td className="p-6 text-right font-mono font-bold text-brand-olive">
                    Rp {parseIDRCurrency(r[analytics.REV_VAL_IDX]).toLocaleString('id-ID')}
                  </td>
                </tr>
              ))}
              {analytics.tableRows.length === 0 && (
                <tr>
                  <td colSpan={3} className="p-20 text-center text-slate-400 font-bold uppercase italic tracking-[0.3em] opacity-30">No revenue data found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default RevenueDashboard;
