
import React, { useState, useEffect, useMemo } from 'react';
import { 
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Legend, Cell, PieChart, Pie, LineChart, Line
} from 'recharts';
import { Icons, COLORS } from '../constants';
import { fetchFromGoogleSheet } from '../services/spreadsheetService';

const CHART_COLORS = ['#8D8741', '#DAAD86', '#659DBD', '#BC986A', '#FBEEC1', '#8D8741'];

const InvestasiDashboard: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<any[][]>([]);
  const [error, setError] = useState<string | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<string>('ALL');
  const [selectedType, setSelectedType] = useState<string | null>(null);

  const monthsOrder = ["JANUARI", "FEBRUARI", "MARET", "APRIL", "MEI", "JUNI", "JULI", "AGUSTUS", "SEPTEMBER", "OKTOBER", "NOVEMBER", "DESEMBER"];

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchFromGoogleSheet('INVESTASI');
      if (data && data.length > 0) {
        setRows(data.slice(1));
      }
    } catch (err: any) {
      setError("Gagal sinkronisasi data Investasi.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const parseNum = (v: any) => {
    if (v === undefined || v === null || v === '') return 0;
    if (typeof v === 'number') return v;
    
    let str = v.toString().replace(/Rp|IDR|\s/g, "");
    
    const hasMultipleDots = (str.match(/\./g) || []).length > 1;
    const hasComma = str.includes(',');
    
    if (hasMultipleDots || (hasComma && str.indexOf('.') < str.indexOf(','))) {
      str = str.replace(/\./g, "").replace(/,/g, ".");
    } else {
      str = str.replace(/,/g, "");
    }
    
    return parseFloat(str) || 0;
  };

  const analytics = useMemo(() => {
    const filteredRows = rows.filter(r => {
      if (selectedMonth === 'ALL') return true;
      return (r[0] || '').toString().toUpperCase() === selectedMonth;
    });

    const totalFund = filteredRows.reduce((acc, r) => acc + parseNum(r[3]), 0);
    const totalEquity = filteredRows.reduce((acc, r) => acc + parseNum(r[5]), 0);

    // Distribution by Manager
    const managerMap: Record<string, number> = {};
    // Distribution by Type
    const typeMap: Record<string, number> = {};
    // Trend by Month
    const monthMap: Record<string, { fund: number, equity: number }> = {};

    filteredRows.forEach(r => {
      const bulan = (r[0] || 'UNKNOWN').toString().toUpperCase();
      const type = (r[1] || 'UNKNOWN').toString().toUpperCase();
      const manager = (r[2] || 'UNKNOWN').toString().toUpperCase();
      const fund = parseNum(r[3]);
      const equity = parseNum(r[5]);

      managerMap[manager] = (managerMap[manager] || 0) + fund;
      typeMap[type] = (typeMap[type] || 0) + fund;
      
      if (!monthMap[bulan]) monthMap[bulan] = { fund: 0, equity: 0 };
      monthMap[bulan].fund += fund;
      monthMap[bulan].equity += equity;
    });

    const managerData = Object.entries(managerMap).map(([name, value]) => ({ name, value }));
    const typeData = Object.entries(typeMap).map(([name, value]) => ({ name, value }));
    
    const monthData = Object.entries(monthMap)
      .map(([name, data]) => ({ name, fund: data.fund, equity: data.equity }))
      .sort((a, b) => monthsOrder.indexOf(a.name) - monthsOrder.indexOf(b.name));

    return {
      totalFund,
      totalEquity,
      managerData,
      typeData,
      monthData
    };
  }, [rows, selectedMonth]);

  const typeTransactions = useMemo(() => {
    if (!selectedType) return [];
    return rows.filter(r => (r[1] || '').toString().toUpperCase() === selectedType);
  }, [selectedType, rows]);

  if (loading) return (
    <div className="p-20 text-center">
      <div className="w-12 h-12 border-4 border-brand-olive/20 border-t-brand-olive rounded-full animate-spin mx-auto mb-4"></div>
      <p className="text-slate-500 font-black uppercase tracking-[0.3em] animate-pulse">Analyzing Investments...</p>
    </div>
  );

  return (
    <div className="space-y-8 pb-20 animate-in fade-in duration-700">
      <header className="flex flex-col md:flex-row justify-between items-start gap-4">
        <div>
          <h1 className="text-3xl font-black text-white uppercase italic tracking-tighter">
            Capital <span className="text-brand-olive">Deployment</span>
          </h1>
          <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.4em] mt-1 italic">Portfolio Analytics • Real-time Valuation</p>
        </div>
        <div className="flex items-center gap-3 bg-slate-900/40 p-2 rounded-2xl border border-slate-800 backdrop-blur-xl shadow-2xl">
          <select 
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="bg-slate-950/60 border border-slate-800 rounded-xl px-5 py-2.5 text-[10px] font-black text-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-olive/50 uppercase tracking-widest shadow-inner"
          >
            <option value="ALL">ALL PERIODS</option>
            {monthsOrder.map(m => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
          <button 
            onClick={fetchData}
            className="p-3 bg-slate-800 border border-slate-700 rounded-xl text-slate-400 hover:text-brand-olive transition-all shadow-xl active:scale-95"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>
      </header>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-slate-900/60 border border-slate-800 p-10 rounded-[3.5rem] border-l-8 border-l-brand-olive shadow-2xl backdrop-blur-md flex flex-col md:flex-row justify-between items-center gap-8 group relative overflow-hidden">
          <div className="relative z-10">
            <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.3em] mb-2 italic">Aggregated Principal</p>
            <h2 className="text-4xl font-black text-white font-mono tracking-tighter italic">Rp {analytics.totalFund.toLocaleString()}</h2>
          </div>
          <div className="flex gap-4 relative z-10">
            <div className="bg-slate-950/60 px-6 py-4 rounded-2xl border border-slate-800 text-center shadow-inner">
              <p className="text-[8px] text-brand-olive font-black uppercase tracking-widest mb-1 italic opacity-80">Managers</p>
              <p className="text-white font-black italic">{analytics.managerData.length}</p>
            </div>
            <div className="bg-slate-950/60 px-6 py-4 rounded-2xl border border-slate-800 text-center shadow-inner">
              <p className="text-[8px] text-brand-blue font-black uppercase tracking-widest mb-1 italic opacity-80">Sectors</p>
              <p className="text-white font-black italic">{analytics.typeData.length}</p>
            </div>
          </div>
          <div className="absolute -bottom-6 -right-6 opacity-5 group-hover:scale-110 transition-transform duration-500 text-brand-olive pointer-events-none">
            <Icons.Growth size={120} />
          </div>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 p-10 rounded-[3.5rem] border-l-8 border-l-brand-blue shadow-2xl backdrop-blur-md flex flex-col md:flex-row justify-between items-center gap-8 group relative overflow-hidden">
          <div className="relative z-10">
            <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.3em] mb-2 italic">Current Equity Value</p>
            <h2 className="text-4xl font-black text-brand-blue font-mono tracking-tighter italic">Rp {analytics.totalEquity.toLocaleString()}</h2>
          </div>
          <div className="bg-slate-950/60 px-8 py-4 rounded-2xl border border-slate-800 text-center shadow-inner relative z-10">
            <p className="text-[8px] text-brand-blue font-black uppercase tracking-widest mb-1 italic opacity-80">Portfolio Yield</p>
            <p className={`font-black text-lg italic ${analytics.totalEquity - analytics.totalFund >= 0 ? 'text-brand-olive' : 'text-brand-peach'}`}>
              {analytics.totalFund > 0 ? (((analytics.totalEquity - analytics.totalFund) / analytics.totalFund) * 100).toFixed(2) : 0}%
            </p>
          </div>
          <div className="absolute -bottom-6 -right-6 opacity-5 group-hover:scale-110 transition-transform duration-500 text-brand-blue pointer-events-none">
            <Icons.TrendingUp size={120} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Manager Distribution Chart */}
        <div className="bg-slate-900/40 border border-slate-800 p-10 rounded-[3.5rem] backdrop-blur-xl shadow-2xl">
          <h3 className="text-white font-black uppercase tracking-[0.3em] text-[10px] mb-10 flex items-center gap-3 italic opacity-80">
            <Icons.Masterdata /> Custodian Distribution Log
          </h3>
          <div className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={analytics.managerData}
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={110}
                  paddingAngle={8}
                  dataKey="value"
                  stroke="none"
                >
                  {analytics.managerData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} shadow="0 10px 20px rgba(0,0,0,0.5)" />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '16px', fontSize: '12px', color: '#fff'}}
                  itemStyle={{fontWeight: '900', textTransform: 'uppercase'}}
                  formatter={(value: number) => `Rp ${value.toLocaleString()}`}
                />
                <Legend verticalAlign="bottom" height={36} iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Type Distribution Chart */}
        <div className="bg-slate-900/40 border border-slate-800 p-10 rounded-[3.5rem] backdrop-blur-xl shadow-2xl">
          <div className="flex justify-between items-center mb-10">
            <h3 className="text-white font-black uppercase tracking-[0.3em] text-[10px] flex items-center gap-3 italic opacity-80">
              <Icons.Analytics /> Strategic Asset Allocation
            </h3>
            {selectedType && (
              <button 
                onClick={() => setSelectedType(null)}
                className="text-[9px] font-black text-brand-olive uppercase tracking-widest bg-brand-olive/10 px-4 py-1.5 rounded-xl border border-brand-olive/20 hover:bg-brand-olive hover:text-white transition-all italic shadow-lg"
              >
                Reset Stream
              </button>
            )}
          </div>
          <div className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart 
                data={analytics.typeData} 
                layout="vertical"
                onClick={(data) => {
                  if (data && data.activeLabel) {
                    setSelectedType(data.activeLabel === selectedType ? null : data.activeLabel);
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
                  formatter={(value: number) => `Rp ${value.toLocaleString()}`}
                />
                <Bar dataKey="value" fill="#10B981" radius={[0, 8, 8, 0]} className="cursor-pointer">
                  {analytics.typeData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fillOpacity={selectedType && entry.name !== selectedType ? 0.2 : 1}
                      fill={CHART_COLORS[index % CHART_COLORS.length]}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <p className="text-center text-[9px] text-slate-600 font-black uppercase tracking-[0.3em] mt-6 italic opacity-50">
            Click segments for vertical data stream
          </p>
        </div>
      </div>

      {/* Type Database Table */}
      {selectedType && (
        <div className="bg-slate-900/60 border border-slate-800 rounded-[3rem] overflow-hidden shadow-2xl animate-in slide-in-from-top-4 duration-500 backdrop-blur-md">
          <div className="p-8 bg-slate-950/40 border-b border-slate-800 flex justify-between items-center">
            <div>
              <h3 className="text-white font-black uppercase tracking-[0.3em] text-xs italic">Asset Stream: <span className="text-brand-olive">{selectedType}</span></h3>
              <p className="text-slate-500 text-[9px] uppercase font-black mt-1 tracking-[0.3em] italic">Granular Database Extraction</p>
            </div>
            <button onClick={() => setSelectedType(null)} className="text-slate-500 hover:text-white transition-colors p-2 bg-slate-800 rounded-xl">
              <Icons.Close />
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[10px]">
              <thead className="bg-slate-950/40">
                <tr>
                  <th className="p-6 text-slate-500 uppercase font-black tracking-[0.2em] italic">Period</th>
                  <th className="p-6 text-slate-500 uppercase font-black tracking-[0.2em] italic">Fund Manager</th>
                  <th className="p-6 text-slate-500 uppercase font-black tracking-[0.2em] italic text-right">Principal Invested</th>
                  <th className="p-6 text-slate-500 uppercase font-black tracking-[0.2em] italic text-right">Market Equity</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {typeTransactions.map((row, i) => (
                  <tr key={i} className="hover:bg-slate-800/40 transition-all group">
                    <td className="p-6 font-black text-slate-300 italic">{row[0]}</td>
                    <td className="p-6 text-slate-500 font-black uppercase tracking-widest italic">{row[2]}</td>
                    <td className="p-6 text-right font-mono text-slate-400 font-black italic">Rp {parseNum(row[3]).toLocaleString()}</td>
                    <td className="p-6 text-right font-mono text-brand-blue font-black italic text-sm">Rp {parseNum(row[5]).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Trend Chart */}
      <div className="bg-slate-900/40 border border-slate-800 p-12 rounded-[3.5rem] backdrop-blur-xl shadow-2xl">
        <h3 className="text-white font-black uppercase tracking-[0.3em] text-[10px] mb-12 flex items-center gap-3 italic opacity-80">
          <Icons.TrendingUp /> Temporal Equity Trajectory
        </h3>
        <div className="h-[350px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={analytics.monthData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
              <XAxis dataKey="name" stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} fontStyle="italic" fontWeight="bold" />
              <YAxis stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(val) => `Rp${(val/1000000).toFixed(0)}M`} fontStyle="italic" fontWeight="bold" />
              <Tooltip 
                contentStyle={{backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '16px', fontSize: '12px', color: '#fff'}}
                itemStyle={{fontWeight: '900', textTransform: 'uppercase'}}
                formatter={(value: number) => `Rp ${value.toLocaleString()}`}
              />
              <Legend iconType="rect" />
              <Line name="Principal Stream" type="monotone" dataKey="fund" stroke="#10B981" strokeWidth={5} dot={{ r: 6, fill: '#10B981', strokeWidth: 2, stroke: '#020617' }} activeDot={{ r: 10, shadow: '0 0 20px #10b981' }} />
              <Line name="Equity Valuation" type="monotone" dataKey="equity" stroke="#3B82F6" strokeWidth={5} dot={{ r: 6, fill: '#3B82F6', strokeWidth: 2, stroke: '#020617' }} activeDot={{ r: 10, shadow: '0 0 20px #3b82f6' }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default InvestasiDashboard;
