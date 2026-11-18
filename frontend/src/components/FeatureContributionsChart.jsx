import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, ReferenceLine, CartesianGrid } from 'recharts';

export default function FeatureContributionsChart({ contributions = [] }) {
  if (!contributions || contributions.length === 0) {
    return (
      <div className="text-center py-10 text-sm text-slate-400 font-medium">
        No feature contribution signals computed.
      </div>
    );
  }

  // Format data for chart
  const data = contributions.map(item => ({
    name: item.feature
      .replace('market_cap_class_', 'Cap: ')
      .replace('sector_', 'Sec: ')
      .replace('volume_ratio_20d', 'Vol Ratio 20d')
      .replace('order_book_imbalance', 'Book Imbalance')
      .replace('social_mentions', 'Social Buzz')
      .replace('delivery_pct', 'Delivery %')
      .replace('avg_trade_size', 'Avg Trade Size')
      .replace('sentiment_score', 'Sentiment'),
    impact: Number(item.impact_score),
    rawFeature: item.feature,
    direction: item.direction,
    coef: item.coefficient
  })).sort((a, b) => a.impact - b.impact);

  return (
    <div className="w-full h-80">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 10, right: 30, left: 75, bottom: 10 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
          <XAxis
            type="number"
            tick={{ fill: '#64748b', fontSize: 11, fontFamily: 'monospace' }}
            axisLine={{ stroke: '#cbd5e1' }}
            tickLine={{ stroke: '#cbd5e1' }}
          />
          <YAxis
            type="category"
            dataKey="name"
            tick={{ fill: '#334155', fontSize: 11, fontWeight: 600 }}
            axisLine={{ stroke: '#cbd5e1' }}
            tickLine={false}
            width={110}
          />
          <Tooltip
            cursor={{ fill: 'rgba(241, 245, 249, 0.7)' }}
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                const item = payload[0].payload;
                const isRiskUp = item.impact >= 0;
                return (
                  <div className="bg-white/95 backdrop-blur-md border border-slate-200 p-3.5 rounded-xl shadow-xl text-xs space-y-1 z-50">
                    <p className="font-bold text-slate-900 tracking-tight">{item.rawFeature}</p>
                    <div className="flex items-center gap-2 pt-1">
                      <span className="text-slate-500">Impact Score:</span>
                      <span className={`font-mono font-bold ${isRiskUp ? 'text-rose-600' : 'text-emerald-600'}`}>
                        {item.impact > 0 ? `+${item.impact.toFixed(3)}` : item.impact.toFixed(3)} pts
                      </span>
                    </div>
                    <p className="text-slate-500 font-mono text-[11px]">
                      Regression Coeff: {item.coef}
                    </p>
                    <p className={`text-[11px] font-semibold italic pt-0.5 ${isRiskUp ? 'text-rose-600' : 'text-emerald-600'}`}>
                      {isRiskUp ? '▲ Elevates manipulation risk' : '▼ Dampens risk / normal trading'}
                    </p>
                  </div>
                );
              }
              return null;
            }}
          />
          <ReferenceLine x={0} stroke="#94a3b8" strokeWidth={1.5} />
          <Bar dataKey="impact" radius={[0, 4, 4, 0]}>
            {data.map((entry, index) => {
              const isRiskUp = entry.impact >= 0;
              return (
                <Cell
                  key={`cell-${index}`}
                  fill={isRiskUp ? '#ef4444' : '#10b981'}
                />
              );
            })}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
