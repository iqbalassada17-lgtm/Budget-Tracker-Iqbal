
import React, { useState, useEffect, useMemo } from 'react';
import { Icons } from '../constants';
import { fetchFromGoogleSheet } from '../services/spreadsheetService';

interface BudgetEntry {
  month: string;
  week: string;
  category: string;
  allocated: number;
  spent: number;
  status: 'Safe' | 'Warning' | 'Over';
}

const RawDataBudget: React.FC = () => {
  const [allBudgetItems, setAllBudgetItems] = useState<BudgetEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<string>('');
  const [selectedWeek, setSelectedWeek] = useState<string>('');

  const parseIDRCurrency = (value: any): number => {
    if (value === undefined || value === null) return 0;
    if (typeof value === 'number') return value;
    let clean = value.toString().replace(/Rp|IDR|\s/g, "");
    if (clean.includes(',') && clean.includes('.')) {
      clean = clean.replace(/\./g, "").replace(/,/g, ".");
    } else if (clean.includes(',')) {
      clean = clean.replace(/,/g, ".");
    } else if (clean.includes('.')) {
      const parts = clean.split('.');
      if (parts.length > 1 && parts[parts.length - 1].length === 3) {
        clean = clean.replace(/\./g, "");
      }
    }
    const parsed = parseFloat(clean);
    return isNaN(parsed) ? 0 : parsed;
  };

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      // Mengambil data Cost untuk realisasi
      const costRowsRaw = await fetchFromGoogleSheet('INPUT COST');
      const costRows = costRowsRaw.slice(1);

      const realizationMap: Record<string, number> = {};
      costRows.forEach(row => {
        const coa = (row[4] || 'UNCATEGORIZED').toString().toUpperCase();
        const costVal = parseIDRCurrency(row[5] || "0");
        realizationMap[coa] = (realizationMap[coa] || 0) + costVal;
      });

      // Mengambil data Budget
      const budgetRowsRaw = await fetchFromGoogleSheet('BUDGET');
      const budgetRows = budgetRowsRaw.slice(1);

      const mergedBudget: BudgetEntry[] = budgetRows.map(row => {
        const month = (row[0] || 'UNKNOWN').toString();
        const week = (row[1] || 'UNKNOWN').toString();
        const category = (row[3] || 'UNKNOWN').toString().toUpperCase();
        const allocated = parseIDRCurrency(row[4] || "0");
        const spent = realizationMap[category] || 0;
        
        let status: 'Safe' | 'Warning' | 'Over' = 'Safe';
        const ratio = allocated > 0 ? spent / allocated : 0;
        if (ratio > 1) status = 'Over';
        else if (ratio > 0.8) status = 'Warning';

        return { month, week, category, allocated, spent, status };
      }).filter(item => item.category !== 'UNKNOWN' && item.allocated > 0);

      setAllBudgetItems(mergedBudget);
    } catch (err) {
      console.error("Budget Fetch Error:", err);
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan sinkronisasi budget.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filteredBudgetItems = useMemo(() => {
    return allBudgetItems.filter(item => {
      const matchMonth = !selectedMonth || item.month === selectedMonth;
      const matchWeek = !selectedWeek || item.week === selectedWeek;
      return matchMonth && matchWeek;
    });
  }, [allBudgetItems, selectedMonth, selectedWeek]);

  const uniqueMonths = useMemo(() => Array.from(new Set(allBudgetItems.map(item => item.month))).filter(Boolean).sort(), [allBudgetItems]);
  const uniqueWeeks = useMemo(() => Array.from(new Set(allBudgetItems.map(item => item.week))).filter(Boolean).sort(), [allBudgetItems]);
  const totalBudget = useMemo(() => filteredBudgetItems.reduce((acc, curr) => acc + curr.allocated, 0), [filteredBudgetItems]);
  const topBudgetCategory = useMemo(() => {
    if (filteredBudgetItems.length === 0) return { category: '-', allocated: 0 };
    return filteredBudgetItems.reduce((prev, current) => (prev.allocated > current.allocated) ? prev : current);
  }, [filteredBudgetItems]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <div className="w-10 h-10 border-4 border-amber-500/20 border-t-amber-500 rounded-full animate-spin mb-4"></div>
        <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.3em] animate-pulse">Synchronizing Budget...</p>
      </div>
    );
  }

  return (
    <div className="animate-in fade-in duration-700 space-y-8 pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <h2 className="text-4xl font-black text-white tracking-tighter uppercase italic">Budget <span className="text-brand-blue">Reference</span></h2>
          <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.4em] mt-1 italic">Tactical Resource Allocation Mapping</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3 bg-slate-900/60 p-3 rounded-2xl border border-slate-800 shadow-2xl backdrop-blur-xl">
          <div className="flex flex-col gap-1 px-3">
            <label className="text-[8px] uppercase font-black text-slate-600 tracking-[0.2em] italic">Period</label>
            <select 
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="bg-transparent text-[10px] text-white font-black focus:outline-none cursor-pointer min-w-[110px] uppercase italic tracking-widest"
            >
              <option value="">ALL MONTHS</option>
              {uniqueMonths.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
          <div className="w-px h-10 bg-slate-800 hidden md:block"></div>
          <div className="flex flex-col gap-1 px-3">
            <label className="text-[8px] uppercase font-black text-slate-600 tracking-[0.2em] italic">Phase</label>
            <select 
              value={selectedWeek}
              onChange={(e) => setSelectedWeek(e.target.value)}
              className="bg-transparent text-[10px] text-white font-black focus:outline-none cursor-pointer min-w-[90px] uppercase italic tracking-widest"
            >
              <option value="">ALL WEEKS</option>
              {uniqueWeeks.map(week => <option key={week} value={week}>{week}</option>)}
            </select>
          </div>
          <button 
            onClick={fetchData}
            className="p-3 bg-slate-800 hover:bg-slate-700 rounded-xl text-slate-400 border border-slate-700 transition-all active:scale-95 shadow-xl"
            title="Refresh Registry"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 p-5 rounded-2xl text-center text-[10px] text-red-400 font-black uppercase tracking-[0.3em] italic">
          CRITICAL ERROR: {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-slate-900/60 border border-slate-800 p-10 rounded-[3.5rem] border-l-8 border-l-brand-blue group relative overflow-hidden shadow-2xl backdrop-blur-md">
           <div className="absolute -top-4 -right-4 p-10 opacity-5 group-hover:scale-110 transition-transform text-brand-blue">
              <Icons.Wallet size={80} />
           </div>
           <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.3em] mb-3 italic">Capital Threshold</p>
           <h3 className="text-4xl font-black text-white font-mono tracking-tighter italic">Rp {totalBudget.toLocaleString('id-ID')}</h3>
           <div className="mt-4 inline-flex items-center gap-2 px-3 py-1.5 bg-slate-950 rounded-xl border border-slate-800">
              <span className="text-[9px] text-brand-blue font-black uppercase tracking-widest italic">{selectedMonth || 'Global Audit'}</span>
           </div>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 p-10 rounded-[3.5rem] border-l-8 border-l-brand-peach group relative overflow-hidden shadow-2xl backdrop-blur-md">
           <div className="absolute -top-4 -right-4 p-10 opacity-5 group-hover:scale-110 transition-transform text-brand-peach">
              <Icons.Analytics size={80} />
           </div>
           <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.3em] mb-3 italic">Primary Sector Allocation</p>
           <h3 className="text-2xl font-black text-white uppercase tracking-tighter mb-1 truncate italic">{topBudgetCategory.category}</h3>
           <p className="text-brand-peach font-mono font-black text-xl italic">Rp {topBudgetCategory.allocated.toLocaleString('id-ID')}</p>
        </div>
      </div>

      <div className="bg-slate-900/40 border border-slate-800 rounded-[3.5rem] overflow-hidden shadow-2xl backdrop-blur-xl">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-separate border-spacing-0 min-w-[900px]">
            <thead className="bg-slate-950/40">
              <tr>
                <th className="px-8 py-8 text-slate-500 font-black text-[10px] uppercase tracking-[0.3em] border-b border-slate-900 italic">Timeline</th>
                <th className="px-8 py-8 text-slate-500 font-black text-[10px] uppercase tracking-[0.3em] border-b border-slate-900 italic">Phase</th>
                <th className="px-8 py-8 text-slate-500 font-black text-[10px] uppercase tracking-[0.3em] border-b border-slate-900 italic">Structural Category</th>
                <th className="px-8 py-8 text-slate-500 font-black text-[10px] uppercase tracking-[0.3em] border-b border-slate-900 italic">Allocation</th>
                <th className="px-8 py-8 text-slate-500 font-black text-[10px] uppercase tracking-[0.3em] border-b border-slate-900 italic">Execution</th>
                <th className="px-8 py-8 text-slate-500 font-black text-[10px] uppercase tracking-[0.3em] border-b border-slate-900 italic">Efficiency Index</th>
                <th className="px-8 py-8 text-slate-500 font-black text-[10px] uppercase tracking-[0.3em] border-b border-slate-900 italic text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-900">
              {filteredBudgetItems.map((entry, index) => {
                const percentage = Math.min((entry.spent / entry.allocated) * 100, 100);
                const isOver = entry.spent > entry.allocated;
                
                return (
                  <tr key={index} className="group hover:bg-slate-800/20 transition-all">
                    <td className="px-8 py-6">
                      <span className="text-[10px] font-black text-slate-500 uppercase italic tracking-widest">{entry.month}</span>
                    </td>
                    <td className="px-8 py-6">
                      <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest italic opacity-60">Phase {entry.week}</span>
                    </td>
                    <td className="px-8 py-6">
                      <span className="text-xs font-black text-slate-300 group-hover:text-brand-blue transition-colors uppercase tracking-widest italic">{entry.category}</span>
                    </td>
                    <td className="px-8 py-6 text-[11px] font-mono font-black text-slate-500 italic">
                      Rp {entry.allocated.toLocaleString('id-ID')}
                    </td>
                    <td className="px-8 py-6 text-[11px] font-mono font-black text-slate-300 italic">
                      Rp {entry.spent.toLocaleString('id-ID')}
                    </td>
                    <td className="px-8 py-6">
                      <div className="w-32">
                          <div className="flex justify-between items-center mb-2">
                              <span className={`text-[9px] font-black italic tracking-widest ${isOver ? 'text-brand-peach' : 'text-slate-500'}`}>{percentage.toFixed(0)}% Efficiency</span>
                          </div>
                          <div className="w-full h-1.5 bg-slate-950 rounded-full overflow-hidden border border-slate-900 shadow-inner">
                              <div 
                                  className={`h-full rounded-full transition-all duration-700 ${
                                      isOver ? 'bg-brand-peach' : percentage > 80 ? 'bg-brand-brown' : 'bg-brand-blue'
                                  }`}
                                  style={{ width: `${percentage}%` }}
                              ></div>
                          </div>
                      </div>
                    </td>
                    <td className="px-8 py-6 text-right">
                      <span className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest italic border ${
                        entry.status === 'Safe' ? 'bg-brand-olive/5 text-brand-olive border-brand-olive/30 shadow-[0_0_15px_rgba(16,185,129,0.1)]' : 
                        entry.status === 'Warning' ? 'bg-brand-peach/5 text-brand-peach border-brand-peach/30 shadow-[0_0_15px_rgba(245,158,11,0.1)]' : 'bg-red-500/5 text-red-400 border-red-500/30 shadow-[0_0_15px_rgba(239,68,68,0.1)]'
                      }`}>
                        {entry.status}
                      </span>
                    </td>
                  </tr>
                );
              })}
              {filteredBudgetItems.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-8 py-24 text-center text-slate-700 italic text-[10px] font-black uppercase tracking-[0.5em] opacity-30">
                    Analytical Void: No Budget Metrics
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        <div className="px-10 py-6 border-t border-slate-900 bg-slate-950/40 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-[9px] text-slate-600 font-black uppercase tracking-[0.4em] italic opacity-50">
            * Automated Synchronization via Terminal Core Node
          </p>
          <div className="flex items-center gap-6">
             <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-brand-olive rounded-full shadow-[0_0_8px_rgba(16,185,129,0.4)]"></div>
                <span className="text-[9px] text-slate-500 font-black uppercase italic tracking-widest opacity-80">Safe Protocol</span>
             </div>
             <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-brand-peach rounded-full shadow-[0_0_8px_rgba(245,158,11,0.4)]"></div>
                <span className="text-[9px] text-slate-500 font-black uppercase italic tracking-widest opacity-80">Threshold Alert</span>
             </div>
             <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-red-500 rounded-full shadow-[0_0_8px_rgba(239,68,68,0.4)]"></div>
                <span className="text-[9px] text-slate-500 font-black uppercase italic tracking-widest opacity-80">Cap Violation</span>
             </div>
          </div>
        </div>
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { height: 4px; width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #cbd5e1; }
      `}</style>
    </div>
  );
};

export default RawDataBudget;
