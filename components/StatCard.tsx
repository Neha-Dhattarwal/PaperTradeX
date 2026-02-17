import React from 'react';

interface StatCardProps {
  title: string;
  value: string | number;
  change?: string;
  positive?: boolean;
}

export const StatCard: React.FC<StatCardProps> = ({ title, value, change, positive }) => (
  <div className="glass p-8 rounded-[2rem] border-white/5 shadow-xl">
    <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-3">{title}</p>
    <p className="text-2xl font-black text-white tracking-tight">{value}</p>
    {change && (
      <div className={`mt-3 inline-block px-3 py-1.5 rounded-lg bg-white/[0.03] text-[8px] font-black uppercase tracking-widest border border-white/5 ${positive === undefined ? 'text-slate-500' : positive ? 'text-emerald-400' : 'text-rose-400'}`}>
        {change}
      </div>
    )}
  </div>
);