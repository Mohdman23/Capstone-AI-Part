import initSqlJs, { Database } from 'sql.js';
import { ProductSpecification, EmployeeDebitCard, AuditRecord } from '../src/lib/types';

let dbInstance: Database | null = null;

export async function getDb(): Promise<Database> {
  if (dbInstance) return dbInstance;

  const SQL = await initSqlJs();
  dbInstance = new SQL.Database();
  initSchemaAndSeed(dbInstance);
  return dbInstance;
}

function initSchemaAndSeed(db: Database) {
  db.run(`
    -- Departments
    CREATE TABLE IF NOT EXISTS departments (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      code TEXT NOT NULL,
      manager_name TEXT NOT NULL,
      annual_budget REAL NOT NULL,
      spent_ytd REAL NOT NULL
    );

    -- Employees
    CREATE TABLE IF NOT EXISTS employees (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      department_id TEXT NOT NULL,
      role TEXT NOT NULL,
      corporate_card_id TEXT NOT NULL,
      approval_limit REAL NOT NULL
    );

    -- Corporate Debit Cards
    CREATE TABLE IF NOT EXISTS corporate_cards (
      card_id TEXT PRIMARY KEY,
      employee_id TEXT NOT NULL,
      employee_name TEXT NOT NULL,
      department TEXT NOT NULL,
      card_last_four TEXT NOT NULL,
      card_brand TEXT NOT NULL,
      status TEXT NOT NULL, -- 'LOCKED' | 'UNLOCKED'
      locked_reason TEXT NOT NULL,
      current_authorized_limit REAL NOT NULL,
      daily_budget REAL NOT NULL,
      monthly_budget REAL NOT NULL,
      spent_this_month REAL NOT NULL,
      virtual_token TEXT,
      expires_at TEXT
    );

    -- Product Specifications (Admin Configured)
    CREATE TABLE IF NOT EXISTS product_specifications (
      id TEXT PRIMARY KEY,
      store TEXT NOT NULL,
      item_name TEXT NOT NULL,
      category TEXT NOT NULL,
      max_unit_price REAL NOT NULL,
      allowed_tolerance_pct REAL NOT NULL DEFAULT 0,
      sku_or_code TEXT,
      notes TEXT,
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL
    );

    -- Transactions History
    CREATE TABLE IF NOT EXISTS transactions (
      id TEXT PRIMARY KEY,
      transaction_date TEXT NOT NULL,
      merchant TEXT NOT NULL,
      category TEXT NOT NULL,
      amount REAL NOT NULL,
      status TEXT NOT NULL, -- 'SETTLED' | 'PENDING' | 'FLAGGED'
      department TEXT NOT NULL,
      employee_name TEXT NOT NULL,
      card_last_four TEXT NOT NULL,
      receipt_id TEXT
    );

    -- Receipt Audit Trail
    CREATE TABLE IF NOT EXISTS receipt_audits (
      id TEXT PRIMARY KEY,
      receipt_number TEXT NOT NULL,
      store_name TEXT NOT NULL,
      scan_date TEXT NOT NULL,
      total_amount REAL NOT NULL,
      compliance_status TEXT NOT NULL,
      items_count INTEGER NOT NULL,
      unauthorized_count INTEGER NOT NULL,
      price_violations_count INTEGER NOT NULL,
      card_unlocked INTEGER NOT NULL,
      employee_name TEXT NOT NULL,
      card_last_four TEXT NOT NULL,
      unlock_token TEXT,
      notes TEXT
    );
  `);

  // Seed Departments
  db.run(`
    INSERT INTO departments (id, name, code, manager_name, annual_budget, spent_ytd) VALUES
      ('dept-eng', 'Engineering & Product', 'ENG-01', 'Elena Rostova', 450000.0, 312450.0),
      ('dept-ops', 'Operations & Logistics', 'OPS-02', 'Marcus Brody', 280000.0, 198200.0),
      ('dept-mkt', 'Global Marketing', 'MKT-03', 'Sophia Chen', 320000.0, 289400.0),
      ('dept-it', 'IT & Infrastructure', 'IT-04', 'David Kim', 210000.0, 142800.0),
      ('dept-sales', 'Enterprise Sales', 'SALES-05', 'Rachel Vance', 390000.0, 245100.0);
  `);

  // Seed Employees
  db.run(`
    INSERT INTO employees (id, name, email, department_id, role, corporate_card_id, approval_limit) VALUES
      ('emp-101', 'Jordan Vance', 'jordan.vance@company.internal', 'dept-eng', 'Staff Systems Engineer', 'card-4821', 1000.0),
      ('emp-102', 'Maya Lin', 'maya.lin@company.internal', 'dept-mkt', 'Creative Director', 'card-9104', 1500.0),
      ('emp-103', 'Carlos Ruiz', 'carlos.ruiz@company.internal', 'dept-ops', 'Facilities Lead', 'card-3312', 800.0),
      ('emp-104', 'Amina Yusuf', 'amina.yusuf@company.internal', 'dept-it', 'DevOps Specialist', 'card-7750', 1200.0);
  `);

  // Seed Corporate Debit Cards
  db.run(`
    INSERT INTO corporate_cards (card_id, employee_id, employee_name, department, card_last_four, card_brand, status, locked_reason, current_authorized_limit, daily_budget, monthly_budget, spent_this_month, virtual_token, expires_at) VALUES
      ('card-4821', 'emp-101', 'Jordan Vance', 'Engineering & Product', '4821', 'Visa Commercial', 'LOCKED', 'Awaiting verified receipt & AI pre-authorization', 0.0, 750.0, 4500.0, 1280.0, NULL, NULL),
      ('card-9104', 'emp-102', 'Maya Lin', 'Global Marketing', '9104', 'Mastercard Corporate', 'LOCKED', 'Auto-locked after transaction window expiry', 0.0, 1200.0, 6000.0, 3140.0, NULL, NULL),
      ('card-3312', 'emp-103', 'Carlos Ruiz', 'Operations & Logistics', '3312', 'Visa Commercial', 'LOCKED', 'Card gatekeeper security active', 0.0, 600.0, 3000.0, 940.0, NULL, NULL);
  `);

  // Seed Admin Product Specifications (Stores, Products, Price Caps)
  db.run(`
    INSERT INTO product_specifications (id, store, item_name, category, max_unit_price, allowed_tolerance_pct, sku_or_code, notes, is_active, created_at) VALUES
      ('spec-01', 'Staples', 'Ergonomic Mesh Office Chair', 'Office Furniture', 199.99, 5.0, 'STP-CHAIR-M1', 'Lumbar support standard workstation chair', 1, '2026-01-10'),
      ('spec-02', 'Staples', 'Wireless Ergonomic Keyboard & Mouse', 'Peripherals', 65.00, 5.0, 'STP-KM-W2', 'Logitech or equivalent wireless set', 1, '2026-01-10'),
      ('spec-03', 'Staples', 'Multipurpose Copy Paper 10-Ream Case', 'Office Supplies', 54.99, 5.0, 'STP-PPR-CASE', '8.5x11 20lb white paper', 1, '2026-01-15'),
      ('spec-04', 'Staples', 'USB-C Universal Dual-Display Dock', 'IT Hardware', 149.00, 5.0, 'STP-DOCK-65W', 'Thunderbolt/USB-C dual HDMI output', 1, '2026-01-20'),
      ('spec-05', 'Best Buy', 'Dell 27-inch 4K UHD IPS Monitor', 'Displays', 289.99, 5.0, 'BB-MON-4K27', 'Standard engineering dual-display monitor', 1, '2026-02-01'),
      ('spec-06', 'Best Buy', 'Anker 100W USB-C GaN Rapid Charger', 'Electronics', 59.99, 5.0, 'BB-ANK-100W', 'Laptop and device travel charger', 1, '2026-02-05'),
      ('spec-07', 'Best Buy', 'Noise-Cancelling Over-Ear Headset', 'Audio Equipment', 179.00, 5.0, 'BB-HEAD-NC1', 'Jabra/Sony office meeting headset', 1, '2026-02-12'),
      ('spec-08', 'Home Depot', 'Industrial Heavy-Duty Tool Kit 75-Piece', 'Facilities & Tools', 119.50, 5.0, 'HD-TOOL-75', 'Maintenance hand tool box with case', 1, '2026-02-15'),
      ('spec-09', 'Home Depot', 'Commercial Grade Outdoor Extension Cord 50ft', 'Facilities & Tools', 42.00, 5.0, 'HD-CORD-50', '12-gauge grounded weather-resistant', 1, '2026-02-20'),
      ('spec-10', 'Amazon Business', 'Standing Desk Anti-Fatigue Mat', 'Office Furniture', 45.00, 5.0, 'AMZ-MAT-2436', 'Commercial high density foam', 1, '2026-03-01'),
      ('spec-11', 'Amazon Business', 'Cat6 Ethernet Patch Cable 25ft 5-Pack', 'Networking', 28.50, 5.0, 'AMZ-CAT6-5PK', 'Snagless shielded cables', 1, '2026-03-05'),
      ('spec-12', 'Apple Store', 'USB-C to MagSafe 3 Cable (2m)', 'Cables & Power', 49.00, 5.0, 'APL-MAG3-2M', 'Original Apple replacement power cable', 1, '2026-03-10'),
      ('spec-13', 'مكتبة جرير (Jarir Bookstore)', 'شاشة سامسونج 27 بوصة بدقة 4K (Samsung 27" 4K Monitor)', 'Displays & IT', 1250.00, 5.0, 'JAR-MON-4K27', 'Approved corporate engineering display at Jarir KSA/UAE', 1, '2026-03-15'),
      ('spec-14', 'مكتبة جرير (Jarir Bookstore)', 'لوحة مفاتيح وماوس لاسلكي لوجيتك (Logitech Wireless Combo)', 'Peripherals', 260.00, 5.0, 'JAR-LOGI-MK', 'Wireless ergonomic desktop keyboard and optical mouse', 1, '2026-03-15'),
      ('spec-15', 'مكتبة جرير (Jarir Bookstore)', 'كرسي مكتب مريح (Ergonomic Office Chair)', 'Office Furniture', 850.00, 5.0, 'JAR-CHR-ERGO', 'Ergonomic lumbar support office chair', 1, '2026-03-15'),
      ('spec-16', 'مكتبة جرير (Jarir Bookstore)', 'طقم أقلام حبر جاف (Ballpoint Pen Set)', 'Office Supplies', 45.00, 5.0, 'JAR-PEN-SET', 'Standard premium office pens', 1, '2026-03-15'),
      ('spec-17', 'مكتبة جرير (Jarir Bookstore)', 'دفتر ملاحظات (A4 Notebook 5-pack)', 'Office Supplies', 65.00, 5.0, 'JAR-NB-A4', 'Executive writing notebooks', 1, '2026-03-15'),
      ('spec-18', 'مكتبة جرير (Jarir Bookstore)', 'دباسة ومسامير (Stapler & Staples)', 'Office Supplies', 30.00, 5.0, 'JAR-STP-SET', 'Heavy duty desktop stapler and staples', 1, '2026-03-15'),
      ('spec-19', 'إكسترا (eXtra Electronics)', 'طابعة ليزر متعددة الوظائف اتش بي (HP LaserJet Pro MFP)', 'Office Equipment', 980.00, 5.0, 'EXT-HP-MFP', 'Bilingual commercial laser printer', 1, '2026-03-20');
  `);

  // Seed Historical Transactions
  db.run(`
    INSERT INTO transactions (id, transaction_date, merchant, category, amount, status, department, employee_name, card_last_four, receipt_id) VALUES
      ('tx-1001', '2026-10-24', 'Staples Advantage', 'Office Supplies', 119.98, 'SETTLED', 'Engineering & Product', 'Jordan Vance', '4821', 'REC-9012'),
      ('tx-1002', '2026-10-23', 'Best Buy', 'Displays', 279.99, 'SETTLED', 'Engineering & Product', 'Jordan Vance', '4821', 'REC-8874'),
      ('tx-1003', '2026-10-22', 'Amazon Business', 'Office Supplies', 45.00, 'SETTLED', 'Global Marketing', 'Maya Lin', '9104', 'REC-7421'),
      ('tx-1004', '2026-10-21', 'Home Depot', 'Facilities & Tools', 161.50, 'SETTLED', 'Operations & Logistics', 'Carlos Ruiz', '3312', 'REC-6590'),
      ('tx-1005', '2026-10-20', 'Staples Advantage', 'Peripherals', 65.00, 'SETTLED', 'Global Marketing', 'Maya Lin', '9104', 'REC-5412'),
      ('tx-1006', '2026-10-18', 'Apple Store', 'Cables & Power', 49.00, 'SETTLED', 'Engineering & Product', 'Jordan Vance', '4821', 'REC-4390'),
      ('tx-1007', '2026-10-15', 'Best Buy', 'Electronics', 59.99, 'SETTLED', 'IT & Infrastructure', 'Amina Yusuf', '7750', 'REC-3912'),
      ('tx-1008', '2026-10-12', 'Amazon Business', 'Networking', 85.50, 'SETTLED', 'IT & Infrastructure', 'Amina Yusuf', '7750', 'REC-2901'),
      ('tx-1009', '2026-10-10', 'Staples Advantage', 'Office Furniture', 199.99, 'SETTLED', 'Operations & Logistics', 'Carlos Ruiz', '3312', 'REC-1982'),
      ('tx-1010', '2026-10-08', 'Home Depot', 'Facilities & Tools', 42.00, 'SETTLED', 'Operations & Logistics', 'Carlos Ruiz', '3312', 'REC-1049');
  `);

  // Seed Historical Receipt Audits
  db.run(`
    INSERT INTO receipt_audits (id, receipt_number, store_name, scan_date, total_amount, compliance_status, items_count, unauthorized_count, price_violations_count, card_unlocked, employee_name, card_last_four, unlock_token, notes) VALUES
      ('audit-01', 'REC-9012', 'Staples Advantage', '2026-10-24 14:22:00', 119.98, 'APPROVED', 2, 0, 0, 1, 'Jordan Vance', '4821', 'AUTH-89F12-X', 'Clean verification: Keyboard & Paper ream within caps'),
      ('audit-02', 'REC-8874', 'Best Buy', '2026-10-23 11:15:00', 279.99, 'APPROVED', 1, 0, 0, 1, 'Jordan Vance', '4821', 'AUTH-44B91-K', 'Dell 4K monitor verified under $289.99 cap'),
      ('audit-03', 'REC-6590', 'Home Depot', '2026-10-21 16:40:00', 161.50, 'APPROVED', 2, 0, 0, 1, 'Carlos Ruiz', '3312', 'AUTH-12C09-M', 'Tool kit and 50ft extension cord authorized'),
      ('audit-04', 'REC-0988', 'Best Buy', '2026-10-19 18:05:00', 499.99, 'REJECTED', 1, 1, 0, 0, 'Jordan Vance', '4821', NULL, 'Violated: PlayStation 5 console not on approved spec list');
  `);
}

