import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  getDb,
  getAllProductSpecs,
  insertProductSpec,
  deleteProductSpec,
  getCorporateCard,
  updateCardStatus,
  getAuditHistory,
  getSchemaSummary,
  executeSqlQuery,
} from './server/db';
import { processNaturalLanguageQuery, processReceiptVerification } from './server/gemini';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = process.env.PORT || 3000;

  app.use(express.json({ limit: '25mb' }));

  // Initialize SQLite database
  await getDb();

  // API Routes
  app.post('/api/financial-query', async (req, res) => {
    try {
      const { prompt } = req.body;
      if (!prompt || typeof prompt !== 'string') {
        return res.status(400).json({ error: 'Prompt string is required' });
      }
      const response = await processNaturalLanguageQuery(prompt);
      res.json(response);
    } catch (err: any) {
      console.error('Error processing financial query:', err);
      res.status(500).json({ error: err.message || 'Internal financial query error' });
    }
  });

  app.post('/api/scan-receipt', async (req, res) => {
    try {
      const payload = req.body;
      const result = await processReceiptVerification(payload);
      res.json(result);
    } catch (err: any) {
      console.error('Error processing receipt verification:', err);
      res.status(500).json({ error: err.message || 'Failed to process receipt verification' });
    }
  });

  app.get('/api/product-specs', (req, res) => {
    try {
      const specs = getAllProductSpecs();
      res.json({ specs });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/product-specs', (req, res) => {
    try {
      const { store, item_name, category, max_unit_price, allowed_tolerance_pct, sku_or_code, notes } = req.body;
      if (!store || !item_name || max_unit_price === undefined) {
        return res.status(400).json({ error: 'Store, item name, and max unit price are required.' });
      }
      const newSpec = insertProductSpec({
        store: String(store).trim(),
        item_name: String(item_name).trim(),
        category: category ? String(category).trim() : 'General Supplies',
        max_unit_price: Number(max_unit_price),
        allowed_tolerance_pct: allowed_tolerance_pct !== undefined ? Number(allowed_tolerance_pct) : 0,
        sku_or_code: sku_or_code ? String(sku_or_code).trim() : undefined,
        notes: notes ? String(notes).trim() : undefined,
        is_active: true,
      });
      res.json({ spec: newSpec });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.delete('/api/product-specs/:id', (req, res) => {
    try {
      const { id } = req.params;
      deleteProductSpec(id);
      res.json({ success: true, deletedId: id });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get('/api/corporate-card', (req, res) => {
    try {
      const card = getCorporateCard('card-4821');
      res.json({ card });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/corporate-card/lock', (req, res) => {
    try {
      updateCardStatus('card-4821', 'LOCKED', 0, undefined, undefined, 'Manual lock engaged by security protocol');
      const card = getCorporateCard('card-4821');
      res.json({ success: true, card });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/corporate-card/override', (req, res) => {
    try {
      const { amount, reason } = req.body;
      const numAmount = Number(amount) || 250;
      const token = `OVERRIDE-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
      const expiresAt = new Date(Date.now() + 30 * 60 * 1000).toISOString();
      updateCardStatus('card-4821', 'UNLOCKED', numAmount, token, expiresAt, reason || 'Admin manual override authorized for 30 minutes');
      const card = getCorporateCard('card-4821');
      res.json({ success: true, card });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get('/api/audit-history', (req, res) => {
    try {
      const audits = getAuditHistory();
      res.json({ audits });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get('/api/schema-summary', (req, res) => {
    try {
      const summary = getSchemaSummary();
      res.json({ tables: summary });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/run-sql', (req, res) => {
    try {
      const { sql } = req.body;
      if (!sql) return res.status(400).json({ error: 'SQL required' });
      const result = executeSqlQuery(sql);
      res.json(result);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  // Mount Vite middlewares in development
  const isDev = process.env.NODE_ENV !== 'production';
  if (isDev) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, () => {
    console.log(`FinGuard AI server running on port ${PORT}`);
  });
}

startServer().catch(err => {
  console.error('Failed to start FinGuard AI server:', err);
  process.exit(1);
});
