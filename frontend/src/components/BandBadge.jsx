import React from 'react';

const BAND_STYLES = {
  Low: {
    bg: 'bg-emerald-50 text-emerald-700 border-emerald-300 shadow-xs',
    dot: 'bg-emerald-500',
    ring: 'bg-emerald-400',
    text: 'Low: Normal Trading'
  },
  Watch: {
    bg: 'bg-amber-50 text-amber-700 border-amber-300 shadow-xs',
    dot: 'bg-amber-500',
    ring: 'bg-amber-400',
    text: 'Watch: Early Build-up'
  },
  High: {
    bg: 'bg-orange-50 text-orange-700 border-orange-300 shadow-xs',
    dot: 'bg-orange-500',
    ring: 'bg-orange-400',
    text: 'High: Likely Manipulation'
  },
  Critical: {
    bg: 'bg-rose-50 text-rose-700 border-rose-300 shadow-xs animate-pulse',
    dot: 'bg-rose-500',
    ring: 'bg-rose-400',
    text: 'Critical: Dump Imminent'
  }
};

export default function BandBadge({ band = 'Low', action, size = 'md' }) {
  const style = BAND_STYLES[band] || BAND_STYLES.Low;
  const sizeClasses = size === 'lg' ? 'px-4 py-2 text-sm font-semibold' : 'px-3 py-1.5 text-xs font-medium';

  return (
    <div className={`inline-flex items-center gap-2.5 rounded-full border backdrop-blur-md transition-all duration-300 hover:scale-105 cursor-default ${style.bg} ${sizeClasses}`}>
      <span className="relative flex h-2.5 w-2.5">
        <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${style.ring} opacity-75`} />
        <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${style.dot}`} />
      </span>
      <span className="tracking-tight font-semibold">{style.text}</span>
      {action && (
        <span className="opacity-80 pl-2 border-l border-current/30 text-[11px] font-mono uppercase tracking-wider">
          Action: <strong className="underline underline-offset-2">{action}</strong>
        </span>
      )}
    </div>
  );
}