export function executeSqlQuery(sql: string): { columns: string[]; rows: any[][]; row_count: number } {
  if (!dbInstance) {
    throw new Error('Database not initialized');
  }

  const results = dbInstance.exec(sql);
  if (!results || results.length === 0) {
    return { columns: [], rows: [], row_count: 0 };
  }

  const firstResult = results[0];
  return {
    columns: firstResult.columns,
    rows: firstResult.values,
    row_count: firstResult.values.length,
  };
}

export function getAllProductSpecs(): ProductSpecification[] {
  const result = executeSqlQuery(
    'SELECT id, store, item_name, category, max_unit_price, allowed_tolerance_pct, sku_or_code, notes, is_active, created_at FROM product_specifications ORDER BY store ASC, item_name ASC'
  );
  return result.rows.map(row => ({
    id: String(row[0]),
    store: String(row[1]),
    item_name: String(row[2]),
    category: String(row[3]),
    max_unit_price: Number(row[4]),
    allowed_tolerance_pct: Number(row[5]),
    sku_or_code: row[6] ? String(row[6]) : undefined,
    notes: row[7] ? String(row[7]) : undefined,
    is_active: Boolean(row[8]),
    created_at: String(row[9]),
  }));
}

export function insertProductSpec(spec: Omit<ProductSpecification, 'id' | 'created_at'>): ProductSpecification {
  if (!dbInstance) throw new Error('Database not initialized');
  const id = `spec-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;
  const now = new Date().toISOString().split('T')[0];

  dbInstance.run(
    `INSERT INTO product_specifications (id, store, item_name, category, max_unit_price, allowed_tolerance_pct, sku_or_code, notes, is_active, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      spec.store,
      spec.item_name,
      spec.category,
      spec.max_unit_price,
      spec.allowed_tolerance_pct,
      spec.sku_or_code || null,
      spec.notes || null,
      spec.is_active ? 1 : 0,
      now,
    ]
  );

  return {
    ...spec,
    id,
    created_at: now,
  };
}

