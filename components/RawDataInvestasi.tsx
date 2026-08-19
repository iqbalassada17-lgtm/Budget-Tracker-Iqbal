
import React, { useState, useEffect } from 'react';
import { fetchFromGoogleSheet } from '../services/spreadsheetService';
import { Icons } from '../constants';

const RawDataInvestasi: React.FC = () => {
  const [data, setData] = useState<any[][]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchFromGoogleSheet('INVESTASI');
      setData(result);
    } catch (err: any) {
      setError(err.message || "Gagal mengambil data investasi.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <div className="animate-in fade-in duration-700 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 uppercase italic tracking-tighter">Raw Data <span className="text-amber-600">Investasi</span></h1>
          <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest italic">Data Historis Investasi Reksadana & Lainnya</p>
        </div>
        <button 
          onClick={fetchData}
          disabled={loading}
          className="p-3 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors text-slate-400 shadow-sm"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 ${loading ? 'animate-spin text-amber-500' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 p-4 rounded-xl text-red-600 text-xs font-bold">
          {error}
        </div>
      )}

      <div className="bg-white border border-slate-200 rounded-[2rem] overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Bulan (A)</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Type Invest (B)</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Fund Manager (C)</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">Fund (D)</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">Ratio (E)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-20 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-8 h-8 border-2 border-amber-500/20 border-t-amber-500 rounded-full animate-spin"></div>
                      <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest">Memuat Data...</p>
                    </div>
                  </td>
                </tr>
              ) : data.length <= 1 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-20 text-center">
                    <p className="text-slate-400 text-xs italic">Belum ada data investasi yang tercatat.</p>
                  </td>
                </tr>
              ) : (
                data.slice(1).map((row, i) => (
                  <tr key={i} className="hover:bg-amber-50 transition-colors group">
                    <td className="px-6 py-4 text-xs text-slate-500 font-bold">{row[0]}</td>
                    <td className="px-6 py-4 text-xs text-slate-400 font-medium uppercase">{row[1]}</td>
                    <td className="px-6 py-4 text-xs text-slate-900 font-black uppercase tracking-tight">{row[2]}</td>
                    <td className="px-6 py-4 text-xs text-emerald-600 font-mono text-right font-bold">
                      Rp {parseFloat(row[3]?.toString().replace(/[^\d.-]/g, '') || '0').toLocaleString('id-ID')}
                    </td>
                    <td className="px-6 py-4 text-xs text-amber-600 font-mono text-right font-black italic">{row[4]}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default RawDataInvestasi;
