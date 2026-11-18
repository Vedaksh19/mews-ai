import React from 'react';
import { Shield, Users, AlertTriangle, BookOpen, Layers } from 'lucide-react';
import { useScrollReveal } from '../hooks/useScrollReveal';

export default function About() {
  const scrollRef = useScrollReveal();

  const teamMembers = [
    { name: 'Tirth Shah', regNo: 'RA2411056010100', role: 'Machine Learning Architect & Feature Engineering', color: 'from-sky-500 to-blue-600' },
    { name: 'Vedaksh Bhandari', regNo: 'RA2411056010098', role: 'Statistical Analysis, Pipeline Design & Backend API', color: 'from-emerald-500 to-teal-600' },
    { name: 'Prajit P', regNo: 'RA2411056010090', role: 'Evaluation Rigor, Cross-Validation & UI Engineering', color: 'from-indigo-500 to-purple-600' }
  ];

  return (
    <div ref={scrollRef} className="space-y-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="reveal-on-scroll glass-panel p-7 rounded-3xl text-center relative overflow-hidden group">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-1 bg-gradient-to-r from-sky-500 via-indigo-600 to-emerald-500 rounded-full" />
        
        <span className="text-[11px] uppercase tracking-widest text-sky-700 font-bold px-3.5 py-1 rounded-full bg-sky-50 border border-sky-200 inline-block mb-3.5 shadow-xs">
          21CSC307P Machine Learning for Data Analytics &middot; Team 09
        </span>
        <h1 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight">
          MEWS AI: Market Manipulation Early Warning System
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-2.5 max-w-2xl mx-auto leading-relaxed">
          A proactive algorithmic surveillance engine engineered to intercept coordinated pump-and-dump operations during the 15-day accumulation build-up phase before the liquidity dump.
        </p>
      </div>

      {/* Synthetic Data Limitation Notice */}
      <div className="reveal-on-scroll delay-75 p-5 sm:p-6 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs sm:text-sm flex items-start gap-4 shadow-xs backdrop-blur-md">
        <div className="p-2 rounded-xl bg-amber-100 border border-amber-300 text-amber-700 flex-shrink-0 mt-0.5">
          <AlertTriangle className="w-5 h-5" />
        </div>
        <div>
          <strong className="block text-amber-800 uppercase font-black text-xs tracking-wider mb-1">
            Academic Project & Synthetic Data Limitation Notice
          </strong>
          The dataset utilized across MEWS AI consists of 50,000 synthetic trading records simulated via microstructural stochastic processes. While feature distributions, delivery decays, and volume ratios accurately model real-world pump-and-dump mechanics, this project serves an academic and exploratory purpose. Real-world deployment requires training on historical NSE/BSE Bhavcopy tick records, order book depth streams, and authoritative regulatory enforcement orders from SEBI.
        </div>
      </div>

      {/* Problem Statement & Real-world Case */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="reveal-on-scroll delay-150 glass-card-hover rounded-2xl p-6 sm:p-7 shadow-xs space-y-3.5">
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-rose-50 text-rose-600 border border-rose-200">
              <Shield className="w-5 h-5" />
            </span>
            <h2 className="text-base font-bold text-slate-900">
              The Market Abuse Problem
            </h2>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            Retail investors lose billions in synchronized pump-and-dump operations. Fraudulent operators quietly accumulate thinly-traded micro-cap stocks, orchestrate deceptive social hype (YouTube channels, Telegram tips), and artificially inflate prices.
          </p>
          <p className="text-xs text-slate-600 leading-relaxed">
            By the time traditional exchange surveillance flags the anomaly post-crash, operators have already dumped their shares into retail buying pressure, leaving innocent participants with massive capital losses.
          </p>
        </div>

        <div className="reveal-on-scroll delay-225 glass-card-hover rounded-2xl p-6 sm:p-7 shadow-xs space-y-3.5">
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-sky-50 text-sky-600 border border-sky-200">
              <BookOpen className="w-5 h-5" />
            </span>
            <h2 className="text-base font-bold text-slate-900">
              Real Regulatory Benchmark: Sadhna Broadcast
            </h2>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            In May 2025, the <strong>Securities and Exchange Board of India (SEBI)</strong> issued a landmark final order barring 59 entities and imposing <strong>₹21.45 crore</strong> in penalties for orchestrating an aggressive YouTube-driven pump-and-dump in Sadhna Broadcast shares.
          </p>
          <p className="text-xs text-slate-600 leading-relaxed">
            MEWS AI reverse-engineers the microstructural footprint of such operations: sudden volume expansions (&gt;3×), drastic drops in delivery percentages (&lt;30%), extreme order book imbalance, and surging online buzz.
          </p>
        </div>
      </div>

      {/* Methodology & Surveillance Architecture */}
      <div className="reveal-on-scroll delay-150 glass-card-hover rounded-2xl p-6 sm:p-7 shadow-xs space-y-5">
        <h2 className="text-base font-bold text-slate-900 flex items-center gap-2.5">
          <span className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600 border border-indigo-200">
            <Layers className="w-4 h-4" />
          </span>
          End-to-End Surveillance Pipeline Architecture
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs">
          <div className="bg-slate-50/80 p-4 rounded-xl border border-slate-200/80 hover:border-sky-300 transition-colors">
            <span className="text-[10px] uppercase font-bold text-sky-700 block mb-1">Stage 1: Ingestion</span>
            <strong className="text-slate-900 block text-sm">Market Signals</strong>
            <p className="text-slate-500 mt-1 leading-relaxed">20d volume ratio, delivery %, order flow imbalance, sentiment polarity, social buzz.</p>
          </div>

          <div className="bg-slate-50/80 p-4 rounded-xl border border-slate-200/80 hover:border-emerald-300 transition-colors">
            <span className="text-[10px] uppercase font-bold text-emerald-700 block mb-1">Stage 2: Preprocessing</span>
            <strong className="text-slate-900 block text-sm">Sklearn Pipeline</strong>
            <p className="text-slate-500 mt-1 leading-relaxed">Log1p skew correction, median imputation for missing values, StandardScaler & OneHotEncoder.</p>
          </div>

          <div className="bg-slate-50/80 p-4 rounded-xl border border-slate-200/80 hover:border-amber-300 transition-colors">
            <span className="text-[10px] uppercase font-bold text-amber-700 block mb-1">Stage 3: Inference</span>
            <strong className="text-slate-900 block text-sm">Dual ML Models</strong>
            <p className="text-slate-500 mt-1 leading-relaxed">Linear Regression baseline (continuous 0-100 score) + Random Forest classification.</p>
          </div>

          <div className="bg-slate-50/80 p-4 rounded-xl border border-slate-200/80 hover:border-rose-300 transition-colors">
            <span className="text-[10px] uppercase font-bold text-rose-700 block mb-1">Stage 4: Action</span>
            <strong className="text-slate-900 block text-sm">Surveillance Bands</strong>
            <p className="text-slate-500 mt-1 leading-relaxed">Low (0-20, None) / Watch (20-50, Monitor) / High (50-80, Alert) / Critical (80-100, Escalate).</p>
          </div>
        </div>
      </div>

      {/* Team Members */}
      <div className="reveal-on-scroll delay-225 glass-card-hover rounded-2xl p-6 sm:p-7 shadow-xs">
        <h2 className="text-base font-bold text-slate-900 mb-5 flex items-center gap-2.5">
          <span className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600 border border-indigo-200">
            <Users className="w-4 h-4" />
          </span>
          Project Team 09
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {teamMembers.map((member) => (
            <div
              key={member.regNo}
              className="bg-slate-50/70 p-5 rounded-2xl border border-slate-200 hover:border-sky-300 hover:-translate-y-1 transition-all duration-300 group shadow-xs"
            >
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-tr ${member.color} text-white flex items-center justify-center font-black text-sm mb-3.5 shadow-sm group-hover:scale-110 transition-transform duration-300`}>
                {member.name.charAt(0)}
              </div>
              <h3 className="text-sm font-bold text-slate-900 group-hover:text-sky-700 transition-colors">{member.name}</h3>
              <p className="text-xs text-sky-700 font-mono font-medium mt-0.5">{member.regNo}</p>
              <p className="text-[11px] text-slate-500 mt-2 leading-relaxed">{member.role}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
