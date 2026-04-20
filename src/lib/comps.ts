// ─── COMPARABLE TRANSACTIONS REPOSITORY ───────────────────────────────────────
//
// Model, CRUD, query helpers, and demo seed for the comps repository.
// Persistence: localStorage["aouj_comps_v1"] (JSON object keyed by comp ID).
// Demo seed:   runs once on first load, flagged by "aouj_comps_seeded_v1".
//
// Provenance: each comp carries its own verificationStatus + confidenceScore
// (from the Step 0 VerificationStatus union). The source field is the
// human-readable origin ("REGA", "Agent", etc.).

import { VerificationStatus } from "./sources";

// ── Model ─────────────────────────────────────────────────────────────────────

export interface Comp {
  id:                  string;
  // Asset identification
  assetName:           string;
  city:                string;
  district:            string;
  assetType:           string;
  area:                number;          // sqm
  // Transaction
  transactionDate:     string;          // YYYY-MM-DD
  transactionValue:    number;          // SAR total
  psmPrice:            number;          // derived: transactionValue / area
  // Evidence metadata
  source:              string;          // "REGA" | "Agent" | "Broker" | "Aqar" | etc.
  notes:               string;
  // Provenance — aligned with Step 0 VerificationStatus union
  verificationStatus:  VerificationStatus;
  confidenceScore:     number;          // 0–100
  isObserved:          boolean;         // true = directly witnessed transaction, false = inferred/estimated
  // System
  createdAt:           string;          // ISO timestamp
  isDemo:              boolean;
}

// ── Source types available when entering a comp ───────────────────────────────

export const COMP_SOURCES = [
  "REGA", "Agent", "Broker", "Aqar", "Bayut",
  "Property Finder", "Transaction Record", "Other",
] as const;

// ── Persistence ───────────────────────────────────────────────────────────────

const STORAGE_KEY = "aouj_comps_v1";
const SEED_FLAG   = "aouj_comps_seeded_v1";

export function loadComps(): Record<string, Comp> {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}");
  } catch { return {}; }
}

/** All comps sorted by transaction date descending (newest first). */
export function getAllComps(): Comp[] {
  return Object.values(loadComps()).sort(
    (a, b) => b.transactionDate.localeCompare(a.transactionDate)
  );
}

export function saveComp(comp: Comp): void {
  const all = loadComps();
  all[comp.id] = comp;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
}

export function deleteComp(id: string): void {
  const all = loadComps();
  delete all[id];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
}

