// ─── INTERFACES ───────────────────────────────────────────────────────────────

export interface PropertyInput {
  city: string;
  district: string;
  propertyType: string;
  size: number;
  condition: string;
  transactionType: string;
  yearBuilt?: number;
  floorLevel?: number;          // apartments only
  hasStreetFrontage?: boolean;  // commercial only
}

export interface IncomeApproach {
  grossRentalIncome: number;
  vacancyRate: number;           // city × type specific
  effectiveGrossIncome: number;
  opexRatio: number;
  operatingExpenses: number;
  noi: number;
  capRate: number;               // city × type specific
  incomeValue: number;
  impliedGrossYield: number;     // GRI / salesCompValue
  capRateSource: string;         // e.g. "Riyadh Commercial (Q1 2026)"
  vacancySource: string;
}

export interface SensitivityRow {
  label: string;
  shiftValue: number;           // cap rate (%) or price shift (%)
  value: number;
  delta: number;
  deltaPercent: number;
  isBase: boolean;
}

export interface LTVAnalysis {
  samaMaxLTV: number;
  impliedMaxLoan: number;
  forcedSaleValue: number;
  fsHaircut: number;
  lendingRate: number;
  annualDebtService: number | null;
  dscr: number | null;
  dscrFlag: "pass" | "warn" | "fail" | null;
}

export interface TaqeemFlag {
  level: "info" | "warning" | "required";
  code: string;
  message: string;
}

export interface ConfidenceDetail {
  score: number;
  level: "High" | "Medium" | "Low";
  cityScore: number;
  districtScore: number;
  propertyTypeScore: number;
  marketActivityScore: number;
  explanation: string[];
}

export interface MarketContext {
  samaRepoRate: number;
  rateVintage: string;
  impliedCapRateFloor: number;
  yieldSpread: number | null;
  spreadComment: string;
  vision2030Flag: string | null;
  vision2030Premium: number;
}

export interface ValuationResult {
  // Sales comparison
  salesCompValue: number;
  salesCompLow: number;
  salesCompHigh: number;
  pricePerSqm: number;

  // Income approach
  incomeApproach: IncomeApproach | null;

  // Reconciled output
  reconciledValue: number;
  reconciledLow: number;
  reconciledHigh: number;
  salesCompWeight: number;
  incomeWeight: number;

  // Sensitivity analysis
  sensitivityTable: SensitivityRow[];
  sensitivityType: "cap_rate" | "price";

  // Risk & financing
  ltvAnalysis: LTVAnalysis;

  // Depreciation
  depreciationFactor: number;
  depreciationNote: string | null;

  // Confidence
  confidence: ConfidenceDetail;

  // Compliance
  taqeemFlags: TaqeemFlag[];

  // Market context
  marketContext: MarketContext;

  // Narrative
  reasoning: string[];
  governanceWarning: string | null;
  caveat: string;

  // Legacy aliases (backward compat with CaseDetail)
  rangeLow: number;
  rangeHigh: number;

  // Provenance — references SOURCE_ID in src/lib/sources.ts
  benchmarkSourceId: string;
}

// ─── LOOKUP DATA ──────────────────────────────────────────────────────────────

export const CITIES = ["Riyadh", "Jeddah", "Makkah", "Medina", "Dammam", "Khobar", "Abha"];

export const DISTRICTS: Record<string, string[]> = {
  Riyadh: ["Al Olaya", "Al Sulaimaniyah", "Hitteen", "Al Nakheel", "Al Yasmin", "Al Rabwah", "Al Malaz", "Al Rawabi"],
  Jeddah: ["Al Hamra", "Al Shati", "Al Zahraa", "Al Rawdah", "Al Safa", "Al Marjaan", "Al Balad"],
  Makkah: ["Al Aziziyah", "Al Nuzha", "Al Awali", "Batha Quraysh", "Al Zaher"],
  Medina: ["Al Aziziyah", "Al Haram", "Quba", "Al Anbariyah", "Al Aqoul"],
  Dammam: ["Al Faisaliyah", "Al Shatea", "Al Muraikabat", "Al Noor", "Al Badiyah"],
  Khobar: ["Al Thuqbah", "Al Ulaya", "Prince Turki", "Al Rakah"],
  Abha: ["Al Maather", "Al Namas", "Al Mansoura", "Al Sad"],
};

export const PROPERTY_TYPES = ["Residential Villa", "Apartment", "Commercial", "Office", "Land", "Warehouse"];
export const CONDITIONS = ["Excellent", "Good", "Fair", "Poor"];
export const TRANSACTION_TYPES = ["Sale", "Rent"];

// Well-known source IDs — imported by UI; kept here to avoid circular deps with sources.ts
export const VALUATION_SOURCE_ID  = "aouj-model-q1-2026";
export const SAMA_RATE_SOURCE_ID  = "sama-repo-q1-2026";
export const SAMA_LTV_SOURCE_ID   = "sama-ltv-regs-2024";
export const DEMO_SOURCE_ID       = "aouj-demo-v1";