export function deleteProductSpec(id: string): boolean {
  if (!dbInstance) throw new Error('Database not initialized');
  dbInstance.run('DELETE FROM product_specifications WHERE id = ?', [id]);
  return true;
}

export function getCorporateCard(cardId = 'card-4821'): EmployeeDebitCard | null {
  const result = executeSqlQuery(
    `SELECT card_id, employee_id, employee_name, department, card_last_four, card_brand, status, locked_reason, current_authorized_limit, daily_budget, monthly_budget, spent_this_month, virtual_token, expires_at
     FROM corporate_cards WHERE card_id = '${cardId}'`
  );
  if (!result.rows || result.rows.length === 0) return null;
  const row = result.rows[0];
  return {
    card_id: String(row[0]),
    employee_id: String(row[1]),
    employee_name: String(row[2]),
    department: String(row[3]),
    card_last_four: String(row[4]),
    card_brand: row[5] as any,
    status: row[6] as any,
    locked_reason: String(row[7]),
    current_authorized_limit: Number(row[8]),
    daily_budget: Number(row[9]),
    monthly_budget: Number(row[10]),
    spent_this_month: Number(row[11]),
    virtual_token: row[12] ? String(row[12]) : undefined,
    expires_at: row[13] ? String(row[13]) : undefined,
  };
}

