
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
    <div className="animate-in fade-in duration-700 space-y-10">
      <div className="flex flex-col md:flex-row justify-between items-center gap-6">
        <div>
          <h1 className="text-4xl font-black text-white uppercase italic tracking-tighter">Investment <span className="text-brand-blue">Archives</span></h1>
          <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.4em] mt-1 italic">Historical Mutual Fund & Asset Matrix</p>
        </div>
        <button 
          onClick={fetchData}
          disabled={loading}
          className="p-4 bg-slate-900/60 border border-slate-800 rounded-2xl hover:bg-slate-800 transition-all text-slate-400 shadow-2xl active:scale-95"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className={`h-6 w-6 ${loading ? 'animate-spin text-brand-blue' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 p-6 rounded-2xl text-red-400 text-[10px] font-black uppercase tracking-[0.3em] italic">
          SYSTEM ERROR: {error}
        </div>
      )}

      <div className="bg-slate-900/60 border border-slate-800 rounded-[3.5rem] overflow-hidden shadow-2xl backdrop-blur-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-950/40">
              <tr>
                <th className="px-10 py-8 text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] italic border-b border-slate-900">Timeline Node</th>
                <th className="px-10 py-8 text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] italic border-b border-slate-900">Asset Classification</th>
                <th className="px-10 py-8 text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] italic border-b border-slate-900">Entity Manager</th>
                <th className="px-10 py-8 text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] italic border-b border-slate-900 text-right">Capital Value</th>
                <th className="px-10 py-8 text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] italic border-b border-slate-900 text-right">Yield Ratio</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-900">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-10 py-32 text-center">
                    <div className="flex flex-col items-center gap-6">
                      <div className="w-10 h-10 border-4 border-brand-blue/20 border-t-brand-blue rounded-full animate-spin"></div>
                      <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.4em] italic">Accessing Ledger...</p>
                    </div>
                  </td>
                </tr>
              ) : data.length <= 1 ? (
                <tr>
                  <td colSpan={5} className="px-10 py-32 text-center">
                    <p className="text-slate-700 text-[10px] font-black uppercase tracking-[0.5em] italic opacity-30">No Assets Detected in Protocol</p>
                  </td>
                </tr>
              ) : (
                data.slice(1).map((row, i) => (
                  <tr key={i} className="hover:bg-slate-800/40 transition-all group">
                    <td className="px-10 py-6 text-[10px] text-slate-500 font-black uppercase italic tracking-widest">{row[0]}</td>
                    <td className="px-10 py-6 text-[10px] text-slate-600 font-black uppercase tracking-widest italic opacity-60">{row[1]}</td>
                    <td className="px-10 py-6 text-xs text-slate-300 font-black uppercase italic tracking-widest group-hover:text-brand-blue transition-colors">{row[2]}</td>
                    <td className="px-10 py-6 text-sm text-brand-olive font-mono text-right font-black italic tracking-tighter">
                      Rp {parseFloat(row[3]?.toString().replace(/[^\d.-]/g, '') || '0').toLocaleString('id-ID')}
                    </td>
                    <td className="px-10 py-6 text-sm text-brand-peach font-mono text-right font-black italic tracking-widest">{row[4]}</td>
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
