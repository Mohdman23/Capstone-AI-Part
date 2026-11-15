/**
 * Core type definitions for FinGuard AI
 */

export interface ProductSpecification {
  id: string;
  store: string;
  item_name: string;
  category: string;
  max_unit_price: number;
  allowed_tolerance_pct: number; // e.g. 5 means up to 5% variance allowed
  sku_or_code?: string;
  notes?: string;
  is_active: boolean;
  created_at: string;
}

export interface ReceiptItem {
  raw_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

export interface ParsedReceipt {
  store_name: string;
  store_address?: string;
  receipt_number: string;
  date: string;
  currency?: string;
  detected_language?: string;
  items: ReceiptItem[];
  subtotal: number;
  tax: number;
  total: number;
  payment_method_detected?: string;
  raw_text?: string;
}

export type ItemStatus = 'APPROVED' | 'PRICE_EXCEEDED' | 'UNAUTHORIZED_ITEM' | 'STORE_MISMATCH';

export interface ItemVerificationResult {
  raw_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  status: ItemStatus;
  matched_spec?: ProductSpecification;
  max_allowed_price?: number;
  price_difference?: number;
  violation_reason?: string;
}

export interface CrossReferenceResult {
  is_approved: boolean;
  status: 'APPROVED' | 'REJECTED' | 'WARNING_OVERRIDE_NEEDED';
  confidence_score: number;
  store_matched: boolean;
  store_detected: string;
  total_items_count: number;
  compliant_items_count: number;
  unauthorized_items_count: number;
  price_violation_count: number;
  total_receipt_amount: number;
  total_approved_amount: number;
  violations: string[];
  items: ItemVerificationResult[];
  card_unlock_granted: boolean;
  authorized_amount: number;
  unlock_token?: string;
  unlock_expires_at?: string;
  ocr_engine_used?: 'tesseract' | 'easyocr' | 'gemini_vision' | string;
  raw_ocr_transcript?: string;
}

export interface EmployeeDebitCard {
  card_id: string;
  employee_id: string;
  employee_name: string;
  department: string;
  card_last_four: string;
  card_brand: 'Visa Commercial' | 'Mastercard Corporate';
  status: 'LOCKED' | 'UNLOCKED' | 'PENDING_APPROVAL';
  locked_reason: string;
  current_authorized_limit: number;
  unlocked_at?: string;
  expires_at?: string;
  daily_budget: number;
  monthly_budget: number;
  spent_this_month: number;
  virtual_token?: string;
}

export interface FinancialQueryResponse {
  query: string;
  sql: string;
  explanation: string;
  key_insights: string[];
  columns: string[];
  rows: (string | number | null)[][];
  row_count: number;
  execution_time_ms: number;
  chart_suggestion?: {
    type: 'bar' | 'line' | 'pie' | 'metric';
    xAxis?: string;
    yAxis?: string;
    title?: string;
  };
}

export interface AuditRecord {
  id: string;
  timestamp: string;
  employee_name: string;
  store_name: string;
  total_amount: number;
  status: 'APPROVED' | 'REJECTED' | 'MANUAL_OVERRIDE';
  violations_count: number;
  card_last_four: string;
  unlock_token?: string;
  receipt_number: string;
}
