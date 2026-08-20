
import React, { useState, useEffect, useMemo } from 'react';
import { 
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Legend, Cell
} from 'recharts';
import { Icons } from '../constants';
import { fetchFromGoogleSheet } from '../services/spreadsheetService';

const StockbitDashboard: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<any[][]>([]);
  const [error, setError] = useState<string | null>(null);
  const [selectedTicker, setSelectedTicker] = useState<string | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<string>('ALL');

  const monthsOrder = ["JANUARI", "FEBRUARI", "MARET", "APRIL", "MEI", "JUNI", "JULI", "AGUSTUS", "SEPTEMBER", "OKTOBER", "NOVEMBER", "DESEMBER"];
  const INDO_MONTHS = ["JANUARI", "FEBRUARI", "MARET", "APRIL", "MEI", "JUNI", "JULI", "AGUSTUS", "SEPTEMBER", "OKTOBER", "NOVEMBER", "DESEMBER"];

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchFromGoogleSheet('STOCKBIT');
      if (data && data.length > 0) {
        setRows(data.slice(1));
      }
    } catch (err: any) {
      setError("Gagal sinkronisasi data Stockbit.");
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
    
    // Check if it's using Indonesian format (1.000,00) or US format (1,000.00)
    // If there's a comma and a dot, we need to be careful.
    // If there's only a comma, it might be a decimal separator (ID) or a thousand separator (US).
    
    // Simple heuristic: if there are multiple dots, it's likely thousand separators (ID).
    // If there's a dot followed by 2 digits at the end, it's likely a decimal separator (US).
    
    const hasMultipleDots = (str.match(/\./g) || []).length > 1;
    const hasComma = str.includes(',');
    
    if (hasMultipleDots || (hasComma && str.indexOf('.') < str.indexOf(','))) {
      // Likely Indonesian: 1.000.000,00
      str = str.replace(/\./g, "").replace(/,/g, ".");
    } else {
      // Likely US or clean: 1,000,000.00
      str = str.replace(/,/g, "");
    }
    
    return parseFloat(str) || 0;
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

  const analytics = useMemo(() => {
    const filteredRows = rows.filter(r => {
      if (selectedMonth === 'ALL') return true;
      const dateStr = (r[0] || '').toString().trim();
      
      // Split by / or - to be flexible
      const parts = dateStr.split(/[\/\-]/);
      if (parts.length < 2) return false;
      
      // The month is the middle part (index 1) in DD/MM/YYYY
      const monthPart = parts[1];
      const monthNum = parseInt(monthPart, 10);
      
      if (isNaN(monthNum) || monthNum < 1 || monthNum > 12) return false;
      
      return INDO_MONTHS[monthNum - 1] === selectedMonth;
    });

    const totalBuy = filteredRows.reduce((acc, r) => acc + (r[2]?.toString().trim().toUpperCase() === 'BUY' ? parseNum(r[5]) : 0), 0);
    const totalSell = filteredRows.reduce((acc, r) => acc + (r[2]?.toString().trim().toUpperCase() === 'SELL' ? parseNum(r[6]) : 0), 0);
    const totalTax = filteredRows.reduce((acc, r) => acc + parseNum(r[7]), 0);

    const stockMap: Record<string, { buy: number, sell: number, tax: number, volume: number }> = {};
    filteredRows.forEach(r => {
      const ticker = (r[1] || 'UNKNOWN').toString().trim().toUpperCase();
      const side = (r[2] || '').toString().trim().toUpperCase();
      if (!stockMap[ticker]) stockMap[ticker] = { buy: 0, sell: 0, tax: 0, volume: 0 };
      
      const tax = parseNum(r[7]);
      stockMap[ticker].tax += tax;

      if (side === 'BUY') {
        stockMap[ticker].buy += parseNum(r[5]);
      } else if (side === 'SELL') {
        stockMap[ticker].sell += parseNum(r[6]);
      }
      stockMap[ticker].volume += parseNum(r[3]);
    });

    const stockStats = Object.entries(stockMap).map(([name, data]) => {
      const netVariance = data.sell - data.buy - data.tax;
      const growthPercent = data.buy > 0 ? (netVariance / data.buy) * 100 : 0;
      return {
        name,
        ...data,
        netVariance,
        growthPercent
      };
    }).sort((a, b) => b.netVariance - a.netVariance);

    return {
      totalBuy,
      totalSell,
      netPnL: totalSell - totalBuy - totalTax,
      stockStats
    };
  }, [rows, selectedMonth]);

  // Data yang ditampilkan di tabel (raw transactions untuk ticker yang dipilih)
  const tickerTransactions = useMemo(() => {
    if (!selectedTicker) return [];
    return rows.filter(r => (r[1] || '').toString().trim().toUpperCase() === selectedTicker)
      .sort((a, b) => {
        const dateA = parseDate(a[0])?.getTime() || 0;
        const dateB = parseDate(b[0])?.getTime() || 0;
        return dateB - dateA;
      });
  }, [selectedTicker, rows]);

  if (loading) return (
    <div className="p-20 text-center">
      <div className="w-12 h-12 border-4 border-sky-500/20 border-t-sky-500 rounded-full animate-spin mx-auto mb-4"></div>
      <p className="text-slate-500 font-black uppercase tracking-[0.3em] animate-pulse">Calculating Performance...</p>
    </div>
  );

  return (
    <div className="space-y-8 pb-20 animate-in fade-in duration-700">
      <header className="flex flex-col md:flex-row justify-between items-start gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 uppercase italic tracking-tighter">Stockbit <span className="text-brand-blue">Portfolio</span></h1>
          <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mt-1 italic">Klik pada grafik untuk melihat detail performa per saham</p>
        </div>
        <div className="flex items-center gap-3">
          <select 
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-xs font-black text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-blue/50 uppercase tracking-widest italic"
          >
            <option value="ALL">ALL NODES</option>
            {monthsOrder.map(m => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
          <button 
            onClick={fetchData}
            className="p-2.5 bg-slate-900 border border-slate-800 rounded-xl text-slate-500 hover:text-brand-blue transition-colors shadow-2xl active:scale-95"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>
      </header>

      {/* Overview Cards Removed */}

      {/* Chart Section */}
      <div className="bg-slate-900/40 border border-slate-800 p-8 rounded-[2.5rem] shadow-2xl backdrop-blur-md">
        <div className="flex justify-between items-center mb-8">
            <h3 className="text-white font-bold uppercase tracking-widest text-xs flex items-center gap-2 italic">
            <Icons.Growth /> Net Variance Distribution by Ticker
            </h3>
            {selectedTicker && (
                <button 
                    onClick={() => setSelectedTicker(null)}
                    className="text-[9px] font-black text-brand-blue uppercase tracking-widest bg-brand-blue/10 px-4 py-2 rounded-xl border border-brand-blue/20 hover:bg-brand-blue hover:text-white transition-all italic"
                >
                    Reset Selection
                </button>
            )}
        </div>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart 
                data={analytics.stockStats}
                onClick={(data) => {
                    if (data && data.activeLabel) {
                        setSelectedTicker(data.activeLabel === selectedTicker ? null : data.activeLabel);
                    }
                }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
              <XAxis dataKey="name" stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
              <YAxis stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
              <Tooltip 
                cursor={{fill: 'rgba(255,255,255,0.02)'}}
                contentStyle={{backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px', color: '#fff'}}
                itemStyle={{fontWeight: 'bold', color: '#fff'}}
              />
              <Bar dataKey="netVariance" name="Net Variance" radius={[4, 4, 0, 0]} className="cursor-pointer">
                {analytics.stockStats.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={entry.netVariance >= 0 ? '#8D8741' : '#DAAD86'} 
                    fillOpacity={selectedTicker && entry.name !== selectedTicker ? 0.3 : 1}
                    stroke={selectedTicker === entry.name ? '#659DBD' : 'transparent'}
                    strokeWidth={2}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <p className="text-center text-[9px] text-slate-500 font-black uppercase tracking-widest mt-6 italic">
            💡 Tip: Click on a bar node to decrypt variance specifics.
        </p>
      </div>

      {/* Stock Variance Table - Conditional Rendering */}
      {selectedTicker && (
        <div className="bg-slate-900/40 border border-slate-800 rounded-[2.5rem] overflow-hidden shadow-2xl animate-in slide-in-from-top-4 duration-500 backdrop-blur-md">
            <div className="p-8 bg-slate-950/40 border-b border-slate-800 flex justify-between items-center">
            <div>
                <h3 className="text-white font-black uppercase tracking-widest text-xs italic">Transaction Protocol: <span className="text-brand-blue">{selectedTicker}</span></h3>
                <p className="text-slate-500 text-[9px] uppercase font-black mt-1 tracking-[0.3em] italic">Decrypted Feed from Central Ledger</p>
            </div>
            <button 
                onClick={() => setSelectedTicker(null)}
                className="text-slate-500 hover:text-brand-blue transition-colors"
            >
                <Icons.Close />
            </button>
            </div>
            <div className="overflow-x-auto">
            <table className="w-full text-left text-[10px]">
                <thead className="bg-slate-950/60 text-slate-500 border-b border-slate-800">
                <tr>
                    <th className="p-6 uppercase font-black tracking-widest italic">Timestamp</th>
                    <th className="p-6 uppercase font-black tracking-widest italic">Protocol</th>
                    <th className="p-6 uppercase font-black tracking-widest italic text-right">Volume</th>
                    <th className="p-6 uppercase font-black tracking-widest italic text-right">Node Price</th>
                    <th className="p-6 uppercase font-black tracking-widest italic text-right">Buy Value</th>
                    <th className="p-6 uppercase font-black tracking-widest italic text-right">Sell Value</th>
                    <th className="p-6 uppercase font-black tracking-widest italic text-right">System Tax</th>
                </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/40">
                {tickerTransactions.map((row, i) => (
                    <tr key={i} className="hover:bg-slate-800/20 transition-all group">
                        <td className="p-6 font-mono text-slate-400 font-black italic">{formatDisplayDate(row[0])}</td>
                        <td className="p-6">
                            <span className={`px-3 py-1 rounded-lg font-black text-[9px] italic tracking-widest ${
                                row[2]?.toString().toUpperCase() === 'BUY' 
                                    ? 'bg-brand-olive/10 text-brand-olive border border-brand-olive/20' 
                                    : 'bg-brand-peach/10 text-brand-peach border border-brand-peach/20'
                            }`}>
                                {row[2]}
                            </span>
                        </td>
                        <td className="p-6 text-right font-mono text-slate-400 font-black italic">{parseNum(row[3]).toLocaleString()}</td>
                        <td className="p-6 text-right font-mono text-slate-400 font-black italic">Rp {parseNum(row[4]).toLocaleString()}</td>
                        <td className="p-6 text-right font-mono text-brand-olive font-black italic">
                            {parseNum(row[5]) > 0 ? `Rp ${parseNum(row[5]).toLocaleString()}` : '-'}
                        </td>
                        <td className="p-6 text-right font-mono text-brand-peach font-black italic">
                            {parseNum(row[6]) > 0 ? `Rp ${parseNum(row[6]).toLocaleString()}` : '-'}
                        </td>
                        <td className="p-6 text-right font-mono text-slate-600 italic font-black">
                            {parseNum(row[7]) > 0 ? `Rp ${parseNum(row[7]).toLocaleString()}` : '-'}
                        </td>
                    </tr>
                ))}
                </tbody>
            </table>
            </div>
            <div className="p-6 bg-slate-950/40 border-t border-slate-800 text-center">
            <p className="text-[9px] text-slate-500 font-black uppercase tracking-[0.4em] leading-relaxed italic">
                Processed {tickerTransactions.length} transaction nodes for {selectedTicker}.
            </p>
            </div>
        </div>
      )}
    </div>
  );
};

export default StockbitDashboard;
