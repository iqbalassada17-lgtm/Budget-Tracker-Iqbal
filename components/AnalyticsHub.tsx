
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
      <div className="flex flex-col md:flex-row justify-between items-center gap-6 bg-slate-900/40 backdrop-blur-xl p-8 rounded-[3rem] border border-slate-800 shadow-2xl">
        <div className="flex items-center gap-4">
          <div className="bg-gradient-to-tr from-brand-blue to-brand-olive p-5 rounded-2xl text-white shadow-2xl shadow-brand-blue/30 border border-white/10">
            <Icons.Analytics />
          </div>
          <div>
            <h1 className="text-3xl font-black text-white tracking-tighter uppercase italic">Integration <span className="text-brand-blue">Dashboard</span></h1>
            <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.3em] italic">Privacy Data • Real-time Monitoring</p>
          </div>
        </div>

        {/* Sub-Tab Switcher - Modern Segmented Control */}
        <div className="flex bg-slate-950/60 p-2 rounded-[1.5rem] border border-slate-800 shadow-inner overflow-x-auto max-w-full custom-scrollbar">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id as any)}
              className={`px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all flex items-center gap-2 whitespace-nowrap ${
                activeSubTab === tab.id 
                  ? `bg-slate-800 text-white border border-white/10 shadow-[0_0_20px_rgba(255,255,255,0.05)]` 
                  : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              <span className={`transition-colors ${activeSubTab === tab.id ? 'text-brand-blue' : 'text-slate-600'}`}>{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Dashboard Area */}
      <div className="min-h-[700px] relative">
        {/* Dynamic Glow Effect based on active color */}
        <div className={`absolute inset-0 bg-${tabs.find(t => t.id === activeSubTab)?.color}/10 blur-[160px] rounded-full -z-10 pointer-events-none transition-all duration-1000`}></div>
        
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
