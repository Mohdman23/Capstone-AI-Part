import React from 'react';
import { ShieldCheck, Database, Scan, Store, History, Sparkles } from 'lucide-react';

interface NavbarProps {
  activeTab: 'explorer' | 'scanner' | 'admin' | 'audits';
  onSelectTab: (tab: 'explorer' | 'scanner' | 'admin' | 'audits') => void;
  isCardUnlocked: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  onSelectTab,
  isCardUnlocked,
}) => {
  return (
    <header className="sticky top-0 z-40 border-b border-slate-800 bg-slate-950/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-emerald-500 to-indigo-600 shadow-md">
            <ShieldCheck className="h-6 w-6 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-base font-extrabold tracking-tight text-white">
                FinGuard <span className="text-emerald-400">AI</span>
              </span>
              <span className="rounded-full bg-indigo-500/10 px-2 py-0.5 text-[10px] font-semibold text-indigo-300 ring-1 ring-indigo-500/30">
                Enterprise v2.4
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Financial SQL Intelligence & Receipt Debit Card Gatekeeper
            </p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex items-center gap-1 rounded-xl border border-slate-800 bg-slate-900/90 p-1">
          <button
            type="button"
            onClick={() => onSelectTab('explorer')}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
              activeTab === 'explorer'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">NL Financial SQL</span>
          </button>

          <button
            type="button"
            onClick={() => onSelectTab('scanner')}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition relative ${
              activeTab === 'scanner'
                ? 'bg-teal-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Scan className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Receipt Gatekeeper</span>
            {isCardUnlocked && (
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            )}
          </button>

          <button
            type="button"
            onClick={() => onSelectTab('admin')}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
              activeTab === 'admin'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Store className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Admin Specs</span>
          </button>

          <button
            type="button"
            onClick={() => onSelectTab('audits')}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
              activeTab === 'audits'
                ? 'bg-violet-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <History className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Audit Trail</span>
          </button>
        </nav>
      </div>
    </header>
  );
};
