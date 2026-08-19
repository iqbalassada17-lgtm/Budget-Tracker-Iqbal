
import React from 'react';

const MasterList: React.FC = () => {
  const masterData = [
    { id: 1, code: 'ACC-001', name: 'Cash on Hand', type: 'Asset' },
    { id: 2, code: 'ACC-002', name: 'Bank BCA Utama', type: 'Asset' },
    { id: 3, code: 'EXP-001', name: 'Gaji Karyawan', type: 'Expense' },
    { id: 4, code: 'REV-001', name: 'Service Income', type: 'Revenue' },
  ];

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Master <span className="text-sky-600">Data</span></h2>
          <p className="text-slate-500 text-sm">Daftar referensi akun dan kategori sistem.</p>
        </div>
      </div>
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        <table className="w-full text-left border-collapse">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-6 py-4 text-slate-600 font-semibold text-sm">Kode Akun</th>
              <th className="px-6 py-4 text-slate-600 font-semibold text-sm">Nama Akun</th>
              <th className="px-6 py-4 text-slate-600 font-semibold text-sm">Tipe</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {masterData.map((d) => (
              <tr key={d.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-6 py-4 text-sky-600 font-mono">{d.code}</td>
                <td className="px-6 py-4 text-slate-900 font-medium">{d.name}</td>
                <td className="px-6 py-4">
                  <span className="px-2 py-1 bg-slate-100 text-slate-600 text-[10px] rounded uppercase font-bold tracking-wider">
                    {d.type}
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

export default MasterList;
