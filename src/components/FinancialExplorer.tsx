import React, { useState } from 'react';
import {
  Sparkles,
  Terminal,
  Search,
  Copy,
  Check,
  Clock,
  Layers,
  TrendingUp,
  Table,
  BarChart3,
  Lightbulb,
  ShieldCheck,
  ArrowRight,
} from 'lucide-react';
import { FinancialQueryResponse } from '../lib/types';

interface FinancialExplorerProps {
  onOpenSchema: () => void;
}

const SAMPLE_PROMPTS = [
  'Show department budget vs actual spend YTD with utilization percentage',
  'List top transactions over $100 with merchant, department, and amount',
  'Show corporate debit card statuses, limits, and current spend this month',
  'What are the approved product specifications and price caps across all stores?',
  'Display the latest receipt audit compliance logs with status and notes',
];

export const FinancialExplorer: React.FC<FinancialExplorerProps> = ({ onOpenSchema }) => {
  const [prompt, setPrompt] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [result, setResult] = useState<FinancialQueryResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'insights' | 'table' | 'sql'>('insights');
  const [tableFilter, setTableFilter] = useState<string>('');

  const executeQuery = async (queryText: string) => {
    if (!queryText.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/financial-query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: queryText }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to execute query');
      }
      setResult(data);
      setActiveTab('insights');
    } catch (err: any) {
      setError(err.message || 'An error occurred while executing the query.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopySql = () => {
    if (!result?.sql) return;
    navigator.clipboard.writeText(result.sql);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Filter rows for interactive search
  const filteredRows = result
    ? result.rows.filter(row =>
        row.some(val =>
          String(val || '')
            .toLowerCase()
            .includes(tableFilter.toLowerCase())
        )
      )
    : [];

  return (
    <div className="space-y-6">
      {/* Search Bar & Prompt Card */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-6 shadow-xl backdrop-blur-md">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600/20 text-indigo-400 ring-1 ring-indigo-500/30">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight">
                Natural Language Financial Intelligence
              </h2>
              <p className="text-xs text-slate-400">
                Ask in plain English. The AI formulates read-only SQL, runs it against the corporate ledger, and explains the results.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onOpenSchema}
            className="flex items-center gap-1.5 self-start rounded-lg border border-slate-700 bg-slate-800/80 px-3 py-1.5 text-xs font-medium text-slate-300 hover:bg-slate-700 hover:text-white transition"
          >
            <Layers className="h-3.5 w-3.5" /> View DB Schema
          </button>
        </div>

        {/* Input Form */}
        <form
          onSubmit={e => {
            e.preventDefault();
            executeQuery(prompt);
          }}
          className="mt-4"
        >
          <div className="relative flex items-center">
            <input
              type="text"
              value={prompt}
              onChange={e => setPrompt(e.target.value)}
              placeholder="e.g. Show top 5 departments by discretionary spend last month..."
              className="w-full rounded-xl border border-slate-700 bg-slate-950/80 px-4 py-3.5 pr-28 text-sm text-slate-100 placeholder-slate-500 shadow-inner focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
            <button
              type="submit"
              disabled={loading || !prompt.trim()}
              className="absolute right-2 flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-md hover:bg-indigo-500 disabled:opacity-50 transition"
            >
              {loading ? (
                <>
                  <Clock className="h-3.5 w-3.5 animate-spin" /> Thinking...
                </>
              ) : (
                <>
                  Execute <ArrowRight className="h-3.5 w-3.5" />
                </>
              )}
            </button>
          </div>
        </form>

        {/* Quick Sample Prompts */}
        <div className="mt-4">
          <span className="text-[11px] font-medium uppercase tracking-wider text-slate-400">
            Suggested Financial Prompts:
          </span>
          <div className="mt-2 flex flex-wrap gap-2">
            {SAMPLE_PROMPTS.map((sample, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setPrompt(sample);
                  executeQuery(sample);
                }}
                className="rounded-full border border-slate-800 bg-slate-950/50 px-3 py-1 text-xs text-slate-300 hover:border-slate-700 hover:bg-slate-800 hover:text-white transition"
              >
                {sample}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="rounded-xl border border-rose-500/40 bg-rose-950/40 p-4 text-xs text-rose-300">
          <strong>Query Error:</strong> {error}
        </div>
      )}

      {/* Results Workspace */}
      {result && (
        <div className="space-y-4">
          {/* Top Bar with Metrics & Tabs */}
          <div className="flex flex-col gap-4 rounded-xl border border-slate-800 bg-slate-900/80 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap items-center gap-2">
              <span className="flex items-center gap-1 rounded-md bg-emerald-500/10 px-2.5 py-1 text-xs font-semibold text-emerald-400 ring-1 ring-emerald-500/30">
                <ShieldCheck className="h-3.5 w-3.5" /> Read-Only Safe
              </span>
              <span className="flex items-center gap-1 rounded-md bg-slate-800 px-2.5 py-1 text-xs font-medium text-slate-300">
                <Clock className="h-3.5 w-3.5 text-slate-400" /> {result.execution_time_ms}ms
              </span>
              <span className="rounded-md bg-slate-800 px-2.5 py-1 text-xs font-medium text-slate-300">
                {result.row_count} rows returned
              </span>
            </div>

            {/* View Tabs */}
            <div className="flex items-center rounded-lg border border-slate-800 bg-slate-950 p-1">
              <button
                type="button"
                onClick={() => setActiveTab('insights')}
                className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition ${
                  activeTab === 'insights'
                    ? 'bg-indigo-600 text-white shadow'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Lightbulb className="h-3.5 w-3.5" /> Understandable Format
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('table')}
                className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition ${
                  activeTab === 'table'
                    ? 'bg-indigo-600 text-white shadow'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Table className="h-3.5 w-3.5" /> Data Table ({result.row_count})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('sql')}
                className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition ${
                  activeTab === 'sql'
                    ? 'bg-indigo-600 text-white shadow'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Terminal className="h-3.5 w-3.5" /> SQL Return
              </button>
            </div>
          </div>

          {/* TAB 1: Understandable Format (Executive Narrative + Takeaways + Visual Chart) */}
          {activeTab === 'insights' && (
            <div className="space-y-4">
              {/* Executive Summary Card */}
              <div className="rounded-2xl border border-slate-800 bg-gradient-to-br from-slate-900 to-slate-950 p-6 shadow-lg">
                <div className="flex items-center gap-2 text-indigo-400 mb-2">
                  <TrendingUp className="h-4 w-4" />
                  <span className="text-xs font-semibold uppercase tracking-wider">
                    Executive Financial Summary
                  </span>
                </div>
                <p className="text-base text-slate-100 font-medium leading-relaxed">
                  {result.explanation}
                </p>

                {/* Key Insights Pills */}
                {result.key_insights && result.key_insights.length > 0 && (
                  <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {result.key_insights.map((insight, idx) => (
                      <div
                        key={idx}
                        className="rounded-xl border border-slate-800/80 bg-slate-950/60 p-3.5 shadow-sm"
                      >
                        <div className="flex items-start gap-2.5">
                          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-indigo-500/20 text-[10px] font-bold text-indigo-300">
                            {idx + 1}
                          </span>
                          <p className="text-xs text-slate-300 leading-normal">{insight}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Dynamic Visual Breakdown Chart */}
              {result.rows.length > 0 && (
                <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <BarChart3 className="h-4 w-4 text-emerald-400" />
                      <h4 className="text-sm font-semibold text-white">
                        {result.chart_suggestion?.title || 'Data Distribution Preview'}
                      </h4>
                    </div>
                    <span className="text-xs text-slate-400">
                      Visualized from {result.row_count} records
                    </span>
                  </div>

                  {/* Horizontal Bar Chart Representation */}
                  <div className="space-y-3">
                    {result.rows.slice(0, 6).map((row, i) => {
                      const label = String(row[0] || `Item ${i + 1}`);
                      // Find numeric column if possible
                      const numCol = row.find(v => typeof v === 'number' || (!isNaN(Number(v)) && Number(v) > 0));
                      const numVal = numCol !== undefined ? Number(numCol) : 100;
                      const maxVal = Math.max(
                        ...result.rows.slice(0, 6).map(r => {
                          const n = r.find(v => typeof v === 'number' || (!isNaN(Number(v)) && Number(v) > 0));
                          return n !== undefined ? Number(n) : 100;
                        })
                      );
                      const pct = Math.max(8, Math.min(100, Math.round((numVal / (maxVal || 1)) * 100)));

                      return (
                        <div key={i} className="space-y-1">
                          <div className="flex justify-between text-xs font-medium">
                            <span className="text-slate-300 truncate max-w-xs">{label}</span>
                            <span className="text-slate-400 font-mono">
                              {typeof numCol === 'number' && numCol > 100
                                ? `$${numCol.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                                : String(numCol || '')}
                            </span>
                          </div>
                          <div className="h-2.5 w-full rounded-full bg-slate-800 overflow-hidden">
                            <div
                              className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-emerald-400 transition-all duration-500"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: Interactive Data Table */}
          {activeTab === 'table' && (
            <div className="rounded-2xl border border-slate-800 bg-slate-900/90 overflow-hidden shadow-xl">
              {/* Search within results */}
              <div className="flex items-center justify-between border-b border-slate-800 p-4">
                <div className="relative w-full max-w-xs">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    value={tableFilter}
                    onChange={e => setTableFilter(e.target.value)}
                    placeholder="Search in table..."
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 py-1.5 pl-9 pr-3 text-xs text-slate-200 placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
                  />
                </div>
                <span className="text-xs text-slate-400">
                  Showing {filteredRows.length} of {result.row_count} rows
                </span>
              </div>

              <div className="overflow-x-auto max-h-96">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950/80 text-[11px] uppercase tracking-wider text-slate-400 sticky top-0 border-b border-slate-800">
                    <tr>
                      {result.columns.map((col, idx) => (
                        <th key={idx} className="px-4 py-3 font-semibold">
                          {col}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-mono text-slate-300">
                    {filteredRows.length === 0 ? (
                      <tr>
                        <td colSpan={result.columns.length} className="px-4 py-8 text-center text-slate-400">
                          No matching records found.
                        </td>
                      </tr>
                    ) : (
                      filteredRows.map((row, rIdx) => (
                        <tr key={rIdx} className="hover:bg-slate-800/40 transition">
                          {row.map((cell, cIdx) => (
                            <td key={cIdx} className="px-4 py-2.5 whitespace-nowrap">
                              {cell === null ? (
                                <span className="text-slate-400 italic">null</span>
                              ) : typeof cell === 'number' ? (
                                <span className="text-emerald-400 font-semibold">
                                  {cell >= 1000 ? cell.toLocaleString() : cell}
                                </span>
                              ) : (
                                String(cell)
                              )}
                            </td>
                          ))}
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: Raw Executed SQL Return */}
          {activeTab === 'sql' && (
            <div className="rounded-2xl border border-slate-800 bg-slate-950 p-5 shadow-xl">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2 text-indigo-400">
                  <Terminal className="h-4 w-4" />
                  <span className="text-xs font-semibold uppercase tracking-wider font-mono">
                    SQLite Query (Read-Only)
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleCopySql}
                  className="flex items-center gap-1.5 rounded-md border border-slate-700 bg-slate-800/80 px-2.5 py-1 text-xs text-slate-300 hover:bg-slate-700 transition"
                >
                  {copied ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                  {copied ? 'Copied' : 'Copy SQL'}
                </button>
              </div>

              <div className="mt-4 overflow-x-auto rounded-lg bg-slate-900/90 p-4 border border-slate-800">
                <pre className="font-mono text-xs text-emerald-300 leading-relaxed whitespace-pre-wrap">
                  {result.sql}
                </pre>
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-slate-400">
                <div>
                  <span className="text-slate-400 font-medium">Query Plan:</span> Automatic SQLite index scan
                </div>
                <div>
                  <span className="text-slate-400 font-medium">Latency:</span> {result.execution_time_ms} ms
                </div>
                <div>
                  <span className="text-slate-400 font-medium">Statement:</span> Single read-only SELECT
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
