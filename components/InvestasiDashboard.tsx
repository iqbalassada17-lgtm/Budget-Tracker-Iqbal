
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
          <h1 className="text-2xl font-black text-slate-900 uppercase italic tracking-tighter">Investasi</h1>
          <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mt-1 italic">Visualisasi Portofolio Investasi Iqbal</p>
        </div>
        <div className="flex items-center gap-3">
          <select 
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="bg-white border border-brand-brown/10 rounded-xl px-4 py-2.5 text-xs font-black text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-olive/50 uppercase tracking-widest"
          >
            <option value="ALL">SEMUA BULAN</option>
            {monthsOrder.map(m => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
          <button 
            onClick={fetchData}
            className="p-2.5 bg-white border border-brand-brown/10 rounded-xl text-slate-400 hover:text-brand-olive transition-colors shadow-lg active:scale-95"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>
      </header>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white border border-brand-brown/10 p-8 rounded-[2.5rem] border-l-8 border-l-brand-olive shadow-xl flex flex-col md:flex-row justify-between items-center gap-6">
          <div>
            <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-2 italic">Total Dana Investasi</p>
            <h2 className="text-4xl font-black text-slate-900 font-mono tracking-tighter">Rp {analytics.totalFund.toLocaleString()}</h2>
          </div>
          <div className="flex gap-4">
            <div className="bg-brand-olive/10 px-6 py-3 rounded-2xl border border-brand-olive/20 text-center">
              <p className="text-[8px] text-brand-olive font-black uppercase tracking-widest mb-1">Managers</p>
              <p className="text-slate-900 font-bold">{analytics.managerData.length}</p>
            </div>
            <div className="bg-brand-blue/10 px-6 py-3 rounded-2xl border border-brand-blue/20 text-center">
              <p className="text-[8px] text-brand-blue font-black uppercase tracking-widest mb-1">Asset Types</p>
              <p className="text-slate-900 font-bold">{analytics.typeData.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white border border-brand-brown/10 p-8 rounded-[2.5rem] border-l-8 border-l-brand-blue shadow-xl flex flex-col md:flex-row justify-between items-center gap-6">
          <div>
            <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-2 italic">Total Equity (Market Value)</p>
            <h2 className="text-4xl font-black text-brand-blue font-mono tracking-tighter">Rp {analytics.totalEquity.toLocaleString()}</h2>
          </div>
          <div className="bg-brand-blue/10 px-6 py-3 rounded-2xl border border-brand-blue/20 text-center">
            <p className="text-[8px] text-brand-blue font-black uppercase tracking-widest mb-1">Growth</p>
            <p className={`font-bold ${analytics.totalEquity - analytics.totalFund >= 0 ? 'text-brand-olive' : 'text-brand-peach'}`}>
              {analytics.totalFund > 0 ? (((analytics.totalEquity - analytics.totalFund) / analytics.totalFund) * 100).toFixed(2) : 0}%
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Manager Distribution Chart */}
        <div className="bg-white/80 border border-brand-brown/10 p-8 rounded-[2.5rem] backdrop-blur-md">
          <h3 className="text-slate-900 font-bold uppercase tracking-widest text-xs mb-8 flex items-center gap-2">
            <Icons.Masterdata /> Distribution by Fund Manager
          </h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={analytics.managerData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {analytics.managerData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px'}}
                  itemStyle={{fontWeight: 'bold'}}
                  formatter={(value: number) => `Rp ${value.toLocaleString()}`}
                />
                <Legend verticalAlign="bottom" height={36}/>
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Type Distribution Chart */}
        <div className="bg-white/80 border border-brand-brown/10 p-8 rounded-[2.5rem] backdrop-blur-md">
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-slate-900 font-bold uppercase tracking-widest text-xs flex items-center gap-2">
              <Icons.Analytics /> Distribution by Asset Type
            </h3>
            {selectedType && (
              <button 
                onClick={() => setSelectedType(null)}
                className="text-[9px] font-black text-brand-olive uppercase tracking-widest bg-brand-olive/10 px-3 py-1 rounded-lg border border-brand-olive/20 hover:bg-brand-olive hover:text-white transition-all"
              >
                Reset
              </button>
            )}
          </div>
          <div className="h-[300px]">
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
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={true} vertical={false} />
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" stroke="#94a3b8" fontSize={10} width={100} tickLine={false} axisLine={false} />
                <Tooltip 
                  cursor={{fill: 'rgba(0,0,0,0.02)'}}
                  contentStyle={{backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px'}}
                  itemStyle={{fontWeight: 'bold'}}
                  formatter={(value: number) => `Rp ${value.toLocaleString()}`}
                />
                <Bar dataKey="value" fill="#8D8741" radius={[0, 4, 4, 0]} className="cursor-pointer">
                  {analytics.typeData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fillOpacity={selectedType && entry.name !== selectedType ? 0.3 : 1}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <p className="text-center text-[9px] text-slate-500 font-bold uppercase tracking-widest mt-4 italic">
            💡 Tip: Klik batang untuk melihat detail database.
          </p>
        </div>
      </div>

      {/* Type Database Table */}
      {selectedType && (
        <div className="bg-white border border-brand-brown/10 rounded-[2.5rem] overflow-hidden shadow-xl animate-in slide-in-from-top-4 duration-500">
          <div className="p-6 bg-brand-cream/30 border-b border-brand-brown/10 flex justify-between items-center">
            <div>
              <h3 className="text-slate-900 font-black uppercase tracking-widest text-xs">Asset Database: <span className="text-brand-olive">{selectedType}</span></h3>
              <p className="text-slate-500 text-[9px] uppercase font-bold mt-1 tracking-widest italic">Data Mentah dari Spreadsheet Investasi</p>
            </div>
            <button onClick={() => setSelectedType(null)} className="text-slate-500 hover:text-brand-olive transition-colors">
              <Icons.Close />
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[10px]">
              <thead className="bg-brand-cream/20">
                <tr>
                  <th className="p-4 text-slate-500 uppercase font-black tracking-widest">Bulan</th>
                  <th className="p-4 text-slate-500 uppercase font-black tracking-widest">Manager</th>
                  <th className="p-4 text-slate-500 uppercase font-black tracking-widest text-right">Fund (Invest)</th>
                  <th className="p-4 text-slate-500 uppercase font-black tracking-widest text-right">Equity (Market)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-brown/5">
                {typeTransactions.map((row, i) => (
                  <tr key={i} className="hover:bg-brand-olive/5 transition-all group">
                    <td className="p-4 font-bold text-slate-700">{row[0]}</td>
                    <td className="p-4 text-slate-600">{row[2]}</td>
                    <td className="p-4 text-right font-mono text-slate-600">Rp {parseNum(row[3]).toLocaleString()}</td>
                    <td className="p-4 text-right font-mono text-brand-blue font-bold">Rp {parseNum(row[5]).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Trend Chart */}
      <div className="bg-white/80 border border-brand-brown/10 p-8 rounded-[2.5rem] backdrop-blur-md">
        <h3 className="text-slate-900 font-bold uppercase tracking-widest text-xs mb-8 flex items-center gap-2">
          <Icons.TrendingUp /> Investment & Equity Trend by Month
        </h3>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={analytics.monthData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} />
              <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(val) => `Rp${(val/1000000).toFixed(0)}M`} />
              <Tooltip 
                contentStyle={{backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px'}}
                itemStyle={{fontWeight: 'bold'}}
                formatter={(value: number) => `Rp ${value.toLocaleString()}`}
              />
              <Legend />
              <Line name="Total Fund" type="monotone" dataKey="fund" stroke="#8D8741" strokeWidth={4} dot={{ r: 6, fill: '#8D8741' }} activeDot={{ r: 8 }} />
              <Line name="Total Equity" type="monotone" dataKey="equity" stroke="#659DBD" strokeWidth={4} dot={{ r: 6, fill: '#659DBD' }} activeDot={{ r: 8 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default InvestasiDashboard;
