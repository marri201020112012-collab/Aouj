// ─── SOURCE REGISTRY + PROVENANCE LAYER ──────────────────────────────────────
//
// Every benchmark, comp, rate, and user-entered record in AOUJ references a
// DataSource. This module owns the model, the static registry, and helpers
// that badge components and data consumers use.
//
// Persistence:
//   - Static seeds (government rates, model estimates, demo) live here in-memory.
//   - User-entered sources will be stored in localStorage under "aouj_sources_v1"
//     when that feature is built (Step 1+).
//   - The registry is merged at load time: static seeds + localStorage entries.
//
// Do not import from this module inside valuation.ts (avoids circular deps).
// valuation.ts exports SOURCE_IDs as string constants instead.

// ── Union types ───────────────────────────────────────────────────────────────

export type SourceType =
  | "government_registry"   // REGA, Baladiya, municipality records
  | "government_disclosure" // REGA quarterly transaction disclosures
  | "regulatory_rate"       // SAMA monetary policy, LTV circulars
  | "market_survey"         // CBRE, JLL, Colliers, local research house
  | "listing_platform"      // Aqar, Bayut, Property Finder
  | "auction_record"        // court or government auction outcomes
  | "user_entered"          // analyst-entered comp or override
  | "model_estimate"        // AOUJ internal deterministic model
  | "demo";                 // demonstration / seed data only

export type VerificationStatus =
  | "verified"              // confirmed against primary, authoritative source
  | "estimated"             // derived or modelled — not independently verified
  | "user_entered"          // analyst-provided — trusted but unverified
  | "demo";                 // not for production use

export type CollectionMethod =
  | "api"                   // live or batch API pull
  | "manual_entry"          // typed in by analyst or admin
  | "web_scrape"            // automated scrape
  | "model_derivation"      // computed by internal model
  | "import";               // bulk file import (CSV, Excel)

// ── Core model ────────────────────────────────────────────────────────────────

export interface DataSource {
  id:                      string;
  source_type:             SourceType;
  source_name:             string;
  external_reference?:     string;    // e.g. "REGA Q4 2025 Transaction Report"
  source_url?:             string;    // canonical URL if public
  collection_method:       CollectionMethod;
  observed_date:           string;    // ISO date — when the data was observed
  effective_date:          string;    // ISO date — when the data became effective
  country:                 string;    // ISO-3166 alpha-2, "SA"
  city?:                   string;
  district?:               string;
  asset_type?:             string;
  verification_status:     VerificationStatus;
  confidence_score:        number;    // 0–100; affects how UI displays uncertainty
  access_or_license_notes?: string;
}

// ── Badge config (used by ProvenanceBadge component) ─────────────────────────

export interface BadgeConfig {
  label:  string;
  color:  string;   // tailwind text class
  bg:     string;   // tailwind bg class
  border: string;   // tailwind border class
  dot:    string;   // tailwind bg class for dot
}

export function getBadgeConfig(status: VerificationStatus): BadgeConfig {
  switch (status) {
    case "verified":
      return {
        label:  "Verified",
        color:  "text-emerald-400",
        bg:     "bg-emerald-900/30",
        border: "border-emerald-700/50",
        dot:    "bg-emerald-400",
      };
    case "estimated":
      return {
        label:  "Estimated",
        color:  "text-amber-400",
        bg:     "bg-amber-900/20",
        border: "border-amber-700/40",
        dot:    "bg-amber-400",
      };
    case "user_entered":
      return {
        label:  "User-entered",
        color:  "text-blue-400",
        bg:     "bg-blue-900/20",
        border: "border-blue-700/40",
        dot:    "bg-blue-400",
      };
    case "demo":
      return {
        label:  "Demo",
        color:  "text-muted-foreground",
        bg:     "bg-secondary/60",
        border: "border-border",
        dot:    "bg-muted-foreground/50",
      };
  }
}

// ── Static registry ───────────────────────────────────────────────────────────
// These are the authoritative static seeds. Never mutate this object at runtime.
// User-entered sources are merged in via loadRegistry() below.

