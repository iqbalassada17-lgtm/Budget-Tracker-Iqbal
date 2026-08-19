
import React from 'react';

const Masterdata: React.FC = () => {
  const transactions = [
    { id: 1, name: 'Gaji Bulanan', category: 'Income', amount: 20000000, date: '01/10/2023', status: 'Selesai' },
    { id: 2, name: 'Sewa Apartemen', category: 'Expense', amount: 5000000, date: '02/10/2023', status: 'Selesai' },
    { id: 3, name: 'Investasi Saham', category: 'Income', amount: 5000000, date: '05/10/2023', status: 'Proses' },
    { id: 4, name: 'Belanja Bulanan', category: 'Expense', amount: 3000000, date: '10/10/2023', status: 'Selesai' },
    { id: 5, name: 'Makan Malam', category: 'Expense', amount: 500000, date: '12/10/2023', status: 'Selesai' },
  ];

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-2xl font-bold text-white">Master Data Keuangan</h2>
          <p className="text-slate-400 text-sm">Kelola semua transaksi masuk dan keluar Anda di sini.</p>
        </div>
        <button className="bg-sky-600 hover:bg-sky-500 text-white px-6 py-2 rounded-xl transition-all shadow-lg shadow-sky-600/20 font-medium">
          + Tambah Data
        </button>
      </div>

      <div className="bg-slate-900/40 border border-slate-800 rounded-2xl overflow-hidden backdrop-blur-sm">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-800/50 border-b border-slate-700">
              <th className="px-6 py-4 text-slate-300 font-semibold text-sm">Transaksi</th>
              <th className="px-6 py-4 text-slate-300 font-semibold text-sm">Kategori</th>
              <th className="px-6 py-4 text-slate-300 font-semibold text-sm">Jumlah</th>
              <th className="px-6 py-4 text-slate-300 font-semibold text-sm">Tanggal</th>
              <th className="px-6 py-4 text-slate-300 font-semibold text-sm">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {transactions.map((t) => (
              <tr key={t.id} className="hover:bg-slate-800/30 transition-colors">
                <td className="px-6 py-4 text-white font-medium">{t.name}</td>
                <td className="px-6 py-4">
                  <span className={`px-3 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase ${
                    t.category === 'Income' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'
                  }`}>
                    {t.category}
                  </span>
                </td>
                <td className="px-6 py-4 text-slate-300 font-mono">
                  Rp {t.amount.toLocaleString()}
                </td>
                <td className="px-6 py-4 text-slate-400 text-sm">
                  {t.date}
                </td>
                <td className="px-6 py-4">
                   <span className={`flex items-center gap-2 text-sm ${t.status === 'Selesai' ? 'text-sky-400' : 'text-amber-400'}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${t.status === 'Selesai' ? 'bg-sky-400' : 'bg-amber-400 animate-pulse'}`}></span>
                    {t.status}
                   </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Masterdata;
