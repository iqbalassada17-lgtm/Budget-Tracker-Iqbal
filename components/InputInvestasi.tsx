
import React, { useState, useEffect } from 'react';
import { Icons } from '../constants';
import { fetchFromGoogleSheet, updateInvestasiRatio } from '../services/spreadsheetService';

const InputInvestasi: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<any[][]>([]);
  const [error, setError] = useState<string | null>(null);
  const [editingRow, setEditingRow] = useState<number | null>(null);
  const [editValue, setEditValue] = useState<string>('');
  const [updating, setUpdating] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchFromGoogleSheet('INVESTASI');
      if (data && data.length > 0) {
        setRows(data);
      }
    } catch (err: any) {
      setError("Gagal mengambil data Investasi.");
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
    let str = v.toString().replace(/Rp|IDR|\s/g, "").replace(/\./g, "").replace(/,/g, ".");
    return parseFloat(str) || 0;
  };

  const handleEdit = (index: number, currentRatio: any) => {
    setEditingRow(index);
    setEditValue(currentRatio ? currentRatio.toString() : '');
  };

  const handleSave = async (index: number) => {
    let finalValue = editValue.trim();
    if (!finalValue) {
      alert("Masukkan nilai ratio yang valid");
      return;
    }

    // Jika input adalah angka murni, tambahkan tanda %
    if (/^\d+(\.\d+)?$/.test(finalValue)) {
      finalValue = finalValue + '%';
    }

    setUpdating(true);
    // index + 1 because Google Sheets is 1-based
    const success = await updateInvestasiRatio(index + 1, finalValue);
    
    if (success) {
      // Update local state
      const newRows = [...rows];
      newRows[index][4] = finalValue; // Column E is index 4
      setRows(newRows);
      setEditingRow(null);
    } else {
      alert("Gagal mengupdate data. Pastikan koneksi stabil.");
    }
    setUpdating(false);
  };

  if (loading) return (
    <div className="p-20 text-center">
      <div className="w-12 h-12 border-4 border-brand-brown/20 border-t-brand-brown rounded-full animate-spin mx-auto mb-4"></div>
      <p className="text-slate-500 font-black uppercase tracking-[0.3em] animate-pulse">Loading Database...</p>
    </div>
  );

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 max-w-6xl mx-auto pb-20">
      <div className="text-center mb-10">
        <h2 className="text-3xl font-black text-slate-900 mb-2 tracking-tight italic uppercase">
          Database <span className="text-brand-brown">Investasi</span>
        </h2>
        <p className="text-slate-500 text-sm font-medium italic uppercase tracking-widest leading-relaxed">
          Kelola dan Update Ratio Portofolio Anda
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 p-4 rounded-xl mb-6 text-center text-sm font-bold">
          {error}
        </div>
      )}

      <div className="bg-white border border-brand-brown/10 rounded-[2.5rem] overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-brand-cream/30 border-b border-brand-brown/10">
              <tr>
                <th className="p-5 text-slate-500 font-black uppercase tracking-widest">Bulan</th>
                <th className="p-5 text-slate-500 font-black uppercase tracking-widest">Type Invest</th>
                <th className="p-5 text-slate-500 font-black uppercase tracking-widest">Fund Manager</th>
                <th className="p-5 text-slate-500 font-black uppercase tracking-widest text-right">Fund (D)</th>
                <th className="p-5 text-slate-500 font-black uppercase tracking-widest text-center">Ratio (E)</th>
                <th className="p-5 text-slate-500 font-black uppercase tracking-widest text-right">Equity (F)</th>
                <th className="p-5 text-slate-500 font-black uppercase tracking-widest text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-brown/5">
              {rows.slice(1).map((row, i) => {
                const rowIndex = i + 1; // Actual index in rows array
                const isEditing = editingRow === rowIndex;

                return (
                  <tr key={i} className="hover:bg-brand-cream/10 transition-colors group">
                    <td className="p-5 font-bold text-slate-700 uppercase">{row[0]}</td>
                    <td className="p-5 text-slate-600">{row[1]}</td>
                    <td className="p-5 text-slate-600 font-medium">{row[2]}</td>
                    <td className="p-5 text-right font-mono text-slate-500">
                      Rp {parseNum(row[3]).toLocaleString('id-ID')}
                    </td>
                    <td className="p-5 text-center">
                      {isEditing ? (
                        <input 
                          type="text"
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          className="w-24 bg-white border-2 border-brand-brown/30 rounded-lg px-3 py-1.5 text-center font-black text-brand-brown focus:outline-none focus:border-brand-brown"
                          autoFocus
                        />
                      ) : (
                        <span className="font-black text-brand-brown italic">
                          {row[4] || '-'}
                        </span>
                      )}
                    </td>
                    <td className="p-5 text-right font-mono text-brand-olive font-black text-sm">
                      Rp {parseNum(row[5]).toLocaleString('id-ID')}
                    </td>
                    <td className="p-5 text-center">
                      {isEditing ? (
                        <div className="flex justify-center gap-2">
                          <button 
                            onClick={() => handleSave(rowIndex)}
                            disabled={updating}
                            className="p-2 bg-brand-olive text-white rounded-lg hover:bg-brand-olive/90 transition-all shadow-md disabled:opacity-50"
                          >
                            {updating ? <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div> : <Icons.Sparkles />}
                          </button>
                          <button 
                            onClick={() => setEditingRow(null)}
                            disabled={updating}
                            className="p-2 bg-slate-100 text-slate-400 rounded-lg hover:bg-slate-200 transition-all"
                          >
                            <Icons.Close />
                          </button>
                        </div>
                      ) : (
                        <button 
                          onClick={() => handleEdit(rowIndex, row[4])}
                          className="p-2.5 bg-brand-brown/10 text-brand-brown rounded-xl opacity-0 group-hover:opacity-100 transition-all hover:bg-brand-brown hover:text-white"
                        >
                          <Icons.Masterdata />
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        
        {rows.length <= 1 && (
          <div className="p-20 text-center">
            <p className="text-slate-400 font-medium italic">Belum ada data investasi di database.</p>
          </div>
        )}
      </div>
      
      <div className="mt-8 flex justify-center">
        <button 
          onClick={fetchData}
          className="flex items-center gap-2 px-6 py-3 bg-white border border-brand-brown/20 rounded-2xl text-slate-500 font-black uppercase tracking-widest hover:bg-slate-50 transition-all shadow-lg active:scale-95"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Refresh Data
        </button>
      </div>
    </div>
  );
};

export default InputInvestasi;
