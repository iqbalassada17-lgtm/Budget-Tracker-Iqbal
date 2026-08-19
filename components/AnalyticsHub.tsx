
import React, { useState } from 'react';
import DashboardTab from './DashboardTab';
import RevenueDashboard from './RevenueDashboard';
import BudgetDashboard from './BudgetDashboard';
import { Icons } from '../constants';

const AnalyticsHub: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState<'cost' | 'revenue' | 'budget'>('cost');

  const tabs = [
    { id: 'cost', label: 'Cost Analysis', icon: <Icons.Analytics />, color: 'brand-peach' },
    { id: 'revenue', label: 'Revenue / Profit', icon: <Icons.TrendingUp />, color: 'brand-olive' },
    { id: 'budget', label: 'Budget Efficiency', icon: <Icons.Wallet />, color: 'brand-brown' },
  ];

  return (
    <div className="animate-in fade-in duration-700 space-y-8">
      {/* Header Hub Analytics */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-6 bg-white/80 p-6 rounded-[2.5rem] border border-brand-brown/10 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="bg-gradient-to-tr from-brand-blue to-brand-olive p-4 rounded-2xl text-white shadow-xl shadow-brand-blue/20">
            <Icons.Analytics />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tighter uppercase italic">Financial <span className="text-brand-blue">Analytics Hub</span></h1>
            <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest italic">Visualisasi Data & Performa Keuangan Iqbal</p>
          </div>
        </div>

        {/* Sub-Tab Switcher - Modern Segmented Control */}
        <div className="flex bg-brand-cream/20 p-1.5 rounded-2xl border border-brand-brown/10 shadow-inner overflow-x-auto max-w-full custom-scrollbar">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id as any)}
              className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 whitespace-nowrap ${
                activeSubTab === tab.id 
                  ? `bg-${tab.color} text-white shadow-lg shadow-${tab.color}/20` 
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Dashboard Area */}
      <div className="min-h-[700px] relative">
        {/* Dynamic Glow Effect based on active color */}
        <div className={`absolute inset-0 bg-${tabs.find(t => t.id === activeSubTab)?.color}/5 blur-[140px] rounded-full -z-10 pointer-events-none transition-all duration-1000`}></div>
        
        {activeSubTab === 'cost' && <DashboardTab />}
        {activeSubTab === 'revenue' && <RevenueDashboard />}
        {activeSubTab === 'budget' && <BudgetDashboard />}
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { height: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #1e293b; border-radius: 10px; }
      `}</style>
    </div>
  );
};

export default AnalyticsHub;
