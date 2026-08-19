
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
    <div className="space-y-6 pb-20 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-black text-slate-900 uppercase italic tracking-tighter">Raw Data <span className="text-red-600">INPUT COST</span></h2>
        <button onClick={fetchData} className="bg-white p-2 rounded-xl text-xs text-slate-900 uppercase font-bold border border-slate-200 shadow-sm">Refresh</button>
      </div>

      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm grid grid-cols-2 md:grid-cols-4 gap-4">
        <input type="date" value={filters.startDate} onChange={e => setFilters({...filters, startDate: e.target.value})} className="bg-slate-50 text-[10px] text-slate-900 p-2 rounded border border-slate-200" />
        <input type="date" value={filters.endDate} onChange={e => setFilters({...filters, endDate: e.target.value})} className="bg-slate-50 text-[10px] text-slate-900 p-2 rounded border border-slate-200" />
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl overflow-x-auto shadow-sm">
        <table className="w-full text-left text-[10px]">
          <thead className="bg-slate-50 text-slate-500">
            <tr>{headers.map((h, i) => <th key={i} className="p-4 uppercase font-black tracking-widest">{h}</th>)}</tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredRows.reverse().map((r, i) => (
              <tr key={i} className="hover:bg-red-50 transition-colors">
                {r.map((c, j) => {
                  const headerName = headers[j]?.toLowerCase();
                  const displayValue = headerName === 'tanggal' ? formatDisplayDate(c) : c;
                  return <td key={j} className="p-4 text-slate-600 font-medium">{displayValue}</td>;
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
