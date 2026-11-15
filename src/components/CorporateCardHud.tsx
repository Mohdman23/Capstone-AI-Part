import React, { useEffect, useState } from 'react';
import { Lock, Unlock, ShieldAlert, ShieldCheck, Clock, RefreshCw, KeyRound, AlertCircle } from 'lucide-react';
import { EmployeeDebitCard } from '../lib/types';

interface CorporateCardHudProps {
  card: EmployeeDebitCard | null;
  onRefresh: () => void;
  onLockCard: () => void;
  onRequestOverride: () => void;
}

export const CorporateCardHud: React.FC<CorporateCardHudProps> = ({
  card,
  onRefresh,
  onLockCard,
  onRequestOverride,
}) => {
  const [timeLeft, setTimeLeft] = useState<string>('');

  useEffect(() => {
    if (!card?.expires_at || card.status !== 'UNLOCKED') {
      setTimeLeft('');
      return;
    }

    const interval = setInterval(() => {
      const remaining = new Date(card.expires_at!).getTime() - Date.now();
      if (remaining <= 0) {
        setTimeLeft('Expired');
        onRefresh();
      } else {
        const mins = Math.floor(remaining / 60000);
        const secs = Math.floor((remaining % 60000) / 1000);
        setTimeLeft(`${mins}:${secs < 10 ? '0' : ''}${secs}`);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [card?.expires_at, card?.status, onRefresh]);

  if (!card) return null;

  const isUnlocked = card.status === 'UNLOCKED';

  return (
    <div className="relative overflow-hidden rounded-2xl border border-slate-800 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-6 text-white shadow-2xl">
      {/* Background ambient lighting */}
      <div
        className={`pointer-events-none absolute -top-24 -right-24 h-64 w-64 rounded-full blur-3xl transition-all duration-700 ${
          isUnlocked ? 'bg-emerald-500/20' : 'bg-rose-500/10'
        }`}
      />

      <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        {/* Virtual Card Representation */}
        <div className="relative w-full max-w-sm shrink-0">
          <div
            className={`relative aspect-[1.586/1] w-full rounded-2xl p-5 shadow-xl transition-all duration-500 border ${
              isUnlocked
                ? 'border-emerald-500/50 bg-gradient-to-br from-emerald-950 via-slate-900 to-teal-950 shadow-emerald-900/30 ring-2 ring-emerald-500/30'
                : 'border-slate-700 bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 shadow-black/60'
            }`}
          >
            {/* Card Chip & Network */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-7 w-9 rounded-md bg-gradient-to-tr from-amber-300 via-amber-200 to-amber-400 p-1 shadow-inner">
                  <div className="h-full w-full rounded border border-amber-600/40 opacity-70" />
                </div>
                <span className="text-xs font-mono tracking-widest text-slate-400">NFC ENCRYPTED</span>
              </div>
              <div className="text-right">
                <span className="text-xs font-semibold tracking-wider text-slate-300 uppercase">
                  {card.card_brand}
                </span>
                <span className="block text-[10px] text-slate-400">COMMERCIAL</span>
              </div>
            </div>

            {/* Card Number & Lock Badge */}
            <div className="mt-5">
              <div className="flex items-center justify-between">
                <p className="font-mono text-lg font-medium tracking-widest text-slate-200">
                  •••• •••• •••• {card.card_last_four}
                </p>
                <div
                  className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold tracking-wide transition-all ${
                    isUnlocked
                      ? 'bg-emerald-500/20 text-emerald-300 ring-1 ring-emerald-500/40'
                      : 'bg-rose-500/20 text-rose-300 ring-1 ring-rose-500/40'
                  }`}
                >
                  {isUnlocked ? <Unlock className="h-3.5 w-3.5" /> : <Lock className="h-3.5 w-3.5" />}
                  <span>{isUnlocked ? 'UNLOCKED' : 'LOCKED'}</span>
                </div>
              </div>
            </div>

            {/* Cardholder & Expiry/Token */}
            <div className="mt-4 flex items-end justify-between border-t border-slate-800/80 pt-3">
              <div>
                <span className="text-[10px] uppercase tracking-wider text-slate-400">Cardholder</span>
                <p className="text-sm font-semibold tracking-wide text-slate-100">{card.employee_name}</p>
                <span className="text-[11px] text-slate-400">{card.department}</span>
              </div>
              <div className="text-right">
                {isUnlocked && card.virtual_token ? (
                  <div>
                    <span className="text-[10px] uppercase tracking-wider text-emerald-400">Auth Token</span>
                    <p className="font-mono text-xs font-bold text-emerald-300">{card.virtual_token.slice(0, 14)}</p>
                  </div>
                ) : (
                  <div>
                    <span className="text-[10px] uppercase tracking-wider text-slate-400">Pre-Auth Status</span>
                    <p className="text-xs font-medium text-slate-400">Zero Authorization</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Security & Gatekeeper Telemetry */}
        <div className="flex-1 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-semibold tracking-tight text-white">
                  Corporate Debit Card Gatekeeper
                </h3>
                {isUnlocked ? (
                  <span className="inline-flex items-center gap-1 rounded-md bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-400 ring-1 ring-emerald-500/30">
                    <ShieldCheck className="h-3.5 w-3.5" /> Payment Approved
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded-md bg-amber-500/10 px-2 py-0.5 text-xs font-medium text-amber-400 ring-1 ring-amber-500/30">
                    <ShieldAlert className="h-3.5 w-3.5" /> Security Enforced
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {isUnlocked
                  ? 'Card is temporarily unlocked for verified receipt items.'
                  : 'Card remains strictly locked until AI cross-references receipt items with approved catalog specs.'}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onRefresh}
                className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800/80 px-3 py-1.5 text-xs font-medium text-slate-300 hover:bg-slate-700 transition"
              >
                <RefreshCw className="h-3.5 w-3.5" /> Sync
              </button>
              {isUnlocked ? (
                <button
                  type="button"
                  onClick={onLockCard}
                  className="flex items-center gap-1.5 rounded-lg border border-rose-600/40 bg-rose-950/60 px-3 py-1.5 text-xs font-medium text-rose-300 hover:bg-rose-900/60 transition"
                >
                  <Lock className="h-3.5 w-3.5" /> Lock Card Now
                </button>
              ) : (
                <button
                  type="button"
                  onClick={onRequestOverride}
                  className="flex items-center gap-1.5 rounded-lg border border-amber-600/40 bg-amber-950/40 px-3 py-1.5 text-xs font-medium text-amber-300 hover:bg-amber-900/40 transition"
                >
                  <KeyRound className="h-3.5 w-3.5" /> Admin Override
                </button>
              )}
            </div>
          </div>

          {/* Metrics Grid */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3">
              <span className="text-[11px] font-medium text-slate-400">Current Pre-Auth</span>
              <p
                className={`text-lg font-bold font-mono ${
                  isUnlocked ? 'text-emerald-400' : 'text-slate-400'
                }`}
              >
                ${card.current_authorized_limit.toFixed(2)}
              </p>
              <span className="text-[10px] text-slate-400">Exact receipt total</span>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3">
              <span className="text-[11px] font-medium text-slate-400">Daily Limit</span>
              <p className="text-lg font-bold font-mono text-slate-200">
                ${card.daily_budget.toFixed(2)}
              </p>
              <span className="text-[10px] text-slate-400">Max per 24 hours</span>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3">
              <span className="text-[11px] font-medium text-slate-400">Month Budget</span>
              <p className="text-lg font-bold font-mono text-slate-200">
                ${card.monthly_budget.toFixed(2)}
              </p>
              <span className="text-[10px] text-slate-400">
                ${card.spent_this_month.toFixed(2)} used
              </span>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3">
              <span className="text-[11px] font-medium text-slate-400">Unlock Timer</span>
              <div className="flex items-center gap-1.5 text-lg font-bold font-mono">
                {isUnlocked && timeLeft ? (
                  <span className="text-emerald-400 flex items-center gap-1">
                    <Clock className="h-4 w-4 animate-spin text-emerald-400" />
                    {timeLeft}
                  </span>
                ) : (
                  <span className="text-slate-400 text-sm font-normal">Inactive</span>
                )}
              </div>
              <span className="text-[10px] text-slate-400">Auto-relock window</span>
            </div>
          </div>

          {/* Security Banner */}
          <div
            className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs border ${
              isUnlocked
                ? 'border-emerald-500/30 bg-emerald-950/30 text-emerald-200'
                : 'border-slate-800 bg-slate-900/40 text-slate-400'
            }`}
          >
            {isUnlocked ? (
              <ShieldCheck className="h-4 w-4 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="h-4 w-4 text-slate-400 shrink-0" />
            )}
            <p className="truncate">
              <strong className="text-slate-200 font-medium">Status Note:</strong> {card.locked_reason}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
