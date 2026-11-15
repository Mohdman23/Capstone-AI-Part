import test from 'node:test';
import assert from 'node:assert/strict';
import {
  matchesStore,
  findMatchingSpec,
  crossReferenceReceipt,
} from './verificationEngine';
import {
  ProductSpecification,
  ParsedReceipt,
  EmployeeDebitCard,
} from './types';

const mockSpecs: ProductSpecification[] = [
  {
    id: 'spec-1',
    store: 'Staples',
    item_name: 'Ergonomic Mesh Office Chair',
    category: 'Furniture',
    max_unit_price: 199.99,
    allowed_tolerance_pct: 5,
    is_active: true,
    created_at: '2026-01-01',
  },
  {
    id: 'spec-2',
    store: 'Staples',
    item_name: 'Wireless Ergonomic Keyboard & Mouse Combo',
    category: 'Peripherals',
    max_unit_price: 65.0,
    allowed_tolerance_pct: 0,
    is_active: true,
    created_at: '2026-01-01',
  },
  {
    id: 'spec-3',
    store: 'Best Buy',
    item_name: 'Dell 27-inch 4K UHD Monitor',
    category: 'Displays',
    max_unit_price: 280.0,
    allowed_tolerance_pct: 5,
    is_active: true,
    created_at: '2026-01-01',
  },
];

const mockCard: EmployeeDebitCard = {
  card_id: 'card-001',
  employee_id: 'emp-104',
  employee_name: 'Jordan Vance',
  department: 'Engineering',
  card_last_four: '4821',
  card_brand: 'Visa Commercial',
  status: 'LOCKED',
  locked_reason: 'Awaiting verified receipt & AI pre-authorization',
  current_authorized_limit: 0,
  daily_budget: 600.0,
  monthly_budget: 3500.0,
  spent_this_month: 800.0,
};

test('matchesStore identifies identical and partial store names', () => {
  assert.equal(matchesStore('Staples', 'Staples'), true);
  assert.equal(matchesStore('Staples Advantage #401', 'Staples'), true);
  assert.equal(matchesStore('Best Buy Store #1409', 'Best Buy'), true);
  assert.equal(matchesStore('Target Supercenter', 'Staples'), false);
});

test('findMatchingSpec finds correct specification for receipt item', () => {
  const staplesSpecs = mockSpecs.filter(s => s.store === 'Staples');
  const match = findMatchingSpec('Staples Ergonomic Mesh Chair - Black', staplesSpecs);
  assert.ok(match.spec);
  assert.equal(match.spec?.id, 'spec-1');
});

test('crossReferenceReceipt approves valid receipt and unlocks card', () => {
  const validReceipt: ParsedReceipt = {
    store_name: 'Staples Advantage',
    receipt_number: 'REC-9941',
    date: '2026-10-27',
    items: [
      {
        raw_name: 'Ergonomic Mesh Office Chair',
        quantity: 1,
        unit_price: 189.99,
        total_price: 189.99,
      },
      {
        raw_name: 'Wireless Ergonomic Keyboard & Mouse',
        quantity: 1,
        unit_price: 64.99,
        total_price: 64.99,
      },
    ],
    subtotal: 254.98,
    tax: 20.40,
    total: 275.38,
  };

  const result = crossReferenceReceipt(validReceipt, mockSpecs, mockCard);
  assert.equal(result.is_approved, true);
  assert.equal(result.card_unlock_granted, true);
  assert.equal(result.authorized_amount, 275.38);
  assert.ok(result.unlock_token);
  assert.equal(result.violations.length, 0);
  assert.equal(result.compliant_items_count, 2);
  assert.equal(result.unauthorized_items_count, 0);
});

