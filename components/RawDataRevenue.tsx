
import React, { useState, useEffect, useMemo } from 'react';
import { Icons } from '../constants';
import { fetchFromGoogleSheet } from '../services/spreadsheetService';

const RawDataRevenue: React.FC = () => {
  const [rows, setRows] = useState<any[][]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  const [filters, setFilters] = useState({
    bulan: '',
    parameter: '',
    search: ''
  });

  // Definisi Header Tetap Sesuai Permintaan (Kolom A - F)
  const FIXED_HEADERS = [
    "BULAN",     // Index 0 (A)
    "TANGGAL",   // Index 1 (B)
    "HARI",      // Index 2 (C)
    "WEEK",      // Index 3 (D)
    "PARAMETER", // Index 4 (E)
    "REVENUE"    // Index 5 (F)
  ];

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchFromGoogleSheet('REVENUE');
      if (data && data.length > 1) {
        // Kita ambil datanya saja, skip header asli dari sheet
        setRows(data.slice(1));
      } else {
        setRows([]);
        setError("Sheet REVENUE kosong atau tidak memiliki data.");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan sinkronisasi.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const parseIDR = (v: any) => {
    if (v === undefined || v === null || v === '') return 0;
    if (typeof v === 'number') return v;
    let clean = v.toString().replace(/Rp|IDR|\s|\./g, "").replace(/,/g, ".");
    return parseFloat(clean) || 0;
  };

  const parseDate = (dateStr: string) => {
    if (!dateStr) return null;
    const s = dateStr.toString().trim();
    if (s.includes('/')) {
      const parts = s.split('/');
      if (parts.length === 3) {
        const d = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
        if (!isNaN(d.getTime())) return d;
      }
    }
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? null : d;
  };

  const formatDisplayDate = (dateStr: string) => {
    const d = parseDate(dateStr);
    if (!d) return dateStr;
    return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
  };

  // Data Unik untuk Filter (Diambil dari rows yang ada)
  const filterOptions = useMemo(() => {
    const bulanSet = new Set<string>();
    const paramSet = new Set<string>();
    rows.forEach(row => {
      if (row[0]) bulanSet.add(row[0].toString().toUpperCase());
      if (row[4]) paramSet.add(row[4].toString().toUpperCase());
    });
    return {
      bulans: Array.from(bulanSet).sort(),
      params: Array.from(paramSet).sort()
    };
  }, [rows]);

  const filteredRows = useMemo(() => {
    let result = [...rows];
    
    if (filters.bulan) {
      result = result.filter(r => r[0]?.toString().toUpperCase() === filters.bulan);
    }
    if (filters.parameter) {
      result = result.filter(r => r[4]?.toString().toUpperCase() === filters.parameter);
    }
    if (filters.search) {
      const q = filters.search.toLowerCase();
      result = result.filter(r => r.some(cell => cell?.toString().toLowerCase().includes(q)));
    }

    return result.reverse(); // Menampilkan data terbaru (baris bawah sheet) di posisi teratas
  }, [rows, filters]);

  const totalFilteredRevenue = useMemo(() => {
    return filteredRows.reduce((acc, row) => acc + parseIDR(row[5]), 0);
  }, [filteredRows]);

  if (loading) return (
    <div className="p-20 text-center animate-pulse">
      <div className="w-12 h-12 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin mx-auto mb-4"></div>
      <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.4em]">Sinkronisasi Revenue Iqbal...</p>
    </div>
  );

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20 space-y-10">
      {/* Header & Stats Card */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-8">
        <div>
          <h4 className="text-brand-blue text-[10px] font-black uppercase tracking-[0.4em] mb-3 italic">Secure Cloud Archive</h4>
          <h2 className="text-4xl md:text-6xl font-black text-white tracking-tighter uppercase italic">
            Revenue <span className="text-brand-blue">Ledger</span>
          </h2>
        </div>
        
        <div className="bg-slate-900/60 border border-slate-800 p-8 rounded-[3rem] flex items-center gap-10 shadow-2xl backdrop-blur-xl">
           <div className="text-right">
              <p className="text-[9px] text-slate-500 font-black uppercase tracking-[0.2em] mb-2 italic">Accumulated Inflow</p>
              <p className="text-brand-blue font-mono font-black text-3xl leading-none tracking-tighter italic">
                Rp {totalFilteredRevenue.toLocaleString('id-ID')}
              </p>
           </div>
           <div className="w-px h-16 bg-slate-800"></div>
           <button 
            onClick={fetchData}
            className="p-5 bg-slate-800 hover:bg-slate-700 text-brand-blue hover:text-white rounded-[2rem] transition-all shadow-2xl active:scale-95 border border-slate-700"
            title="Refresh Database"
           >
             <svg xmlns="http://www.w3.org/2000/svg" className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
             </svg>
           </button>
        </div>
      </div>

      {/* Navigation & Filters */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 bg-slate-900/40 p-6 rounded-[3rem] border border-slate-800 shadow-2xl backdrop-blur-md">
        <div className="relative group">
          <input 
            type="text" 
            placeholder="Search transaction trail..." 
            value={filters.search}
            onChange={e => setFilters({...filters, search: e.target.value})}
            className="w-full bg-slate-950/60 border border-slate-800 rounded-2xl px-6 py-4 text-[10px] text-white font-black italic tracking-widest focus:ring-1 focus:ring-brand-blue/30 outline-none transition-all placeholder:text-slate-700"
          />
        </div>
        
        <select 
          value={filters.bulan}
          onChange={e => setFilters({...filters, bulan: e.target.value})}
          className="bg-slate-950/60 border border-slate-800 rounded-2xl px-6 py-4 text-[10px] font-black uppercase text-slate-400 outline-none cursor-pointer focus:border-brand-blue/50 tracking-widest italic"
        >
          <option value="">PERIOD: ALL</option>
          {filterOptions.bulans.map(b => <option key={b} value={b}>{b}</option>)}
        </select>

        <select 
          value={filters.parameter}
          onChange={e => setFilters({...filters, parameter: e.target.value})}
          className="bg-slate-950/60 border border-slate-800 rounded-2xl px-6 py-4 text-[10px] font-black uppercase text-slate-400 outline-none cursor-pointer focus:border-brand-blue/50 tracking-widest italic"
        >
          <option value="">CLASS: ALL</option>
          {filterOptions.params.map(p => <option key={p} value={p}>{p}</option>)}
        </select>

        <button 
          onClick={() => setFilters({bulan: '', parameter: '', search: ''})}
          className="bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white text-[10px] font-black uppercase rounded-2xl transition-all active:scale-95 border border-slate-700 tracking-[0.2em] italic"
        >
          Reset Parameters
        </button>
      </div>

      {/* Modern Table UI */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-[3.5rem] overflow-hidden shadow-2xl backdrop-blur-xl relative">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead className="bg-slate-950/40">
              <tr>
                {FIXED_HEADERS.map((h, i) => (
                  <th key={i} className="px-10 py-8 text-[10px] text-slate-500 uppercase font-black tracking-[0.3em] border-b border-slate-900 italic">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-900">
              {filteredRows.map((row, rowIdx) => (
                <tr key={rowIdx} className="group hover:bg-slate-800/40 transition-all">
                  {/* BULAN (A) */}
                  <td className="px-10 py-6 text-[10px] font-black text-slate-500 uppercase italic tracking-widest">{row[0] || '-'}</td>
                  
                  {/* TANGGAL (B) */}
                  <td className="px-10 py-6 text-[11px] text-slate-400 font-mono font-black italic">
                    {formatDisplayDate(row[1])}
                  </td>
                  
                  {/* HARI (C) */}
                  <td className="px-10 py-6 text-[10px] font-black text-slate-500 uppercase tracking-widest italic">{row[2] || '-'}</td>
                  
                  {/* WEEK (D) */}
                  <td className="px-10 py-6">
                    <span className="text-[10px] font-black text-brand-blue bg-slate-950 px-4 py-2 rounded-xl border border-slate-800 uppercase tracking-tighter italic shadow-inner">
                      {row[3] || '-'}
                    </span>
                  </td>
                  
                  {/* PARAMETER (E) */}
                  <td className="px-10 py-6">
                    <span className="text-[11px] font-black text-slate-300 uppercase group-hover:text-brand-blue transition-colors tracking-widest italic">
                      {row[4] || '-'}
                    </span>
                  </td>
                  
                  {/* REVENUE (F) */}
                  <td className="px-10 py-6 text-right">
                    <span className="text-base font-black font-mono text-brand-blue tracking-tighter italic">
                      Rp {parseIDR(row[5]).toLocaleString('id-ID')}
                    </span>
                  </td>
                </tr>
              ))}
              
              {filteredRows.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-10 py-40 text-center">
                    <div className="flex flex-col items-center gap-6 opacity-20">
                       <Icons.Dashboard size={48} />
                       <p className="text-[10px] font-black uppercase tracking-[0.5em] text-slate-500 italic">Analytical Void: No Data Matches Protocol</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        {/* Footer Metadata */}
        <div className="p-10 bg-slate-950/40 border-t border-slate-900 flex flex-col md:flex-row justify-between items-center gap-6">
           <div className="flex items-center gap-4">
              <span className="w-2.5 h-2.5 rounded-full bg-brand-blue animate-pulse shadow-[0_0_10px_rgba(59,130,246,0.5)]"></span>
              <p className="text-[9px] text-slate-600 font-black uppercase tracking-[0.4em] italic leading-relaxed">
                Source Synchronized: Continuous Mapping Active from "REVENUE" Node
              </p>
           </div>
           <div className="flex items-center gap-4">
              <span className="text-[10px] font-black text-slate-500 italic uppercase tracking-[0.2em]">Sequence Count:</span>
              <span className="text-[10px] font-black text-white bg-slate-900 px-6 py-2 rounded-full border border-slate-800 shadow-2xl tracking-[0.2em]">
                {filteredRows.length} RECORDS
              </span>
           </div>
        </div>
      </div>
    </div>
  );
};

export default RawDataRevenue;
