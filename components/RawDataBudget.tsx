
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
    <div className="animate-in fade-in duration-700 space-y-6 pb-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">Raw Data <span className="text-amber-600">Budget</span></h2>
          <p className="text-slate-500 text-xs italic font-medium mt-1 uppercase tracking-tighter">Monitoring alokasi vs realita biaya operasional via API.</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3 bg-white p-2 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex flex-col gap-1 px-2">
            <label className="text-[8px] uppercase font-black text-slate-500 tracking-widest">Bulan</label>
            <select 
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="bg-transparent text-xs text-slate-900 font-bold focus:outline-none cursor-pointer min-w-[100px]"
            >
              <option value="">Semua</option>
              {uniqueMonths.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
          <div className="w-px h-8 bg-slate-100 hidden md:block"></div>
          <div className="flex flex-col gap-1 px-2">
            <label className="text-[8px] uppercase font-black text-slate-500 tracking-widest">Minggu</label>
            <select 
              value={selectedWeek}
              onChange={(e) => setSelectedWeek(e.target.value)}
              className="bg-transparent text-xs text-slate-900 font-bold focus:outline-none cursor-pointer min-w-[80px]"
            >
              <option value="">Semua</option>
              {uniqueWeeks.map(week => <option key={week} value={week}>{week}</option>)}
            </select>
          </div>
          <button 
            onClick={fetchData}
            className="p-2.5 bg-slate-50 hover:bg-slate-100 rounded-xl text-slate-400 border border-slate-200 transition-all active:scale-95"
            title="Refresh Data"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 p-4 rounded-xl text-center text-xs text-red-600 font-bold uppercase tracking-widest">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white border border-slate-200 p-6 rounded-3xl border-l-4 border-l-amber-500 group relative overflow-hidden shadow-sm">
           <div className="absolute -top-4 -right-4 p-8 opacity-5 group-hover:scale-110 transition-transform">
              <Icons.Wallet />
           </div>
           <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.2em] mb-2">Total Alokasi Budget</p>
           <h3 className="text-3xl font-black text-slate-900 font-mono tracking-tighter">Rp {totalBudget.toLocaleString('id-ID')}</h3>
           <div className="mt-3 inline-flex items-center gap-2 px-2 py-1 bg-amber-50 rounded-lg border border-amber-100">
              <span className="text-[9px] text-amber-600 font-bold uppercase">{selectedMonth || 'Global View'}</span>
           </div>
        </div>

        <div className="bg-white border border-slate-200 p-6 rounded-3xl border-l-4 border-l-sky-500 group relative overflow-hidden shadow-sm">
           <div className="absolute -top-4 -right-4 p-8 opacity-5 group-hover:scale-110 transition-transform">
              <Icons.Analytics />
           </div>
           <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.2em] mb-2">Budget COA Terbesar</p>
           <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight mb-1 truncate">{topBudgetCategory.category}</h3>
           <p className="text-sky-600 font-mono font-black text-lg">Rp {topBudgetCategory.allocated.toLocaleString('id-ID')}</p>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-separate border-spacing-0 min-w-[900px]">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-5 py-5 text-slate-500 font-black text-[9px] uppercase tracking-widest border-b border-slate-100">Bulan</th>
                <th className="px-5 py-5 text-slate-500 font-black text-[9px] uppercase tracking-widest border-b border-slate-100">Wk</th>
                <th className="px-5 py-5 text-slate-500 font-black text-[9px] uppercase tracking-widest border-b border-slate-100">Kategori COA</th>
                <th className="px-5 py-5 text-slate-500 font-black text-[9px] uppercase tracking-widest border-b border-slate-100">Budget</th>
                <th className="px-5 py-5 text-slate-500 font-black text-[9px] uppercase tracking-widest border-b border-slate-100">Realisasi</th>
                <th className="px-5 py-5 text-slate-500 font-black text-[9px] uppercase tracking-widest border-b border-slate-100">Progress</th>
                <th className="px-5 py-5 text-slate-500 font-black text-[9px] uppercase tracking-widest border-b border-slate-100 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredBudgetItems.map((entry, index) => {
                const percentage = Math.min((entry.spent / entry.allocated) * 100, 100);
                const isOver = entry.spent > entry.allocated;
                
                return (
                  <tr key={index} className="group hover:bg-slate-50 transition-all">
                    <td className="px-5 py-4">
                      <span className="text-[10px] font-black text-slate-500 uppercase">{entry.month}</span>
                    </td>
                    <td className="px-5 py-4">
                      <span className="text-[10px] font-bold text-slate-400 uppercase">W{entry.week}</span>
                    </td>
                    <td className="px-5 py-4">
                      <span className="text-sm font-black text-slate-900 group-hover:text-amber-600 transition-colors uppercase tracking-tight">{entry.category}</span>
                    </td>
                    <td className="px-5 py-4 text-xs font-mono text-slate-500">
                      Rp{entry.allocated.toLocaleString('id-ID')}
                    </td>
                    <td className="px-5 py-4 text-xs font-mono font-bold text-slate-900">
                      Rp{entry.spent.toLocaleString('id-ID')}
                    </td>
                    <td className="px-5 py-4">
                      <div className="w-32">
                          <div className="flex justify-between items-center mb-1">
                              <span className={`text-[8px] font-black ${isOver ? 'text-red-600' : 'text-slate-500'}`}>{percentage.toFixed(0)}%</span>
                          </div>
                          <div className="w-full h-1 bg-slate-100 rounded-full overflow-hidden">
                              <div 
                                  className={`h-full rounded-full transition-all duration-700 ${
                                      isOver ? 'bg-red-500' : percentage > 80 ? 'bg-amber-500' : 'bg-green-500'
                                  }`}
                                  style={{ width: `${percentage}%` }}
                              ></div>
                          </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-[8px] font-black uppercase tracking-tighter ${
                        entry.status === 'Safe' ? 'bg-green-50 text-green-600 border border-green-200' : 
                        entry.status === 'Warning' ? 'bg-amber-50 text-amber-600 border border-amber-200' : 'bg-red-50 text-red-600 border border-red-200'
                      }`}>
                        {entry.status}
                      </span>
                    </td>
                  </tr>
                );
              })}
              {filteredBudgetItems.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-slate-400 italic text-[10px] font-bold uppercase tracking-[0.2em]">
                    Belum ada data anggaran ditemukan.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex flex-col sm:flex-row justify-between items-center gap-3">
          <p className="text-[8px] text-slate-400 font-black uppercase tracking-widest italic">
            * Data tersinkronisasi via Apps Script API Bridge
          </p>
          <div className="flex items-center gap-4">
             <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                <span className="text-[8px] text-slate-400 font-black uppercase">Safe</span>
             </div>
             <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 bg-amber-500 rounded-full"></div>
                <span className="text-[8px] text-slate-400 font-black uppercase">Limit</span>
             </div>
             <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 bg-red-500 rounded-full"></div>
                <span className="text-[8px] text-slate-400 font-black uppercase">Over</span>
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
