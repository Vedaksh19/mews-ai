import React from 'react';

export default function Gauge({ score = 0, color = '#059669', band = 'Low' }) {
  const clampedScore = Math.max(0, Math.min(100, Number(score) || 0));
  
  // Angle: 0 -> -90 deg, 100 -> +90 deg
  const angle = -90 + (clampedScore / 100) * 180;
  
  const radius = 82;
  const strokeWidth = 14;
  const circumference = Math.PI * radius;
  const strokeDashoffset = circumference - (clampedScore / 100) * circumference;

  // Band glow color
  const glowMap = {
    Low: 'rgba(16, 185, 129, 0.12)',
    Watch: 'rgba(245, 158, 11, 0.12)',
    High: 'rgba(249, 115, 22, 0.15)',
    Critical: 'rgba(244, 63, 94, 0.18)'
  };
  const activeGlow = glowMap[band] || glowMap.Low;

  return (
    <div className="flex flex-col items-center justify-center relative p-5">
      {/* Background radial soft aura */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 rounded-full blur-3xl pointer-events-none transition-all duration-700 -z-10"
        style={{ background: activeGlow }}
      />

      <svg className="w-64 h-36 overflow-visible filter drop-shadow-[0_2px_8px_rgba(0,0,0,0.06)]" viewBox="0 0 200 115">
        <defs>
          <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#10b981" />
            <stop offset="25%" stopColor="#22c55e" />
            <stop offset="50%" stopColor="#f59e0b" />
            <stop offset="75%" stopColor="#f97316" />
            <stop offset="100%" stopColor="#ef4444" />
          </linearGradient>

          <filter id="needleShadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="1.5" stdDeviation="2" floodColor="#0f172a" floodOpacity="0.25" />
          </filter>
        </defs>

        {/* Background track */}
        <path
          d="M 18 100 A 82 82 0 0 1 182 100"
          fill="none"
          stroke="#e2e8f0"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
        />

        {/* Zone indicator dots on outer track */}
        <circle cx="18" cy="100" r="2" fill="#10b981" opacity="0.8" />
        <circle cx="47" cy="48" r="2" fill="#f59e0b" opacity="0.8" />
        <circle cx="100" cy="18" r="2.5" fill="#f97316" opacity="0.8" />
        <circle cx="153" cy="48" r="2" fill="#ef4444" opacity="0.8" />
        <circle cx="182" cy="100" r="2" fill="#ef4444" opacity="0.8" />

        {/* Animated active score arc */}
        <path
          d="M 18 100 A 82 82 0 0 1 182 100"
          fill="none"
          stroke="url(#gaugeGradient)"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className="transition-all duration-700 ease-out"
        />

        {/* Needle indicator */}
        <g transform={`rotate(${angle} 100 100)`} className="transition-transform duration-700 ease-out">
          <line
            x1="100"
            y1="100"
            x2="100"
            y2="28"
            stroke="#0f172a"
            strokeWidth="3.5"
            strokeLinecap="round"
            filter="url(#needleShadow)"
          />
          <polygon points="98,34 102,34 100,24" fill="#0f172a" />
          <circle cx="100" cy="100" r="7.5" fill="#ffffff" stroke="#0f172a" strokeWidth="2.5" />
          <circle cx="100" cy="100" r="3" fill={color} />
        </g>

        {/* Gauge Scale Labels */}
        <text x="14" y="114" fill="#64748b" fontSize="9" fontWeight="bold" fontFamily="monospace">0</text>
        <text x="44" y="38" fill="#64748b" fontSize="8" fontWeight="semibold" fontFamily="monospace">20</text>
        <text x="96" y="12" fill="#475569" fontSize="9" fontWeight="bold" fontFamily="monospace">50</text>
        <text x="148" y="38" fill="#64748b" fontSize="8" fontWeight="semibold" fontFamily="monospace">80</text>
        <text x="174" y="114" fill="#64748b" fontSize="9" fontWeight="bold" fontFamily="monospace">100</text>
      </svg>

      {/* Numerical readout */}
      <div className="text-center mt-[-10px] space-y-0.5">
        <div className="text-4xl sm:text-5xl font-black tracking-tight font-mono text-slate-900 flex items-center justify-center gap-1">
          <span style={{ color: color }}>
            {clampedScore.toFixed(1)}
          </span>
          <span className="text-sm text-slate-400 font-normal">/100</span>
        </div>
        <span className="text-[11px] text-slate-500 uppercase tracking-widest font-bold block">
          Composite Risk Metric
        </span>
      </div>
    </div>
  );
}
