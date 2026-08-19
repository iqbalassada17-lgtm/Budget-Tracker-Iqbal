
import React, { useState } from 'react';
import { Icons } from '../constants';
import { parseCostCommand } from '../services/geminiService';
import { syncToGoogleSheet } from '../services/spreadsheetService';

const InputCost: React.FC = () => {
  const [command, setCommand] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'analyzing' | 'preview' | 'syncing' | 'success' | 'error'>('idle');
  const [result, setResult] = useState<any>(null);

  const templateString = `BULAN : FEBRUARI
TANGGAL : 01/02/2026
HARI : MINGGU
WEEK : 1
COA : UANG MAKAN
COST : 12000
KETERANGAN : MAKAN SIANG`;

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!command.trim() || loading) return;

    setLoading(true);
    setStatus('analyzing');
    setResult(null);

    try {
      const parsed = await parseCostCommand(command);
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
      const isSent = await syncToGoogleSheet({
        bulan: result.bulan || '',
        tanggal: result.tanggal || '',
        hari: result.hari || '',
        week: result.week || '',
        coa: result.coa || '',
        cost: result.cost || 0,
        keterangan: result.keterangan || ''
      });

      if (isSent) {
        setStatus('success');
        setCommand('');
        setTimeout(() => {
          setStatus('idle');
          setResult(null);
        }, 8000);
      } else {
        throw new Error("Gagal sinkronisasi ke cloud.");
      }
    } catch (err: any) {
      console.error(err);
      setStatus('error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 max-w-4xl mx-auto pb-20">
      <div className="text-center mb-10">
        <h2 className="text-3xl font-black text-slate-900 mb-2 tracking-tight italic uppercase">
          AI <span className="text-brand-blue">Smart Cost</span>
        </h2>
        <p className="text-slate-500 text-sm font-medium italic uppercase tracking-widest leading-relaxed">
          Pencatatan Otomatis ke Database Sheet "INPUT COST"
        </p>
      </div>

      <div className="relative">
        {(status === 'idle' || status === 'analyzing' || status === 'error') && (
          <div className="bg-white/80 border border-brand-brown/10 p-8 rounded-[2.5rem] backdrop-blur-xl shadow-2xl">
            <form onSubmit={handleAnalyze} className="space-y-6">
              <div className="relative">
                <div className="flex justify-between items-center mb-4">
                  <label className="text-[10px] uppercase font-black text-slate-500 tracking-[0.2em]">Input Deskripsi Biaya</label>
                  <button 
                    type="button"
                    onClick={() => setCommand(templateString)}
                    className="text-[10px] bg-brand-blue/10 text-brand-blue font-black px-4 py-2 rounded-xl border border-brand-blue/20 hover:bg-brand-blue hover:text-white transition-all uppercase tracking-widest"
                  >
                    Pakai Contoh
                  </button>
                </div>
                <textarea
                  value={command}
                  onChange={(e) => setCommand(e.target.value)}
                  placeholder="Ketik pengeluaranmu (misal: Beli pulsa 50rb atau Makan malam 35k)..."
                  className="w-full bg-brand-cream/20 border border-brand-brown/10 rounded-2xl px-6 py-5 text-slate-900 focus:outline-none focus:ring-4 focus:ring-brand-blue/10 focus:border-brand-blue/50 transition-all min-h-[200px] resize-none text-lg font-mono placeholder:text-slate-400"
                  disabled={loading}
                />
              </div>

              <button 
                type="submit"
                disabled={loading || !command.trim()}
                className="w-full bg-brand-blue hover:bg-brand-blue/90 disabled:bg-slate-200 disabled:text-slate-400 font-black py-5 rounded-2xl shadow-xl transition-all active:scale-[0.98] flex items-center justify-center gap-3 text-lg text-white"
              >
                {status === 'analyzing' ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                    MENGANALISIS...
                  </>
                ) : (
                  <>
                    <Icons.Sparkles />
                    PROSES INPUT OTOMATIS
                  </>
                )}
              </button>
            </form>
          </div>
        )}

        {(status === 'preview' || status === 'syncing') && result && (
          <div className="animate-in zoom-in-95 fade-in duration-500 bg-white border-2 border-brand-blue/30 p-10 rounded-[3rem] shadow-[0_0_50px_rgba(101,157,189,0.1)] backdrop-blur-3xl">
             <div className="flex items-center gap-4 mb-10">
                <div className="bg-brand-blue p-3 rounded-2xl text-white">
                   <Icons.Wallet />
                </div>
                <div>
                   <h3 className="text-slate-900 font-black text-xl uppercase tracking-tighter">Konfirmasi Data</h3>
                   <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">Detail Baris Baru di Database INPUT COST</p>
                </div>
             </div>

             <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div className="bg-brand-cream/20 p-4 rounded-2xl border border-brand-brown/10">
                   <p className="text-[9px] text-slate-500 font-black uppercase tracking-widest mb-1">BULAN (A)</p>
                   <p className="text-slate-900 font-bold">{result.bulan || '-'}</p>
                </div>
                <div className="bg-brand-cream/20 p-4 rounded-2xl border border-brand-brown/10">
                   <p className="text-[9px] text-slate-500 font-black uppercase tracking-widest mb-1">TANGGAL (B)</p>
                   <p className="text-slate-900 font-mono font-bold">{result.tanggal || '-'}</p>
                </div>
                <div className="bg-brand-cream/20 p-4 rounded-2xl border border-brand-brown/10">
                   <p className="text-[9px] text-slate-500 font-black uppercase tracking-widest mb-1">HARI (C)</p>
                   <p className="text-slate-900 font-bold">{result.hari || '-'}</p>
                </div>
                <div className="bg-brand-cream/20 p-4 rounded-2xl border border-brand-brown/10">
                   <p className="text-[9px] text-slate-500 font-black uppercase tracking-widest mb-1">WEEK (D)</p>
                   <p className="text-brand-blue font-black italic">{result.week || '-'}</p>
                </div>
                
                <div className="col-span-2 bg-brand-cream/20 p-6 rounded-2xl border border-brand-brown/10 border-l-4 border-l-brand-blue">
                   <p className="text-[9px] text-slate-500 font-black uppercase tracking-widest mb-2">COA / KATEGORI (E)</p>
                   <p className="text-slate-900 font-black text-2xl tracking-tighter uppercase">{result.coa || '-'}</p>
                </div>
                <div className="col-span-2 bg-brand-cream/20 p-6 rounded-2xl border border-brand-brown/10 border-l-4 border-l-brand-olive">
                   <p className="text-[9px] text-slate-500 font-black uppercase tracking-widest mb-2">COST / NOMINAL (F)</p>
                   <p className="text-brand-olive font-mono font-black text-3xl">Rp {(result.cost || 0).toLocaleString('id-ID')}</p>
                </div>

                <div className="col-span-full bg-brand-cream/20 p-6 rounded-2xl border border-brand-brown/10">
                   <p className="text-[9px] text-slate-500 font-black uppercase tracking-widest mb-2">KETERANGAN (G)</p>
                   <p className="text-slate-700 font-medium italic text-lg leading-relaxed uppercase">{result.keterangan || '-'}</p>
                </div>
             </div>

             <div className="mt-12 flex flex-col sm:flex-row gap-4">
                <button 
                  onClick={() => setStatus('idle')}
                  disabled={status === 'syncing'}
                  className="flex-1 py-4 px-6 rounded-2xl border border-brand-brown/20 text-slate-500 font-black uppercase tracking-widest hover:bg-slate-100 transition-all active:scale-95"
                >
                  Batal
                </button>
                <button 
                  onClick={handleFinalSync}
                  disabled={status === 'syncing'}
                  className="flex-[2] py-4 px-6 rounded-2xl bg-brand-blue hover:bg-brand-blue/90 text-white font-black uppercase tracking-widest shadow-xl shadow-brand-blue/20 transition-all flex items-center justify-center gap-3 active:scale-95"
                >
                  {status === 'syncing' ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                      SEDANG MENGIRIM...
                    </>
                  ) : (
                    <>
                      <Icons.Masterdata />
                      SIMPAN KE DATABASE
                    </>
                  )}
                </button>
             </div>
          </div>
        )}

        {status === 'success' && (
          <div className="bg-white border border-brand-olive/30 p-12 rounded-[3rem] text-center animate-in zoom-in duration-500 shadow-2xl">
             <div className="w-20 h-20 bg-brand-olive/20 rounded-full flex items-center justify-center mx-auto mb-6 text-brand-olive border border-brand-olive/20">
                <Icons.Sparkles />
             </div>
             <h3 className="text-brand-olive font-black text-3xl mb-2 tracking-tighter uppercase">Berhasil Disimpan!</h3>
             <p className="text-slate-500 text-sm font-medium mb-10 italic uppercase tracking-widest">Data biaya Iqbal telah masuk ke baris terbaru di sheet "INPUT COST".</p>
             
             <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button 
                  onClick={() => setStatus('idle')} 
                  className="px-8 py-4 bg-slate-100 text-slate-700 text-xs font-black uppercase rounded-2xl border border-brand-brown/10 hover:bg-slate-200 transition-all"
                >
                  Input Lagi
                </button>
                <button 
                  onClick={() => window.open('https://docs.google.com/spreadsheets/d/1WiHaDJnXOMVKvLmkhzml0C3xUg69iHc3rsNKuEojJ2k/edit', '_blank')}
                  className="px-8 py-4 bg-brand-blue text-white text-xs font-black uppercase rounded-2xl shadow-lg shadow-brand-blue/20 inline-flex items-center gap-2"
                >
                  Cek Spreadsheet <Icons.ChevronRight />
                </button>
             </div>
          </div>
        )}

        {status === 'error' && (
          <div className="mt-6 bg-red-500/10 border border-red-500/20 p-6 rounded-2xl text-center">
             <p className="text-red-400 font-bold uppercase text-xs mb-1 tracking-widest">Koneksi Cloud Gagal</p>
             <p className="text-slate-500 text-[10px] italic">Pastikan Sheet "INPUT COST" tersedia dan Web App GAS sudah aktif.</p>
             <button onClick={() => setStatus('idle')} className="mt-4 text-xs font-black text-white underline uppercase">Coba Lagi</button>
          </div>
        )}
      </div>
    </div>
  );
};

export default InputCost;