export function updateCardStatus(
  cardId: string,
  status: 'LOCKED' | 'UNLOCKED',
  authorizedAmount: number,
  token?: string,
  expiresAt?: string,
  reason?: string
) {
  if (!dbInstance) throw new Error('Database not initialized');
  const lockedReason = reason || (status === 'UNLOCKED' ? 'Active 15-minute authorization' : 'Card locked by security gatekeeper');
  dbInstance.run(
    `UPDATE corporate_cards
     SET status = ?, current_authorized_limit = ?, virtual_token = ?, expires_at = ?, locked_reason = ?
     WHERE card_id = ?`,
    [status, authorizedAmount, token || null, expiresAt || null, lockedReason, cardId]
  );
}

export function recordAuditAndTransaction(audit: {
  receiptNumber: string;
  storeName: string;
  totalAmount: number;
  complianceStatus: 'APPROVED' | 'REJECTED' | 'OVERRIDDEN';
  itemsCount: number;
  unauthorizedCount: number;
  priceViolationsCount: number;
  cardUnlocked: boolean;
  employeeName: string;
  cardLastFour: string;
  unlockToken?: string;
  notes: string;
}) {
  if (!dbInstance) throw new Error('Database not initialized');
  const auditId = `audit-${Date.now().toString(36)}`;
  const now = new Date().toISOString().replace('T', ' ').substring(0, 19);

  dbInstance.run(
    `INSERT INTO receipt_audits (id, receipt_number, store_name, scan_date, total_amount, compliance_status, items_count, unauthorized_count, price_violations_count, card_unlocked, employee_name, card_last_four, unlock_token, notes)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      auditId,
      audit.receiptNumber,
      audit.storeName,
      now,
      audit.totalAmount,
      audit.complianceStatus,
      audit.itemsCount,
      audit.unauthorizedCount,
      audit.priceViolationsCount,
      audit.cardUnlocked ? 1 : 0,
      audit.employeeName,
      audit.cardLastFour,
      audit.unlockToken || null,
      audit.notes,
    ]
  );

  // If approved and unlocked, create a pending/approved transaction entry
  if (audit.cardUnlocked) {
    const txId = `tx-${Date.now().toString(36)}`;
    const today = now.substring(0, 10);
    dbInstance.run(
      `INSERT INTO transactions (id, transaction_date, merchant, category, amount, status, department, employee_name, card_last_four, receipt_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        txId,
        today,
        audit.storeName,
        'Approved Corporate Spend',
        audit.totalAmount,
        'AUTHORIZED',
        'Engineering & Product',
        audit.employeeName,
        audit.cardLastFour,
        audit.receiptNumber,
      ]
    );

    // Update spent_this_month
    dbInstance.run(
      `UPDATE corporate_cards
       SET spent_this_month = spent_this_month + ?
       WHERE card_last_four = ?`,
      [audit.totalAmount, audit.cardLastFour]
    );
  }
}

