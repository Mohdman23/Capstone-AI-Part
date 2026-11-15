# FinGuard AI — Financial SQL Intelligence & Receipt Card Gatekeeper

Full-stack corporate spend control platform combining:

1. **Natural Language Financial SQL Explorer**: Converts natural language finance questions into validated read-only SQLite queries (`SELECT` / `WITH` only), executes them against the financial ledger, and renders executive summaries, key insights, charts, and raw SQL results.
2. **Admin Product Specification Catalog**: Manage approved stores, SKU/product items, category caps, and allowable price tolerances (supporting both English and Arabic item/store names).
3. **Multilingual Receipt OCR & Gatekeeper**: Supports 2-step open-source OCR (`Tesseract CLI ara+eng` or `EasyOCR PyTorch`) followed by Gemini LLM semantic structuring—plus direct `Gemini Vision` multimodal fallback—to cross-reference scanned English/Arabic receipts against admin specifications before unlocking the employee corporate debit card.
4. **Audit Trail**: Logs every verification attempt, matched/violated items, authorization tokens, and card lock/unlock events.

## Tech Stack

- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS, Lucide Icons
- **Backend**: Express (`server.ts`), SQLite (`sql.js`), `@google/genai` (`gemini-2.5-flash`)
- **OCR Engines**:
  - Tesseract OCR CLI (`tesseract-ocr`, `tesseract-ocr-ara`, `tesseract-ocr-eng`)
  - EasyOCR (`easyocr` Python package, `['ar', 'en']`)
  - Gemini Multimodal Vision (`gemini-2.5-flash`)

## Setup

### 1. Environment Variables

Copy `.env.example` to `.env` and set your Gemini API key:

```bash
cp .env.example .env
```

```env
GEMINI_API_KEY="your_gemini_api_key"
APP_URL="http://localhost:3000"
```

### 2. Install Dependencies

Node dependencies:

```bash
npm install
```

System & Python OCR dependencies (optional if only using Gemini Vision):

```bash
# Ubuntu/Debian
sudo apt-get update && sudo apt-get install -y tesseract-ocr tesseract-ocr-ara tesseract-ocr-eng python3-pip
pip3 install easyocr pytesseract pillow
```

### 3. Run Development Server

```bash
npm run dev
```

The app runs on `http://localhost:3000`.

### 4. Tests & Build

```bash
npx tsx --test src/lib/verificationEngine.test.ts src/lib/sqlValidator.test.ts
npm run lint
npm run build
```

## API Endpoints (For Integration With Other Apps)

- `POST /api/financial-query` — `{ prompt: string }` → Generates validated read-only SQL and returns rows, columns, explanation, insights, and chart suggestion.
- `POST /api/scan-receipt` — `{ imageBase64?, imageMimeType?, rawText?, presetReceipt?, ocrEngine?: 'tesseract' | 'easyocr' | 'gemini_vision', cardId? }` → Extracts receipt items, cross-references specs, and locks/unlocks card.
- `GET /api/product-specs` / `POST /api/product-specs` / `DELETE /api/product-specs/:id` — Manage approved product specifications.
- `GET /api/corporate-card` / `POST /api/corporate-card/lock` / `POST /api/corporate-card/override` — Manage corporate debit card lock state.
- `GET /api/audit-history` — Retrieve verification and card authorization logs.
- `GET /api/schema-summary` / `POST /api/run-sql` — Inspect database schema and run SQL queries.
