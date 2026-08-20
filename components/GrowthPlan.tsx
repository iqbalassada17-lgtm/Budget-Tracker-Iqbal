
import React, { useState, useEffect } from 'react';
import { Icons } from '../constants';
import { getGrowthStrategy } from '../services/geminiService';

const GrowthPlan: React.FC = () => {
  const [strategy, setStrategy] = useState<string>('');
  const [loading, setLoading] = useState(true);

  const fetchStrategy = async () => {
    setLoading(true);
    try {
      // Menggunakan 12.5jt sebagai baseline default atau bisa dinamis dari state jika ada
      const result = await getGrowthStrategy(12500000);
      setStrategy(result);
    } catch (e) {
      setStrategy('1. Mulai investasi pada instrumen berisiko rendah.\n2. Sisihkan 20% pendapatan untuk dana darurat.\n3. Evaluasi pengeluaran rutin setiap bulan.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStrategy();
  }, []);

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex justify-between items-start mb-10">
        <div>
          <h2 className="text-3xl font-black text-white uppercase italic tracking-tighter">Growth <span className="text-brand-blue">Strategy</span></h2>
          <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.4em] mt-1 italic">Tactical wealth amplification protocols</p>
        </div>
        <button 
          onClick={fetchStrategy}
          disabled={loading}
          className="p-3 bg-slate-900/60 border border-slate-800 rounded-xl text-slate-500 hover:text-brand-blue transition-all shadow-2xl active:scale-95 disabled:opacity-50"
          title="Initialize Strategy Protocol"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-slate-900/60 border border-slate-800 p-10 rounded-[3.5rem] shadow-2xl relative overflow-hidden group border-l-8 border-l-brand-blue backdrop-blur-md">
          <div className="absolute top-0 right-0 p-8 text-brand-blue/10 group-hover:text-brand-blue/20 transition-colors pointer-events-none">
            <Icons.Robot size={48} />
          </div>
          <h3 className="text-brand-blue font-black mb-8 flex items-center gap-3 uppercase tracking-[0.3em] text-[10px] italic">
            <Icons.Sparkles /> AI STRATEGIC INTELLIGENCE
          </h3>
          {loading ? (
            <div className="space-y-6">
              <div className="h-4 bg-slate-800 rounded-full w-3/4 animate-pulse"></div>
              <div className="h-4 bg-slate-800 rounded-full w-1/2 animate-pulse"></div>
              <div className="h-4 bg-slate-800 rounded-full w-5/6 animate-pulse"></div>
            </div>
          ) : (
            <div className="text-slate-300 leading-[1.8] space-y-6 whitespace-pre-wrap text-sm font-bold italic tracking-tight">
              {strategy}
            </div>
          )}
        </div>

        <div className="space-y-8">
          <div className="bg-slate-900/60 border border-slate-800 p-10 rounded-[3.5rem] shadow-2xl border-l-8 border-l-brand-olive backdrop-blur-md">
            <h4 className="text-slate-500 font-black uppercase tracking-[0.3em] text-[10px] mb-6 italic">Fiscal Target 2024</h4>
            <div className="flex justify-between items-end mb-5">
              <span className="text-5xl font-black text-white font-mono tracking-tighter italic">Rp 100M</span>
              <span className="text-brand-olive text-[10px] font-black uppercase tracking-[0.2em] italic bg-brand-olive/10 px-3 py-1 rounded-full border border-brand-olive/20">12.5% Synchronized</span>
            </div>
            <div className="w-full h-4 bg-slate-950/60 rounded-full overflow-hidden border border-slate-800 shadow-inner">
              <div className="h-full bg-brand-olive w-[12.5%] rounded-full shadow-[0_0_20px_rgba(16,185,129,0.4)] transition-all duration-1000"></div>
            </div>
          </div>

          <div className="bg-slate-900/60 border border-slate-800 p-10 rounded-[3.5rem] shadow-2xl backdrop-blur-md">
            <h4 className="text-slate-500 font-black uppercase tracking-[0.4em] text-[10px] mb-8 italic text-center">Optimal Capital Distribution</h4>
            <div className="space-y-8">
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] italic">Money Market</span>
                  <span className="text-white font-black font-mono italic text-sm">40%</span>
                </div>
                <div className="w-full h-2.5 bg-slate-950/60 rounded-full overflow-hidden shadow-inner">
                  <div className="h-full bg-brand-olive w-[40%] rounded-full shadow-[0_0_15px_rgba(16,185,129,0.3)]"></div>
                </div>
              </div>
              
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] italic">Equity / Bluechip</span>
                  <span className="text-white font-black font-mono italic text-sm">35%</span>
                </div>
                <div className="w-full h-2.5 bg-slate-950/60 rounded-full overflow-hidden shadow-inner">
                  <div className="h-full bg-brand-blue w-[35%] rounded-full shadow-[0_0_15px_rgba(59,130,246,0.3)]"></div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] italic">High-Yield / Alpha</span>
                  <span className="text-white font-black font-mono italic text-sm">25%</span>
                </div>
                <div className="w-full h-2.5 bg-slate-950/60 rounded-full overflow-hidden shadow-inner">
                  <div className="h-full bg-brand-peach w-[25%] rounded-full shadow-[0_0_15px_rgba(245,158,11,0.3)]"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GrowthPlan;
