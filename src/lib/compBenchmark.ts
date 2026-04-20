// ─── COMP-DERIVED BENCHMARK LAYER ─────────────────────────────────────────────
//
// Computes a statistical reference benchmark from saved comparable transactions.
// This is a SEPARATE layer from:
//   - Model benchmark   (src/lib/valuation.ts — deterministic model)
//   - User scenario     (src/lib/scenario.ts  — analyst override)
//
// The comp benchmark is purely informational — it does not replace or silently
// overwrite either of the above. All three are kept structurally distinct.
//
// Matching strategy (in order of preference):
//   1. city + assetType + district (if district provided and ≥ MIN_COMPS match)
//   2. city + assetType            (city-level fallback)
//
// Guardrails:
//   - count < MIN_COMPS           → qualityLabel = "insufficient"
//   - all isDemo                  → qualityLabel = "demo-only"
//   - all verified                → qualityLabel = "verified"
//   - mix includes verified       → qualityLabel = "mixed"
//   - user_entered / estimated    → qualityLabel = "estimated"

import { getAllComps } from "./comps";

// ── Constants ─────────────────────────────────────────────────────────────────

/** Minimum comps required to show a meaningful average. */
export const MIN_COMPS = 2;

// ── Types ─────────────────────────────────────────────────────────────────────

export type BenchmarkQuality =
  | "verified"      // every comp is verification_status = "verified"
  | "mixed"         // mix of verified + user_entered / estimated (with or without demo)
  | "estimated"     // all user_entered or estimated; none verified
  | "demo-only"     // every comp is a demo record
  | "insufficient"; // fewer than MIN_COMPS match

export interface SourceMix {
  verifiedCount:   number;
  userCount:       number;
  estimatedCount:  number;
  demoCount:       number;
}

export interface CompBenchmark {
  // Statistics — only meaningful when qualityLabel !== "insufficient"
  avgPsm:     number;
  medianPsm:  number;
  minPsm:     number;
  maxPsm:     number;
  count:      number;

  // Source breakdown
  sourceMix:  SourceMix;

  // Evidence quality
  qualityLabel: BenchmarkQuality;
  qualityNote:  string;   // human-readable one-liner for UI

  // Date range of comps included
  oldestDate: string;
  newestDate: string;

  // Match context (for UI labelling)
  city:             string;
  assetType:        string;
  matchedDistrict:  string | null;   // null = city-level match was used
  windowDays:       number | null;   // null = no date filter applied
}

export interface CompBenchmarkOptions {
  /** Attempt a district-level match first; fall back to city-level if < MIN_COMPS. */
  district?:    string;
  /** Only include comps transacted within this many days. null = no window. */
  windowDays?:  number | null;
  /** Include demo comps. Default true so early-stage installs are not blank. */
  includeDemo?: boolean;
}

// ── Engine ────────────────────────────────────────────────────────────────────

export function computeCompBenchmark(
  city: string,
  assetType: string,
  options: CompBenchmarkOptions = {},
): CompBenchmark | null {
  const { district, windowDays = null, includeDemo = true } = options;

  // Step 1 — base filter: city + asset type
  let pool = getAllComps().filter(
    c => c.city === city && c.assetType === assetType
  );
  if (!includeDemo) pool = pool.filter(c => !c.isDemo);

  // Step 2 — optional date window
  if (windowDays) {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - windowDays);
    const cutoffStr = cutoff.toISOString().slice(0, 10);
    pool = pool.filter(c => c.transactionDate >= cutoffStr);
  }

  if (pool.length === 0) return null;

  // Step 3 — try district-level, fall back to city-level
  let matched = pool;
  let matchedDistrict: string | null = null;

  if (district) {
    const districtPool = pool.filter(c => c.district === district);
    if (districtPool.length >= MIN_COMPS) {
      matched     = districtPool;
      matchedDistrict = district;
    }
    // else: not enough district comps — use city-level pool
  }

  const count = matched.length;

  // Step 4 — statistics
  const psms = matched.map(c => c.psmPrice).sort((a, b) => a - b);
  const avgPsm = Math.round(psms.reduce((s, v) => s + v, 0) / count);
  const medianPsm =
    count % 2 === 0
      ? Math.round((psms[count / 2 - 1] + psms[count / 2]) / 2)
      : psms[Math.floor(count / 2)];

  const sourceMix: SourceMix = {
    verifiedCount:   matched.filter(c => c.verificationStatus === "verified").length,
    userCount:       matched.filter(c => c.verificationStatus === "user_entered").length,
    estimatedCount:  matched.filter(c => c.verificationStatus === "estimated").length,
    demoCount:       matched.filter(c => c.isDemo).length,
  };

  const dates = matched.map(c => c.transactionDate).sort();

  // Step 5 — quality label and note
  const { verifiedCount, userCount, estimatedCount, demoCount } = sourceMix;
  const nonDemoCount = count - demoCount;

  let qualityLabel: BenchmarkQuality;
  let qualityNote: string;

  if (count < MIN_COMPS) {
    qualityLabel = "insufficient";
    qualityNote  = `Only ${count} comp on record — need at least ${MIN_COMPS} for a reliable average. Add more transactions.`;
  } else if (demoCount === count) {
    qualityLabel = "demo-only";
    qualityNote  = `All ${count} comps are demo data. Add real transactions to replace this with market evidence.`;
  } else if (verifiedCount === nonDemoCount && demoCount === 0) {
    qualityLabel = "verified";
    qualityNote  = `${verifiedCount} of ${count} comps verified against primary source (REGA or deed transfer).`;
  } else if (verifiedCount > 0) {
    const parts: string[] = [];
    if (verifiedCount  > 0) parts.push(`${verifiedCount} verified`);
    if (userCount      > 0) parts.push(`${userCount} user-entered`);
    if (estimatedCount > 0) parts.push(`${estimatedCount} estimated`);
    if (demoCount      > 0) parts.push(`${demoCount} demo`);
    qualityLabel = "mixed";
    qualityNote  = `Mixed evidence: ${parts.join(", ")}. Treat with moderate confidence.`;
  } else {
    // All user_entered / estimated — no verified, no demo (or demo mixed in)
    const parts: string[] = [];
    if (userCount      > 0) parts.push(`${userCount} user-entered`);
    if (estimatedCount > 0) parts.push(`${estimatedCount} estimated`);
    if (demoCount      > 0) parts.push(`${demoCount} demo`);
    qualityLabel = "estimated";
    qualityNote  = `${parts.join(", ")}. No verified comps — treat as indicative, not definitive.`;
  }

  return {
    avgPsm,
    medianPsm,
    minPsm:  psms[0],
    maxPsm:  psms[psms.length - 1],
    count,
    sourceMix,
    qualityLabel,
    qualityNote,
    oldestDate:     dates[0],
    newestDate:     dates[dates.length - 1],
    city,
    assetType,
    matchedDistrict,
    windowDays,
  };
}
