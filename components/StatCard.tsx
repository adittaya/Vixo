
import React from 'react';

interface StatCardProps {
  label: string;
  value: string | number;
  icon: string;
  trend?: string;
  color?: string;
}

export const StatCard: React.FC<StatCardProps> = ({ label, value, icon, trend, color = 'bg-white' }) => {
  return (
    <div className={`${color} p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col gap-2`}>
      <div className="flex justify-between items-center">
        <span className="text-slate-500 text-sm font-medium">{label}</span>
        <i className={`${icon} text-slate-400`}></i>
      </div>
      <div className="text-2xl font-bold text-slate-900">{value}</div>
      {trend && (
        <div className="text-xs font-semibold text-emerald-500">
          <i className="fas fa-arrow-up mr-1"></i>
          {trend}
        </div>
      )}
    </div>
  );
};
