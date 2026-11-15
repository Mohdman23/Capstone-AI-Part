import React, { useState } from 'react';
import { KeyRound, X, AlertTriangle, DollarSign } from 'lucide-react';

interface OverrideModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmOverride: (amount: number, reason: string) => Promise<void>;
}

export const OverrideModal: React.FC<OverrideModalProps> = ({
  isOpen,
  onClose,
  onConfirmOverride,
}) => {
  const [amount, setAmount] = useState<string>('250.00');
  const [reason, setReason] = useState<string>(
    'Emergency engineering team replacement hardware authorized by department head'
  );
  const [submitting, setSubmitting] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await onConfirmOverride(parseFloat(amount) || 250, reason);
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <KeyRound className="h-5 w-5 text-amber-400" />
            <h3 className="text-base font-bold text-white">Admin Debit Card Override</h3>
          </div>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div className="rounded-xl border border-amber-500/30 bg-amber-950/20 p-3 text-xs text-amber-200">
            <div className="flex items-center gap-1.5 font-semibold text-amber-300 mb-1">
              <AlertTriangle className="h-4 w-4" /> Manager / Admin Authorization
            </div>
            This action bypasses the automated receipt check and temporarily unlocks the employee corporate card for a 30-minute pre-authorized window.
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Authorized Pre-Auth Amount ($)
            </label>
            <div className="relative">
              <DollarSign className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
              <input
                type="number"
                step="0.01"
                required
                value={amount}
                onChange={e => setAmount(e.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-950 py-2 pl-7 pr-3 text-xs text-slate-100 focus:border-amber-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Audit Justification / Business Reason
            </label>
            <textarea
              rows={3}
              required
              value={reason}
              onChange={e => setReason(e.target.value)}
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-100 focus:border-amber-500 focus:outline-none"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-700 px-4 py-2 text-xs font-medium text-slate-300 hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-lg bg-amber-600 px-4 py-2 text-xs font-semibold text-white hover:bg-amber-500 disabled:opacity-50"
            >
              {submitting ? 'Unlocking Card...' : 'Authorize Emergency Unlock'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
