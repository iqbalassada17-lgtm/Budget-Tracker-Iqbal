
import React, { useState } from 'react';
import { Icons } from '../constants';
import { parseAssetCommand } from '../services/geminiService';
import { syncAssetToGoogleSheet, syncStockbitTransactionToSheet } from '../services/spreadsheetService';

const InputAsset: React.FC = () => {
  const [selectedBroker, setSelectedBroker] = useState<'stockbit' | 'bibit' | null>(null);
  const [command, setCommand] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'analyzing' | 'preview' | 'syncing' | 'success' | 'error'>('idle');
  const [assets, setAssets] = useState<any[]>([]);

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!command.trim() || loading || !selectedBroker) return;

    setLoading(true);
    setStatus('analyzing');
    
    try {
      const brokerName = selectedBroker === 'stockbit' ? 'Stockbit Sekuritas' : 'Bibit Reksadana';
      const parsed = await parseAssetCommand(command, brokerName);
      
      // Filter out invalid/zero data before showing preview
      const validAssets = parsed.filter(a => a.name && (a.lot > 0 || a.amount > 0 || a.buyValue > 0 || a.sellValue > 0));
      
      if (validAssets.length === 0) {
        alert("AI tidak mendeteksi data transaksi yang valid. Silakan coba salin ulang teks dari aplikasi broker.");
        setStatus('idle');
      } else {
        setAssets(validAssets);
        setStatus('preview');
      }
    } catch (err) {
      console.error(err);
      setStatus('error');
    } finally {
      setLoading(false);
    }
  };

  const handleBulkSync = async () => {
    setLoading(true);
    setStatus('syncing');
    
    try {
      for (const asset of assets) {
        if (asset.isTransaction && selectedBroker === 'stockbit') {
          await syncStockbitTransactionToSheet({
            transDate: asset.transDate || '',
            stock: asset.name || '',
            side: asset.side || '',
            lot: asset.lot || 0,
            price: asset.price || 0,
            buyValue: asset.buyValue || 0,
            sellValue: asset.sellValue || 0,
            salesTax: asset.salesTax || 0
          });
        } else {
          await syncAssetToGoogleSheet({
            name: asset.name || '',
            type: asset.isTransaction ? 'STOCK_TRADE' : (asset.type || 'SAHAM'),
            amount: asset.isTransaction ? ((asset.lot || 0) * 100) : (asset.amount || 0),
            unit: asset.unit || 'LEMBAR',
            invest: asset.isTransaction ? (asset.buyValue || 0) : (asset.invest || 0),
            equity: asset.isTransaction ? (asset.sellValue || 0) : (asset.equity || 0),
            currentPrice: asset.isTransaction ? (asset.price || 0) : (asset.currentPrice || 0)
          });
        }
      }
      setStatus('success');
      setCommand('');
      setSelectedBroker(null);
    } catch (err) {
      console.error(err);
      setStatus('error');
    } finally {
      setLoading(false);
    }
  };

  const isTransactionData = assets.length > 0 && assets[0].isTransaction;

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 max-w-5xl mx-auto pb-20">
      <div className="flex flex-col items-center text-center mb-10">
        <div className="w-16 h-16 bg-brand-olive/10 rounded-2xl flex items-center justify-center text-brand-olive mb-4 border border-brand-olive/20">
          <Icons.Growth />
        </div>
        <h2 className="text-3xl font-black text-slate-900 italic uppercase tracking-tighter">
          Stock <span className="text-brand-olive">Portfolio Automator</span>
        </h2>
        <p className="text-slate-500 text-xs font-bold uppercase tracking-[0.3em] mt-2">
          Sync dari Aplikasi Sekuritas Iqbal
        </p>
      </div>

      {status === 'idle' || status === 'analyzing' || status === 'error' ? (
        <div className="bg-white/80 border border-brand-brown/10 p-8 rounded-[3rem] backdrop-blur-xl shadow-2xl space-y-8">
          
          <div className="space-y-4">
            <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest text-center italic">Pilih Sumber Broker :</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button
                onClick={() => setSelectedBroker('stockbit')}
                className={`p-6 rounded-[2rem] border-2 transition-all flex flex-col items-center gap-3 group ${
                  selectedBroker === 'stockbit' 
                    ? 'bg-brand-olive/10 border-brand-olive shadow-[0_0_30px_rgba(141,135,65,0.1)]' 
                    : 'bg-white/50 border-brand-brown/10 hover:border-brand-brown/30'
                }`}
              >
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-black text-xl ${
                  selectedBroker === 'stockbit' ? 'bg-brand-olive text-white' : 'bg-slate-100 text-slate-400 group-hover:bg-slate-200'
                }`}>
                  S
                </div>
                <div className="text-center">
                  <p className={`font-black uppercase tracking-tighter ${selectedBroker === 'stockbit' ? 'text-slate-900' : 'text-slate-500'}`}>Stockbit Sekuritas</p>
                  <p className="text-[8px] text-slate-500 font-bold uppercase tracking-widest mt-1 italic">Portfolio & Trade Log</p>
                </div>
              </button>

              <button
                onClick={() => setSelectedBroker('bibit')}
                className={`p-6 rounded-[2rem] border-2 transition-all flex flex-col items-center gap-3 group ${
                  selectedBroker === 'bibit' 
                    ? 'bg-brand-blue/10 border-brand-blue shadow-[0_0_30px_rgba(101,157,189,0.1)]' 
                    : 'bg-white/50 border-brand-brown/10 hover:border-brand-brown/30'
                }`}
              >
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-black text-xl ${
                  selectedBroker === 'bibit' ? 'bg-brand-blue text-white' : 'bg-slate-100 text-slate-400 group-hover:bg-slate-200'
                }`}>
                  B
                </div>
                <div className="text-center">
                  <p className={`font-black uppercase tracking-tighter ${selectedBroker === 'bibit' ? 'text-slate-900' : 'text-slate-500'}`}>Bibit Reksadana</p>
                  <p className="text-[8px] text-slate-500 font-bold uppercase tracking-widest mt-1 italic">Aplikasi Bibit</p>
                </div>
              </button>
            </div>
          </div>

          <form onSubmit={handleAnalyze} className={`space-y-6 transition-all duration-500 ${selectedBroker ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-30 pointer-events-none'}`}>
            <textarea
              value={command}
              onChange={(e) => setCommand(e.target.value)}
              placeholder={selectedBroker === 'stockbit' ? "Tempel rincian Portfolio atau Trade Log di sini..." : "Tempel rincian Bibit di sini..."}
              className="w-full bg-white/50 border border-brand-brown/10 rounded-[2rem] px-8 py-8 text-slate-900 focus:outline-none focus:ring-4 focus:ring-brand-olive/10 focus:border-brand-olive/50 transition-all min-h-[250px] resize-none text-lg font-mono placeholder:text-slate-400"
            />
            
            <button 
              type="submit"
              disabled={loading || !command.trim() || !selectedBroker}
              className={`w-full font-black py-5 rounded-2xl shadow-xl transition-all flex items-center justify-center gap-3 text-lg ${
                selectedBroker === 'bibit' ? 'bg-brand-blue hover:bg-brand-blue/90' : 'bg-brand-olive hover:bg-brand-olive/90'
              } disabled:bg-slate-200 disabled:text-slate-400 text-white`}
            >
              {status === 'analyzing' ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                  AI SEDANG MENDETEKSI PARAMETER...
                </>
              ) : "SINKRONISASI SEKARANG"}
            </button>
          </form>
        </div>
      ) : status === 'preview' || status === 'syncing' ? (
        <div className="space-y-6 animate-in zoom-in-95 duration-500">
          <div className="bg-white border border-brand-brown/10 rounded-[3rem] overflow-hidden shadow-2xl">
            <div className="p-8 border-b border-brand-brown/10 bg-brand-cream/10 flex justify-between items-center">
               <h3 className="text-slate-900 font-black uppercase tracking-widest text-sm italic">
                 Preview Deteksi Transaksi {selectedBroker?.toUpperCase()}
               </h3>
               <span className="text-[10px] font-black px-4 py-2 rounded-full border border-brand-olive/20 text-brand-olive bg-brand-olive/10">
                 {assets.length} ENTRI VALID
               </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50">
                  {isTransactionData ? (
                    <tr>
                      <th className="px-6 py-4 text-[9px] text-slate-500 uppercase font-black">Trans Date</th>
                      <th className="px-6 py-4 text-[9px] text-slate-500 uppercase font-black">Stock</th>
                      <th className="px-6 py-4 text-[9px] text-slate-500 uppercase font-black">Side</th>
                      <th className="px-6 py-4 text-[9px] text-slate-500 uppercase font-black text-right">Lot</th>
                      <th className="px-6 py-4 text-[9px] text-slate-500 uppercase font-black text-right">Price</th>
                      <th className="px-6 py-4 text-[9px] text-slate-500 uppercase font-black text-right">Buy/Sell Value</th>
                      <th className="px-6 py-4 text-[9px] text-slate-500 uppercase font-black text-right">Tax</th>
                    </tr>
                  ) : (
                    <tr>
                      <th className="px-6 py-4 text-[9px] text-slate-500 uppercase font-black">Ticker</th>
                      <th className="px-6 py-4 text-[9px] text-slate-500 uppercase font-black text-right">Lembar</th>
                      <th className="px-6 py-4 text-[9px] text-slate-500 uppercase font-black text-right">Modal</th>
                      <th className="px-6 py-4 text-[9px] text-slate-500 uppercase font-black text-right">Equity</th>
                    </tr>
                  )}
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {assets.map((a, i) => (
                    <tr key={i} className="hover:bg-brand-olive/5 transition-colors">
                      {isTransactionData ? (
                        <>
                          <td className="px-6 py-4 text-xs text-slate-500 font-mono">{a.transDate}</td>
                          <td className="px-6 py-4 font-black text-slate-900">{a.name}</td>
                          <td className={`px-6 py-4 text-[10px] font-black ${a.side === 'BUY' ? 'text-brand-olive' : 'text-rose-500'}`}>{a.side}</td>
                          <td className="px-6 py-4 text-right font-mono text-xs text-slate-600">{(a.lot || 0).toLocaleString()}</td>
                          <td className="px-6 py-4 text-right font-mono text-xs text-slate-600">Rp{(a.price || 0).toLocaleString()}</td>
                          <td className={`px-6 py-4 text-right font-mono text-xs font-black ${a.side === 'BUY' ? 'text-brand-olive' : 'text-rose-500'}`}>
                            Rp{(a.side === 'BUY' ? a.buyValue : a.sellValue).toLocaleString()}
                          </td>
                          <td className="px-6 py-4 text-right font-mono text-xs text-slate-400">Rp{(a.salesTax || 0).toLocaleString()}</td>
                        </>
                      ) : (
                        <>
                          <td className="px-6 py-4 font-black text-slate-900">{a.name}</td>
                          <td className="px-6 py-4 text-right font-mono text-xs text-slate-500">{(a.amount || 0).toLocaleString()}</td>
                          <td className="px-6 py-4 text-right font-mono text-xs text-slate-500">Rp{(a.invest || 0).toLocaleString()}</td>
                          <td className="px-6 py-4 text-right font-mono text-sm font-black text-brand-olive">Rp{(a.equity || 0).toLocaleString()}</td>
                        </>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          
          <div className="flex gap-4">
            <button 
              onClick={() => setStatus('idle')}
              className="flex-1 py-5 bg-white border border-brand-brown/10 text-slate-500 font-black uppercase rounded-2xl hover:bg-slate-50"
            >
              Edit Data
            </button>
            <button 
              onClick={handleBulkSync}
              className="flex-[2] py-5 bg-brand-olive text-white font-black uppercase rounded-2xl shadow-xl flex items-center justify-center gap-3"
            >
              {status === 'syncing' ? "SEDANG MENYIMPAN..." : "SIMPAN KE SPREADSHEET"}
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-white border border-brand-olive/30 p-16 rounded-[3rem] text-center shadow-2xl animate-in zoom-in">
           <div className="w-20 h-20 bg-brand-olive/20 rounded-full flex items-center justify-center mx-auto mb-6 text-brand-olive">
              <Icons.Sparkles />
           </div>
           <h3 className="text-3xl font-black text-slate-900 uppercase tracking-tighter mb-4">Berhasil Sinkron!</h3>
           <p className="text-slate-500 text-sm font-medium italic mb-10 uppercase tracking-widest">
             Seluruh data {selectedBroker} telah dipindahkan ke Spreadsheet Iqbal.
           </p>
           <button 
             onClick={() => setStatus('idle')}
             className="px-10 py-4 bg-brand-olive text-white font-black uppercase rounded-2xl hover:bg-brand-olive/90 transition-all shadow-xl"
           >
             Selesai
           </button>
        </div>
      )}
    </div>
  );
};

export default InputAsset;
