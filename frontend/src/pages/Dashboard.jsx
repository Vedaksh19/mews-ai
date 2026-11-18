import React, { useState, useEffect } from 'react';
import { predictRisk } from '../api';
import Gauge from '../components/Gauge';
import BandBadge from '../components/BandBadge';
import FeatureContributionsChart from '../components/FeatureContributionsChart';
import { useScrollReveal } from '../hooks/useScrollReveal';
import { AlertTriangle, CheckCircle, RefreshCw, Zap, Shield, Layers, Sliders, Activity } from 'lucide-react';

const NORMAL_PRESET = {
  volume_ratio_20d: 1.05,
  volatility: 0.012,
  delivery_pct: 54.0,
  order_book_imbalance: 0.02,
  sentiment_score: 0.05,
  social_mentions: 12.0,
  volume: 35000,
  close_price: 185.0,
  avg_trade_size: 780,
  past_manipulation_flags: 0,
  market_cap_class: 'small',
  sector: 'Banking'
};

const PUMP_PRESET = {
  volume_ratio_20d: 4.2,
  volatility: 0.048,
  delivery_pct: 26.0,
  order_book_imbalance: 0.52,
  sentiment_score: 0.72,
  social_mentions: 480.0,
  volume: 165000,
  close_price: 340.0,
  avg_trade_size: 2100,
  past_manipulation_flags: 2,
  market_cap_class: 'small',
  sector: 'IT'
};

const SECTORS = ['Auto', 'Banking', 'Energy', 'FMCG', 'IT', 'Metals', 'Pharma'];

