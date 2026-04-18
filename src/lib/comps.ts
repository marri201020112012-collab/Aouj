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
