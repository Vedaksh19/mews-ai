import React from 'react';

export default function StatCard({ title, value, subtitle, icon: Icon, badge, color = 'blue' }) {
  const colorMap = {
    blue: {
      text: 'text-sky-600',
      bg: 'bg-sky-50',
      border: 'border-sky-200',
      glow: 'group-hover:border-sky-300 group-hover:shadow-[0_12px_24px_-4px_rgba(2,132,199,0.12)]',
      line: 'from-sky-500 to-blue-600'
    },
    emerald: {
      text: 'text-emerald-600',
      bg: 'bg-emerald-50',
      border: 'border-emerald-200',
      glow: 'group-hover:border-emerald-300 group-hover:shadow-[0_12px_24px_-4px_rgba(16,185,129,0.12)]',
      line: 'from-emerald-500 to-teal-600'
    },
    amber: {
      text: 'text-amber-600',
      bg: 'bg-amber-50',
      border: 'border-amber-200',
      glow: 'group-hover:border-amber-300 group-hover:shadow-[0_12px_24px_-4px_rgba(245,158,11,0.12)]',
      line: 'from-amber-500 to-yellow-600'
    },
    orange: {
      text: 'text-orange-600',
      bg: 'bg-orange-50',
      border: 'border-orange-200',
      glow: 'group-hover:border-orange-300 group-hover:shadow-[0_12px_24px_-4px_rgba(249,115,22,0.12)]',
      line: 'from-orange-500 to-rose-600'
    },
    rose: {
      text: 'text-rose-600',
      bg: 'bg-rose-50',
      border: 'border-rose-200',
      glow: 'group-hover:border-rose-300 group-hover:shadow-[0_12px_24px_-4px_rgba(244,63,94,0.12)]',
      line: 'from-rose-500 to-pink-600'
    },
    purple: {
      text: 'text-indigo-600',
      bg: 'bg-indigo-50',
      border: 'border-indigo-200',
      glow: 'group-hover:border-indigo-300 group-hover:shadow-[0_12px_24px_-4px_rgba(99,102,241,0.12)]',
      line: 'from-indigo-500 to-purple-600'
    }
  };

  const scheme = colorMap[color] || colorMap.blue;

  return (
    <div className={`glass-card-hover group relative rounded-2xl p-5 overflow-hidden transition-all duration-300 ${scheme.glow}`}>
      {/* Top subtle highlight line */}
      <div className={`absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r ${scheme.line} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />

      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
            {title}
          </p>
          <h3 className="text-2xl sm:text-3xl font-black text-slate-900 font-mono tracking-tight">
            {value}
          </h3>
          {subtitle && (
            <p className="text-xs text-slate-500 font-medium">
              {subtitle}
            </p>
          )}
        </div>

        {Icon && (
          <div className={`p-3 rounded-xl border ${scheme.bg} ${scheme.border} ${scheme.text} transition-all duration-300 group-hover:scale-110 shadow-xs`}>
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>

      {badge && (
        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
          <span className="text-slate-500 font-medium">{badge.label}</span>
          <span className="font-semibold text-slate-800 px-2 py-0.5 rounded-md bg-slate-50 border border-slate-200">
            {badge.val}
          </span>
        </div>
      )}
    </div>
  );
}
