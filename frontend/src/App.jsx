import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import StockExplorer from './pages/StockExplorer';
import EdaView from './pages/EdaView';
import ModelPerformance from './pages/ModelPerformance';
import About from './pages/About';

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-[#f8fafc] text-slate-800 flex flex-col font-sans selection:bg-sky-500/20 selection:text-sky-900 relative overflow-hidden">
        {/* Soft atmospheric ambient light mesh */}
        <div className="fixed top-0 left-1/4 w-[32rem] h-[32rem] bg-sky-400/[0.07] rounded-full blur-[140px] pointer-events-none -z-10" />
        <div className="fixed bottom-1/4 right-1/4 w-[30rem] h-[30rem] bg-indigo-400/[0.06] rounded-full blur-[140px] pointer-events-none -z-10" />
        <div className="fixed top-1/2 right-0 w-96 h-96 bg-emerald-400/[0.04] rounded-full blur-[140px] pointer-events-none -z-10" />

        <Navbar />

        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/stocks" element={<StockExplorer />} />
            <Route path="/eda" element={<EdaView />} />
            <Route path="/performance" element={<ModelPerformance />} />
            <Route path="/about" element={<About />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>

        <footer className="border-t border-slate-200/80 bg-white/70 backdrop-blur-md py-6 text-center text-xs text-slate-500 mt-auto shadow-sm">
          <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              MEWS AI &copy; 2026 Team 09 &middot; 21CSC307P Machine Learning for Data Analytics
            </span>
            <span className="font-mono text-slate-600 font-medium">
              Tirth Shah &middot; Vedaksh Bhandari &middot; Prajit P
            </span>
          </div>
        </footer>
      </div>
    </BrowserRouter>
  );
}
