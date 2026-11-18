import React, { useState, useEffect } from 'react';
import { getStocks, getStockTimeseries } from '../api';
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
  ReferenceLine, CartesianGrid, Area, ComposedChart
} from 'recharts';
import { Search, TrendingUp, AlertTriangle, ShieldCheck, Filter, RefreshCw, BarChart2 } from 'lucide-react';
import { useScrollReveal } from '../hooks/useScrollReveal';

export default function StockExplorer() {
  const [stocks, setStocks] = useState([]);
  const [selectedStock, setSelectedStock] = useState('STK001');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCap, setFilterCap] = useState('all');
  const [filterEpisodes, setFilterEpisodes] = useState('all');
  const [timeseries, setTimeseries] = useState([]);
  const [loadingStocks, setLoadingStocks] = useState(true);
  const [loadingChart, setLoadingChart] = useState(false);
  const [error, setError] = useState(null);
  const scrollRef = useScrollReveal([selectedStock, timeseries]);

  // Load stocks list on mount
  useEffect(() => {
    async function loadStocksList() {
      try {
        setLoadingStocks(true);
        const data = await getStocks();
        setStocks(data);
        if (data.length > 0) {
          const found = data.find(s => s.stock_id === 'STK001');
          setSelectedStock(found ? 'STK001' : data[0].stock_id);
        }
      } catch (err) {
        console.error(err);
        setError('Failed to load stocks list.');
      } finally {
        setLoadingStocks(false);
      }
    }
    loadStocksList();
  }, []);

  // Load timeseries when selectedStock changes
  useEffect(() => {
    if (!selectedStock) return;
    async function loadStockData() {
      try {
        setLoadingChart(true);
        setError(null);
        const data = await getStockTimeseries(selectedStock);
        setTimeseries(data);
      } catch (err) {
        console.error(err);
        setError(`Failed to load telemetry for ${selectedStock}.`);
      } finally {
        setLoadingChart(false);
      }
    }
    loadStockData();
  }, [selectedStock]);

  // Filtered stocks list
  const filteredStocks = stocks.filter(s => {
    const matchesQuery = s.stock_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         s.sector.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCap = filterCap === 'all' || s.market_cap_class === filterCap;
    const matchesEp = filterEpisodes === 'all' ||
                      (filterEpisodes === 'episodes' && s.episode_count > 0) ||
                      (filterEpisodes === 'clean' && s.episode_count === 0);
    return matchesQuery && matchesCap && matchesEp;
  });

  const currentStockInfo = stocks.find(s => s.stock_id === selectedStock);

  return (
    <div ref={scrollRef} className="space-y-6">
      {/* Top Banner */}
      <div className="reveal-on-scroll glass-panel p-6 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b from-sky-500 to-indigo-600" />
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            <span className="p-2 rounded-xl bg-sky-50 border border-sky-200 text-sky-600 shadow-xs">
              <TrendingUp className="w-5 h-5" />
            </span>
            Stock Telemetry & Surveillance Explorer
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-2xl">
            Browse across 200 stocks and inspect 250 trading days of actual vs predicted risk telemetry, order flow, and pricing dynamics.
          </p>
        </div>
      </div>

      {/* Main Grid: Stock Selector vs Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Stock Search & Selection List */}
        <div className="reveal-on-scroll delay-75 lg:col-span-4 glass-panel rounded-2xl p-5 flex flex-col h-[750px]">
          <h2 className="text-sm font-bold text-slate-900 mb-3.5 flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-sky-600" />
              Stock Directory
            </span>
            <span className="text-[11px] font-mono font-semibold text-sky-700 bg-sky-50 border border-sky-200 px-2 py-0.5 rounded-full">
              {filteredStocks.length} / {stocks.length}
            </span>
          </h2>

          {/* Search bar */}
          <div className="relative mb-3">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search stock code or sector..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-sky-500 focus:bg-white transition-all font-medium"
            />
          </div>

          {/* Filter Pills */}
          <div className="flex gap-2 mb-3 text-[11px]">
            <select
              value={filterCap}
              onChange={(e) => setFilterCap(e.target.value)}
              className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 focus:outline-none focus:border-sky-500 cursor-pointer font-medium"
            >
              <option value="all">All Caps</option>
              <option value="small">Small Cap</option>
              <option value="large">Large Cap</option>
            </select>

            <select
              value={filterEpisodes}
              onChange={(e) => setFilterEpisodes(e.target.value)}
              className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 focus:outline-none focus:border-sky-500 cursor-pointer font-medium"
            >
              <option value="all">All Stocks</option>
              <option value="episodes">Has Episodes (Pump/Dump)</option>
              <option value="clean">Clean (No Episodes)</option>
            </select>
          </div>

          {/* Scrollable Stocks List */}
          <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scroll">
            {loadingStocks ? (
              <div className="py-16 text-center text-slate-400 text-xs flex flex-col items-center">
                <RefreshCw className="w-5 h-5 animate-spin text-sky-600 mb-2" />
                Loading stock directory...
              </div>
            ) : filteredStocks.length === 0 ? (
              <div className="py-16 text-center text-slate-400 text-xs">No matching stocks found.</div>
            ) : (
              filteredStocks.map((s) => {
                const isSelected = s.stock_id === selectedStock;
                const hasEpisode = s.episode_count > 0;
                return (
                  <button
                    key={s.stock_id}
                    onClick={() => setSelectedStock(s.stock_id)}
                    className={`w-full text-left p-3 rounded-xl border transition-all duration-200 cursor-pointer flex items-center justify-between group ${
                      isSelected
                        ? 'bg-sky-50/90 border-sky-300 text-slate-900 shadow-xs translate-x-1 border-l-4 border-l-sky-600 font-semibold'
                        : 'bg-white border-slate-200/80 text-slate-700 hover:bg-slate-50 hover:text-slate-900 hover:border-slate-300'
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className={`font-mono font-bold text-xs ${isSelected ? 'text-sky-700' : 'text-slate-900'}`}>
                          {s.stock_id}
                        </span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 border border-slate-200 text-slate-600 font-medium">
                          {s.sector}
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-500 capitalize mt-0.5 block">
                        {s.market_cap_class} cap
                      </span>
                    </div>

                    <div className="text-right">
                      {hasEpisode ? (
                        <span className="text-[10px] font-bold text-rose-700 bg-rose-50 px-2.5 py-1 rounded-full border border-rose-200 shadow-2xs">
                          {s.episode_count} Episode{s.episode_count > 1 ? 's' : ''}
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full font-medium">
                          Clean
                        </span>
                      )}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Stock Details & Charts */}
        <div className="lg:col-span-8 space-y-6">
          {/* Selected Stock Info Banner */}
          {currentStockInfo && (
            <div className="reveal-on-scroll delay-100 glass-card-hover rounded-2xl p-5 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-sky-50 to-indigo-50 border border-sky-200 flex items-center justify-center font-mono font-black text-sky-700 text-lg shadow-xs">
                  {currentStockInfo.stock_id.slice(-3)}
                </div>
                <div>
                  <div className="flex items-center gap-2.5">
                    <h2 className="text-xl font-black text-slate-900 font-mono tracking-tight">{currentStockInfo.stock_id}</h2>
                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 font-semibold">
                      {currentStockInfo.sector}
                    </span>
                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-sky-50 border border-sky-200 text-sky-700 capitalize font-semibold">
                      {currentStockInfo.market_cap_class} Cap
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1 font-mono font-medium">
                    Total Records: {currentStockInfo.total_days} Trading Days &middot; Manipulation Days: {currentStockInfo.manipulation_days}
                  </p>
                </div>
              </div>

              <div>
                {currentStockInfo.episode_count > 0 ? (
                  <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold shadow-xs animate-pulse">
                    <AlertTriangle className="w-4 h-4 text-rose-600" />
                    <span>{currentStockInfo.episode_count} Simulated Pump & Dump Episode(s)</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold shadow-xs">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    <span>Clean Asset (Zero Manipulation Episodes)</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {error && (
            <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
              {error}
            </div>
          )}

          {/* Chart 1: Actual vs Predicted Risk Score */}
          <div className="reveal-on-scroll delay-150 glass-card-hover rounded-2xl p-6 sm:p-7">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 border-b border-slate-200/80 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2.5">
                  <BarChart2 className="w-4 h-4 text-sky-600" />
                  Manipulation Risk Score Timeline (0–100 Scale)
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Dynamic 15-day build-up ramp vs linear model regression predictions.
                </p>
              </div>
              <div className="flex items-center gap-3 text-[11px] font-mono">
                <span className="flex items-center gap-1.5 text-sky-700 font-semibold">
                  <span className="w-3 h-1 bg-sky-600 rounded-full inline-block" /> Actual Risk
                </span>
                <span className="flex items-center gap-1.5 text-emerald-700 font-semibold">
                  <span className="w-3 h-1 bg-emerald-600 rounded-full inline-block" /> Linear Pred
                </span>
                <span className="flex items-center gap-1.5 text-rose-600 font-semibold">
                  <span className="w-2 h-2 rounded-full bg-rose-500 inline-block" /> Alert Threshold
                </span>
              </div>
            </div>

            {loadingChart ? (
              <div className="h-64 flex items-center justify-center text-slate-400 text-xs">
                <RefreshCw className="w-5 h-5 animate-spin mr-2 text-sky-600" />
                Loading timeseries data...
              </div>
            ) : (
              <div className="w-full h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={timeseries} margin={{ top: 15, right: 20, left: -10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis
                      dataKey="day"
                      tick={{ fill: '#64748b', fontSize: 10, fontFamily: 'monospace' }}
                      tickLine={{ stroke: '#cbd5e1' }}
                      axisLine={{ stroke: '#cbd5e1' }}
                    />
                    <YAxis
                      domain={[0, 100]}
                      tick={{ fill: '#64748b', fontSize: 10, fontFamily: 'monospace' }}
                      tickLine={{ stroke: '#cbd5e1' }}
                      axisLine={{ stroke: '#cbd5e1' }}
                    />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const item = payload[0].payload;
                          return (
                            <div className="bg-white/95 backdrop-blur-md border border-slate-200 p-3.5 rounded-xl shadow-xl text-xs space-y-1">
                              <p className="font-bold text-slate-900 font-mono">Day {item.day}</p>
                              <p className="text-sky-700 font-mono font-semibold">Actual Risk: <strong>{item.actual_risk_score}</strong></p>
                              <p className="text-emerald-700 font-mono font-semibold">Predicted Risk: <strong>{item.predicted_risk_score}</strong></p>
                              <p className="text-slate-600 font-mono">Classifier Prob: <strong>{(item.manipulation_probability * 100).toFixed(1)}%</strong></p>
                              <p className={item.manipulation_label === 1 ? 'text-rose-600 font-bold' : 'text-slate-500'}>
                                Status: {item.manipulation_label === 1 ? 'Manipulation Episode' : 'Normal Trading'}
                              </p>
                              {item.alert && (
                                <p className="text-rose-700 font-bold bg-rose-50 px-2 py-0.5 rounded border border-rose-200 text-[10px]">
                                  SURVEILLANCE ALERT TRIGGERED
                                </p>
                              )}
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    {/* Threshold Lines */}
                    <ReferenceLine y={50} stroke="#ea580c" strokeDasharray="4 4" label={{ value: 'High Risk (50)', fill: '#ea580c', fontSize: 10, fontWeight: 'bold' }} />
                    <ReferenceLine y={80} stroke="#dc2626" strokeDasharray="4 4" label={{ value: 'Critical (80)', fill: '#dc2626', fontSize: 10, fontWeight: 'bold' }} />
                    
                    {/* Shaded Area for actual risk */}
                    <Area type="monotone" dataKey="actual_risk_score" fill="#0284c7" fillOpacity={0.08} stroke="none" />
                    
                    {/* Lines */}
                    <Line type="monotone" dataKey="actual_risk_score" stroke="#0284c7" strokeWidth={2.2} dot={false} />
                    <Line type="monotone" dataKey="predicted_risk_score" stroke="#059669" strokeWidth={2} strokeDasharray="3 3" dot={false} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* Chart 2: Price and Volume Ratio (20d) */}
          <div className="reveal-on-scroll delay-225 glass-card-hover rounded-2xl p-6 sm:p-7">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 border-b border-slate-200/80 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2.5">
                  <TrendingUp className="w-4 h-4 text-amber-600" />
                  Price (INR) & Volume Ratio (20-day) Footprint
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Observe price surge and volume multiplication during the 15-day ramp and subsequent dump.
                </p>
              </div>
              <div className="flex items-center gap-3 text-[11px] font-mono">
                <span className="flex items-center gap-1.5 text-indigo-700 font-semibold">
                  <span className="w-3 h-1 bg-indigo-600 rounded-full inline-block" /> Price (INR)
                </span>
                <span className="flex items-center gap-1.5 text-amber-700 font-semibold">
                  <span className="w-3 h-1 bg-amber-600 rounded-full inline-block" /> Volume Ratio (x)
                </span>
              </div>
            </div>

            {loadingChart ? (
              <div className="h-48 flex items-center justify-center text-slate-400 text-xs">
                Loading price data...
              </div>
            ) : (
              <div className="w-full h-60">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={timeseries} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="day" tick={{ fill: '#64748b', fontSize: 10, fontFamily: 'monospace' }} stroke="#cbd5e1" />
                    <YAxis yAxisId="left" tick={{ fill: '#4f46e5', fontSize: 10, fontFamily: 'monospace' }} stroke="#cbd5e1" />
                    <YAxis yAxisId="right" orientation="right" domain={[0, 'auto']} tick={{ fill: '#d97706', fontSize: 10, fontFamily: 'monospace' }} stroke="#cbd5e1" />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const item = payload[0].payload;
                          return (
                            <div className="bg-white/95 backdrop-blur-md border border-slate-200 p-3 rounded-xl shadow-xl text-xs space-y-0.5 font-mono">
                              <p className="font-bold text-slate-900">Day {item.day}</p>
                              <p className="text-indigo-700 font-semibold">Close Price: <strong>₹{item.close_price.toFixed(2)}</strong></p>
                              <p className="text-amber-700 font-semibold">Volume Ratio: <strong>{item.volume_ratio_20d.toFixed(2)}x</strong></p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <ReferenceLine yAxisId="right" y={1.0} stroke="#94a3b8" strokeDasharray="2 2" />
                    <Line yAxisId="left" type="monotone" dataKey="close_price" stroke="#4f46e5" strokeWidth={2.2} dot={false} />
                    <Line yAxisId="right" type="monotone" dataKey="volume_ratio_20d" stroke="#d97706" strokeWidth={2.2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
