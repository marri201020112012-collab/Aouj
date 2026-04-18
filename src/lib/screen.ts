// ─── DEAL SCREENING ENGINE ────────────────────────────────────────────────────
// Fast, decision-oriented screening. Wraps the valuation engine for market
// benchmarks, then overlays user-supplied price/rent to produce a verdict.
//
// Logic is intentionally transparent and replaceable — mock where needed,
// replace with real data sources as they become available.

import { computeValuation, PropertyInput, VALUATION_SOURCE_ID } from "./valuation";
import { computeIrrResult, HoldYears } from "./irr";

// ── Constants (mirrored from valuation.ts) ────────────────────────────────────

const OPEX: Record<string, number> = {
  "Residential Villa": 0.20, "Apartment": 0.25, "Commercial": 0.30,
  "Office": 0.35, "Warehouse": 0.20, "Land": 0.00,
};

const LTV_PARAMS: Record<string, { samaMax: number; lendingRate: number; fsHaircut: number }> = {
  "Residential Villa": { samaMax: 0.85, lendingRate: 0.0700, fsHaircut: 0.25 },
  "Apartment":         { samaMax: 0.90, lendingRate: 0.0700, fsHaircut: 0.25 },
  "Commercial":        { samaMax: 0.70, lendingRate: 0.0750, fsHaircut: 0.30 },
  "Office":            { samaMax: 0.70, lendingRate: 0.0750, fsHaircut: 0.30 },
  "Warehouse":         { samaMax: 0.65, lendingRate: 0.0800, fsHaircut: 0.35 },
  "Land":              { samaMax: 0.60, lendingRate: 0.0850, fsHaircut: 0.40 },
};

const SECONDARY_CITIES = ["Makkah", "Medina", "Abha"];
const SAMA_REPO  = 0.060;
const SAMA_TAG   = "Q1 2026";
const LOAN_YEARS = 20;

function annualMC(rate: number): number {
  const r = rate / 12;
  const n = LOAN_YEARS * 12;
  if (r === 0) return 1 / LOAN_YEARS;
  return (r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1) * 12;
}

// ── Interfaces ────────────────────────────────────────────────────────────────

export interface ScreenInput {
  city: string;
  district: string;
  assetType: string;
  price:       number | null;   // SAR acquisition price
  size:        number | null;   // sqm
  annualRent:  number | null;   // SAR/yr (user-entered)
  yieldPct:    number | null;   // % yield (alternative to rent)
  ltvOverride: number | null;   // 0–100; null = SAMA max
  holdYears:   HoldYears;
}

export type Verdict = "proceed" | "clarify" | "reject" | "insufficient";
export type ConfLevel = "high" | "medium" | "low" | "insufficient";

export interface RiskFlag {
  level: "info" | "warn" | "critical";
  code: string;
  message: string;
}

export interface ScreenResult {
  // Price benchmarking
  pricePerSqm:        number | null;
  benchmarkPsm:       number | null;
  benchmarkLow:       number | null;
  benchmarkHigh:      number | null;
  psmDeltaPct:        number | null;   // positive = above market
  // Income
  effectiveRent:      number | null;   // SAR/yr actually used
  impliedNoi:         number | null;
  impliedCapRate:     number | null;
  benchmarkCapRate:   number | null;
  yieldVsBenchBps:    number | null;
  yieldVsSamaBps:     number | null;
  samaRepoRate:       number;
  samaTag:            string;
  // Financing
  ltv:                number;
  ltvIsDefault:       boolean;
  maxLoan:            number | null;
  annualDebtService:  number | null;
  forcedSaleValue:    number | null;
  // Returns
  unleveredIRR:       number | null;
  leveredIRR:         number | null;
  irrBear:            number | null;
  irrBull:            number | null;
  // Decision
  verdict:            Verdict;
  verdictReason:      string;
  confidence:         ConfLevel;
  confidenceScore:    number;
  flags:              RiskFlag[];
  hasIncome:          boolean;
  benchmarkSource:    string;
  benchmarkSourceId:  string;   // references SOURCE_ID in src/lib/sources.ts
}

