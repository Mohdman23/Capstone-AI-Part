import React, { useEffect, useState, useCallback } from 'react';
import { Navbar } from './components/Navbar';
import { CorporateCardHud } from './components/CorporateCardHud';
import { FinancialExplorer } from './components/FinancialExplorer';
import { AdminProductCatalog } from './components/AdminProductCatalog';
import { ReceiptScanner } from './components/ReceiptScanner';
import { AuditTrail } from './components/AuditTrail';
import { SchemaModal } from './components/SchemaModal';
import { OverrideModal } from './components/OverrideModal';
import { EmployeeDebitCard, ProductSpecification } from './lib/types';

export default function App() {
  const [activeTab, setActiveTab] = useState<'explorer' | 'scanner' | 'admin' | 'audits'>('scanner');
  const [card, setCard] = useState<EmployeeDebitCard | null>(null);
  const [specs, setSpecs] = useState<ProductSpecification[]>([]);
  const [isSchemaModalOpen, setIsSchemaModalOpen] = useState<boolean>(false);
  const [isOverrideModalOpen, setIsOverrideModalOpen] = useState<boolean>(false);

  const fetchCard = useCallback(async () => {
    try {
      const res = await fetch('/api/corporate-card');
      const data = await res.json();
      if (data.card) setCard(data.card);
    } catch (err) {
      console.error('Failed to fetch card:', err);
    }
  }, []);

  const fetchSpecs = useCallback(async () => {
    try {
      const res = await fetch('/api/product-specs');
      const data = await res.json();
      if (data.specs) setSpecs(data.specs);
    } catch (err) {
      console.error('Failed to fetch product specs:', err);
    }
  }, []);

  useEffect(() => {
    fetchCard();
    fetchSpecs();
  }, [fetchCard, fetchSpecs]);

  const handleLockCard = async () => {
    try {
      const res = await fetch('/api/corporate-card/lock', { method: 'POST' });
      const data = await res.json();
      if (data.card) setCard(data.card);
    } catch (err) {
      console.error('Failed to lock card:', err);
    }
  };

  const handleOverride = async (amount: number, reason: string) => {
    try {
      const res = await fetch('/api/corporate-card/override', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount, reason }),
      });
      const data = await res.json();
      if (data.card) setCard(data.card);
    } catch (err) {
      console.error('Failed to apply override:', err);
    }
  };

  const handleAddSpec = async (newSpec: Omit<ProductSpecification, 'id' | 'created_at'>) => {
    const res = await fetch('/api/product-specs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newSpec),
    });
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || 'Failed to add specification');
    }
    fetchSpecs();
  };

  const handleDeleteSpec = async (id: string) => {
    await fetch(`/api/product-specs/${id}`, { method: 'DELETE' });
    fetchSpecs();
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-emerald-500 selection:text-slate-950">
      {/* Navigation */}
      <Navbar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        isCardUnlocked={card?.status === 'UNLOCKED'}
      />

      {/* Main Container */}
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 lg:px-8 space-y-6">
        {/* Permanent Corporate Card Security HUD */}
        <CorporateCardHud
          card={card}
          onRefresh={fetchCard}
          onLockCard={handleLockCard}
          onRequestOverride={() => setIsOverrideModalOpen(true)}
        />

        {/* Tab Views */}
        {activeTab === 'scanner' && (
          <ReceiptScanner
            specs={specs}
            onVerificationComplete={() => {
              fetchCard();
            }}
          />
        )}

        {activeTab === 'explorer' && (
          <FinancialExplorer onOpenSchema={() => setIsSchemaModalOpen(true)} />
        )}

        {activeTab === 'admin' && (
          <AdminProductCatalog
            specs={specs}
            onAddSpec={handleAddSpec}
            onDeleteSpec={handleDeleteSpec}
          />
        )}

        {activeTab === 'audits' && <AuditTrail />}
      </main>

      {/* Modals */}
      <SchemaModal
        isOpen={isSchemaModalOpen}
        onClose={() => setIsSchemaModalOpen(false)}
      />

      <OverrideModal
        isOpen={isOverrideModalOpen}
        onClose={() => setIsOverrideModalOpen(false)}
        onConfirmOverride={handleOverride}
      />
    </div>
  );
}
