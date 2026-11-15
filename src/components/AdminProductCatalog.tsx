import React, { useState } from 'react';
import {
  Plus,
  Trash2,
  Search,
  Store,
  DollarSign,
  ShieldCheck,
  Tag,
  Percent,
  CheckCircle2,
  X,
  FileCheck,
} from 'lucide-react';
import { ProductSpecification } from '../lib/types';

interface AdminProductCatalogProps {
  specs: ProductSpecification[];
  onAddSpec: (spec: Omit<ProductSpecification, 'id' | 'created_at'>) => Promise<void>;
  onDeleteSpec: (id: string) => Promise<void>;
}

const COMMON_STORES = ['Staples', 'Best Buy', 'Home Depot', 'Amazon Business', 'Apple Store', 'Target', 'Walmart'];

export const AdminProductCatalog: React.FC<AdminProductCatalogProps> = ({
  specs,
  onAddSpec,
  onDeleteSpec,
}) => {
  const [search, setSearch] = useState<string>('');
  const [selectedStore, setSelectedStore] = useState<string>('ALL');
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);

  // New spec form state
  const [store, setStore] = useState<string>('Staples');
  const [itemName, setItemName] = useState<string>('');
  const [category, setCategory] = useState<string>('Office Supplies');
  const [maxPrice, setMaxPrice] = useState<string>('99.99');
  const [tolerance, setTolerance] = useState<string>('5');
  const [sku, setSku] = useState<string>('');
  const [notes, setNotes] = useState<string>('');

  const stores = ['ALL', ...Array.from(new Set(specs.map(s => s.store)))];

  const filteredSpecs = specs.filter(s => {
    const matchesSearch =
      s.item_name.toLowerCase().includes(search.toLowerCase()) ||
      s.store.toLowerCase().includes(search.toLowerCase()) ||
      s.category.toLowerCase().includes(search.toLowerCase());
    const matchesStore = selectedStore === 'ALL' || s.store === selectedStore;
    return matchesSearch && matchesStore;
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!store || !itemName || !maxPrice) return;

    setSubmitting(true);
    try {
      await onAddSpec({
        store: store.trim(),
        item_name: itemName.trim(),
        category: category.trim(),
        max_unit_price: parseFloat(maxPrice),
        allowed_tolerance_pct: parseFloat(tolerance) || 0,
        sku_or_code: sku ? sku.trim() : undefined,
        notes: notes ? notes.trim() : undefined,
        is_active: true,
      });
      // Reset form
      setItemName('');
      setNotes('');
      setSku('');
      setIsModalOpen(false);
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with Admin Stats */}
      <div className="flex flex-col gap-4 rounded-2xl border border-slate-800 bg-slate-900/90 p-6 shadow-xl sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-600/20 text-emerald-400 ring-1 ring-emerald-500/30">
              <FileCheck className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight">
                Admin Product Specifications & Price Caps
              </h2>
              <p className="text-xs text-slate-400">
                Configure authorized vendors, approved line items, and price ceilings. Receipts are checked against these rules before card unlock.
              </p>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-1.5 self-start rounded-xl bg-emerald-600 px-4 py-2 text-xs font-semibold text-white shadow-md hover:bg-emerald-500 transition"
        >
          <Plus className="h-4 w-4" /> Add Product Specification
        </button>
      </div>

      {/* Filters & Store Tabs */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        {/* Store Tabs */}
        <div className="flex flex-wrap gap-1.5">
          {stores.map(st => (
            <button
              key={st}
              type="button"
              onClick={() => setSelectedStore(st)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                selectedStore === st
                  ? 'bg-slate-100 text-slate-900 shadow'
                  : 'bg-slate-900 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
              }`}
            >
              {st} {st !== 'ALL' && `(${specs.filter(s => s.store === st).length})`}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative w-full max-w-xs">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search products or stores..."
            className="w-full rounded-xl border border-slate-700 bg-slate-950 py-2 pl-9 pr-3 text-xs text-slate-200 placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
          />
        </div>
      </div>

      {/* Specifications Grid */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredSpecs.map(spec => (
          <div
            key={spec.id}
            className="group relative flex flex-col justify-between rounded-xl border border-slate-800 bg-slate-900/60 p-4 shadow-sm hover:border-slate-700 hover:bg-slate-900 transition"
          >
            <div>
              <div className="flex items-start justify-between gap-2">
                <span className="inline-flex items-center gap-1 rounded-md bg-indigo-500/10 px-2 py-0.5 text-[11px] font-semibold text-indigo-400 ring-1 ring-indigo-500/30">
                  <Store className="h-3 w-3" /> {spec.store}
                </span>
                <button
                  type="button"
                  onClick={() => onDeleteSpec(spec.id)}
                  title="Delete specification"
                  className="text-slate-400 hover:text-rose-400 transition"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>

              <h4 className="mt-2.5 text-sm font-semibold text-white group-hover:text-emerald-300 transition">
                {spec.item_name}
              </h4>
              <p className="text-[11px] text-slate-400 mt-0.5">{spec.category}</p>

              {spec.notes && (
                <p className="mt-2 text-xs text-slate-400 italic line-clamp-2">"{spec.notes}"</p>
              )}
            </div>

            <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase tracking-wider text-slate-400">Max Cap</span>
                <p className="text-base font-bold font-mono text-emerald-400">
                  ${spec.max_unit_price.toFixed(2)}
                </p>
              </div>

              <div className="text-right">
                <span className="text-[10px] uppercase tracking-wider text-slate-400">Tolerance</span>
                <p className="text-xs font-semibold text-slate-300">+{spec.allowed_tolerance_pct}%</p>
                <span className="text-[10px] text-slate-400">
                  Max: ${(spec.max_unit_price * (1 + spec.allowed_tolerance_pct / 100)).toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredSpecs.length === 0 && (
        <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-12 text-center text-slate-400">
          <Store className="mx-auto h-8 w-8 text-slate-400 mb-2" />
          <p className="text-sm font-medium">No product specifications match your criteria.</p>
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="mt-3 text-xs text-emerald-400 hover:underline"
          >
            Add a new product specification
          </button>
        </div>
      )}

      {/* Modal: Add Product Specification */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-emerald-400" />
                <h3 className="text-base font-bold text-white">New Product Specification</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="mt-4 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Store / Vendor Name
                  </label>
                  <input
                    type="text"
                    required
                    value={store}
                    onChange={e => setStore(e.target.value)}
                    list="stores-list"
                    placeholder="e.g. Staples"
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-100 focus:border-emerald-500 focus:outline-none"
                  />
                  <datalist id="stores-list">
                    {COMMON_STORES.map(s => (
                      <option key={s} value={s} />
                    ))}
                  </datalist>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Category</label>
                  <input
                    type="text"
                    value={category}
                    onChange={e => setCategory(e.target.value)}
                    placeholder="e.g. IT Hardware"
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-100 focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Approved Item Name (as it appears on receipt)
                </label>
                <input
                  type="text"
                  required
                  value={itemName}
                  onChange={e => setItemName(e.target.value)}
                  placeholder="e.g. Dell 27-inch 4K UHD IPS Monitor"
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-100 focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Max Allowed Unit Price ($)
                  </label>
                  <div className="relative">
                    <DollarSign className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={maxPrice}
                      onChange={e => setMaxPrice(e.target.value)}
                      placeholder="199.99"
                      className="w-full rounded-lg border border-slate-700 bg-slate-950 py-2 pl-7 pr-3 text-xs text-slate-100 focus:border-emerald-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Allowed Tolerance (%)
                  </label>
                  <div className="relative">
                    <Percent className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
                    <input
                      type="number"
                      step="1"
                      value={tolerance}
                      onChange={e => setTolerance(e.target.value)}
                      placeholder="5"
                      className="w-full rounded-lg border border-slate-700 bg-slate-950 py-2 pl-7 pr-3 text-xs text-slate-100 focus:border-emerald-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  SKU or Product Code (Optional)
                </label>
                <input
                  type="text"
                  value={sku}
                  onChange={e => setSku(e.target.value)}
                  placeholder="e.g. BB-MON-4K27"
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-100 focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Corporate Policy Guidelines / Notes
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="e.g. Standard engineering monitor spec. Only 1 per employee without manager sign-off."
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-100 focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-lg border border-slate-700 px-4 py-2 text-xs font-medium text-slate-300 hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-500 disabled:opacity-50"
                >
                  {submitting ? 'Saving Spec...' : 'Save Product Specification'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
