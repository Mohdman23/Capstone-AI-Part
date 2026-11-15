import React, { useState, useRef } from 'react';
import {
  Scan,
  Upload,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ShieldCheck,
  ShieldAlert,
  ArrowRight,
  Sparkles,
  FileText,
  DollarSign,
  Lock,
  Unlock,
  Store,
  RefreshCw,
  Camera,
  Cpu,
  Terminal,
} from 'lucide-react';
import { CrossReferenceResult, ParsedReceipt, ProductSpecification } from '../lib/types';

interface ReceiptScannerProps {
  onVerificationComplete: (result: CrossReferenceResult & { parsedReceipt: ParsedReceipt }) => void;
  specs: ProductSpecification[];
}

const PRESET_RECEIPTS: Array<{
  id: string;
  title: string;
  badge: string;
  badgeColor: string;
  description: string;
  receipt: ParsedReceipt;
}> = [
  {
    id: 'arabic-jarir-compliant',
    title: 'مكتبة جرير - Jarir Bookstore (Arabic/Bilingual Compliant)',
    badge: 'Arabic فاتورة ضريبية',
    badgeColor: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
    description: 'فاتورة ضريبية مبسطة (ZATCA compliant) لشاشة سامسونج وماوس لوجيتك ضمن المواصفات المعتمدة.',
    receipt: {
      store_name: 'مكتبة جرير (Jarir Bookstore)',
      store_address: 'فرع طريق الملك فهد، الرياض، المملكة العربية السعودية',
      receipt_number: 'FAT-JAR-2026-904',
      date: '2026-11-10',
      currency: 'SAR',
      detected_language: 'ar-en',
      items: [
        {
          raw_name: 'شاشة سامسونج 27 بوصة بدقة 4K (Samsung 27" 4K Monitor)',
          quantity: 1,
          unit_price: 1199.00,
          total_price: 1199.00,
        },
        {
          raw_name: 'لوحة مفاتيح وماوس لاسلكي لوجيتك (Logitech Wireless Combo)',
          quantity: 1,
          unit_price: 249.00,
          total_price: 249.00,
        },
      ],
      subtotal: 1448.00,
      tax: 217.20,
      total: 1665.20,
      payment_method_detected: 'بطاقة مدى / Corporate Debit Card',
      raw_text: `شركة مكتبة جرير - Jarir Marketing Co.
الرقم الضريبي: 300000000000003 (VAT Reg #)
فاتورة ضريبية مبسطة / Simplified Tax Invoice
التاريخ: 10/11/2026
رقم الفاتورة: FAT-JAR-2026-904
------------------------------------------------
1x شاشة سامسونج 27 بوصة بدقة 4K          1,199.00 ر.س
1x لوحة مفاتيح وماوس لاسلكي لوجيتك          249.00 ر.س
------------------------------------------------
المجموع الفرعي (Subtotal):               1,448.00 ر.س
ضريبة القيمة المضافة 15% (VAT 15%):        217.20 ر.س
المجموع الكلي (Total):                   1,665.20 ر.س
طريقة الدفع: بطاقة خصم مباشر (Debit Card)`,
    },
  },
  {
    id: 'arabic-extra-fraud',
    title: 'إكسترا - eXtra Electronics (Arabic Unauthorized)',
    badge: 'Arabic مخالفة سياسة',
    badgeColor: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
    description: 'فاتورة تتضمن جهاز بلايستيشن 5 غير مصرح به بجانب طابعة ليزر.',
    receipt: {
      store_name: 'إكسترا (eXtra Electronics)',
      store_address: 'شارع التحلية، جدة',
      receipt_number: 'EXT-INV-8831',
      date: '2026-11-10',
      currency: 'SAR',
      detected_language: 'ar',
      items: [
        {
          raw_name: 'طابعة ليزر متعددة الوظائف اتش بي (HP LaserJet Pro MFP)',
          quantity: 1,
          unit_price: 950.00,
          total_price: 950.00,
        },
        {
          raw_name: 'جهاز سوني بلايستيشن 5 مع يد تحكم (Sony PlayStation 5 Console)',
          quantity: 1,
          unit_price: 2299.00,
          total_price: 2299.00,
        },
      ],
      subtotal: 3249.00,
      tax: 487.35,
      total: 3736.35,
      payment_method_detected: 'Corporate Debit Card',
      raw_text: `الشركة المتحدة للإلكترونيات (إكسترا - eXtra)
الرقم الضريبي: 300055219900003
فاتورة نقدية رقم: EXT-INV-8831
1x طابعة ليزر متعددة الوظائف اتش بي           950.00 ر.س
1x جهاز سوني بلايستيشن 5 مع يد تحكم        2,299.00 ر.س
المجموع بدون الضريبة:                      3,249.00 ر.س
ضريبة القيمة المضافة:                        487.35 ر.س
الإجمالي المطلوب:                         3,736.35 ر.س`,
    },
  },
  {
    id: 'compliant-staples',
    title: 'Staples Office Supplies (English Compliant)',
    badge: 'Compliant',
    badgeColor: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
    description: 'Ergonomic chair and wireless keyboard combo within approved catalog caps.',
    receipt: {
      store_name: 'Staples Advantage #401',
      receipt_number: 'REC-STP-9481',
      date: '2026-10-27',
      currency: 'USD',
      detected_language: 'en',
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
      payment_method_detected: 'Corporate Debit Card',
      raw_text: `STAPLES ADVANTAGE STORE #401
100 TECH WAY, SILICON VALLEY
1x Ergonomic Mesh Office Chair        $189.99
1x Wireless Ergonomic Keyboard & Mouse $64.99
SUBTOTAL:                             $254.98
TAX (8%):                              $20.40
TOTAL:                                $275.38
PAYMENT: Corporate Debit Card ending 4821`,
    },
  },
  {
    id: 'fraud-bestbuy',
    title: 'Best Buy (Unauthorized Item Slipping)',
    badge: 'Fraud Violation',
    badgeColor: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
    description: 'Includes an unauthorized personal gaming console hidden under office equipment.',
    receipt: {
      store_name: 'Best Buy Store #1409',
      receipt_number: 'REC-BB-2281',
      date: '2026-10-27',
      currency: 'USD',
      detected_language: 'en',
      items: [
        {
          raw_name: 'Dell 27-inch 4K UHD IPS Monitor',
          quantity: 1,
          unit_price: 279.99,
          total_price: 279.99,
        },
        {
          raw_name: 'Nintendo Switch OLED Gaming Console',
          quantity: 1,
          unit_price: 349.99,
          total_price: 349.99,
        },
      ],
      subtotal: 629.98,
      tax: 50.40,
      total: 680.38,
      payment_method_detected: 'Corporate Debit Card',
      raw_text: `BEST BUY #1409
1x Dell 27-inch 4K UHD IPS Monitor    $279.99
1x Nintendo Switch OLED Gaming Console $349.99
SUBTOTAL:                             $629.98
TAX:                                   $50.40
TOTAL:                                $680.38`,
    },
  },
  {
    id: 'food-restaurant-unauthorized',
    title: 'مطعم ومقهى السفير - Al Safeer Restaurant (Food Receipt)',
    badge: 'Food / Unauthorized Store',
    badgeColor: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
    description: 'فاتورة وجبة طعام ومشروبات من مطعم. غير متوافقة تماماً مع مواصفات أجهزة ومستلزمات الشركة.',
    receipt: {
      store_name: 'مطعم ومقهى السفير للمأكولات (Al Safeer Restaurant)',
      store_address: 'شارع الأمير سلطان، الرياض',
      receipt_number: 'REST-FOOD-4091',
      date: '2026-11-10',
      currency: 'SAR',
      detected_language: 'ar',
      items: [
        {
          raw_name: 'وجبة غداء مشاوي مشكل (Mixed Grill Platter)',
          quantity: 2,
          unit_price: 65.00,
          total_price: 130.00,
        },
        {
          raw_name: 'عصير برتقال طازج (Fresh Orange Juice)',
          quantity: 2,
          unit_price: 18.00,
          total_price: 36.00,
        },
        {
          raw_name: 'صحن مقبلات حمص ومتبل (Hummus & Appetizers)',
          quantity: 1,
          unit_price: 24.00,
          total_price: 24.00,
        },
      ],
      subtotal: 190.00,
      tax: 28.50,
      total: 218.50,
      payment_method_detected: 'Corporate Debit Card',
      raw_text: `مطعم ومقهى السفير للمأكولات - Al Safeer Restaurant
الرقم الضريبي: 300994112000003
فاتورة طاولة رقم: 14 - كاشير 2
2x وجبة غداء مشاوي مشكل             130.00 ر.س
2x عصير برتقال طازج                 36.00 ر.س
1x صحن مقبلات حمص ومتبل             24.00 ر.س
------------------------------------------------
المجموع الخاضع للضريبة:             190.00 ر.س
ضريبة القيمة المضافة 15%:            28.50 ر.س
الإجمالي النهائي:                   218.50 ر.س
حالة الدفع: بطاقة مدى بنكية`,
    },
  },
  {
    id: 'overprice-homedepot',
    title: 'Home Depot (Unit Price Over Allowed Cap)',
    badge: 'Price Overrun',
    badgeColor: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
    description: 'Industrial tool kit priced at $149.99 exceeds the approved spec threshold ($119.50).',
    receipt: {
      store_name: 'Home Depot #0921',
      receipt_number: 'REC-HD-5532',
      date: '2026-10-27',
      currency: 'USD',
      detected_language: 'en',
      items: [
        {
          raw_name: 'Industrial Heavy-Duty Tool Kit 75-Piece',
          quantity: 1,
          unit_price: 149.99,
          total_price: 149.99,
        },
        {
          raw_name: 'Commercial Grade Outdoor Extension Cord 50ft',
          quantity: 1,
          unit_price: 39.99,
          total_price: 39.99,
        },
      ],
      subtotal: 189.98,
      tax: 15.20,
      total: 205.18,
      payment_method_detected: 'Corporate Debit Card',
    },
  },
];

