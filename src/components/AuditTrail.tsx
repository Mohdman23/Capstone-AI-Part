import React, { useEffect, useState } from 'react';
import { History, ShieldCheck, XCircle, AlertCircle, RefreshCw, Clock } from 'lucide-react';
import { AuditRecord } from '../lib/types';

export const AuditTrail: React.FC = () => {
  const [audits, setAudits] = useState<AuditRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchAudits = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/audit-history');
      const data = await res.json();
      setAudits(data.audits || []);
    } catch (err) {
      console.error('Failed to load audit history:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAudits();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 rounded-2xl border border-slate-800 bg-slate-900/90 p-6 shadow-xl sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-600/20 text-violet-400 ring-1 ring-violet-500/30">
            <History className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white tracking-tight">
              Receipt Compliance Audit Trail & Card Unlocks
            </h2>
            <p className="text-xs text-slate-400">
              Immutable ledger of all receipt cross-reference checks, policy violation detections, and corporate debit card authorizations.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={fetchAudits}
          className="flex items-center gap-1.5 self-start rounded-lg border border-slate-700 bg-slate-800/80 px-3 py-1.5 text-xs font-medium text-slate-300 hover:bg-slate-700 transition"
        >
          <RefreshCw className="h-3.5 w-3.5" /> Refresh Log
        </button>
      </div>

      <div className="rounded-2xl border border-slate-800 bg-slate-900/90 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 text-[11px] uppercase tracking-wider text-slate-400 border-b border-slate-800">
              <tr>
                <th className="px-4 py-3 font-semibold">Timestamp</th>
                <th className="px-4 py-3 font-semibold">Employee</th>
                <th className="px-4 py-3 font-semibold">Store & Receipt</th>
                <th className="px-4 py-3 font-semibold">Amount</th>
                <th className="px-4 py-3 font-semibold">Card Target</th>
                <th className="px-4 py-3 font-semibold">Gatekeeper Result</th>
                <th className="px-4 py-3 font-semibold">Unlock Token</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono text-slate-300">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-slate-400">
                    <Clock className="mx-auto h-5 w-5 animate-spin mb-1 text-slate-400" />
                    Loading audit trail...
                  </td>
                </tr>
              ) : audits.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-slate-400">
                    No receipt audits recorded yet.
                  </td>
                </tr>
              ) : (
                audits.map(audit => (
                  <tr key={audit.id} className="hover:bg-slate-800/40 transition">
                    <td className="px-4 py-3 text-slate-400 font-sans text-[11px]">
                      {audit.timestamp}
                    </td>
                    <td className="px-4 py-3 font-sans font-medium text-slate-200">
                      {audit.employee_name}
                    </td>
                    <td className="px-4 py-3 font-sans">
                      <span className="text-slate-100 font-medium block">{audit.store_name}</span>
                      <span className="text-[10px] text-slate-400 font-mono">{audit.receipt_number}</span>
                    </td>
                    <td className="px-4 py-3 font-bold text-slate-100">
                      ${audit.total_amount.toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-slate-400 font-mono">
                      •••• {audit.card_last_four}
                    </td>
                    <td className="px-4 py-3 font-sans">
                      {audit.status === 'APPROVED' ? (
                        <span className="inline-flex items-center gap-1 rounded-md bg-emerald-500/10 px-2 py-0.5 text-xs font-semibold text-emerald-400 ring-1 ring-emerald-500/30">
                          <ShieldCheck className="h-3 w-3" /> Approved & Unlocked
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-md bg-rose-500/10 px-2 py-0.5 text-xs font-semibold text-rose-400 ring-1 ring-rose-500/30">
                          <XCircle className="h-3 w-3" /> Rejected (Card Locked)
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 font-mono text-[11px] text-emerald-400">
                      {audit.unlock_token || <span className="text-slate-400 italic">None</span>}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
