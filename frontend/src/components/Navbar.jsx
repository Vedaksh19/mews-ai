import React from 'react';
import { NavLink } from 'react-router-dom';
import { ShieldAlert, BarChart3, TrendingUp, Cpu, Info, Activity } from 'lucide-react';

export default function Navbar() {
  const navItems = [
    { to: '/', label: 'Live Scorer', icon: ShieldAlert },
    { to: '/stocks', label: 'Stock Explorer', icon: TrendingUp },
    { to: '/eda', label: 'EDA Insights', icon: BarChart3 },
    { to: '/performance', label: 'Model Performance', icon: Cpu },
    { to: '/about', label: 'About', icon: Info }
  ];

  return (
    <header className="sticky top-0 z-50 bg-white/85 backdrop-blur-xl border-b border-slate-200 shadow-[0_2px_12px_rgba(0,0,0,0.03)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="relative group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-500 via-blue-600 to-indigo-600 flex items-center justify-center shadow-md shadow-sky-500/20 transition-transform duration-300 group-hover:scale-105">
              <Activity className="w-5 h-5 text-white animate-subtle-float" />
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold tracking-tight text-slate-900 text-lg sm:text-xl">
                MEWS AI
              </span>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-sky-50 text-sky-700 border border-sky-200 shadow-xs">
                Team 09
              </span>
            </div>
            <p className="text-[11px] text-slate-500 font-medium tracking-tight hidden sm:block">
              Market Manipulation Early Warning System
            </p>
          </div>
        </div>

        {/* Live Surveillance Status Badge */}
        <div className="hidden lg:flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-mono font-medium">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span>Surveillance Active</span>
        </div>

        {/* Navigation Links */}
        <nav className="flex items-center gap-1 sm:gap-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `relative flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all duration-200 group ${
                    isActive
                      ? 'bg-sky-50/80 text-sky-700 border border-sky-200 shadow-xs font-semibold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80 border border-transparent'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon className={`w-4 h-4 transition-transform duration-200 group-hover:scale-110 ${isActive ? 'text-sky-600' : 'text-slate-400 group-hover:text-slate-700'}`} />
                    <span>{item.label}</span>
                    {isActive && (
                      <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-6 h-0.5 bg-gradient-to-r from-sky-500 to-indigo-600 rounded-full" />
                    )}
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