const STATIC_REGISTRY: Record<string, DataSource> = {

  // ── AOUJ internal model ───────────────────────────────────────────────────
  "aouj-model-q1-2026": {
    id:                   "aouj-model-q1-2026",
    source_type:          "model_estimate",
    source_name:          "AOUJ Market Model",
    external_reference:   "Q1 2026 Analyst Calibration",
    collection_method:    "model_derivation",
    observed_date:        "2026-01-01",
    effective_date:       "2026-01-01",
    country:              "SA",
    verification_status:  "estimated",
    confidence_score:     50,
    access_or_license_notes:
      "Deterministic model calibrated against publicly available REGA transaction " +
      "summaries and Ejar market reports. Not independently verified. " +
      "Not suitable for formal financing, litigation, or regulatory filings.",
  },

  // ── SAMA monetary policy rate ─────────────────────────────────────────────
  "sama-repo-q1-2026": {
    id:                   "sama-repo-q1-2026",
    source_type:          "regulatory_rate",
    source_name:          "SAMA Repo Rate",
    external_reference:   "SAMA Monetary Policy Committee, Q1 2026",
    source_url:           "https://www.sama.gov.sa",
    collection_method:    "manual_entry",
    observed_date:        "2026-01-15",
    effective_date:       "2026-01-15",
    country:              "SA",
    verification_status:  "verified",
    confidence_score:     99,
    access_or_license_notes:
      "Public regulatory rate. Updated each SAMA MPC meeting. " +
      "Current rate: 6.00% per annum.",
  },

  // ── SAMA LTV regulations ──────────────────────────────────────────────────
  "sama-ltv-regs-2024": {
    id:                   "sama-ltv-regs-2024",
    source_type:          "government_registry",
    source_name:          "SAMA Real Estate Finance Rules",
    external_reference:   "SAMA Real Estate Finance Regulations, 2024 Update",
    source_url:           "https://www.sama.gov.sa",
    collection_method:    "manual_entry",
    observed_date:        "2024-06-01",
    effective_date:       "2024-06-01",
    country:              "SA",
    verification_status:  "verified",
    confidence_score:     99,
    access_or_license_notes:
      "Public SAMA regulations. LTV limits are regulatory maximums for licensed " +
      "Saudi banks. Individual lender underwriting may be stricter.",
  },

  // ── Demo / seed data ──────────────────────────────────────────────────────
  "aouj-demo-v1": {
    id:                   "aouj-demo-v1",
    source_type:          "demo",
    source_name:          "AOUJ Demo Data",
    external_reference:   "Product Demonstration Seed — v1",
    collection_method:    "manual_entry",
    observed_date:        "2026-04-01",
    effective_date:       "2026-04-01",
    country:              "SA",
    verification_status:  "demo",
    confidence_score:     0,
    access_or_license_notes:
      "Illustrative data for product demonstration only. " +
      "Do not use for investment decisions.",
  },
};

// ── Runtime registry (static + user-entered) ──────────────────────────────────

const RUNTIME_REGISTRY: Record<string, DataSource> = { ...STATIC_REGISTRY };

// Merge user-entered sources from localStorage on first access.
// Called lazily — do not call at module load time (SSR safety).
function maybeHydrate(): void {
  if (typeof localStorage === "undefined") return;
  try {
    const stored = JSON.parse(
      localStorage.getItem("aouj_sources_v1") ?? "{}"
    ) as Record<string, DataSource>;
    for (const [id, src] of Object.entries(stored)) {
      // Static seeds are immutable — user entries cannot override them.
      if (!STATIC_REGISTRY[id]) {
        RUNTIME_REGISTRY[id] = src;
      }
    }
  } catch {
    // Corrupt localStorage — ignore, static seeds are still available.
  }
}

let hydrated = false;

// ── Public API ────────────────────────────────────────────────────────────────

/** Look up a source by ID. Returns null if not found. */
export function getSource(id: string): DataSource | null {
  if (!hydrated) { maybeHydrate(); hydrated = true; }
  return RUNTIME_REGISTRY[id] ?? null;
}

/** All sources currently in the registry (static + user-entered). */
export function getAllSources(): DataSource[] {
  if (!hydrated) { maybeHydrate(); hydrated = true; }
  return Object.values(RUNTIME_REGISTRY);
}

/** Persist a user-entered source to localStorage and add it to the runtime registry. */
export function registerUserSource(src: DataSource): void {
  if (STATIC_REGISTRY[src.id]) {
    console.warn(`[sources] Cannot override static source "${src.id}"`);
    return;
  }
  RUNTIME_REGISTRY[src.id] = src;
  try {
    const stored = JSON.parse(
      localStorage.getItem("aouj_sources_v1") ?? "{}"
    ) as Record<string, DataSource>;
    stored[src.id] = src;
    localStorage.setItem("aouj_sources_v1", JSON.stringify(stored));
  } catch { /* ignore */ }
}

// ── Well-known source IDs (import these in consuming modules) ─────────────────
// Avoids magic strings in other files without creating circular imports.

export const SOURCE_ID = {
  MODEL:    "aouj-model-q1-2026",
  SAMA_RATE: "sama-repo-q1-2026",
  SAMA_LTV:  "sama-ltv-regs-2024",
  DEMO:      "aouj-demo-v1",
} as const;
