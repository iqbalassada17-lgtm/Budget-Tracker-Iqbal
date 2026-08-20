
import React, { useState } from 'react';
import { Icons } from '../constants';
import { parseRevenueCommand } from '../services/geminiService';
import { syncRevenueToGoogleSheet } from '../services/spreadsheetService';

const InputRevenue: React.FC = () => {
  const [command, setCommand] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'analyzing' | 'preview' | 'syncing' | 'success' | 'error'>('idle');
  const [result, setResult] = useState<any>(null);

  const templateString = `BULAN : January
TANGGAL : 01/01/2026
HARI : KAMIS
WEEK : WEEK1
PARAMETER : GAJI POKOK
REVENUE : 12000000`;

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!command.trim() || loading) return;

    setLoading(true);
    setStatus('analyzing');
    setResult(null);

    try {
      const parsed = await parseRevenueCommand(command);
      setResult(parsed);
      setStatus('preview');
    } catch (err: any) {
      console.error(err);
      setStatus('error');
    } finally {
      setLoading(false);
    }
  };

  const handleFinalSync = async () => {
    if (!result || loading) return;

    setLoading(true);
    setStatus('syncing');

    try {
      const isSent = await syncRevenueToGoogleSheet({
        bulan: result.bulan || '',
        tanggal: result.tanggal || '',
        hari: result.hari || '',
        week: result.week || '',
        parameter: result.parameter || '',
        revenue: result.revenue || 0
      });

      if (isSent) {
        setStatus('success');
        setCommand('');
        setTimeout(() => {
          setStatus('idle');
          setResult(null);
        }, 15000); // Pesan sukses lebih lama agar user bisa klik link
      } else {
        throw new Error("Gagal kirim revenue ke cloud.");
      }
    } catch (err: any) {
      console.error(err);
      setStatus('error');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setStatus('idle');
    setResult(null);
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 max-w-4xl mx-auto pb-20">
      <div className="text-center mb-10">
        <h2 className="text-4xl font-black text-white mb-2 tracking-tighter italic uppercase">
          AI <span className="text-brand-olive">Revenue Engine</span>
        </h2>
        <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.4em] leading-relaxed italic">
          Automated Inflow Tracking • Multi-Channel Audit
        </p>
      </div>

      <div className="relative">
        {(status === 'idle' || status === 'analyzing' || status === 'error') && (
          <div className="bg-slate-900/40 border border-slate-800 p-10 rounded-[3rem] backdrop-blur-xl shadow-2xl">
            <form onSubmit={handleAnalyze} className="space-y-8">
              <div className="relative">
                <div className="flex justify-between items-center mb-6">
                  <label className="text-[10px] uppercase font-black text-slate-500 tracking-[0.3em] italic flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-brand-olive rounded-full animate-pulse"></span>
                    Terminal Input Matrix
                  </label>
                  <button 
                    type="button"
                    onClick={() => setCommand(templateString)}
                    className="text-[10px] bg-slate-800 text-slate-400 font-black px-6 py-2.5 rounded-xl border border-slate-700 hover:bg-brand-olive hover:text-white transition-all uppercase tracking-widest shadow-lg"
                  >
                    Load Sample Protocol
                  </button>
                </div>
                <textarea
                  value={command}
                  onChange={(e) => setCommand(e.target.value)}
                  placeholder="Describe your revenue influx (e.g., Project bonus 5M or Dividend payout 1.2M)..."
                  className="w-full bg-slate-950/60 border border-slate-800 rounded-3xl px-8 py-8 text-white focus:outline-none focus:ring-4 focus:ring-brand-olive/10 focus:border-brand-olive/50 transition-all min-h-[250px] resize-none text-xl font-bold placeholder:text-slate-600 shadow-inner italic"
                  disabled={loading}
                />
              </div>

              <button 
                type="submit"
                disabled={loading || !command.trim()}
                className="w-full bg-brand-olive hover:bg-brand-olive/90 disabled:bg-slate-800 disabled:text-slate-600 font-black py-6 rounded-[2rem] shadow-[0_20px_50px_rgba(16,185,129,0.3)] transition-all active:scale-[0.98] flex items-center justify-center gap-4 text-xl text-white italic border border-white/10"
              >
                {status === 'analyzing' ? (
                  <>
                    <div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                    DECRYPTING REVENUE...
                  </>
                ) : (
                  <>
                    <Icons.Sparkles />
                    INITIALIZE INFLOW
                  </>
                )}
              </button>
            </form>
          </div>
        )}

        {(status === 'preview' || status === 'syncing') && result && (
          <div className="animate-in zoom-in-95 fade-in duration-500 bg-slate-900 border-2 border-brand-olive/30 p-12 rounded-[4rem] shadow-[0_0_80px_rgba(16,185,129,0.15)] backdrop-blur-3xl relative overflow-hidden">
             <div className="absolute top-0 right-0 p-10 opacity-5 pointer-events-none">
                <Icons.Sparkles />
             </div>
             <div className="flex items-center gap-5 mb-12">
                <div className="bg-brand-olive p-4 rounded-2xl text-white shadow-2xl shadow-brand-olive/30">
                   <Icons.TrendingUp />
                </div>
                <div>
                   <h3 className="text-white font-black text-2xl uppercase tracking-tighter italic">Inflow Validation</h3>
                   <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.3em] italic">Reviewing entry for REVENUE ledger</p>
                </div>
             </div>

             <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div className="bg-slate-950/60 p-6 rounded-3xl border border-slate-800">
                   <p className="text-[9px] text-slate-500 font-black uppercase tracking-widest mb-1 italic">MONTH_NODE (A)</p>
                   <p className="text-white font-black italic">{result.bulan || '-'}</p>
                </div>
                <div className="bg-slate-950/60 p-6 rounded-3xl border border-slate-800">
                   <p className="text-[9px] text-slate-500 font-black uppercase tracking-widest mb-1 italic">TIMESTAMP (B)</p>
                   <p className="text-white font-mono font-black italic">{result.tanggal || '-'}</p>
                </div>
                <div className="bg-slate-950/60 p-6 rounded-3xl border border-slate-800">
                   <p className="text-[9px] text-slate-500 font-black uppercase tracking-widest mb-1 italic">DAY_REF (C)</p>
                   <p className="text-white font-black italic">{result.hari || '-'}</p>
                </div>
                <div className="bg-slate-950/60 p-6 rounded-3xl border border-slate-800">
                   <p className="text-[9px] text-slate-500 font-black uppercase tracking-widest mb-1 italic">WEEK_PHASE (D)</p>
                   <p className="text-brand-olive font-black italic text-lg">{result.week || '-'}</p>
                </div>
                
                <div className="col-span-2 bg-slate-950/80 p-8 rounded-3xl border border-slate-800 border-l-8 border-l-brand-olive shadow-inner">
                   <p className="text-[9px] text-slate-500 font-black uppercase tracking-widest mb-2 italic">PARAMETER_ID (E)</p>
                   <p className="text-white font-black text-3xl tracking-tighter uppercase italic">{result.parameter || '-'}</p>
                </div>
                <div className="col-span-2 bg-slate-950/80 p-8 rounded-3xl border border-slate-800 border-l-8 border-l-brand-blue shadow-inner">
                   <p className="text-[9px] text-slate-500 font-black uppercase tracking-widest mb-2 italic">NET_REVENUE (F)</p>
                   <p className="text-brand-blue font-mono font-black text-4xl italic">Rp {(result.revenue || 0).toLocaleString('id-ID')}</p>
                </div>
             </div>

             <div className="mt-12 flex flex-col sm:flex-row gap-4">
                <button 
                  onClick={handleCancel}
                  disabled={status === 'syncing'}
                  className="flex-1 py-5 px-8 rounded-[2rem] border border-slate-800 text-slate-500 font-black uppercase tracking-widest hover:bg-slate-800 hover:text-white transition-all active:scale-95 italic"
                >
                  Abort
                </button>
                <button 
                  onClick={handleFinalSync}
                  disabled={status === 'syncing'}
                  className="flex-[2] py-5 px-8 rounded-[2rem] bg-brand-olive hover:bg-brand-olive/90 text-white font-black uppercase tracking-[0.2em] shadow-2xl shadow-brand-olive/30 transition-all flex items-center justify-center gap-4 active:scale-95 italic border border-white/10"
                >
                  {status === 'syncing' ? (
                    <>
                      <div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                      UPLOADING...
                    </>
                  ) : (
                    <>
                      <Icons.Masterdata />
                      COMMIT REVENUE
                    </>
                  )}
                </button>
             </div>
          </div>
        )}

        {status === 'success' && (
          <div className="bg-slate-900 border border-brand-olive/30 p-16 rounded-[4rem] text-center animate-in zoom-in duration-500 shadow-2xl">
             <div className="w-24 h-24 bg-brand-olive/20 rounded-3xl flex items-center justify-center mx-auto mb-8 text-brand-olive border border-brand-olive/20 shadow-2xl shadow-brand-olive/20 rotate-12">
                <Icons.Sparkles />
             </div>
             <h3 className="text-brand-olive font-black text-4xl mb-4 tracking-tighter uppercase italic">Ledger Updated</h3>
             <p className="text-slate-500 text-xs font-black mb-12 italic uppercase tracking-[0.4em] leading-loose">Inflow packet has been successfully indexed in "REVENUE" node.</p>
             
             <div className="flex flex-col sm:flex-row gap-6 justify-center">
                <button 
                  onClick={() => {setStatus('idle'); setResult(null);}} 
                  className="px-10 py-5 bg-slate-800 text-slate-300 text-xs font-black uppercase rounded-2xl border border-slate-700 hover:bg-slate-700 transition-all italic tracking-widest"
                >
                  New Inflow
                </button>
                <a 
                  href="https://docs.google.com/spreadsheets/d/1WiHaDJnXOMVKvLmkhzml0C3xUg69iHc3rsNKuEojJ2k/edit?gid=479119470" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="px-10 py-5 bg-brand-olive text-white text-xs font-black uppercase rounded-2xl shadow-2xl shadow-brand-olive/30 inline-flex items-center gap-3 italic border border-white/10 tracking-widest hover:scale-105 transition-all"
                >
                  Inspect Database <Icons.ChevronRight />
                </a>
             </div>
          </div>
        )}

        {status === 'error' && (
          <div className="mt-6 bg-red-500/10 border border-red-500/20 p-6 rounded-2xl text-center">
             <p className="text-red-400 font-bold uppercase text-xs mb-1 tracking-widest">Protocol Failure</p>
             <p className="text-slate-500 text-[10px] italic">Failed to bridge revenue data to central node.</p>
             <button onClick={() => setStatus('idle')} className="mt-4 text-xs font-black text-white underline uppercase">Retry Protocol</button>
          </div>
        )}
      </div>

      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-brand-olive/5 rounded-full blur-[120px] -z-10 pointer-events-none"></div>
    </div>
  );
};

export default InputRevenue;
