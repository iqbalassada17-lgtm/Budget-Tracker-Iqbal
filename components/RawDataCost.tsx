
import React, { useState, useEffect, useMemo } from 'react';
import { fetchFromGoogleSheet } from '../services/spreadsheetService';

const RawDataCost: React.FC = () => {
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<any[][]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  const getYesterday = () => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return d.toISOString().split('T')[0];
  };

  const [filters, setFilters] = useState({ 
    bulan: '', 
    coa: '', 
    startDate: getYesterday(), 
    endDate: getYesterday() 
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const data = await fetchFromGoogleSheet('INPUT COST');
      if (data && data.length > 0) {
        setHeaders(data[0]);
        setRows(data.slice(1));
      }
    } catch (err: any) { setError(err.message); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

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

  const filteredRows = useMemo(() => {
    const B_IDX = headers.findIndex(h => h.toLowerCase() === 'bulan');
    const T_IDX = headers.findIndex(h => h.toLowerCase() === 'tanggal');
    const C_IDX = headers.findIndex(h => h.toLowerCase() === 'coa');

    return rows.filter(row => {
      if (filters.bulan && row[B_IDX] !== filters.bulan) return false;
      if (filters.coa && row[C_IDX] !== filters.coa) return false;
      
      const d = parseDate(row[T_IDX]);
      if (d) {
        if (filters.startDate) { const s = new Date(filters.startDate); s.setHours(0,0,0,0); if (d < s) return false; }
        if (filters.endDate) { const e = new Date(filters.endDate); e.setHours(23,59,59,999); if (d > e) return false; }
      }
      return true;
    });
  }, [rows, filters, headers]);

  if (loading) return <div className="p-20 text-center animate-pulse text-slate-500 font-black">MEMUAT DATABASE...</div>;

  return (
    <div className="space-y-8 pb-20 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-black text-white uppercase italic tracking-tighter">Raw Data <span className="text-brand-peach">Cost Matrix</span></h2>
        <button onClick={fetchData} className="bg-slate-900/60 p-3 rounded-xl text-[10px] text-slate-400 hover:text-white uppercase font-black border border-slate-800 shadow-2xl transition-all active:scale-95 italic tracking-widest">Re-Synchronize</button>
      </div>

      <div className="bg-slate-900/40 p-6 rounded-[2rem] border border-slate-800 shadow-2xl backdrop-blur-xl grid grid-cols-2 md:grid-cols-4 gap-6">
        <div className="space-y-2">
          <label className="text-[9px] font-black text-slate-600 uppercase tracking-widest italic ml-1">Timeline Start</label>
          <input type="date" value={filters.startDate} onChange={e => setFilters({...filters, startDate: e.target.value})} className="w-full bg-slate-950/60 text-[10px] font-black text-white p-3 rounded-xl border border-slate-800 focus:outline-none focus:ring-1 focus:ring-brand-blue/50" />
        </div>
        <div className="space-y-2">
          <label className="text-[9px] font-black text-slate-600 uppercase tracking-widest italic ml-1">Timeline End</label>
          <input type="date" value={filters.endDate} onChange={e => setFilters({...filters, endDate: e.target.value})} className="w-full bg-slate-950/60 text-[10px] font-black text-white p-3 rounded-xl border border-slate-800 focus:outline-none focus:ring-1 focus:ring-brand-blue/50" />
        </div>
      </div>

      <div className="bg-slate-900/60 border border-slate-800 rounded-[2.5rem] overflow-x-auto shadow-2xl backdrop-blur-md">
        <table className="w-full text-left text-[10px]">
          <thead className="bg-slate-950/40 text-slate-500 border-b border-slate-800">
            <tr>{headers.map((h, i) => <th key={i} className="p-6 uppercase font-black tracking-[0.2em] italic">{h}</th>)}</tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {filteredRows.reverse().map((r, i) => (
              <tr key={i} className="hover:bg-slate-800/40 transition-all group">
                {r.map((c, j) => {
                  const headerName = headers[j]?.toLowerCase();
                  const displayValue = headerName === 'tanggal' ? formatDisplayDate(c) : c;
                  return <td key={j} className="p-6 text-slate-300 font-black uppercase italic tracking-widest">{displayValue}</td>;
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default RawDataCost;
