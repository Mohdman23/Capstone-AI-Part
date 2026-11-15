import React, { useEffect, useState } from 'react';
import { Database, X, Table, Shield } from 'lucide-react';

interface SchemaModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SchemaModal: React.FC<SchemaModalProps> = ({ isOpen, onClose }) => {
  const [tables, setTables] = useState<Array<{ tableName: string; rowCount: number; columns: Array<{ name: string; type: string }> }>>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    if (!isOpen) return;
    setLoading(true);
    fetch('/api/schema-summary')
      .then(res => res.json())
      .then(data => setTables(data.tables || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
      <div className="w-full max-w-4xl max-h-[85vh] overflow-hidden flex flex-col rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 p-5">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500/20 text-indigo-400">
              <Database className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Financial Database Schema</h3>
              <p className="text-xs text-slate-400">
                Connected SQLite financial ledger inspected by the Natural Language AI engine.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto p-5 space-y-4">
          {loading ? (
            <div className="p-8 text-center text-xs text-slate-400">Loading database schema...</div>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {tables.map(table => (
                <div
                  key={table.tableName}
                  className="rounded-xl border border-slate-800 bg-slate-950/70 p-4"
                >
                  <div className="flex items-center justify-between border-b border-slate-800/80 pb-2 mb-3">
                    <div className="flex items-center gap-2">
                      <Table className="h-4 w-4 text-indigo-400" />
                      <span className="font-mono text-xs font-bold text-white">{table.tableName}</span>
                    </div>
                    <span className="rounded bg-slate-800 px-2 py-0.5 text-[10px] font-medium text-slate-300">
                      {table.rowCount} rows
                    </span>
                  </div>

                  <div className="space-y-1.5 font-mono text-[11px]">
                    {table.columns.map(col => (
                      <div key={col.name} className="flex items-center justify-between text-slate-300">
                        <span>{col.name}</span>
                        <span className="text-[10px] text-slate-400 uppercase">{col.type}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-slate-800 bg-slate-950/60 p-4 text-xs text-slate-400">
          <div className="flex items-center gap-1.5 text-emerald-400">
            <Shield className="h-4 w-4" /> Enforcing strictly read-only execution safety
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg bg-slate-800 px-4 py-1.5 font-medium text-slate-200 hover:bg-slate-700 transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
