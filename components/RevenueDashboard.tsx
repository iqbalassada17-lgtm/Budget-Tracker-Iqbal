
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
          <h1 className="text-3xl font-black text-white uppercase italic tracking-tighter">Profit <span className="text-brand-olive">Dynamics</span></h1>
          <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.4em] mt-1 italic">Tactical Fiscal Analysis • Live Margin Tracking</p>
        </div>
        <div className="flex gap-2 bg-slate-900/40 p-2.5 rounded-2xl border border-slate-800 backdrop-blur-xl shadow-2xl">
          <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="bg-slate-950/60 text-[10px] font-black text-white px-3 py-2 rounded-xl border border-slate-800 focus:outline-none focus:ring-1 focus:ring-brand-olive/50 shadow-inner" />
          <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="bg-slate-950/60 text-[10px] font-black text-white px-3 py-2 rounded-xl border border-slate-800 focus:outline-none focus:ring-1 focus:ring-brand-olive/50 shadow-inner" />
          <button onClick={() => {setStartDate(''); setEndDate(''); setSelectedDate(null); fetchData();}} className="text-[10px] bg-slate-800 hover:bg-slate-700 px-4 py-2 rounded-xl font-black text-slate-400 hover:text-white transition-all uppercase tracking-widest italic border border-slate-700">Reset</button>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className={`p-10 rounded-[3.5rem] shadow-2xl border-l-8 transition-all backdrop-blur-md ${analytics.netProfit >= 0 ? 'bg-brand-olive/5 border-brand-olive text-brand-olive' : 'bg-brand-peach/5 border-brand-peach text-brand-peach'}`}>
          <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.3em] mb-3 italic">Net Yield Surplus</p>
          <h2 className="text-4xl font-black font-mono tracking-tighter italic">Rp {analytics.netProfit.toLocaleString()}</h2>
        </div>
        <div className="bg-slate-900/60 border border-slate-800 p-10 rounded-[3.5rem] border-l-8 border-l-brand-blue shadow-2xl backdrop-blur-md">
          <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.3em] mb-3 italic">Gross Revenue Flow</p>
          <h2 className="text-3xl font-black text-white font-mono tracking-tighter italic">Rp {analytics.totalRev.toLocaleString()}</h2>
        </div>
        <div className="bg-slate-900/60 border border-slate-800 p-10 rounded-[3.5rem] border-l-8 border-l-brand-peach shadow-2xl backdrop-blur-md">
          <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.3em] mb-3 italic">Total Expenditure</p>
          <h2 className="text-3xl font-black text-white font-mono tracking-tighter italic">Rp {analytics.totalCost.toLocaleString()}</h2>
        </div>
      </div>

      <div className="bg-slate-900/40 border border-slate-800 p-12 rounded-[3.5rem] backdrop-blur-xl shadow-2xl">
        <h3 className="text-white font-black mb-10 uppercase tracking-[0.3em] text-[10px] flex items-center gap-4 italic opacity-80">
          <Icons.TrendingUp />
          Temporal Revenue Velocity
          {selectedDate && (
            <button 
              onClick={() => setSelectedDate(null)}
              className="ml-auto text-[10px] bg-brand-olive/10 text-brand-olive px-4 py-1.5 rounded-full border border-brand-olive/20 hover:bg-brand-olive/20 transition-all font-black italic tracking-widest"
            >
              Filter Active: {formatDisplayDate(selectedDate)} &times;
            </button>
          )}
        </h3>
        <div className="h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart 
              data={analytics.trend}
              onClick={(d) => d && d.activeLabel && setSelectedDate(selectedDate === d.activeLabel ? null : d.activeLabel)}
              style={{ cursor: 'pointer' }}
            >
              <defs>
                <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10B981" stopOpacity={0.2}/>
                  <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
              <XAxis 
                dataKey="name" 
                stroke="#64748b" 
                fontSize={10} 
                tickFormatter={(val) => formatDisplayDate(val)} 
                tickLine={false} 
                axisLine={false} 
                fontStyle="italic"
                fontWeight="bold"
              />
              <YAxis stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(val) => `Rp${(val/1000).toFixed(0)}k`} fontStyle="italic" fontWeight="bold" />
              <Tooltip 
                labelFormatter={(val) => formatDisplayDate(val)}
                contentStyle={{backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '16px', fontSize: '12px', color: '#fff'}}
                itemStyle={{color: '#10B981', fontWeight: '900', textTransform: 'uppercase'}}
              />
              <Area type="monotone" dataKey="total" stroke="#10B981" fill="url(#colorRev)" strokeWidth={4} dot={{ r: 4, fill: '#10B981' }} activeDot={{ r: 8, shadow: '0 0 15px #10b981' }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Revenue Table Section */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-[3rem] overflow-hidden shadow-2xl animate-in slide-in-from-top-4 duration-500 backdrop-blur-md">
        <div className="p-8 bg-slate-950/40 border-b border-slate-800 flex justify-between items-center">
          <h3 className="text-white font-black uppercase tracking-[0.3em] text-[10px] italic">
            Transactional Database
            {selectedDate && <span className="ml-3 text-brand-olive lowercase font-black tracking-widest"> [ Period Lock: {formatDisplayDate(selectedDate)} ]</span>}
          </h3>
          <span className="bg-slate-800 px-4 py-2 rounded-xl text-[10px] text-slate-400 font-black tracking-[0.2em] border border-slate-700 italic">
            {analytics.tableRows.length} DATA_POINTS
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[10px]">
            <thead className="bg-slate-950/40">
              <tr>
                <th className="p-6 text-slate-500 uppercase font-black tracking-[0.3em] italic">Timeline</th>
                <th className="p-6 text-slate-500 uppercase font-black tracking-[0.3em] italic">Origin / Parameter</th>
                <th className="p-6 text-slate-500 uppercase font-black tracking-[0.3em] italic text-right">Inflow Value</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {analytics.tableRows.map((r, i) => (
                <tr key={i} className="hover:bg-slate-800/40 transition-all group">
                  <td className="p-6 text-slate-400 font-black italic tracking-tighter">{formatDisplayDate(r[analytics.DATE_IDX])}</td>
                  <td className="p-6">
                    <span className="font-black text-slate-300 uppercase group-hover:text-brand-olive transition-colors tracking-widest italic">{r[analytics.PARAM_IDX]}</span>
                  </td>
                  <td className="p-6 text-right font-mono font-black text-brand-olive text-sm italic">
                    Rp {parseIDRCurrency(r[analytics.REV_VAL_IDX]).toLocaleString('id-ID')}
                  </td>
                </tr>
              ))}
              {analytics.tableRows.length === 0 && (
                <tr>
                  <td colSpan={3} className="p-24 text-center text-slate-600 font-black uppercase italic tracking-[0.5em] opacity-30">Null Database Response</td>
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