export const ReceiptScanner: React.FC<ReceiptScannerProps> = ({
  onVerificationComplete,
  specs,
}) => {
  const [activePreset, setActivePreset] = useState<string>('compliant-staples');
  const [customImage, setCustomImage] = useState<string | null>(null);
  const [selectedEngine, setSelectedEngine] = useState<'tesseract' | 'easyocr' | 'gemini_vision'>('tesseract');
  const [analyzing, setAnalyzing] = useState<boolean>(false);
  const [currentStep, setCurrentStep] = useState<string>('');
  const [verificationResult, setVerificationResult] = useState<
    (CrossReferenceResult & { parsedReceipt: ParsedReceipt }) | null
  >(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const selectedPresetObj = PRESET_RECEIPTS.find(p => p.id === activePreset);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setCustomImage(reader.result as string);
      setActivePreset('');
      setVerificationResult(null);
    };
    reader.readAsDataURL(file);
  };

  const runVerification = async () => {
    setAnalyzing(true);
    setError(null);
    setVerificationResult(null);

    try {
      if (selectedEngine === 'tesseract') {
        setCurrentStep('1/4: Running Open Source Tesseract OCR CLI (tesseract-ocr-ara & tesseract-ocr-eng)...');
      } else if (selectedEngine === 'easyocr') {
        setCurrentStep('1/4: Running Open Source EasyOCR (PyTorch Arabic/English neural model)...');
      } else {
        setCurrentStep('1/4: Running Gemini Multimodal Vision direct pixel OCR...');
      }
      await new Promise(r => setTimeout(r, 450));

      setCurrentStep('2/4: Feeding raw OCR transcript into Gemini LLM for structured semantic parsing...');
      await new Promise(r => setTimeout(r, 450));

      setCurrentStep('3/4: Cross-referencing extracted items & price caps against Admin Specifications...');
      await new Promise(r => setTimeout(r, 450));

      setCurrentStep('4/4: Evaluating employee debit card gatekeeper rules and budget caps...');

      let imageMimeType = 'image/jpeg';
      if (customImage && customImage.startsWith('data:')) {
        const match = customImage.match(/^data:(image\/[a-zA-Z0-9-+.]+);base64,/);
        if (match) imageMimeType = match[1];
      }

      const payload = customImage
        ? { imageBase64: customImage, imageMimeType, ocrEngine: selectedEngine, cardId: 'card-4821' }
        : { presetReceipt: selectedPresetObj?.receipt, cardId: 'card-4821', ocrEngine: selectedEngine };

      const res = await fetch('/api/scan-receipt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Verification processing failed.');
      }

      setVerificationResult(data);
      onVerificationComplete(data);
    } catch (err: any) {
      setError(err.message || 'Failed to scan and cross-reference receipt.');
    } finally {
      setAnalyzing(false);
      setCurrentStep('');
    }
  };

  return (
    <div className="space-y-6">
      {/* Introduction Banner */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-6 shadow-xl">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-600/20 text-teal-400 ring-1 ring-teal-500/30">
            <Scan className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white tracking-tight">
              AI Receipt Scanner & Cross-Reference Gatekeeper
            </h2>
            <p className="text-xs text-slate-400">
              Employee scans receipt. AI inspects every line item against Admin Product Specifications and Price Caps before unlocking the corporate debit card.
            </p>
          </div>
        </div>

        {/* Input Selector: Presets or Upload */}
        <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {PRESET_RECEIPTS.map(preset => (
            <button
              key={preset.id}
              type="button"
              onClick={() => {
                setActivePreset(preset.id);
                setCustomImage(null);
                setVerificationResult(null);
              }}
              className={`flex flex-col text-left rounded-xl p-3.5 transition border ${
                activePreset === preset.id && !customImage
                  ? 'border-teal-500/60 bg-teal-950/30 shadow-md ring-1 ring-teal-500/30'
                  : 'border-slate-800 bg-slate-950/60 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded border ${preset.badgeColor}`}>
                  {preset.badge}
                </span>
                <span className="text-xs font-mono font-bold text-slate-300">
                  ${preset.receipt.total.toFixed(2)}
                </span>
              </div>
              <p className="text-xs font-semibold text-slate-100">{preset.title}</p>
              <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">{preset.description}</p>
            </button>
          ))}
        </div>

        {/* OCR Engine Selector */}
        <div className="mt-5 p-4 rounded-xl border border-slate-800 bg-slate-950/80">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
            <div className="flex items-center gap-2">
              <Cpu className="h-4 w-4 text-cyan-400" />
              <span className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                Select OCR Engine (Physical Text Extraction)
              </span>
            </div>
            <span className="text-[11px] text-cyan-400/90 font-mono flex items-center gap-1">
              <Terminal className="h-3 w-3" /> Step 1: Open Source OCR → Step 2: LLM Semantic Structuring
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <button
              type="button"
              onClick={() => setSelectedEngine('tesseract')}
              className={`p-3 rounded-xl border text-left transition ${
                selectedEngine === 'tesseract'
                  ? 'border-cyan-500/70 bg-cyan-950/40 text-cyan-100 ring-1 ring-cyan-500/40 shadow-sm'
                  : 'border-slate-800 bg-slate-900/40 text-slate-400 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-slate-100">Tesseract OCR (CLI)</span>
                <span className="text-[9px] px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-mono font-bold">
                  ara + eng
                </span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Native C++ open source CLI with Arabic (tesseract-ocr-ara) and English traineddata.
              </p>
            </button>

            <button
              type="button"
              onClick={() => setSelectedEngine('easyocr')}
              className={`p-3 rounded-xl border text-left transition ${
                selectedEngine === 'easyocr'
                  ? 'border-indigo-500/70 bg-indigo-950/40 text-indigo-100 ring-1 ring-indigo-500/40 shadow-sm'
                  : 'border-slate-800 bg-slate-900/40 text-slate-400 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-slate-100">EasyOCR (PyTorch)</span>
                <span className="text-[9px] px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-mono font-bold">
                  Deep Neural
                </span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Open-source deep learning detector (CRAFT) and recognizer for Arabic & Latin typography.
              </p>
            </button>

            <button
              type="button"
              onClick={() => setSelectedEngine('gemini_vision')}
              className={`p-3 rounded-xl border text-left transition ${
                selectedEngine === 'gemini_vision'
                  ? 'border-teal-500/70 bg-teal-950/40 text-teal-100 ring-1 ring-teal-500/40 shadow-sm'
                  : 'border-slate-800 bg-slate-900/40 text-slate-400 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-slate-100">Gemini Vision</span>
                <span className="text-[9px] px-2 py-0.5 rounded-full bg-teal-500/20 text-teal-300 font-mono font-bold">
                  Multimodal
                </span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Direct pixel vision OCR + reasoning in one end-to-end multimodal pass.
              </p>
            </button>
          </div>
        </div>

        {/* Custom Upload Option and Mode Indicator */}
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-800/80">
          <div className="flex flex-wrap items-center gap-2">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept="image/*"
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800/80 px-3 py-1.5 text-xs font-medium text-slate-300 hover:bg-slate-700 transition"
            >
              <Upload className="h-3.5 w-3.5" /> Upload Any Receipt Image (Arabic or English)
            </button>
            {customImage && (
              <span className="text-xs text-teal-400 font-medium flex items-center gap-1">
                <CheckCircle2 className="h-3.5 w-3.5" /> Image Ready for {selectedEngine === 'tesseract' ? 'Tesseract' : selectedEngine === 'easyocr' ? 'EasyOCR' : 'Gemini Vision'}
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={runVerification}
            disabled={analyzing}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-600 px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-white shadow-lg hover:from-teal-400 hover:to-emerald-500 disabled:opacity-50 transition"
          >
            {analyzing ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" /> Running {selectedEngine === 'tesseract' ? 'Tesseract' : selectedEngine === 'easyocr' ? 'EasyOCR' : 'Gemini Vision'} & Gatekeeper...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" /> Run {selectedEngine === 'tesseract' ? 'Tesseract OCR + LLM' : selectedEngine === 'easyocr' ? 'EasyOCR + LLM' : 'Gemini Vision'} Gatekeeper
              </>
            )}
          </button>
        </div>

        {/* Custom Upload Preview */}
        {customImage && (
          <div className="mt-4 flex items-center gap-4 rounded-xl border border-slate-800 bg-slate-950 p-3">
            <img
              src={customImage}
              alt="Receipt preview"
              className="h-20 w-20 rounded-lg object-cover border border-slate-700"
            />
            <div>
              <p className="text-xs font-semibold text-slate-200">
                Loaded Image for {selectedEngine === 'tesseract' ? 'Tesseract CLI (ara+eng)' : selectedEngine === 'easyocr' ? 'EasyOCR (PyTorch)' : 'Gemini Multimodal Vision'}
              </p>
              <p className="text-[11px] text-slate-400">
                {selectedEngine === 'gemini_vision'
                  ? 'Direct multimodal pixel scanning and semantic verification.'
                  : 'Open-source OCR extracts raw transcript from image, then Gemini LLM parses into structured financial items.'}
              </p>
            </div>
          </div>
        )}

        {/* Stepper progress during scan */}
        {analyzing && (
          <div className="mt-4 rounded-xl border border-teal-500/30 bg-teal-950/40 p-3.5 text-xs text-teal-200 animate-pulse">
            <p className="font-semibold">{currentStep}</p>
          </div>
        )}
      </div>

      {/* Error state */}
      {error && (
        <div className="rounded-xl border border-rose-500/40 bg-rose-950/40 p-4 text-xs text-rose-300">
          <strong>Scanning Error:</strong> {error}
        </div>
      )}

      {/* Cross-Reference Breakdown & Decision Results */}
      {verificationResult && (
        <div className="space-y-6">
          {/* Decision Verdict Banner */}
          <div
            className={`rounded-2xl border p-6 shadow-2xl transition-all ${
              verificationResult.is_approved
                ? 'border-emerald-500/50 bg-gradient-to-br from-emerald-950/80 via-slate-900 to-slate-950 text-white ring-2 ring-emerald-500/30'
                : 'border-rose-500/50 bg-gradient-to-br from-rose-950/80 via-slate-900 to-slate-950 text-white ring-2 ring-rose-500/30'
            }`}
          >
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="flex items-start gap-4">
                <div
                  className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl shadow-lg ${
                    verificationResult.is_approved
                      ? 'bg-emerald-500 text-slate-950'
                      : 'bg-rose-500 text-white'
                  }`}
                >
                  {verificationResult.is_approved ? (
                    <Unlock className="h-7 w-7" />
                  ) : (
                    <Lock className="h-7 w-7" />
                  )}
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full ${
                        verificationResult.is_approved
                          ? 'bg-emerald-400/20 text-emerald-300'
                          : 'bg-rose-400/20 text-rose-300'
                      }`}
                    >
                      {verificationResult.is_approved
                        ? '100% Policy Match (معتمد)'
                        : 'Gatekeeper Rejected (مرفوض)'}
                    </span>
                    <span className="text-xs text-slate-400 font-mono">
                      Confidence: {verificationResult.confidence_score}%
                    </span>
                    {verificationResult.ocr_engine_used && (
                      <span className="rounded bg-cyan-950 border border-cyan-500/40 px-2.5 py-0.5 text-[10px] font-bold text-cyan-300 font-mono flex items-center gap-1">
                        <Cpu className="h-3 w-3" />
                        {verificationResult.ocr_engine_used === 'tesseract'
                          ? 'Tesseract CLI (ara+eng) + LLM'
                          : verificationResult.ocr_engine_used === 'easyocr'
                          ? 'EasyOCR (PyTorch) + LLM'
                          : verificationResult.ocr_engine_used === 'gemini_vision'
                          ? 'Gemini Vision (Multimodal)'
                          : verificationResult.ocr_engine_used}
                      </span>
                    )}
                    {verificationResult.parsedReceipt.currency && (
                      <span className="rounded bg-slate-800 px-2 py-0.5 text-[10px] font-bold text-slate-300">
                        {verificationResult.parsedReceipt.currency}
                      </span>
                    )}
                  </div>

                  <h3 className="mt-1 text-xl font-extrabold tracking-tight">
                    {verificationResult.is_approved
                      ? 'PAYMENT APPROVED: Corporate Debit Card Unlocked'
                      : 'PAYMENT REJECTED: Corporate Debit Card Remains Locked'}
                  </h3>

                  <p className="mt-1 text-xs text-slate-300">
                    {verificationResult.is_approved
                      ? `Pre-authorized charge of ${verificationResult.parsedReceipt.currency || '$'} ${verificationResult.authorized_amount.toFixed(2)} at ${verificationResult.store_detected}. Unlocked for 15-minute window.`
                      : `Violations detected in receipt line items. Card locked to protect company capital.`}
                  </p>
                </div>
              </div>

              {/* Action/Token badge */}
              <div className="rounded-xl border border-white/10 bg-black/40 p-3 text-right">
                <span className="text-[10px] uppercase tracking-wider text-slate-400">
                  {verificationResult.is_approved ? 'Single-Use Auth Token' : 'Action Required'}
                </span>
                <p className="font-mono text-sm font-bold text-emerald-400">
                  {verificationResult.is_approved
                    ? verificationResult.unlock_token
                    : 'Submit Manager Override'}
                </p>
                <span className="text-[10px] text-slate-400">
                  {verificationResult.is_approved
                    ? 'Card ready for POS swipe'
                    : 'Card frozen at POS'}
                </span>
              </div>
            </div>

            {/* List of Violations if any */}
            {verificationResult.violations.length > 0 && (
              <div className="mt-5 rounded-xl border border-rose-500/30 bg-rose-950/30 p-4">
                <div className="flex items-center gap-2 text-rose-400 font-semibold text-xs mb-2">
                  <AlertTriangle className="h-4 w-4" /> Policy Violations Detected (المخالفات المرصودة):
                </div>
                <ul className="space-y-1 text-xs text-rose-200">
                  {verificationResult.violations.map((violation, i) => (
                    <li key={i} className="flex items-start gap-1.5">
                      <span className="text-rose-400 font-bold">•</span>
                      <span>{violation}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Raw OCR Transcript Viewer */}
          {(verificationResult.raw_ocr_transcript || verificationResult.parsedReceipt.raw_text) && (
            <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-4 shadow-lg">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <div className="flex items-center gap-2 text-cyan-400">
                  <Terminal className="h-4 w-4" />
                  <span className="text-xs font-bold uppercase tracking-wider">
                    {verificationResult.ocr_engine_used === 'tesseract'
                      ? 'Tesseract OCR (CLI) Raw Transcript (tesseract -l ara+eng)'
                      : verificationResult.ocr_engine_used === 'easyocr'
                      ? 'EasyOCR (PyTorch) Raw Transcript (CRAFT + CRNN)'
                      : 'Optical Character Recognition Transcript — النص المستخرج'}
                  </span>
                </div>
                <span className="text-[11px] text-slate-400 font-mono">
                  {verificationResult.ocr_engine_used === 'gemini_vision'
                    ? 'Pixel Vision'
                    : 'Open Source OCR → Gemini LLM Parsed'}
                </span>
              </div>
              <pre
                dir="auto"
                className="mt-3 max-h-48 overflow-y-auto rounded-lg border border-slate-800 bg-slate-950 p-3.5 font-mono text-xs text-slate-300 leading-relaxed whitespace-pre-wrap selection:bg-cyan-500 selection:text-slate-950"
              >
                {verificationResult.raw_ocr_transcript || verificationResult.parsedReceipt.raw_text}
              </pre>
            </div>
          )}

          {/* Line-by-Line Cross-Reference Breakdown */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/90 overflow-hidden shadow-xl">
            <div className="border-b border-slate-800 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-white">
                    Line Item Cross-Reference Matrix (مصفوفة فحص البنود)
                  </h4>
                  <p className="text-xs text-slate-400">
                    Comparing scanned receipt items against admin specifications for {verificationResult.store_detected}.
                  </p>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <span className="rounded-md bg-emerald-500/10 px-2 py-0.5 text-emerald-400 ring-1 ring-emerald-500/30 font-medium">
                    {verificationResult.compliant_items_count} Approved
                  </span>
                  {verificationResult.unauthorized_items_count > 0 && (
                    <span className="rounded-md bg-rose-500/10 px-2 py-0.5 text-rose-400 ring-1 ring-rose-500/30 font-medium">
                      {verificationResult.unauthorized_items_count} Unauthorized
                    </span>
                  )}
                  {verificationResult.price_violation_count > 0 && (
                    <span className="rounded-md bg-amber-500/10 px-2 py-0.5 text-amber-400 ring-1 ring-amber-500/30 font-medium">
                      {verificationResult.price_violation_count} Over Cap
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950/80 text-[11px] uppercase tracking-wider text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Receipt Item Name (اسم الصنف)</th>
                    <th className="px-4 py-3 font-semibold">Matched Admin Spec (المواصفة المعتمدة)</th>
                    <th className="px-4 py-3 font-semibold">Unit Price</th>
                    <th className="px-4 py-3 font-semibold">Approved Price Cap</th>
                    <th className="px-4 py-3 font-semibold">Compliance Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-300">
                  {verificationResult.items.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-800/40 transition">
                      <td className="px-4 py-3 font-medium text-slate-100" dir="auto">
                        {item.raw_name}
                      </td>
                      <td className="px-4 py-3 text-slate-400" dir="auto">
                        {item.matched_spec ? (
                          <div>
                            <span className="text-slate-200 font-medium">{item.matched_spec.item_name}</span>
                            <span className="block text-[10px] text-slate-400">{item.matched_spec.category}</span>
                          </div>
                        ) : (
                          <span className="text-rose-400 italic">No matching approved catalog spec (غير مصرح)</span>
                        )}
                      </td>
                      <td className="px-4 py-3 font-mono font-semibold">
                        {verificationResult.parsedReceipt.currency || '$'} {item.unit_price.toFixed(2)}
                      </td>
                      <td className="px-4 py-3 font-mono">
                        {item.max_allowed_price ? (
                          <div>
                            <span className="text-slate-300 font-semibold">
                              {verificationResult.parsedReceipt.currency || '$'} {item.max_allowed_price.toFixed(2)}
                            </span>
                            {item.matched_spec?.allowed_tolerance_pct ? (
                              <span className="text-[10px] text-slate-400 block">
                                (+{item.matched_spec.allowed_tolerance_pct}% tol)
                              </span>
                            ) : null}
                          </div>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {item.status === 'APPROVED' && (
                          <span className="inline-flex items-center gap-1 rounded-md bg-emerald-500/10 px-2 py-1 text-xs font-semibold text-emerald-400 ring-1 ring-emerald-500/30">
                            <CheckCircle2 className="h-3.5 w-3.5" /> Approved
                          </span>
                        )}
                        {item.status === 'UNAUTHORIZED_ITEM' && (
                          <span className="inline-flex items-center gap-1 rounded-md bg-rose-500/10 px-2 py-1 text-xs font-semibold text-rose-400 ring-1 ring-rose-500/30">
                            <XCircle className="h-3.5 w-3.5" /> Unauthorized Item
                          </span>
                        )}
                        {item.status === 'PRICE_EXCEEDED' && (
                          <span className="inline-flex items-center gap-1 rounded-md bg-amber-500/10 px-2 py-1 text-xs font-semibold text-amber-400 ring-1 ring-amber-500/30">
                            <AlertTriangle className="h-3.5 w-3.5" /> Price Exceeded (+{verificationResult.parsedReceipt.currency || '$'}{item.price_difference?.toFixed(2)})
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Receipt Summary Footer */}
            <div className="flex flex-wrap items-center justify-between border-t border-slate-800 bg-slate-950/60 p-4 text-xs">
              <div className="flex items-center gap-4 text-slate-400">
                <span>Receipt: <strong className="text-slate-200">{verificationResult.parsedReceipt.receipt_number}</strong></span>
                <span>Date: <strong className="text-slate-200">{verificationResult.parsedReceipt.date}</strong></span>
                <span>Store: <strong className="text-slate-200" dir="auto">{verificationResult.parsedReceipt.store_name}</strong></span>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-slate-400">
                  Tax: {verificationResult.parsedReceipt.currency || '$'} {verificationResult.parsedReceipt.tax?.toFixed(2) || '0.00'}
                </span>
                <span className="text-sm font-bold text-white font-mono">
                  Total: {verificationResult.parsedReceipt.currency || '$'} {verificationResult.parsedReceipt.total.toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
