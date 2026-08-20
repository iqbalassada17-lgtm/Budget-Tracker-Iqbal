
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
        <h2 className="text-4xl font-black text-white mb-2 tracking-tighter italic uppercase">
          Investment <span className="text-brand-brown">Portfolio Hub</span>
        </h2>
        <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.4em] leading-relaxed italic">
          Asset Management Terminal • Allocation Control
        </p>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl mb-6 text-center text-sm font-bold uppercase tracking-widest italic">
          {error}
        </div>
      )}

      <div className="bg-slate-900/60 border border-slate-800 rounded-[3rem] overflow-hidden shadow-2xl backdrop-blur-md">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/40 border-b border-slate-800">
              <tr>
                <th className="p-6 text-slate-500 font-black uppercase tracking-[0.2em] italic">Period</th>
                <th className="p-6 text-slate-500 font-black uppercase tracking-[0.2em] italic">Asset Class</th>
                <th className="p-6 text-slate-500 font-black uppercase tracking-[0.2em] italic">Custodian</th>
                <th className="p-6 text-slate-500 font-black uppercase tracking-[0.2em] italic text-right">Principal (D)</th>
                <th className="p-6 text-slate-500 font-black uppercase tracking-[0.2em] italic text-center">Weight % (E)</th>
                <th className="p-6 text-slate-500 font-black uppercase tracking-[0.2em] italic text-right">Valuation (F)</th>
                <th className="p-6 text-slate-500 font-black uppercase tracking-[0.2em] italic text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {rows.slice(1).map((row, i) => {
                const rowIndex = i + 1; // Actual index in rows array
                const isEditing = editingRow === rowIndex;

                return (
                  <tr key={i} className="hover:bg-slate-800/40 transition-all group">
                    <td className="p-6 font-black text-white uppercase italic">{row[0]}</td>
                    <td className="p-6 text-slate-300 font-bold uppercase italic">{row[1]}</td>
                    <td className="p-6 text-slate-500 font-black uppercase tracking-widest">{row[2]}</td>
                    <td className="p-6 text-right font-mono text-slate-400 font-bold italic">
                      Rp {parseNum(row[3]).toLocaleString('id-ID')}
                    </td>
                    <td className="p-6 text-center">
                      {isEditing ? (
                        <input 
                          type="text"
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          className="w-24 bg-slate-950 border-2 border-brand-brown/30 rounded-xl px-3 py-2 text-center font-black text-brand-brown focus:outline-none focus:border-brand-brown shadow-inner shadow-brand-brown/10"
                          autoFocus
                        />
                      ) : (
                        <span className="font-black text-brand-brown italic text-lg tracking-tighter">
                          {row[4] || '-'}
                        </span>
                      )}
                    </td>
                    <td className="p-6 text-right font-mono text-brand-olive font-black text-sm italic">
                      Rp {parseNum(row[5]).toLocaleString('id-ID')}
                    </td>
                    <td className="p-6 text-center">
                      {isEditing ? (
                        <div className="flex justify-center gap-2">
                          <button 
                            onClick={() => handleSave(rowIndex)}
                            disabled={updating}
                            className="p-3 bg-brand-olive text-white rounded-xl hover:bg-brand-olive/90 transition-all shadow-2xl shadow-brand-olive/30 disabled:opacity-50 border border-white/10"
                          >
                            {updating ? <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div> : <Icons.Sparkles />}
                          </button>
                          <button 
                            onClick={() => setEditingRow(null)}
                            disabled={updating}
                            className="p-3 bg-slate-800 text-slate-400 rounded-xl hover:bg-slate-700 transition-all border border-slate-700"
                          >
                            <Icons.Close />
                          </button>
                        </div>
                      ) : (
                        <button 
                          onClick={() => handleEdit(rowIndex, row[4])}
                          className="p-3 bg-slate-800 text-slate-400 rounded-xl opacity-0 group-hover:opacity-100 transition-all hover:bg-brand-brown hover:text-white border border-slate-700 shadow-xl"
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
          <div className="p-24 text-center">
            <p className="text-slate-600 font-black uppercase italic tracking-[0.4em] opacity-20">NULL DATA SET</p>
          </div>
        )}
      </div>
      
      <div className="mt-12 flex justify-center">
        <button 
          onClick={fetchData}
          className="flex items-center gap-3 px-10 py-5 bg-slate-900/60 border border-slate-800 rounded-2xl text-slate-500 font-black uppercase tracking-[0.2em] hover:bg-slate-800 hover:text-white transition-all shadow-2xl active:scale-95 italic"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Re-initialize Data Stream
        </button>
      </div>
    </div>
  );
};

export default InputInvestasi;
