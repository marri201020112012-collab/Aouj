// ─── SCENARIO LAYER ───────────────────────────────────────────────────────────
//
// User-entered market assumption overrides. These sit on top of the default
// source-backed model benchmarks — they never overwrite model records.
//
// Persistence: localStorage["aouj_scenario_v1"]
// Provenance:  registered as source "user-scenario-v1" (verification_status: user_entered)

import { registerUserSource } from "./sources";

// ── Source ID ─────────────────────────────────────────────────────────────────

export const SCENARIO_SOURCE_ID = "user-scenario-v1";

// ── Schema ────────────────────────────────────────────────────────────────────

export interface ScenarioOverrides {
  psmPrice?:   number;   // SAR/sqm — user's price benchmark (overrides model PSM in delta calc)
  rentPsm?:    number;   // SAR/sqm/yr — market rent assumption (used when no explicit rent entered)
  occupancy?:  number;   // 0–100 % occupied  (applied to scenario rentPsm)
  capRate?:    number;   // % (e.g. 7.5) — overrides model cap rate in yield spread calcs
  growthRate?: number;   // % annual rent growth (e.g. 3.0) — overrides 2% IRR base case
}

// ── Defaults shown as reference in the UI ─────────────────────────────────────

export const SCENARIO_DEFAULTS = {
  growthRate: 2.0,  // matches IRR engine default
} as const;

// ── Persistence ───────────────────────────────────────────────────────────────

const STORAGE_KEY = "aouj_scenario_v1";

export function getScenario(): ScenarioOverrides {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}");
  } catch { return {}; }
}

export function saveScenario(s: ScenarioOverrides): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
  _ensureSource();
}

export function resetScenario(): void {
  localStorage.removeItem(STORAGE_KEY);
}

/** True if any override field is set to a real value. */
export function hasScenario(s: ScenarioOverrides): boolean {
  return Object.values(s).some(v => v !== undefined && v !== null && v !== "");
}

// ── Source registry ───────────────────────────────────────────────────────────
// Called on first save — idempotent (registerUserSource guards static IDs and
// the runtime registry deduplicates by key).

function _ensureSource(): void {
  registerUserSource({
    id:                    SCENARIO_SOURCE_ID,
    source_type:           "user_entered",
    source_name:           "My Assumptions",
    external_reference:    "Analyst scenario layer — active overrides",
    collection_method:     "manual_entry",
    observed_date:         new Date().toISOString().slice(0, 10),
    effective_date:        new Date().toISOString().slice(0, 10),
    country:               "SA",
    verification_status:   "user_entered",
    confidence_score:      70,
    access_or_license_notes:
      "Analyst-entered assumptions. Override the default model benchmarks. " +
      "Not verified against market data. For scenario analysis only.",
  });
}
