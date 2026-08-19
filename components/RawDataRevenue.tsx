
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
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20 space-y-6">
      {/* Header & Stats Card */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <h4 className="text-emerald-600 text-[10px] font-black uppercase tracking-[0.4em] mb-2 italic">Cloud Archive</h4>
          <h2 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tighter uppercase italic">
            Raw Data <span className="text-emerald-600">Revenue</span>
          </h2>
        </div>
        
        <div className="bg-white border border-slate-200 p-6 rounded-[2rem] flex items-center gap-8 shadow-sm">
           <div className="text-right">
              <p className="text-[8px] text-slate-500 font-black uppercase tracking-widest mb-1">Accumulated View Revenue</p>
              <p className="text-emerald-600 font-mono font-black text-2xl leading-none tracking-tighter">
                Rp {totalFilteredRevenue.toLocaleString('id-ID')}
              </p>
           </div>
           <div className="w-px h-12 bg-slate-100"></div>
           <button 
            onClick={fetchData}
            className="p-4 bg-emerald-50 hover:bg-emerald-600 text-emerald-600 hover:text-white rounded-2xl transition-all shadow-sm active:scale-95 border border-emerald-100"
            title="Refresh Database"
           >
             <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
             </svg>
           </button>
        </div>
      </div>

      {/* Navigation & Filters */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-white p-4 rounded-[2.5rem] border border-slate-200 shadow-sm">
        <div className="relative group">
          <input 
            type="text" 
            placeholder="Cari transaksi..." 
            value={filters.search}
            onChange={e => setFilters({...filters, search: e.target.value})}
            className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3 text-xs text-slate-900 focus:ring-2 focus:ring-emerald-500/30 outline-none transition-all placeholder:text-slate-400"
          />
        </div>
        
        <select 
          value={filters.bulan}
          onChange={e => setFilters({...filters, bulan: e.target.value})}
          className="bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3 text-[10px] font-black uppercase text-slate-900 outline-none cursor-pointer focus:border-emerald-500/50"
        >
          <option value="">SEMUA BULAN</option>
          {filterOptions.bulans.map(b => <option key={b} value={b}>{b}</option>)}
        </select>

        <select 
          value={filters.parameter}
          onChange={e => setFilters({...filters, parameter: e.target.value})}
          className="bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3 text-[10px] font-black uppercase text-slate-900 outline-none cursor-pointer focus:border-emerald-500/50"
        >
          <option value="">SEMUA PARAMETER</option>
          {filterOptions.params.map(p => <option key={p} value={p}>{p}</option>)}
        </select>

        <button 
          onClick={() => setFilters({bulan: '', parameter: '', search: ''})}
          className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-black uppercase rounded-2xl transition-all active:scale-95 border border-slate-200"
        >
          Reset Filter
        </button>
      </div>

      {/* Modern Table UI */}
      <div className="bg-white border border-slate-200 rounded-[3rem] overflow-hidden shadow-sm relative">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead className="bg-slate-50">
              <tr>
                {FIXED_HEADERS.map((h, i) => (
                  <th key={i} className="px-8 py-6 text-[10px] text-slate-500 uppercase font-black tracking-[0.2em] border-b border-slate-100">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRows.map((row, rowIdx) => (
                <tr key={rowIdx} className="group hover:bg-emerald-50 transition-all">
                  {/* BULAN (A) */}
                  <td className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase">{row[0] || '-'}</td>
                  
                  {/* TANGGAL (B) */}
                  <td className="px-8 py-5 text-[11px] text-slate-600 font-mono">
                    {formatDisplayDate(row[1])}
                  </td>
                  
                  {/* HARI (C) */}
                  <td className="px-8 py-5 text-[10px] font-bold text-slate-500 uppercase tracking-tight">{row[2] || '-'}</td>
                  
                  {/* WEEK (D) */}
                  <td className="px-8 py-5">
                    <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-3 py-1 rounded-lg border border-emerald-100 uppercase tracking-tighter italic">
                      {row[3] || '-'}
                    </span>
                  </td>
                  
                  {/* PARAMETER (E) */}
                  <td className="px-8 py-5">
                    <span className="text-xs font-black text-slate-900 uppercase group-hover:text-emerald-600 transition-colors">
                      {row[4] || '-'}
                    </span>
                  </td>
                  
                  {/* REVENUE (F) */}
                  <td className="px-8 py-5 text-right">
                    <span className="text-sm font-black font-mono text-emerald-600 tracking-tighter">
                      Rp {parseIDR(row[5]).toLocaleString('id-ID')}
                    </span>
                  </td>
                </tr>
              ))}
              
              {filteredRows.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-8 py-32 text-center">
                    <div className="flex flex-col items-center gap-4 opacity-30">
                       <Icons.Dashboard />
                       <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">No revenue data matches the current filters</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        {/* Footer Metadata */}
        <div className="p-8 bg-slate-50 border-t border-slate-100 flex flex-col md:flex-row justify-between items-center gap-4">
           <div className="flex items-center gap-3">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest leading-relaxed">
                Source Synchronized: Columns A-F Mapping active from Sheet "REVENUE"
              </p>
           </div>
           <div className="flex items-center gap-2">
              <span className="text-[10px] font-black text-slate-400">Total Entries:</span>
              <span className="text-[10px] font-black text-slate-700 bg-white px-4 py-1.5 rounded-full border border-slate-200 shadow-sm">
                {filteredRows.length} RECORDS
              </span>
           </div>
        </div>
      </div>
    </div>
  );
};

export default RawDataRevenue;
