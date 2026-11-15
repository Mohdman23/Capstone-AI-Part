import {
  CrossReferenceResult,
  EmployeeDebitCard,
  ItemVerificationResult,
  ParsedReceipt,
  ProductSpecification,
} from './types';

/**
 * Normalizes text for lenient keyword matching, supporting both Latin and Arabic scripts.
 * Strips Arabic tashkeel (diacritics), unifies alef forms, hamza, taa marbuta, and digits.
 */
export function normalizeText(str: string): string {
  if (!str) return '';
  
  // Convert Eastern Arabic numerals (٠-٩) to standard digits
  const easternDigits = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
  let norm = str;
  easternDigits.forEach((digit, idx) => {
    norm = norm.split(digit).join(String(idx));
  });

  return norm
    .toLowerCase()
    // Strip Arabic diacritics (tashkeel/harakat: fathah, dammah, kasrah, sukun, shaddah, tanween)
    .replace(/[\u064B-\u065F\u0670]/g, '')
    // Normalize Alef variations (أ, إ, آ, ٱ -> ا)
    .replace(/[أإآٱ]/g, 'ا')
    // Normalize Taa Marbuta & Haa (ة -> ه)
    .replace(/ة/g, 'ه')
    // Normalize Ya / Alef Maksura (ى -> ي)
    .replace(/ى/g, 'ي')
    // Remove non-alphanumeric except spaces (keep Arabic unicode range \u0600-\u06FF)
    .replace(/[^\w\s\u0600-\u06FF]/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Determines whether a store name matches an approved store specification (bilingual aware)
 */
export function matchesStore(receiptStore: string, specStore: string): boolean {
  const normReceipt = normalizeText(receiptStore);
  const normSpec = normalizeText(specStore);
  if (!normReceipt || !normSpec) return false;

  // Direct containment
  if (normReceipt.includes(normSpec) || normSpec.includes(normReceipt)) return true;

  // Known bilingual aliases (Arabic <-> English)
  const bilingualAliases: Array<[string, string]> = [
    ['جرير', 'jarir'],
    ['مكتبه جرير', 'jarir bookstore'],
    ['اكسترا', 'extra'],
    ['لولو', 'lulu'],
    ['كارفور', 'carrefour'],
    ['امازون', 'amazon'],
    ['ابل', 'apple'],
  ];

  for (const [ar, en] of bilingualAliases) {
    const normAr = normalizeText(ar);
    const normEn = normalizeText(en);
    if (
      (normReceipt.includes(normAr) || normReceipt.includes(normEn)) &&
      (normSpec.includes(normAr) || normSpec.includes(normEn))
    ) {
      return true;
    }
  }

  return levenshteinSimilarity(normReceipt, normSpec) > 0.55;
}

/**
 * Simple similarity metric between two strings (0 to 1)
 */
export function levenshteinSimilarity(s1: string, s2: string): number {
  if (s1 === s2) return 1.0;
  if (!s1 || !s2) return 0.0;
  
  // Word overlap check for multi-word item descriptions
  const words1 = new Set(s1.split(' ').filter(w => w.length > 2));
  const words2 = new Set(s2.split(' ').filter(w => w.length > 2));
  let common = 0;
  for (const w of words1) {
    if (words2.has(w)) common++;
  }
  const overlap = (2 * common) / (words1.size + words2.size || 1);
  return overlap;
}

/**
 * Finds the best matching ProductSpecification for a receipt line item within a store
 */
export function findMatchingSpec(
  receiptItemName: string,
  storeSpecs: ProductSpecification[]
): { spec: ProductSpecification | null; score: number } {
  const normReceipt = normalizeText(receiptItemName);
  let bestMatch: ProductSpecification | null = null;
  let highestScore = 0;

  for (const spec of storeSpecs) {
    if (!spec.is_active) continue;
    const normSpec = normalizeText(spec.item_name);

    // Direct containment
    if (normReceipt.includes(normSpec) || normSpec.includes(normReceipt)) {
      const score = 0.85 + (Math.min(normReceipt.length, normSpec.length) / Math.max(normReceipt.length, normSpec.length)) * 0.15;
      if (score > highestScore) {
        highestScore = score;
        bestMatch = spec;
      }
      continue;
    }

    // Keyword overlap similarity
    const score = levenshteinSimilarity(normReceipt, normSpec);
    if (score > 0.4 && score > highestScore) {
      highestScore = score;
      bestMatch = spec;
    }
  }

  return { spec: bestMatch, score: highestScore };
}

/**
 * Cross-references an entire parsed receipt against approved product specifications
 * and card spending rules to determine if the corporate debit card can be safely unlocked.
 */
export function crossReferenceReceipt(
  receipt: ParsedReceipt,
  allSpecs: ProductSpecification[],
  card: EmployeeDebitCard
): CrossReferenceResult {
  const violations: string[] = [];
  const itemResults: ItemVerificationResult[] = [];

  // 1. Check Store Match
  const matchingStoreSpecs = allSpecs.filter(spec =>
    matchesStore(receipt.store_name, spec.store)
  );
  const storeMatched = matchingStoreSpecs.length > 0;

  if (!storeMatched) {
    violations.push(
      `Store "${receipt.store_name}" is not an authorized vendor in the approved specifications catalog.`
    );
  }

  let totalApprovedAmount = 0;
  let compliantCount = 0;
  let unauthorizedCount = 0;
  let priceViolationCount = 0;

  // 2. Validate line items
  for (const item of receipt.items) {
    const { spec } = findMatchingSpec(item.raw_name, matchingStoreSpecs);

    if (!spec) {
      unauthorizedCount++;
      const reason = `Item "${item.raw_name}" is not in the approved product specification catalog for ${receipt.store_name}.`;
      violations.push(reason);
      itemResults.push({
        raw_name: item.raw_name,
        quantity: item.quantity,
        unit_price: item.unit_price,
        total_price: item.total_price,
        status: 'UNAUTHORIZED_ITEM',
        violation_reason: reason,
      });
      continue;
    }

    // Check Price Cap with allowable tolerance
    const toleranceMultiplier = 1 + (spec.allowed_tolerance_pct || 0) / 100;
    const effectiveCap = Number((spec.max_unit_price * toleranceMultiplier).toFixed(2));

    if (item.unit_price > effectiveCap) {
      priceViolationCount++;
      const diff = Number((item.unit_price - spec.max_unit_price).toFixed(2));
      const reason = `Price $${item.unit_price.toFixed(2)} exceeds approved spec cap of $${spec.max_unit_price.toFixed(2)} (max allowed with ${spec.allowed_tolerance_pct}% tolerance: $${effectiveCap.toFixed(2)}).`;
      violations.push(`[${spec.item_name}] ${reason}`);
      itemResults.push({
        raw_name: item.raw_name,
        quantity: item.quantity,
        unit_price: item.unit_price,
        total_price: item.total_price,
        status: 'PRICE_EXCEEDED',
        matched_spec: spec,
        max_allowed_price: effectiveCap,
        price_difference: diff,
        violation_reason: reason,
      });
    } else {
      compliantCount++;
      totalApprovedAmount += item.total_price;
      itemResults.push({
        raw_name: item.raw_name,
        quantity: item.quantity,
        unit_price: item.unit_price,
        total_price: item.total_price,
        status: 'APPROVED',
        matched_spec: spec,
        max_allowed_price: effectiveCap,
      });
    }
  }

  // 3. Card Limits & Budget Check (Currency-normalized to USD base)
  // Standard corporate FX conversions: SAR ~ 0.267, AED ~ 0.272, EUR ~ 1.08, GBP ~ 1.28
  let normalizedTotalInUsd = receipt.total;
  const curr = (receipt.currency || 'USD').toUpperCase();
  if (curr === 'SAR' || curr === 'ر.س') {
    normalizedTotalInUsd = Number((receipt.total * 0.267).toFixed(2));
  } else if (curr === 'AED' || curr === 'د.إ') {
    normalizedTotalInUsd = Number((receipt.total * 0.272).toFixed(2));
  } else if (curr === 'EUR' || curr === '€') {
    normalizedTotalInUsd = Number((receipt.total * 1.08).toFixed(2));
  } else if (curr === 'GBP' || curr === '£') {
    normalizedTotalInUsd = Number((receipt.total * 1.28).toFixed(2));
  }

  if (normalizedTotalInUsd > card.daily_budget) {
    violations.push(
      `Receipt total of ${receipt.currency || '$'} ${receipt.total.toFixed(2)} (~$${normalizedTotalInUsd.toFixed(2)} USD) exceeds employee daily spending limit of $${card.daily_budget.toFixed(2)} USD.`
    );
  }

  const remainingMonthlyBudget = card.monthly_budget - card.spent_this_month;
  if (normalizedTotalInUsd > remainingMonthlyBudget) {
    violations.push(
      `Receipt total of ${receipt.currency || '$'} ${receipt.total.toFixed(2)} (~$${normalizedTotalInUsd.toFixed(2)} USD) exceeds remaining monthly budget of $${remainingMonthlyBudget.toFixed(2)} USD.`
    );
  }

  const isApproved =
    storeMatched &&
    unauthorizedCount === 0 &&
    priceViolationCount === 0 &&
    violations.length === 0 &&
    receipt.items.length > 0;

  // Calculate confidence score (0 - 100)
  let confidenceScore = 100;
  if (!storeMatched) confidenceScore -= 40;
  confidenceScore -= unauthorizedCount * 25;
  confidenceScore -= priceViolationCount * 15;
  if (confidenceScore < 0) confidenceScore = 0;

  // Generate dynamic 15-minute unlock token if approved
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 15 * 60 * 1000).toISOString();
  const unlockToken = isApproved
    ? `AUTH-${Math.random().toString(36).substring(2, 8).toUpperCase()}-${Date.now().toString(36).toUpperCase()}`
    : undefined;

  return {
    is_approved: isApproved,
    status: isApproved
      ? 'APPROVED'
      : priceViolationCount > 0 && unauthorizedCount === 0
      ? 'WARNING_OVERRIDE_NEEDED'
      : 'REJECTED',
    confidence_score: confidenceScore,
    store_matched: storeMatched,
    store_detected: receipt.store_name,
    total_items_count: receipt.items.length,
    compliant_items_count: compliantCount,
    unauthorized_items_count: unauthorizedCount,
    price_violation_count: priceViolationCount,
    total_receipt_amount: receipt.total,
    total_approved_amount: Number(totalApprovedAmount.toFixed(2)),
    violations,
    items: itemResults,
    card_unlock_granted: isApproved,
    authorized_amount: isApproved ? receipt.total : 0,
    unlock_token: unlockToken,
    unlock_expires_at: isApproved ? expiresAt : undefined,
  };
}
