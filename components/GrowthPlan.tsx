
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
      <div className="flex justify-between items-start mb-8">
        <div>
          <h2 className="text-2xl font-black text-slate-900 uppercase italic tracking-tighter">Growth <span className="text-brand-blue">Plan</span></h2>
          <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mt-1 italic">Strategi cerdas untuk melipatgandakan kekayaan Anda.</p>
        </div>
        <button 
          onClick={fetchStrategy}
          disabled={loading}
          className="p-2.5 bg-white border border-brand-brown/20 rounded-xl text-slate-400 hover:text-brand-blue transition-colors shadow-lg active:scale-95 disabled:opacity-50"
          title="Refresh Strategy"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-white border border-brand-brown/10 p-8 rounded-[2.5rem] shadow-xl relative overflow-hidden group border-l-8 border-l-brand-blue">
          <div className="absolute top-0 right-0 p-6 text-brand-blue/5 group-hover:text-brand-blue/10 transition-colors">
            <Icons.Robot />
          </div>
          <h3 className="text-brand-blue font-black mb-6 flex items-center gap-2 uppercase tracking-widest text-[10px] italic">
            <Icons.Sparkles /> Rekomendasi Strategis AI
          </h3>
          {loading ? (
            <div className="space-y-4">
              <div className="h-4 bg-brand-cream/40 rounded-full w-3/4 animate-pulse"></div>
              <div className="h-4 bg-brand-cream/40 rounded-full w-1/2 animate-pulse"></div>
              <div className="h-4 bg-brand-cream/40 rounded-full w-5/6 animate-pulse"></div>
            </div>
          ) : (
            <div className="text-slate-600 leading-relaxed space-y-4 whitespace-pre-wrap text-sm font-medium">
              {strategy}
            </div>
          )}
        </div>

        <div className="space-y-8">
          <div className="bg-white border border-brand-brown/10 p-8 rounded-[2.5rem] shadow-xl border-l-8 border-l-brand-olive">
            <h4 className="text-slate-900 font-black uppercase tracking-widest text-[10px] mb-4 italic">Target Tabungan 2024</h4>
            <div className="flex justify-between items-end mb-4">
              <span className="text-4xl font-black text-slate-900 font-mono tracking-tighter">Rp 100jt</span>
              <span className="text-brand-olive text-xs font-black uppercase tracking-widest">12.5% Tercapai</span>
            </div>
            <div className="w-full h-3 bg-brand-cream/40 rounded-full overflow-hidden border border-brand-brown/5">
              <div className="h-full bg-brand-olive w-[12.5%] rounded-full shadow-[0_0_10px_rgba(141,135,65,0.3)]"></div>
            </div>
          </div>

          <div className="bg-white border border-brand-brown/10 p-8 rounded-[2.5rem] shadow-xl">
            <h4 className="text-slate-900 font-black uppercase tracking-widest text-[10px] mb-6 italic">Alokasi Aset Ideal</h4>
            <div className="space-y-6">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 text-[10px] font-black uppercase tracking-widest">Pasar Uang</span>
                  <span className="text-slate-900 font-black font-mono">40%</span>
                </div>
                <div className="w-full h-2 bg-brand-cream/40 rounded-full overflow-hidden">
                  <div className="h-full bg-brand-olive w-[40%] rounded-full"></div>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 text-[10px] font-black uppercase tracking-widest">Saham Bluechip</span>
                  <span className="text-slate-900 font-black font-mono">35%</span>
                </div>
                <div className="w-full h-2 bg-brand-cream/40 rounded-full overflow-hidden">
                  <div className="h-full bg-brand-blue w-[35%] rounded-full"></div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 text-[10px] font-black uppercase tracking-widest">Crypto / High Risk</span>
                  <span className="text-slate-900 font-black font-mono">25%</span>
                </div>
                <div className="w-full h-2 bg-brand-cream/40 rounded-full overflow-hidden">
                  <div className="h-full bg-brand-peach w-[25%] rounded-full"></div>
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