// Capital value base SAR/sqm by city (comparable-derived, Q1 2026)
const CITY_BASE: Record<string, number> = {
  Riyadh: 8_000, Jeddah: 9_500, Makkah: 13_000, Medina: 6_800,
  Dammam: 5_500, Khobar: 6_500, Abha: 3_500,
};

// District multipliers vs city base (capital values)
const DISTRICT_MULT: Record<string, Record<string, number>> = {
  Riyadh: {
    "Al Olaya": 1.55, "Al Sulaimaniyah": 1.40, "Hitteen": 1.25, "Al Nakheel": 1.15,
    "Al Yasmin": 1.10, "Al Rabwah": 1.00, "Al Malaz": 0.85, "Al Rawabi": 0.90,
  },
  Jeddah: {
    "Al Hamra": 1.35, "Al Shati": 1.45, "Al Zahraa": 1.25, "Al Rawdah": 1.20,
    "Al Safa": 1.10, "Al Marjaan": 1.00, "Al Balad": 0.80,
  },
  Makkah: { "Al Aziziyah": 1.20, "Al Nuzha": 1.00, "Al Awali": 0.90, "Batha Quraysh": 0.85, "Al Zaher": 0.95 },
  Medina: { "Al Aziziyah": 1.10, "Al Haram": 1.30, "Quba": 1.00, "Al Anbariyah": 0.90, "Al Aqoul": 0.85 },
  Dammam: { "Al Faisaliyah": 1.15, "Al Shatea": 1.25, "Al Muraikabat": 1.00, "Al Noor": 0.95, "Al Badiyah": 0.85 },
  Khobar: { "Al Thuqbah": 1.10, "Al Ulaya": 1.20, "Prince Turki": 1.00, "Al Rakah": 1.05 },
  Abha: { "Al Maather": 1.05, "Al Namas": 1.15, "Al Mansoura": 0.95, "Al Sad": 0.90 },
};

// Property type multipliers vs residential villa benchmark
const PROPERTY_TYPE_MULT: Record<string, number> = {
  "Residential Villa": 1.00, "Apartment": 0.65, "Commercial": 1.20,
  "Office": 1.05, "Land": 0.50, "Warehouse": 0.75,
};

const CONDITION_MULT: Record<string, number> = {
  Excellent: 1.15, Good: 1.00, Fair: 0.82, Poor: 0.65,
};

// Independent market rents SAR/sqm/year (rental comparables, Q1 2026)
const MARKET_RENT_PSM: Record<string, Record<string, number>> = {
  "Residential Villa": { Riyadh: 380, Jeddah: 450, Makkah: 550, Medina: 320, Dammam: 270, Khobar: 300, Abha: 180 },
  "Apartment":         { Riyadh: 520, Jeddah: 620, Makkah: 800, Medina: 480, Dammam: 400, Khobar: 440, Abha: 240 },
  "Commercial":        { Riyadh: 1_000, Jeddah: 1_100, Makkah: 1_400, Medina: 800, Dammam: 750, Khobar: 850, Abha: 450 },
  "Office":            { Riyadh: 900, Jeddah: 950, Makkah: 1_000, Medina: 720, Dammam: 700, Khobar: 750, Abha: 380 },
  "Warehouse":         { Riyadh: 480, Jeddah: 520, Makkah: 500, Medina: 450, Dammam: 460, Khobar: 480, Abha: 280 },
  "Land":              { Riyadh: 0, Jeddah: 0, Makkah: 0, Medina: 0, Dammam: 0, Khobar: 0, Abha: 0 },
};

// ── Cap rates: city × property type (investment transaction evidence, Q1 2026) ──
// Riyadh compresses due to Vision 2030 demand; secondary/tertiary cities carry
// higher risk premiums reflecting thinner buyer pools and longer hold periods.
const MARKET_CAP_RATE: Record<string, Record<string, number>> = {
  "Residential Villa": {
    Riyadh: 0.0425, Jeddah: 0.0450, Makkah: 0.0500,
    Medina: 0.0475, Dammam: 0.0475, Khobar: 0.0450, Abha: 0.0550,
  },
  "Apartment": {
    Riyadh: 0.0525, Jeddah: 0.0550, Makkah: 0.0600,
    Medina: 0.0575, Dammam: 0.0575, Khobar: 0.0550, Abha: 0.0650,
  },
  "Commercial": {
    Riyadh: 0.0700, Jeddah: 0.0750, Makkah: 0.0800,
    Medina: 0.0800, Dammam: 0.0800, Khobar: 0.0775, Abha: 0.0950,
  },
  "Office": {
    Riyadh: 0.0675, Jeddah: 0.0725, Makkah: 0.0850,
    Medina: 0.0850, Dammam: 0.0775, Khobar: 0.0750, Abha: 0.1000,
  },
  "Warehouse": {
    Riyadh: 0.0850, Jeddah: 0.0875, Makkah: 0.0900,
    Medina: 0.0925, Dammam: 0.0825, Khobar: 0.0850, Abha: 0.1100,
  },
  "Land": {
    Riyadh: 0, Jeddah: 0, Makkah: 0, Medina: 0, Dammam: 0, Khobar: 0, Abha: 0,
  },
};