export function generateCompId(): string {
  return `comp_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

// ── Query helpers ─────────────────────────────────────────────────────────────

/**
 * Returns comps matching city + assetType for the screener reference panel.
 * Excludes demo comps by default — they are labelled but not used in analysis.
 */
export function getCompsForScreen(
  city: string,
  assetType: string,
  includeDemo = false,
): Comp[] {
  return getAllComps().filter(
    c =>
      c.city === city &&
      c.assetType === assetType &&
      (includeDemo || !c.isDemo)
  );
}

// ── Demo seed ─────────────────────────────────────────────────────────────────

function makeDemo(
  partial: Omit<Comp, "id" | "psmPrice" | "createdAt" | "isDemo">,
): Comp {
  return {
    ...partial,
    id:       `demo_comp_${partial.assetName.replace(/\W+/g, "_").toLowerCase().slice(0, 32)}`,
    psmPrice: Math.round(partial.transactionValue / partial.area),
    createdAt: new Date().toISOString(),
    isDemo:    true,
  };
}

const DEMO_COMPS: Comp[] = [
  // ── Riyadh — Office ─────────────────────────────────────────────────────────
  makeDemo({
    assetName:       "Al Olaya Tower — Floor 8 Office Suite",
    city: "Riyadh",  district: "Al Olaya",   assetType: "Office",
    area: 650,       transactionDate: "2025-11-10",
    transactionValue: 9_100_000,
    source: "REGA",
    notes: "Registered title deed transfer. Grade A office, fully fitted, direct lift lobby access.",
    verificationStatus: "verified", confidenceScore: 90, isObserved: true,
  }),

  // ── Riyadh — Commercial ─────────────────────────────────────────────────────
  makeDemo({
    assetName:       "Al Sulaimaniyah Commercial Strip",
    city: "Riyadh",  district: "Al Sulaimaniyah", assetType: "Commercial",
    area: 920,       transactionDate: "2025-09-22",
    transactionValue: 14_720_000,
    source: "Broker",
    notes: "Street frontage, 3 retail units on ground floor. Broker confirmed off-market deal. No lease back.",
    verificationStatus: "user_entered", confidenceScore: 70, isObserved: true,
  }),

  // ── Riyadh — Residential Villa ───────────────────────────────────────────────
  makeDemo({
    assetName:       "Hitteen Villa — Corner Plot",
    city: "Riyadh",  district: "Hitteen",    assetType: "Residential Villa",
    area: 480,       transactionDate: "2025-10-05",
    transactionValue: 5_280_000,
    source: "Agent",
    notes: "Owner-occupier sale. No lease in place. Agent-quoted asking price — final settlement unconfirmed.",
    verificationStatus: "user_entered", confidenceScore: 62, isObserved: false,
  }),
  makeDemo({
    assetName:       "Al Nakheel Residential Villa — REGA Registered",
    city: "Riyadh",  district: "Al Nakheel", assetType: "Residential Villa",
    area: 750,       transactionDate: "2025-08-15",
    transactionValue: 9_375_000,
    source: "REGA",
    notes: "REGA-registered transaction. Deed transfer confirmed. Seller: private individual.",
    verificationStatus: "verified", confidenceScore: 93, isObserved: true,
  }),

  // ── Jeddah — Commercial ─────────────────────────────────────────────────────
  makeDemo({
    assetName:       "Al Hamra Mixed-Use Ground Floor Block",
    city: "Jeddah",  district: "Al Hamra",   assetType: "Commercial",
    area: 1_100,     transactionDate: "2025-12-01",
    transactionValue: 17_600_000,
    source: "REGA",
    notes: "Institutional sale. Three retail tenants. Anchor F&B lease 4yr remaining. Full REGA disclosure.",
    verificationStatus: "verified", confidenceScore: 88, isObserved: true,
  }),

  // ── Khobar — Warehouse ───────────────────────────────────────────────────────
  makeDemo({
    assetName:       "Al Hamraa Logistics Facility",
    city: "Khobar",  district: "Al Hamraa",  assetType: "Warehouse",
    area: 2_800,     transactionDate: "2025-07-18",
    transactionValue: 8_120_000,
    source: "Broker",
    notes: "Second-hand logistics facility. Roof remediation required (est. SAR 400K). Yield est. 6.8% gross.",
    verificationStatus: "estimated", confidenceScore: 55, isObserved: false,
  }),

  // ── Jeddah — Office ─────────────────────────────────────────────────────────
  makeDemo({
    assetName:       "Al Zahraa Office Park — Unit B4",
    city: "Jeddah",  district: "Al Zahraa",  assetType: "Office",
    area: 420,       transactionDate: "2025-06-30",
    transactionValue: 5_040_000,
    source: "Aqar",
    notes: "Price inferred from Aqar listing. Final settlement price unconfirmed — treat as indicative.",
    verificationStatus: "estimated", confidenceScore: 48, isObserved: false,
  }),

  // ── Dammam — Commercial ─────────────────────────────────────────────────────
  makeDemo({
    assetName:       "Al Faisaliyah Retail Unit — F&B Anchor",
    city: "Dammam",  district: "Al Faisaliyah", assetType: "Commercial",
    area: 380,       transactionDate: "2025-10-28",
    transactionValue: 3_800_000,
    source: "Agent",
    notes: "Single retail unit. Anchor tenant: food & beverage operator. Agent-confirmed transaction.",
    verificationStatus: "user_entered", confidenceScore: 67, isObserved: true,
  }),
];

export function seedDemoComps(): void {
  if (localStorage.getItem(SEED_FLAG)) return;
  const all = loadComps();
  for (const comp of DEMO_COMPS) {
    if (!all[comp.id]) all[comp.id] = comp;
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
  localStorage.setItem(SEED_FLAG, "1");
}

// ── Imported comps — Manus extraction batch v1 ────────────────────────────────
// Source: REGA public transaction disclosures (3 records) + Aqar listings (12 records).
// REGA records: verified confirmed sale transactions.
// Aqar records: listing proxies — prices are asking/listed, not confirmed settlement.
// Asset type mapping from CSV: residential→Residential Villa, apartment building→Apartment,
// mixed-use→Commercial. Districts stored as sourced — some are outside the screener
// dropdown but stored verbatim and match at city level.

const IMPORT_SEED_FLAG = "aouj_comps_seeded_v2";

function makeImported(
  partial: Omit<Comp, "id" | "psmPrice" | "createdAt" | "isDemo">,
): Comp {
  return {
    ...partial,
    id:       `imported_${partial.assetName.replace(/\W+/g, "_").toLowerCase().slice(0, 40)}`,
    psmPrice: Math.round(partial.transactionValue / partial.area),
    createdAt: new Date().toISOString(),
    isDemo:    false,
  };
}

const IMPORTED_COMPS: Comp[] = [
  // ── REGA verified transactions ─────────────────────────────────────────────
  makeImported({
    assetName: "REGA Sale — Al Malqa Residential",
    city: "Riyadh", district: "Al Malqa", assetType: "Residential Villa",
    area: 450, transactionDate: "2025-06-20", transactionValue: 3_200_000,
    source: "REGA",
    notes: "Confirmed REGA-registered sale transaction.",
    verificationStatus: "verified", confidenceScore: 85, isObserved: true,
  }),
  makeImported({
    assetName: "REGA Sale — Al Rawdah Apartment Building",
    city: "Jeddah", district: "Al Rawdah", assetType: "Apartment",
    area: 1_200, transactionDate: "2025-05-15", transactionValue: 12_500_000,
    source: "REGA",
    notes: "Confirmed REGA-registered sale transaction.",
    verificationStatus: "verified", confidenceScore: 85, isObserved: true,
  }),
  makeImported({
    assetName: "REGA Sale — Al Shatea Land",
    city: "Dammam", district: "Al Shatea", assetType: "Land",
    area: 800, transactionDate: "2025-04-10", transactionValue: 2_400_000,
    source: "REGA",
    notes: "Confirmed REGA-registered sale transaction.",
    verificationStatus: "verified", confidenceScore: 85, isObserved: true,
  }),

  // ── Aqar listing proxies ───────────────────────────────────────────────────
  makeImported({
    assetName: "Commercial Building — Al Manar",
    city: "Riyadh", district: "Al Manar", assetType: "Apartment",
    area: 870, transactionDate: "2026-04-20", transactionValue: 10_500_000,
    source: "Aqar",
    notes: "Listing proxy. 11 halls with mezzanines. 2 years old. Price not confirmed settlement.",
    verificationStatus: "estimated", confidenceScore: 50, isObserved: false,
  }),
  makeImported({
    assetName: "Building Okaz",
    city: "Riyadh", district: "Okaz", assetType: "Apartment",
    area: 132, transactionDate: "2026-04-20", transactionValue: 500_000,
    source: "Aqar",
    notes: "Listing proxy. Price not confirmed settlement.",
    verificationStatus: "estimated", confidenceScore: 45, isObserved: false,
  }),
  makeImported({
    assetName: "Investment Building — Al Janadriyah",
    city: "Riyadh", district: "Al Janadriyah", assetType: "Apartment",
    area: 2_343, transactionDate: "2026-04-20", transactionValue: 27_000_000,
    source: "Aqar",
    notes: "Listing proxy. 86 studios, 8 shops. 5 years old.",
    verificationStatus: "estimated", confidenceScore: 50, isObserved: false,
  }),
  makeImported({
    assetName: "Building Al Misfat — 37 Units",
    city: "Riyadh", district: "Al Misfat", assetType: "Apartment",
    area: 3_000, transactionDate: "2026-04-20", transactionValue: 10_000_000,
    source: "Aqar",
    notes: "Listing proxy. 37 residential units.",
    verificationStatus: "estimated", confidenceScore: 45, isObserved: false,
  }),
  makeImported({
    assetName: "Building Badr",
    city: "Riyadh", district: "Badr", assetType: "Apartment",
    area: 1_000, transactionDate: "2026-04-20", transactionValue: 9_000_000,
    source: "Aqar",
    notes: "Listing proxy. Price not confirmed settlement.",
    verificationStatus: "estimated", confidenceScore: 45, isObserved: false,
  }),
  makeImported({
    assetName: "Building Al Faisaliyah (Riyadh)",
    city: "Riyadh", district: "Al Faisaliyah", assetType: "Apartment",
    area: 3_000, transactionDate: "2026-04-20", transactionValue: 18_000_000,
    source: "Aqar",
    notes: "Listing proxy. Price not confirmed settlement.",
    verificationStatus: "estimated", confidenceScore: 45, isObserved: false,
  }),
  makeImported({
    assetName: "Commercial Plot — As Saadah",
    city: "Riyadh", district: "As Saadah", assetType: "Land",
    area: 200, transactionDate: "2026-04-20", transactionValue: 600_000,
    source: "Aqar",
    notes: "Listing proxy. Commercial plot.",
    verificationStatus: "estimated", confidenceScore: 45, isObserved: false,
  }),
  makeImported({
    assetName: "Mixed-Use Building — Al Marwah",
    city: "Riyadh", district: "Al Marwah", assetType: "Commercial",
    area: 1_003, transactionDate: "2026-04-20", transactionValue: 3_500_000,
    source: "Aqar",
    notes: "Listing proxy. Commercial building + residential villa.",
    verificationStatus: "estimated", confidenceScore: 45, isObserved: false,
  }),
  makeImported({
    assetName: "Apartment Complex — Ar Rimal",
    city: "Riyadh", district: "Ar Rimal", assetType: "Apartment",
    area: 600, transactionDate: "2026-04-20", transactionValue: 4_000_000,
    source: "Aqar",
    notes: "Listing proxy. Apartment complex.",
    verificationStatus: "estimated", confidenceScore: 45, isObserved: false,
  }),
  makeImported({
    assetName: "Building Ad Dar Al Baida — 19 Units",
    city: "Riyadh", district: "Ad Dar Al Baida", assetType: "Apartment",
    area: 1_260, transactionDate: "2026-04-20", transactionValue: 8_400_000,
    source: "Aqar",
    notes: "Listing proxy. 19 residential units.",
    verificationStatus: "estimated", confidenceScore: 50, isObserved: false,
  }),
  makeImported({
    assetName: "Building Al Faruq — Mixed Use",
    city: "Riyadh", district: "Al Faruq", assetType: "Commercial",
    area: 1_180, transactionDate: "2026-04-20", transactionValue: 7_000_000,
    source: "Aqar",
    notes: "Listing proxy.",
    verificationStatus: "estimated", confidenceScore: 45, isObserved: false,
  }),
  makeImported({
    assetName: "Office Building — An Narjis",
    city: "Riyadh", district: "An Narjis", assetType: "Office",
    area: 2_200, transactionDate: "2026-04-20", transactionValue: 84_000_000,
    source: "Aqar",
    notes: "Listing proxy. Premium office building. PSM (38,182) is a significant outlier — verify before using in analysis.",
    verificationStatus: "estimated", confidenceScore: 35, isObserved: false,
  }),
];

export function seedImportedComps(): void {
  if (localStorage.getItem(IMPORT_SEED_FLAG)) return;
  const all = loadComps();
  for (const comp of IMPORTED_COMPS) {
    if (!all[comp.id]) all[comp.id] = comp;
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
  localStorage.setItem(IMPORT_SEED_FLAG, "1");
}