export function getAuditHistory(): AuditRecord[] {
  const result = executeSqlQuery(
    `SELECT id, scan_date, employee_name, store_name, total_amount, compliance_status, (unauthorized_count + price_violations_count) as violations, card_last_four, unlock_token, receipt_number
     FROM receipt_audits
     ORDER BY scan_date DESC LIMIT 25`
  );
  return result.rows.map(row => ({
    id: String(row[0]),
    timestamp: String(row[1]),
    employee_name: String(row[2]),
    store_name: String(row[3]),
    total_amount: Number(row[4]),
    status: row[5] as any,
    violations_count: Number(row[6]),
    card_last_four: String(row[7]),
    unlock_token: row[8] ? String(row[8]) : undefined,
    receipt_number: String(row[9]),
  }));
}

export function getSchemaSummary() {
  const tables = ['departments', 'employees', 'corporate_cards', 'product_specifications', 'transactions', 'receipt_audits'];
  const summary: Array<{ tableName: string; rowCount: number; columns: Array<{ name: string; type: string }> }> = [];

  for (const t of tables) {
    const countRes = executeSqlQuery(`SELECT COUNT(*) FROM ${t}`);
    const rowCount = countRes.rows.length > 0 ? Number(countRes.rows[0][0]) : 0;
    const infoRes = executeSqlQuery(`PRAGMA table_info(${t})`);
    const columns = infoRes.rows.map(r => ({ name: String(r[1]), type: String(r[2]) }));
    summary.push({ tableName: t, rowCount, columns });
  }

  return summary;
}