// ── Vacancy rates: city × property type ──
// Driven by local supply/demand. Makkah/Medina commercial benefits from
// pilgrimage traffic. Abha/secondary cities carry structural oversupply risk.
const VACANCY_RATE: Record<string, Record<string, number>> = {
  "Residential Villa": {
    Riyadh: 0.04, Jeddah: 0.05, Makkah: 0.04,
    Medina: 0.05, Dammam: 0.06, Khobar: 0.05, Abha: 0.08,
  },
  "Apartment": {
    Riyadh: 0.07, Jeddah: 0.08, Makkah: 0.05,
    Medina: 0.06, Dammam: 0.09, Khobar: 0.08, Abha: 0.12,
  },
  "Commercial": {
    Riyadh: 0.10, Jeddah: 0.12, Makkah: 0.08,
    Medina: 0.10, Dammam: 0.12, Khobar: 0.11, Abha: 0.15,
  },
  "Office": {
    Riyadh: 0.15, Jeddah: 0.18, Makkah: 0.20,
    Medina: 0.20, Dammam: 0.17, Khobar: 0.15, Abha: 0.30,
  },
  "Warehouse": {
    Riyadh: 0.07, Jeddah: 0.08, Makkah: 0.08,
    Medina: 0.09, Dammam: 0.06, Khobar: 0.07, Abha: 0.15,
  },
  "Land": {
    Riyadh: 0, Jeddah: 0, Makkah: 0, Medina: 0, Dammam: 0, Khobar: 0, Abha: 0,
  },
};

const OPEX_RATIO: Record<string, number> = {
  "Residential Villa": 0.20, "Apartment": 0.25, "Commercial": 0.30,
  "Office": 0.35, "Warehouse": 0.20, "Land": 0.00,
};

// SAMA lending parameters (residential: Muraba'ha-based; commercial: SAIBOR + spread)
const LTV_PARAMS: Record<string, { samaMax: number; lendingRate: number; fsHaircut: number }> = {
  "Residential Villa": { samaMax: 0.85, lendingRate: 0.0700, fsHaircut: 0.25 },
  "Apartment":         { samaMax: 0.90, lendingRate: 0.0700, fsHaircut: 0.25 },
  "Commercial":        { samaMax: 0.70, lendingRate: 0.0750, fsHaircut: 0.30 },
  "Office":            { samaMax: 0.70, lendingRate: 0.0750, fsHaircut: 0.30 },
  "Warehouse":         { samaMax: 0.65, lendingRate: 0.0800, fsHaircut: 0.35 },
  "Land":              { samaMax: 0.60, lendingRate: 0.0850, fsHaircut: 0.40 },
};

// Approach weights for reconciliation { sales, income }
const APPROACH_WEIGHTS_SALE: Record<string, { sales: number; income: number }> = {
  "Residential Villa": { sales: 0.90, income: 0.10 },
  "Apartment":         { sales: 0.70, income: 0.30 },
  "Commercial":        { sales: 0.35, income: 0.65 },
  "Office":            { sales: 0.30, income: 0.70 },
  "Warehouse":         { sales: 0.25, income: 0.75 },
  "Land":              { sales: 1.00, income: 0.00 },
};
const APPROACH_WEIGHTS_RENT: Record<string, { sales: number; income: number }> = {
  "Residential Villa": { sales: 0.30, income: 0.70 },
  "Apartment":         { sales: 0.25, income: 0.75 },
  "Commercial":        { sales: 0.20, income: 0.80 },
  "Office":            { sales: 0.15, income: 0.85 },
  "Warehouse":         { sales: 0.15, income: 0.85 },
  "Land":              { sales: 1.00, income: 0.00 },
};

// Vision 2030 priority corridors (8% demand premium)
const V2030_DISTRICTS: Record<string, string[]> = {
  Riyadh: ["Al Olaya", "Al Sulaimaniyah", "Hitteen", "Al Nakheel"],
  Jeddah: ["Al Hamra", "Al Shati", "Al Zahraa"],
  Dammam: ["Al Shatea"],
  Khobar: ["Al Ulaya"],
};
const V2030_PREMIUM = 0.08;

// SAMA repo rate (Q1 2026)
const SAMA_REPO_RATE = 0.0600;
const SAMA_REPO_VINTAGE = "Q1 2026";