test('crossReferenceReceipt rejects receipt with unauthorized items', () => {
  const fraudReceipt: ParsedReceipt = {
    store_name: 'Best Buy Store #122',
    receipt_number: 'REC-8821',
    date: '2026-10-27',
    items: [
      {
        raw_name: 'Dell 27-inch 4K UHD Monitor',
        quantity: 1,
        unit_price: 269.99,
        total_price: 269.99,
      },
      {
        raw_name: 'Nintendo Switch OLED Gaming Console',
        quantity: 1,
        unit_price: 349.99,
        total_price: 349.99,
      },
    ],
    subtotal: 619.98,
    tax: 49.60,
    total: 669.58,
  };

  const result = crossReferenceReceipt(fraudReceipt, mockSpecs, mockCard);
  assert.equal(result.is_approved, false);
  assert.equal(result.card_unlock_granted, false);
  assert.equal(result.unauthorized_items_count, 1);
  assert.ok(result.violations.some(v => v.includes('Nintendo Switch')));
});

test('crossReferenceReceipt flags item exceeding price cap beyond tolerance', () => {
  const overCapReceipt: ParsedReceipt = {
    store_name: 'Staples Store #50',
    receipt_number: 'REC-3312',
    date: '2026-10-27',
    items: [
      {
        raw_name: 'Wireless Ergonomic Keyboard & Mouse Combo',
        quantity: 1,
        unit_price: 89.99, // cap is 65.0 with 0% tolerance
        total_price: 89.99,
      },
    ],
    subtotal: 89.99,
    tax: 7.20,
    total: 97.19,
  };

  const result = crossReferenceReceipt(overCapReceipt, mockSpecs, mockCard);
  assert.equal(result.is_approved, false);
  assert.equal(result.card_unlock_granted, false);
  assert.equal(result.price_violation_count, 1);
  assert.ok(result.violations.some(v => v.includes('exceeds approved spec cap')));
});

test('matchesStore handles Arabic and bilingual store names and aliases', () => {
  assert.equal(matchesStore('مكتبة جرير', 'مكتبة جرير (Jarir Bookstore)'), true);
  assert.equal(matchesStore('شركة جرير للتسويق', 'جرير'), true);
  assert.equal(matchesStore('Jarir Bookstore KSA', 'مكتبة جرير'), true);
  assert.equal(matchesStore('إكسترا للإلكترونيات', 'إكسترا (eXtra Electronics)'), true);
  assert.equal(matchesStore('سوبرماركت التميمي', 'مكتبة جرير'), false);
});

test('crossReferenceReceipt approves valid Arabic/bilingual receipt and unlocks card', () => {
  const arabicSpecs: ProductSpecification[] = [
    {
      id: 'spec-jarir-mon',
      store: 'مكتبة جرير (Jarir Bookstore)',
      item_name: 'شاشة سامسونج 27 بوصة بدقة 4K (Samsung 27" 4K Monitor)',
      category: 'Displays',
      max_unit_price: 1250.00,
      allowed_tolerance_pct: 5,
      is_active: true,
      created_at: '2026-03-15',
    },
  ];

  const arabicReceipt: ParsedReceipt = {
    store_name: 'مكتبة جرير',
    receipt_number: 'FAT-JAR-2026-904',
    date: '2026-11-10',
    currency: 'SAR',
    detected_language: 'ar',
    items: [
      {
        raw_name: 'شاشة سامسونج 27 بوصة بدقة 4K',
        quantity: 1,
        unit_price: 1199.00,
        total_price: 1199.00,
      },
    ],
    subtotal: 1199.00,
    tax: 179.85,
    total: 1378.85,
  };

  const highLimitCard: EmployeeDebitCard = {
    ...mockCard,
    daily_budget: 2000.0,
    monthly_budget: 15000.0,
  };

  const result = crossReferenceReceipt(arabicReceipt, arabicSpecs, highLimitCard);
  assert.equal(result.is_approved, true);
  assert.equal(result.card_unlock_granted, true);
  assert.equal(result.compliant_items_count, 1);
  assert.equal(result.unauthorized_items_count, 0);
  assert.ok(result.unlock_token);
});