export default function Dashboard() {
  const [formData, setFormData] = useState(NORMAL_PRESET);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const scrollRef = useScrollReveal([result]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value === '' ? null : value
    }));
  };

  const handleNumberChange = (field, val) => {
    if (val === '' || val === null) {
      handleInputChange(field, null);
    } else {
      handleInputChange(field, parseFloat(val));
    }
  };

  const executePrediction = async (payload) => {
    setLoading(true);
    setError(null);
    try {
      const res = await predictRisk(payload);
      setResult(res);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.detail || 'Failed to score market risk. Please ensure backend is running.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    executePrediction(NORMAL_PRESET);
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    executePrediction(formData);
  };

  const loadPreset = (preset) => {
    setFormData(preset);
    executePrediction(preset);
  };

  return (
    <div ref={scrollRef} className="space-y-6">
      {/* Top Header & Presets */}
      <div className="reveal-on-scroll glass-panel p-6 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-5 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b from-sky-500 to-indigo-600" />
        
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            <span className="p-2 rounded-xl bg-sky-50 border border-sky-200 text-sky-600 shadow-xs">
              <Shield className="w-5 h-5" />
            </span>
            Live Market Manipulation Scorer
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-2xl leading-relaxed">
            Real-time multi-signal surveillance combining Linear Regression baseline with Random Forest classification and explainable feature impact.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => loadPreset(NORMAL_PRESET)}
            className="btn-shimmer flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-300 hover:bg-emerald-100/80 hover:border-emerald-400 hover:shadow-xs transition-all cursor-pointer"
          >
            <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
            Load Normal Day
          </button>
          <button
            type="button"
            onClick={() => loadPreset(PUMP_PRESET)}
            className="btn-shimmer flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-xl bg-rose-50 text-rose-700 border border-rose-300 hover:bg-rose-100/80 hover:border-rose-400 hover:shadow-xs transition-all cursor-pointer"
          >
            <Zap className="w-3.5 h-3.5 text-rose-600" />
            Load Pump-Build-Up Day
          </button>
        </div>
      </div>

      {error && (
        <div className="reveal-on-scroll p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs sm:text-sm flex items-center gap-3 shadow-xs">
          <AlertTriangle className="w-5 h-5 flex-shrink-0 text-rose-500" />
          <span>{error}</span>
        </div>
      )}

      {/* Main Grid: Form Inputs vs Prediction Output */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Form Controls */}
        <form onSubmit={handleSubmit} className="reveal-on-scroll delay-75 lg:col-span-7 glass-panel rounded-2xl p-6 sm:p-7 space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-200/80">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2.5">
              <span className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600 border border-indigo-200">
                <Layers className="w-4 h-4" />
              </span>
              Daily Microstructure & Hype Signals
            </h2>
            <span className="text-[11px] font-mono font-semibold text-sky-700 bg-sky-50 border border-sky-200 px-2 py-0.5 rounded-full">
              Median Imputation Active
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {/* Market Cap & Sector */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-600 tracking-wide block">Market Cap Class</label>
              <select
                value={formData.market_cap_class || 'small'}
                onChange={(e) => handleInputChange('market_cap_class', e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-slate-900 focus:outline-none focus:border-sky-500 focus:bg-white transition-all cursor-pointer font-medium"
              >
                <option value="small">Small Cap (Higher Manipulation Vulnerability)</option>
                <option value="large">Large Cap (Liquid / Institutional)</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-600 tracking-wide block">Sector (7 Categories)</label>
              <select
                value={formData.sector || 'Banking'}
                onChange={(e) => handleInputChange('sector', e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-slate-900 focus:outline-none focus:border-sky-500 focus:bg-white transition-all cursor-pointer font-medium"
              >
                {SECTORS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>

            {/* Volume Ratio 20d */}
            <div className="space-y-1.5 bg-slate-50/70 p-3.5 rounded-xl border border-slate-200/80 hover:border-slate-300 transition-colors">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-600 font-semibold">Volume Ratio (20-day)</span>
                <span className="text-sky-700 font-mono font-bold px-1.5 py-0.5 rounded bg-sky-100 border border-sky-200">
                  {formData.volume_ratio_20d !== null && formData.volume_ratio_20d !== undefined ? `${formData.volume_ratio_20d}x` : 'Missing (Imputed)'}
                </span>
              </div>
              <input
                type="range"
                min="0.2"
                max="10.0"
                step="0.05"
                value={formData.volume_ratio_20d || 1.0}
                onChange={(e) => handleNumberChange('volume_ratio_20d', e.target.value)}
                className="w-full"
              />
              <input
                type="number"
                step="0.01"
                placeholder="Custom value..."
                value={formData.volume_ratio_20d ?? ''}
                onChange={(e) => handleNumberChange('volume_ratio_20d', e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-xs text-slate-900 focus:outline-none focus:border-sky-500"
              />
            </div>

            {/* Delivery % */}
            <div className="space-y-1.5 bg-slate-50/70 p-3.5 rounded-xl border border-slate-200/80 hover:border-slate-300 transition-colors">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-600 font-semibold">Delivery Percentage (%)</span>
                <span className="text-sky-700 font-mono font-bold px-1.5 py-0.5 rounded bg-sky-100 border border-sky-200">
                  {formData.delivery_pct !== null && formData.delivery_pct !== undefined ? `${formData.delivery_pct}%` : 'Missing (Imputed)'}
                </span>
              </div>
              <input
                type="range"
                min="5"
                max="95"
                step="1"
                value={formData.delivery_pct || 50}
                onChange={(e) => handleNumberChange('delivery_pct', e.target.value)}
                className="w-full"
              />
              <input
                type="number"
                step="0.1"
                placeholder="Custom %..."
                value={formData.delivery_pct ?? ''}
                onChange={(e) => handleNumberChange('delivery_pct', e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-xs text-slate-900 focus:outline-none focus:border-sky-500"
              />
            </div>

            {/* Order Book Imbalance */}
            <div className="space-y-1.5 bg-slate-50/70 p-3.5 rounded-xl border border-slate-200/80 hover:border-slate-300 transition-colors">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-600 font-semibold">Order Book Imbalance</span>
                <span className="text-sky-700 font-mono font-bold px-1.5 py-0.5 rounded bg-sky-100 border border-sky-200">
                  {formData.order_book_imbalance !== null && formData.order_book_imbalance !== undefined ? formData.order_book_imbalance : 'Missing (Imputed)'}
                </span>
              </div>
              <input
                type="range"
                min="-0.9"
                max="0.9"
                step="0.05"
                value={formData.order_book_imbalance || 0.0}
                onChange={(e) => handleNumberChange('order_book_imbalance', e.target.value)}
                className="w-full"
              />
              <input
                type="number"
                step="0.01"
                placeholder="Imbalance ratio (-1 to +1)..."
                value={formData.order_book_imbalance ?? ''}
                onChange={(e) => handleNumberChange('order_book_imbalance', e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-xs text-slate-900 focus:outline-none focus:border-sky-500"
              />
            </div>

            {/* Sentiment Score */}
            <div className="space-y-1.5 bg-slate-50/70 p-3.5 rounded-xl border border-slate-200/80 hover:border-slate-300 transition-colors">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-600 font-semibold">Sentiment Score</span>
                <span className="text-sky-700 font-mono font-bold px-1.5 py-0.5 rounded bg-sky-100 border border-sky-200">
                  {formData.sentiment_score !== null && formData.sentiment_score !== undefined ? formData.sentiment_score : 'Missing (Imputed)'}
                </span>
              </div>
              <input
                type="range"
                min="-0.9"
                max="0.9"
                step="0.05"
                value={formData.sentiment_score || 0.0}
                onChange={(e) => handleNumberChange('sentiment_score', e.target.value)}
                className="w-full"
              />
              <input
                type="number"
                step="0.01"
                placeholder="Sentiment polarity (-1 to +1)..."
                value={formData.sentiment_score ?? ''}
                onChange={(e) => handleNumberChange('sentiment_score', e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-xs text-slate-900 focus:outline-none focus:border-sky-500"
              />
            </div>

            {/* Social Mentions */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-600 block">Social Mentions (Telegram / X Buzz)</label>
              <input
                type="number"
                min="0"
                step="1"
                value={formData.social_mentions ?? ''}
                onChange={(e) => handleNumberChange('social_mentions', e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-slate-900 focus:outline-none focus:border-sky-500 focus:bg-white"
              />
            </div>

            {/* Traded Volume */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-600 block">Traded Volume (Shares)</label>
              <input
                type="number"
                min="100"
                step="1000"
                value={formData.volume ?? ''}
                onChange={(e) => handleNumberChange('volume', e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-slate-900 focus:outline-none focus:border-sky-500 focus:bg-white"
              />
            </div>

            {/* Price & Volatility */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-600 block">Close Price (INR)</label>
              <input
                type="number"
                min="1"
                step="0.5"
                value={formData.close_price ?? ''}
                onChange={(e) => handleNumberChange('close_price', e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-slate-900 focus:outline-none focus:border-sky-500 focus:bg-white"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-600 block">Volatility (Daily Returns STD)</label>
              <input
                type="number"
                min="0.001"
                max="0.2"
                step="0.002"
                value={formData.volatility ?? ''}
                onChange={(e) => handleNumberChange('volatility', e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-slate-900 focus:outline-none focus:border-sky-500 focus:bg-white"
              />
            </div>

            {/* Past Flags & Trade Size */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-600 block">Past SEBI / Surveillance Flags</label>
              <input
                type="number"
                min="0"
                max="5"
                value={formData.past_manipulation_flags ?? ''}
                onChange={(e) => handleNumberChange('past_manipulation_flags', e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-slate-900 focus:outline-none focus:border-sky-500 focus:bg-white"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-600 block">Avg Trade Size (Shares / Trade)</label>
              <input
                type="number"
                min="50"
                step="50"
                value={formData.avg_trade_size ?? ''}
                onChange={(e) => handleNumberChange('avg_trade_size', e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-slate-900 focus:outline-none focus:border-sky-500 focus:bg-white"
              />
            </div>
          </div>

          <div className="pt-3 border-t border-slate-200/80 flex items-center justify-between">
            <button
              type="button"
              onClick={() => {
                const emptyForm = {
                  volume_ratio_20d: null,
                  volatility: null,
                  delivery_pct: null,
                  order_book_imbalance: null,
                  sentiment_score: null,
                  social_mentions: null,
                  volume: null,
                  close_price: 150.0,
                  avg_trade_size: null,
                  past_manipulation_flags: null,
                  market_cap_class: 'small',
                  sector: 'Banking'
                };
                setFormData(emptyForm);
                executePrediction(emptyForm);
              }}
              className="text-xs text-slate-500 hover:text-sky-600 underline underline-offset-4 transition-colors cursor-pointer font-medium"
            >
              Test Pipeline Imputation (All Nulls)
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn-shimmer flex items-center gap-2.5 px-6 py-2.5 rounded-xl bg-gradient-to-r from-sky-600 via-blue-600 to-indigo-600 hover:from-sky-500 hover:via-blue-500 hover:to-indigo-500 text-white font-bold text-xs sm:text-sm shadow-md shadow-sky-500/20 transition-all cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Calculating Models...
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4" />
                  Run Risk Inference
                </>
              )}
            </button>
          </div>
        </form>

        {/* Right Column: Inferred Risk, Gauge & Breakdown */}
        <div className="lg:col-span-5 space-y-6">
          {/* Risk Gauge Card */}
          <div className="reveal-on-scroll delay-150 glass-card-hover rounded-2xl p-6 sm:p-7 flex flex-col items-center relative overflow-hidden">
            <div className="w-full flex items-center justify-between border-b border-slate-200/80 pb-3 mb-2">
              <h3 className="text-xs uppercase tracking-widest font-bold text-slate-500">
                Early Warning Telemetry
              </h3>
              <span className="text-[11px] font-mono text-slate-500 flex items-center gap-1.5 font-medium">
                <span className="w-2 h-2 rounded-full bg-sky-500 animate-pulse" />
                Dual Inference
              </span>
            </div>

            {result ? (
              <>
                <Gauge score={result.risk_score} color={result.color} band={result.band} />

                <div className="mt-3 flex flex-col items-center gap-2">
                  <BandBadge band={result.band} action={result.action} size="lg" />
                </div>

                {/* Alert Banner */}
                {result.alert ? (
                  <div className="w-full mt-4 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 flex items-start gap-3 text-xs shadow-xs">
                    <AlertTriangle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5 animate-bounce" />
                    <div>
                      <strong className="block text-rose-900 uppercase font-black tracking-wide text-[11px] mb-0.5">
                        Surveillance Alert Triggered
                      </strong>
                      Model probability ({((result.manipulation_probability || 0) * 100).toFixed(1)}%) exceeds optimal threshold ({(result.alert_threshold * 100).toFixed(1)}%) or Risk Score &ge; 50.
                    </div>
                  </div>
                ) : (
                  <div className="w-full mt-4 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-start gap-3 text-xs shadow-xs">
                    <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <strong className="block text-emerald-900 uppercase font-black tracking-wide text-[11px] mb-0.5">
                        Normal Surveillance Window
                      </strong>
                      Market signals align with organic liquidity baseline. No anomalous accumulation detected.
                    </div>
                  </div>
                )}

                {/* Classifier Probability Meter */}
                <div className="w-full mt-5 pt-4 border-t border-slate-200/80">
                  <div className="flex justify-between items-center text-xs mb-2">
                    <span className="text-slate-700 font-semibold flex items-center gap-1.5">
                      <Activity className="w-3.5 h-3.5 text-sky-600" />
                      Random Forest Manipulation Probability
                    </span>
                    <span className="text-slate-900 font-mono font-black text-sm px-2 py-0.5 rounded bg-slate-100 border border-slate-200">
                      {((result.manipulation_probability || 0) * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden relative border border-slate-200 p-0.5">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ${
                        result.alert
                          ? 'bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500'
                          : 'bg-gradient-to-r from-teal-500 to-emerald-500'
                      }`}
                      style={{ width: `${Math.min(100, (result.manipulation_probability || 0) * 100)}%` }}
                    />
                    <div
                      className="absolute top-0 bottom-0 w-0.5 bg-slate-900 z-10"
                      style={{ left: `${(result.alert_threshold || 0.7) * 100}%` }}
                      title={`Alert Threshold: ${(result.alert_threshold * 100).toFixed(1)}%`}
                    />
                  </div>
                  <div className="flex justify-between text-[10px] text-slate-500 mt-1.5 font-mono">
                    <span>0%</span>
                    <span className="text-sky-700 font-semibold">Decision Cutoff: {(result.alert_threshold * 100).toFixed(1)}%</span>
                    <span>100%</span>
                  </div>
                </div>
              </>
            ) : (
              <div className="py-20 text-slate-400 text-xs flex flex-col items-center">
                <RefreshCw className="w-6 h-6 animate-spin text-sky-600 mb-2" />
                Calculating model inference...
              </div>
            )}
          </div>

          {/* Top Contributing Signals Card */}
          <div className="reveal-on-scroll delay-225 glass-card-hover rounded-2xl p-6 sm:p-7 relative overflow-hidden">
            <div className="flex items-center justify-between mb-4 border-b border-slate-200/80 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900 tracking-tight">Top Contributing Signals</h3>
                <p className="text-[11px] text-slate-500 mt-0.5">Linear Model Standardized Feature Coefficients &times; Values</p>
              </div>
            </div>
            {result?.top_contributions ? (
              <FeatureContributionsChart contributions={result.top_contributions} />
            ) : (
              <p className="text-xs text-slate-400 py-6 text-center">Awaiting model inference...</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