export const DEFAULT_SCREEN: ScreenInput = {
  city: "Riyadh",
  district: "Al Olaya",
  assetType: "Commercial",
  price:       null,
  size:        null,
  annualRent:  null,
  yieldPct:    null,
  ltvOverride: null,
  holdYears:   5,
};

// ── Engine ────────────────────────────────────────────────────────────────────

export function runScreen(inp: ScreenInput): ScreenResult {
  const flags: RiskFlag[] = [];

  // ── Market benchmarks via valuation engine ─────────────────────────────────
  // Always run with a standard size (100 sqm) to get per-sqm benchmarks.
  // The valuation is size-linear so we can divide to get PSM.
  const REF_SIZE = 100;
  const valInput: PropertyInput = {
    city:            inp.city,
    district:        inp.district,
    propertyType:    inp.assetType,
    size:            REF_SIZE,
    condition:       "Good",
    transactionType: "Sale",
  };
  const val = computeValuation(valInput);

  const benchmarkPsm  = val.reconciledValue  / REF_SIZE;
  const benchmarkLow  = val.reconciledLow    / REF_SIZE;
  const benchmarkHigh = val.reconciledHigh   / REF_SIZE;
  const benchmarkCapRate   = val.incomeApproach?.capRate ?? null;
  const benchmarkSource    = `AOUJ Market Reference (${SAMA_TAG})`;
  const benchmarkSourceId  = VALUATION_SOURCE_ID;

  // ── User inputs ────────────────────────────────────────────────────────────
  const { price, size, holdYears } = inp;
  const pricePerSqm = price && size ? price / size : null;
  const psmDeltaPct = pricePerSqm ? (pricePerSqm - benchmarkPsm) / benchmarkPsm * 100 : null;

  // Income: prefer annualRent, fall back to yieldPct × price
  let effectiveRent: number | null = inp.annualRent;
  if (!effectiveRent && inp.yieldPct && price) {
    effectiveRent = price * (inp.yieldPct / 100);
  }
  const hasIncome = !!effectiveRent;

  const opex         = OPEX[inp.assetType] ?? 0.25;
  const impliedNoi   = effectiveRent ? effectiveRent * (1 - opex) : null;
  const impliedCapRate = impliedNoi && price ? impliedNoi / price : null;

  const yieldVsBenchBps = impliedCapRate && benchmarkCapRate
    ? (impliedCapRate - benchmarkCapRate) * 10_000
    : null;
  const yieldVsSamaBps  = impliedCapRate
    ? (impliedCapRate - SAMA_REPO) * 10_000
    : null;

  // ── Financing ──────────────────────────────────────────────────────────────
  const ltpParams    = LTV_PARAMS[inp.assetType] ?? LTV_PARAMS["Commercial"];
  const ltvDefault   = ltpParams.samaMax;
  const ltv          = inp.ltvOverride != null ? inp.ltvOverride / 100 : ltvDefault;
  const ltvIsDefault = inp.ltvOverride == null;
  const maxLoan      = price ? price * ltv : null;
  const annualDebtService = maxLoan
    ? maxLoan * annualMC(ltpParams.lendingRate)
    : null;
  const forcedSaleValue = price ? price * (1 - ltpParams.fsHaircut) : null;

  const ltvData = (maxLoan && annualDebtService)
    ? { impliedMaxLoan: maxLoan, annualDebtService, lendingRate: ltpParams.lendingRate }
    : null;

  // ── IRR (base / bear / bull) ───────────────────────────────────────────────
  let unleveredIRR: number | null = null;
  let leveredIRR:   number | null = null;
  let irrBear:      number | null = null;
  let irrBull:      number | null = null;

  if (price && impliedNoi) {
    const base = computeIrrResult(price, impliedNoi,
      { holdYears, rentGrowthRate: 0.02, exitCapRateDelta: 0 }, ltvData);
    const bear = computeIrrResult(price, impliedNoi,
      { holdYears, rentGrowthRate: 0.00, exitCapRateDelta: 0.010 }, ltvData);
    const bull = computeIrrResult(price, impliedNoi,
      { holdYears, rentGrowthRate: 0.04, exitCapRateDelta: -0.005 }, ltvData);

    unleveredIRR = base?.unleveredIRR ?? null;
    leveredIRR   = base?.leveredIRR   ?? null;
    irrBear      = bear?.unleveredIRR ?? null;
    irrBull      = bull?.unleveredIRR ?? null;
  }

  // ── Risk flags ─────────────────────────────────────────────────────────────

  // Price vs benchmark
  if (psmDeltaPct !== null) {
    if (psmDeltaPct > 50)
      flags.push({ level: "critical", code: "PRICE-001",
        message: `Price is ${psmDeltaPct.toFixed(0)}% above market benchmark — verify recent comparables` });
    else if (psmDeltaPct > 25)
      flags.push({ level: "warn", code: "PRICE-002",
        message: `Price is ${psmDeltaPct.toFixed(0)}% above market — above-market entry, limited upside` });
    else if (psmDeltaPct < -30)
      flags.push({ level: "info", code: "PRICE-003",
        message: `Price is ${Math.abs(psmDeltaPct).toFixed(0)}% below market — verify title, condition, and encumbrances` });
    else
      flags.push({ level: "info", code: "PRICE-OK",
        message: `Price is ${psmDeltaPct >= 0 ? "+" : ""}${psmDeltaPct.toFixed(0)}% vs market benchmark` });
  }

  // No income input
  if (!hasIncome)
    flags.push({ level: "warn", code: "INC-001",
      message: "No rental income entered — yield and IRR unavailable" });

  // Yield vs benchmark
  if (yieldVsBenchBps !== null) {
    if (yieldVsBenchBps < -200)
      flags.push({ level: "critical", code: "YLD-001",
        message: `Implied cap rate ${Math.abs(yieldVsBenchBps).toFixed(0)}bps below market — yield materially compressed` });
    else if (yieldVsBenchBps < -100)
      flags.push({ level: "warn", code: "YLD-002",
        message: `Cap rate ${Math.abs(yieldVsBenchBps).toFixed(0)}bps below market — limited yield buffer` });
    else if (yieldVsBenchBps > 150)
      flags.push({ level: "info", code: "YLD-003",
        message: `Cap rate ${yieldVsBenchBps.toFixed(0)}bps above market — attractive yield entry` });
  }

  // Yield spread over SAMA
  if (yieldVsSamaBps !== null && yieldVsSamaBps < 150)
    flags.push({ level: "warn", code: "RISK-001",
      message: `Yield premium over SAMA Repo is only ${yieldVsSamaBps.toFixed(0)}bps — insufficient risk compensation` });

  // IRR flags
  if (unleveredIRR !== null) {
    if (unleveredIRR < 0.05)
      flags.push({ level: "critical", code: "IRR-001",
        message: `Unlevered IRR ${(unleveredIRR * 100).toFixed(1)}% is sub-5% — below institutional threshold` });
    else if (unleveredIRR < 0.08)
      flags.push({ level: "warn", code: "IRR-002",
        message: `Unlevered IRR ${(unleveredIRR * 100).toFixed(1)}% is borderline — institutional target is 8%+` });
    else if (unleveredIRR > 0.14)
      flags.push({ level: "info", code: "IRR-003",
        message: `Unlevered IRR ${(unleveredIRR * 100).toFixed(1)}% — verify rent assumptions before relying on this` });
  }

  // Asset / market specific
  if (inp.assetType === "Office" && SECONDARY_CITIES.includes(inp.city))
    flags.push({ level: "warn", code: "MKT-001",
      message: "Office vacancy risk elevated in this market — thin institutional buyer pool" });

  if (inp.assetType === "Land")
    flags.push({ level: "info", code: "MKT-002",
      message: "Land: White Land Tax may apply. Income approach not applicable." });

  if (inp.assetType === "Warehouse" && SECONDARY_CITIES.includes(inp.city))
    flags.push({ level: "info", code: "MKT-003",
      message: "Logistics / warehouse demand in this market is thin — verify occupier covenant" });

  if (ltv > ltpParams.samaMax + 0.001)
    flags.push({ level: "critical", code: "FIN-001",
      message: `LTV ${(ltv * 100).toFixed(0)}% exceeds SAMA maximum of ${(ltpParams.samaMax * 100).toFixed(0)}%` });

  // ── Confidence ─────────────────────────────────────────────────────────────
  let score = 30;
  if (price)        score += 25;
  if (size)         score += 20;
  if (hasIncome)    score += 20;
  if (!SECONDARY_CITIES.includes(inp.city)) score += 5;
  score = Math.min(100, score);

  const confidence: ConfLevel =
    score >= 80 ? "high"   :
    score >= 60 ? "medium" :
    score >= 40 ? "low"    : "insufficient";

  // ── Verdict ────────────────────────────────────────────────────────────────
  if (!price) {
    return buildResult("insufficient", "Enter a price to screen this deal.",
      "insufficient", score, flags,
      { pricePerSqm, benchmarkPsm, benchmarkLow, benchmarkHigh, psmDeltaPct,
        effectiveRent, impliedNoi, impliedCapRate, benchmarkCapRate,
        yieldVsBenchBps, yieldVsSamaBps, ltv, ltvIsDefault,
        maxLoan, annualDebtService, forcedSaleValue,
        unleveredIRR, leveredIRR, irrBear, irrBull,
        hasIncome, benchmarkSource, benchmarkSourceId });
  }

  const hasCritical = flags.some(f => f.level === "critical");
  const warnCount   = flags.filter(f => f.level === "warn").length;

  let verdict: Verdict;
  let verdictReason: string;

  if (hasCritical) {
    verdict = "reject";
    const cf = flags.find(f => f.level === "critical")!;
    verdictReason = cf.message;
  } else if (!hasIncome && !size) {
    verdict = "clarify";
    verdictReason = "Missing size and income data — benchmark comparison incomplete";
  } else if (!hasIncome) {
    verdict = "clarify";
    verdictReason = "Rental income not verified — IRR and yield analysis unavailable";
  } else if (unleveredIRR !== null && unleveredIRR < 0.08) {
    verdict = "clarify";
    verdictReason = `Unlevered IRR ${(unleveredIRR * 100).toFixed(1)}% is below 8% institutional target — stress-test assumptions before proceeding`;
  } else if (warnCount >= 2) {
    verdict = "clarify";
    verdictReason = `${warnCount} risk flags require review before committing to due diligence`;
  } else {
    verdict = "proceed";
    const irrStr = unleveredIRR ? ` · ${(unleveredIRR * 100).toFixed(1)}% unlevered IRR` : "";
    const psmStr = psmDeltaPct != null ? ` · Price ${psmDeltaPct >= 0 ? "+" : ""}${psmDeltaPct.toFixed(0)}% vs market` : "";
    verdictReason = `No blocking issues identified${irrStr}${psmStr}`;
  }

  return buildResult(verdict, verdictReason, confidence, score, flags, {
    pricePerSqm, benchmarkPsm, benchmarkLow, benchmarkHigh, psmDeltaPct,
    effectiveRent, impliedNoi, impliedCapRate, benchmarkCapRate,
    yieldVsBenchBps, yieldVsSamaBps, ltv, ltvIsDefault,
    maxLoan, annualDebtService, forcedSaleValue,
    unleveredIRR, leveredIRR, irrBear, irrBull,
    hasIncome, benchmarkSource, benchmarkSourceId,
  });
}

// ── Builder (keeps runScreen readable) ───────────────────────────────────────

function buildResult(
  verdict: Verdict,
  verdictReason: string,
  confidence: ConfLevel,
  confidenceScore: number,
  flags: RiskFlag[],
  fields: Omit<ScreenResult, "verdict" | "verdictReason" | "confidence" | "confidenceScore" | "flags" | "samaRepoRate" | "samaTag">,
): ScreenResult {
  return {
    ...fields,
    verdict,
    verdictReason,
    confidence,
    confidenceScore,
    flags,
    samaRepoRate: SAMA_REPO,
    samaTag: SAMA_TAG,
  };
}