// Confidence scoring tables
const CITY_CONF: Record<string, number> = {
  Riyadh: 25, Jeddah: 22, Dammam: 18, Khobar: 17, Medina: 12, Makkah: 10, Abha: 8,
};
const TYPE_CONF: Record<string, number> = {
  "Residential Villa": 25, "Apartment": 23, "Commercial": 18,
  "Office": 15, "Land": 10, "Warehouse": 8,
};
const ACTIVITY_CONF: Record<string, Record<string, number>> = {
  Sale: { "Residential Villa": 25, "Apartment": 23, "Commercial": 17, "Office": 14, "Land": 10, "Warehouse": 8 },
  Rent: { "Residential Villa": 22, "Apartment": 20, "Commercial": 19, "Office": 16, "Land": 0, "Warehouse": 10 },
};

// ─── HELPER FUNCTIONS ─────────────────────────────────────────────────────────

function mortgageConstant(annualRate: number, years: number): number {
  const r = annualRate / 12;
  const n = years * 12;
  if (r === 0) return 1 / years;
  const factor = (r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
  return factor * 12; // annualised
}

function floorPremium(floorLevel: number | undefined): number {
  if (!floorLevel || floorLevel <= 0) return 1.00;
  if (floorLevel <= 2)  return 0.97;  // ground/2nd: slight discount
  if (floorLevel <= 5)  return 1.02;
  if (floorLevel <= 10) return 1.06;
  if (floorLevel <= 15) return 1.10;
  return 1.14; // 16+
}

function computeDepreciation(yearBuilt: number | undefined, propertyType: string): number {
  if (!yearBuilt || propertyType === "Land") return 1.0;
  const age = Math.max(0, new Date().getFullYear() - yearBuilt);
  // Land portion (assumed 30–40%) does not depreciate
  const bldgShare = ["Commercial", "Office", "Warehouse"].includes(propertyType) ? 0.60 : 0.70;
  let bldgFactor: number;
  if (age <= 5)       bldgFactor = 1.00;
  else if (age <= 10) bldgFactor = 0.92;
  else if (age <= 15) bldgFactor = 0.84;
  else if (age <= 20) bldgFactor = 0.76;
  else if (age <= 25) bldgFactor = 0.68;
  else if (age <= 30) bldgFactor = 0.60;
  else if (age <= 40) bldgFactor = 0.52;
  else                bldgFactor = 0.45;
  return (1 - bldgShare) + bldgShare * bldgFactor;
}

function rentDistrictMult(capitalDistrictMult: number): number {
  // Rent premiums are ~65% as volatile as capital value premiums
  return 1 + (capitalDistrictMult - 1) * 0.65;
}

function round1k(n: number): number { return Math.round(n / 1_000) * 1_000; }
function round10(n: number): number { return Math.round(n / 10) * 10; }

// Size adjustment: large assets trade at a per-sqm discount (thinner buyer pool,
// longer marketing time). Based on Saudi market transaction evidence.
function sizeAdjustmentFactor(size: number, propertyType: string): number {
  switch (propertyType) {
    case "Apartment":
      if (size < 80)   return 1.05;   // small units: premium per sqm
      if (size < 150)  return 1.00;   // base
      if (size < 300)  return 0.95;
      return 0.90;
    case "Residential Villa":
      if (size < 200)  return 1.00;
      if (size < 400)  return 1.00;
      if (size < 600)  return 0.95;
      return 0.92;
    case "Commercial":
      if (size < 100)  return 1.08;   // small shops command highest rate/sqm
      if (size < 300)  return 1.00;
      if (size < 700)  return 0.95;
      return 0.90;
    case "Office":
      if (size < 200)  return 1.03;
      if (size < 500)  return 1.00;
      if (size < 1000) return 0.96;
      return 0.92;
    case "Warehouse":
      if (size < 500)  return 1.00;
      if (size < 2000) return 0.95;
      return 0.90;
    case "Land":
      if (size < 500)   return 1.05;
      if (size < 1000)  return 1.00;
      if (size < 3000)  return 0.95;
      return 0.90;
    default:
      return 1.00;
  }
}

// ─── INCOME APPROACH ──────────────────────────────────────────────────────────

function computeIncomeApproach(
  propertyType: string,
  city: string,
  districtMult: number,
  condMult: number,
  floorMult: number,
  frontageMult: number,
  v2030Mult: number,
  size: number,
  salesCompValue: number
): IncomeApproach | null {
  if (propertyType === "Land") return null;
  const baseRentPSM = (MARKET_RENT_PSM[propertyType] ?? {})[city] ?? 0;
  if (baseRentPSM === 0) return null;

  // Rent adjusted for district, condition, floor/frontage, V2030, and size
  const rdm = rentDistrictMult(districtMult);
  const sizeAdj = sizeAdjustmentFactor(size, propertyType);
  const grossRentalIncome = baseRentPSM * rdm * condMult * floorMult * frontageMult * v2030Mult * sizeAdj * size;

  // City × type specific vacancy and cap rate
  const vacancyRate = (VACANCY_RATE[propertyType] ?? {})[city] ?? 0.10;
  const effectiveGrossIncome = grossRentalIncome * (1 - vacancyRate);
  const opexRatio = OPEX_RATIO[propertyType] ?? 0.25;
  const operatingExpenses = effectiveGrossIncome * opexRatio;
  const noi = effectiveGrossIncome - operatingExpenses;
  const capRate = (MARKET_CAP_RATE[propertyType] ?? {})[city] ?? 0.075;
  const incomeValue = capRate > 0 ? noi / capRate : 0;
  const impliedGrossYield = salesCompValue > 0 ? grossRentalIncome / salesCompValue : 0;

  return {
    grossRentalIncome: Math.round(grossRentalIncome),
    vacancyRate,
    effectiveGrossIncome: Math.round(effectiveGrossIncome),
    opexRatio,
    operatingExpenses: Math.round(operatingExpenses),
    noi: Math.round(noi),
    capRate,
    incomeValue: round1k(incomeValue),
    impliedGrossYield,
    capRateSource: `${city} ${propertyType} (Q1 2026)`,
    vacancySource: `${city} ${propertyType} market (Q1 2026)`,
  };
}

// ─── SENSITIVITY TABLE ────────────────────────────────────────────────────────

function buildCapRateSensitivity(noi: number, baseCapRate: number): SensitivityRow[] {
  const base = noi / baseCapRate;
  return [-100, -50, -25, 0, 25, 50, 100].map((bps) => {
    const cr = baseCapRate + bps / 10_000;
    if (cr <= 0.001) return null;
    const v = noi / cr;
    return {
      label: bps === 0 ? "Base" : `${bps > 0 ? "+" : ""}${bps}bps`,
      shiftValue: cr * 100,
      value: round1k(v),
      delta: round1k(v - base),
      deltaPercent: ((v - base) / base) * 100,
      isBase: bps === 0,
    };
  }).filter(Boolean) as SensitivityRow[];
}

function buildPriceSensitivity(baseValue: number): SensitivityRow[] {
  return [-15, -10, -5, 0, 5, 10, 15].map((pct) => ({
    label: pct === 0 ? "Base" : `${pct > 0 ? "+" : ""}${pct}%`,
    shiftValue: pct,
    value: round1k(baseValue * (1 + pct / 100)),
    delta: round1k(baseValue * pct / 100),
    deltaPercent: pct,
    isBase: pct === 0,
  }));
}

// ─── LTV & FINANCING ──────────────────────────────────────────────────────────

function computeLTV(reconciledValue: number, propertyType: string, noi: number | null): LTVAnalysis {
  const p = LTV_PARAMS[propertyType] ?? LTV_PARAMS["Commercial"];
  const impliedMaxLoan = reconciledValue * p.samaMax;
  const forcedSaleValue = reconciledValue * (1 - p.fsHaircut);
  const annConst = mortgageConstant(p.lendingRate, 20);
  const annualDebtService = impliedMaxLoan * annConst;

  let dscr: number | null = null;
  let dscrFlag: "pass" | "warn" | "fail" | null = null;
  if (noi && noi > 0 && annualDebtService > 0) {
    dscr = Math.round((noi / annualDebtService) * 100) / 100;
    dscrFlag = dscr >= 1.25 ? "pass" : dscr >= 1.00 ? "warn" : "fail";
  }

  return {
    samaMaxLTV: p.samaMax,
    impliedMaxLoan: round1k(impliedMaxLoan),
    forcedSaleValue: round1k(forcedSaleValue),
    fsHaircut: p.fsHaircut,
    lendingRate: p.lendingRate,
    annualDebtService: round1k(annualDebtService),
    dscr,
    dscrFlag,
  };
}

// ─── CONFIDENCE SCORING ───────────────────────────────────────────────────────

function computeConfidence(
  city: string, district: string, propertyType: string, transactionType: string
): ConfidenceDetail {
  const cityScore = CITY_CONF[city] ?? 5;
  const distMult = DISTRICT_MULT[city]?.[district] ?? 1.0;
  const districtScore = distMult >= 1.3 ? 25 : distMult >= 1.1 ? 20 : distMult >= 0.9 ? 15 : 10;
  const propertyTypeScore = TYPE_CONF[propertyType] ?? 8;
  const marketActivityScore = (ACTIVITY_CONF[transactionType] ?? {})[propertyType] ?? 8;

  const score = cityScore + districtScore + propertyTypeScore + marketActivityScore;
  const level: "High" | "Medium" | "Low" = score >= 75 ? "High" : score >= 45 ? "Medium" : "Low";

  const explanation = [
    `City (${city}): ${cityScore}/25 — ${cityScore >= 20 ? "major hub, deep transaction pool" : cityScore >= 12 ? "secondary market, moderate data" : "emerging market, sparse data"}.`,
    `District (${district}): ${districtScore}/25 — ${districtScore >= 20 ? "premium, heavily traded" : districtScore >= 15 ? "moderate activity" : "limited comparable transactions"}.`,
    `Asset type (${propertyType}): ${propertyTypeScore}/25 — ${propertyTypeScore >= 20 ? "high-liquidity segment" : propertyTypeScore >= 14 ? "moderate liquidity" : "specialist/thin market"}.`,
    `Transaction type (${transactionType}): ${marketActivityScore}/25 — ${marketActivityScore >= 20 ? "active comp pool" : marketActivityScore >= 14 ? "moderate comp availability" : "limited market evidence"}.`,
  ];

  return { score, level, cityScore, districtScore, propertyTypeScore, marketActivityScore, explanation };
}

// ─── TAQEEM FLAGS ─────────────────────────────────────────────────────────────

function generateTaqeemFlags(
  reconciledValue: number,
  salesCompValue: number,
  incomeApproach: IncomeApproach | null,
  propertyType: string,
  city: string,
  size: number,
  ltvAnalysis: LTVAnalysis,
  yearBuilt: number | undefined
): TaqeemFlag[] {
  const flags: TaqeemFlag[] = [];

  if (reconciledValue >= 5_000_000) {
    flags.push({ level: "required", code: "TQ-001",
      message: "Transaction ≥ SAR 5M: TAQEEM-certified appraisal required under REGA regulations before any financing or formal transfer." });
  } else if (reconciledValue >= 1_000_000) {
    flags.push({ level: "warning", code: "TQ-002",
      message: "Transaction ≥ SAR 1M: independent TAQEEM valuation strongly recommended for lender underwriting or formal title transfer." });
  }

  if (city === "Makkah" || city === "Medina") {
    flags.push({ level: "required", code: "TQ-003",
      message: `Holy City (${city}): non-Saudi ownership subject to Royal Decree M/49 restrictions. REGA pre-clearance required; foreign investor eligibility must be confirmed.` });
  }

  if (["Commercial", "Office"].includes(propertyType) && size > 500) {
    flags.push({ level: "warning", code: "TQ-004",
      message: `${propertyType} > 500 sqm: municipal zoning approval and REGA transaction registration required prior to execution.` });
  }

  if (yearBuilt && (new Date().getFullYear() - yearBuilt) > 30) {
    flags.push({ level: "warning", code: "TQ-005",
      message: `Property age ${new Date().getFullYear() - yearBuilt} years: independent structural survey and municipality inspection recommended before valuation reliance.` });
  }

  if (ltvAnalysis.dscr !== null && ltvAnalysis.dscr < 1.25) {
    flags.push({ level: "warning", code: "TQ-006",
      message: `DSCR ${ltvAnalysis.dscr.toFixed(2)}x is below the SAMA minimum threshold of 1.25x. Commercial lending at standard LTV ratios is likely constrained.` });
  }

  // Approach divergence signal
  if (incomeApproach && salesCompValue > 0) {
    const gap = Math.abs(salesCompValue - incomeApproach.incomeValue) / salesCompValue;
    if (gap > 0.25) {
      flags.push({ level: "warning", code: "TQ-007",
        message: `High approach divergence: sales comparison (SAR ${salesCompValue.toLocaleString()}) vs income approach (SAR ${incomeApproach.incomeValue.toLocaleString()}) differ by ${Math.round(gap * 100)}%. Indicates market pricing is running ${salesCompValue > incomeApproach.incomeValue ? "ahead of" : "below"} income fundamentals.` });
    }
  }

  flags.push({ level: "info", code: "TQ-INFO",
    message: "Estimate uses deterministic comparable and income logic (Q1 2026 data). Does not constitute a TAQEEM-compliant appraisal. Not suitable for formal financing, litigation, or regulatory filings without independent verification." });

  return flags;
}

// ─── MARKET CONTEXT ───────────────────────────────────────────────────────────

function buildMarketContext(
  _propertyType: string, city: string, district: string, capRate: number | null
): MarketContext {
  const yieldSpread = capRate !== null && capRate > 0 ? capRate - SAMA_REPO_RATE : null;

  const v2030Districts = V2030_DISTRICTS[city] ?? [];
  const isV2030 = v2030Districts.includes(district);

  let spreadComment = "";
  if (yieldSpread === null) {
    spreadComment = "Income yield not applicable for this asset type or transaction.";
  } else if (yieldSpread < 0.010) {
    spreadComment = `Yield spread <100bps over SAMA repo (${(SAMA_REPO_RATE * 100).toFixed(2)}%) — elevated cap rate compression risk; asset is priced like a quasi-bond. Monitor rate sensitivity closely.`;
  } else if (yieldSpread < 0.015) {
    spreadComment = `Yield spread 100–150bps over repo — thin risk premium. Any rate hike of 25bps would materially reprice this asset. LP and pension funds typically require 200bps+ spread.`;
  } else if (yieldSpread < 0.025) {
    spreadComment = `Yield spread 150–250bps over repo — within acceptable institutional range. Suitable for income-focused mandates.`;
  } else {
    spreadComment = `Yield spread >250bps over repo — attractive relative to risk-free rate. Consistent with value-add or opportunistic return expectations.`;
  }

  return {
    samaRepoRate: SAMA_REPO_RATE,
    rateVintage: SAMA_REPO_VINTAGE,
    impliedCapRateFloor: SAMA_REPO_RATE + 0.015,
    yieldSpread,
    spreadComment,
    vision2030Flag: isV2030
      ? `${district}, ${city} is within a Vision 2030 priority development corridor. Structural demand support from government infrastructure investment (giga-projects, Riyadh Metro Phase 2, Diriyah Gate). Applied +${Math.round(V2030_PREMIUM * 100)}% demand premium.`
      : null,
    vision2030Premium: isV2030 ? V2030_PREMIUM : 0,
  };
}

// ─── MAIN FUNCTION ────────────────────────────────────────────────────────────

export function computeValuation(input: PropertyInput): ValuationResult {
  const { city, district, propertyType, size, condition, transactionType, yearBuilt, floorLevel, hasStreetFrontage } = input;

  const cityBase = CITY_BASE[city] ?? 5_000;
  const districtMult = DISTRICT_MULT[city]?.[district] ?? 1.0;
  const typeMult = PROPERTY_TYPE_MULT[propertyType] ?? 1.0;
  const condMult = CONDITION_MULT[condition] ?? 1.0;
  const floorMult = propertyType === "Apartment" ? floorPremium(floorLevel) : 1.0;
  const frontageMult = propertyType === "Commercial" && hasStreetFrontage ? 1.25 : 1.0;
  const v2030Mult = (V2030_DISTRICTS[city] ?? []).includes(district) ? (1 + V2030_PREMIUM) : 1.0;
  const depFactor = computeDepreciation(yearBuilt, propertyType);
  const sizeAdj = sizeAdjustmentFactor(size, propertyType);

  // ── Sales comparison ──
  const pricePerSqm = cityBase * districtMult * typeMult * condMult * floorMult * frontageMult * v2030Mult * depFactor * sizeAdj;
  const salesCompValue = pricePerSqm * size;

  // ── Confidence ──
  const confidence = computeConfidence(city, district, propertyType, transactionType);
  const spread = confidence.level === "High" ? 0.12 : confidence.level === "Medium" ? 0.22 : 0.35;
  const salesCompLow = round1k(salesCompValue * (1 - spread));
  const salesCompHigh = round1k(salesCompValue * (1 + spread));

  // ── Income approach ──
  const incomeApproach = computeIncomeApproach(
    propertyType, city, districtMult, condMult, floorMult, frontageMult, v2030Mult, size, salesCompValue
  );

  // ── Reconciliation ──
  const weights = transactionType === "Rent"
    ? (APPROACH_WEIGHTS_RENT[propertyType] ?? { sales: 0.50, income: 0.50 })
    : (APPROACH_WEIGHTS_SALE[propertyType] ?? { sales: 0.60, income: 0.40 });

  const reconciledValue = incomeApproach && incomeApproach.incomeValue > 0
    ? weights.sales * salesCompValue + weights.income * incomeApproach.incomeValue
    : salesCompValue;

  const reconciledLow = round1k(reconciledValue * (1 - spread));
  const reconciledHigh = round1k(reconciledValue * (1 + spread));

  // ── Sensitivity ──
  const useCapRate = !!(incomeApproach && incomeApproach.noi > 0 && incomeApproach.capRate > 0);
  const sensitivityTable = useCapRate
    ? buildCapRateSensitivity(incomeApproach!.noi, incomeApproach!.capRate)
    : buildPriceSensitivity(reconciledValue);
  const sensitivityType: "cap_rate" | "price" = useCapRate ? "cap_rate" : "price";

  // ── LTV ──
  const ltvAnalysis = computeLTV(reconciledValue, propertyType, incomeApproach?.noi ?? null);

  // ── Depreciation note ──
  let depreciationNote: string | null = null;
  if (yearBuilt && depFactor < 1.0) {
    const age = new Date().getFullYear() - yearBuilt;
    depreciationNote = `Age ${age} yrs — ${Math.round((1 - depFactor) * 100)}% depreciation applied to building component (${["Commercial", "Office", "Warehouse"].includes(propertyType) ? "60%" : "70%"} of value); land portion excluded.`;
  }

  // ── Market context ──
  const marketContext = buildMarketContext(propertyType, city, district, incomeApproach?.capRate ?? null);

  // ── TAQEEM flags ──
  const taqeemFlags = generateTaqeemFlags(
    reconciledValue, salesCompValue, incomeApproach, propertyType, city, size, ltvAnalysis, yearBuilt
  );

  // ── Reasoning ──
  const reasoning: string[] = [
    `Comparable base for ${city}: SAR ${cityBase.toLocaleString()}/sqm (Q1 2026).`,
    `${district} location adjustment: ${districtMult >= 1 ? "+" : ""}${Math.round((districtMult - 1) * 100)}% → SAR ${round10(cityBase * districtMult).toLocaleString()}/sqm.`,
    `${propertyType}: ${Math.round(typeMult * 100)}% of residential villa benchmark per sqm.`,
    `${condition} condition: ${condMult >= 1 ? "+" : ""}${Math.round((condMult - 1) * 100)}% quality adjustment.`,
    ...(floorMult !== 1.0 ? [`Floor ${floorLevel} premium: ${floorMult >= 1 ? "+" : ""}${Math.round((floorMult - 1) * 100)}%.`] : []),
    ...(frontageMult !== 1.0 ? [`Corner/street frontage premium: +${Math.round((frontageMult - 1) * 100)}%.`] : []),
    ...(v2030Mult !== 1.0 ? [`Vision 2030 corridor premium (${district}): +${Math.round((v2030Mult - 1) * 100)}%.`] : []),
    ...(sizeAdj !== 1.0 ? [`Size adjustment (${size} sqm, ${propertyType}): ${sizeAdj >= 1 ? "+" : ""}${Math.round((sizeAdj - 1) * 100)}% — ${sizeAdj > 1 ? "small unit premium" : "large asset per-sqm discount"}.`] : []),
    ...(depFactor < 1.0 ? [`Depreciation factor: ${depFactor.toFixed(3)} (building age adjustment).`] : []),
    `Sales comparison value: SAR ${round1k(salesCompValue).toLocaleString()} (SAR ${round10(pricePerSqm).toLocaleString()}/sqm × ${size} sqm).`,
    ...(incomeApproach ? [
      `Income approach: NOI SAR ${incomeApproach.noi.toLocaleString()} ÷ ${(incomeApproach.capRate * 100).toFixed(2)}% cap rate (${incomeApproach.capRateSource}) = SAR ${incomeApproach.incomeValue.toLocaleString()}.`,
      `Vacancy applied: ${Math.round(incomeApproach.vacancyRate * 100)}% (${incomeApproach.vacancySource}).`,
      `Implied gross yield (GRI/sales comp): ${(incomeApproach.impliedGrossYield * 100).toFixed(2)}%.`,
      `Reconciled: ${Math.round(weights.sales * 100)}% sales comparison + ${Math.round(weights.income * 100)}% income → SAR ${round1k(reconciledValue).toLocaleString()}.`,
    ] : []),
  ];

  // ── Governance warning ──
  let governanceWarning: string | null = null;
  if (city === "Makkah" || city === "Medina") {
    governanceWarning = "Properties in the Holy Cities are subject to strict foreign ownership restrictions under Saudi law. Transactions require REGA pre-clearance and may need Ministry of Investment approval.";
  } else if (size > 800 && propertyType === "Commercial") {
    governanceWarning = "Large commercial assets >800 sqm may require REGA pre-approval and municipal planning clearance before execution.";
  } else if (condition === "Poor" && salesCompValue > 2_000_000) {
    governanceWarning = "High-value property in poor condition may trigger Vision 2030 mandatory inspection standards and affect lender underwriting.";
  }

  const caveat = "Directional estimate only. Derived from deterministic comparable and income logic against Q1 2026 data. Does not constitute a TAQEEM-certified appraisal, does not incorporate live REGA transaction data, and must not be relied upon for formal financing, litigation, or regulatory filings. All outputs require independent verification by a REGA-licensed valuator.";

  return {
    salesCompValue: round1k(salesCompValue),
    salesCompLow,
    salesCompHigh,
    pricePerSqm: round10(pricePerSqm),
    incomeApproach,
    reconciledValue: round1k(reconciledValue),
    reconciledLow,
    reconciledHigh,
    salesCompWeight: weights.sales,
    incomeWeight: weights.income,
    sensitivityTable,
    sensitivityType,
    ltvAnalysis,
    depreciationFactor: depFactor,
    depreciationNote,
    confidence,
    taqeemFlags,
    marketContext,
    reasoning,
    governanceWarning,
    caveat,
    // legacy aliases
    rangeLow: reconciledLow,
    rangeHigh: reconciledHigh,
    // provenance
    benchmarkSourceId: VALUATION_SOURCE_ID,
  };
}

// ─── SAMPLE SCENARIOS ─────────────────────────────────────────────────────────

export const SAMPLE_SCENARIOS: Array<{ label: string; description: string; input: PropertyInput }> = [
  {
    label: "Riyadh Premium Villa",
    description: "Al Olaya luxury residential",
    input: { city: "Riyadh", district: "Al Olaya", propertyType: "Residential Villa", size: 500, condition: "Excellent", transactionType: "Sale" },
  },
  {
    label: "Jeddah Apartment",
    description: "Mid-range coastal unit",
    input: { city: "Jeddah", district: "Al Rawdah", propertyType: "Apartment", size: 150, condition: "Good", transactionType: "Sale" },
  },
  {
    label: "Dammam Commercial",
    description: "Eastern Province retail — income analysis",
    input: { city: "Dammam", district: "Al Shatea", propertyType: "Commercial", size: 220, condition: "Good", transactionType: "Rent" },
  },
];
