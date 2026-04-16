// ─── DEMO DATA SEEDER ────────────────────────────────────────────────────────
// Seeds 5 realistic Saudi institutional deals into localStorage on first visit.
// Idempotent — checks flag before seeding so it never overwrites real data.

import { computeValuation, PropertyInput } from "./valuation";
import {
  Case, DEFAULT_CHECKLIST,
  DealStage, StageEvent, AuditEntry, DecisionRecord, ChecklistItem,
} from "./cases";

const SEED_FLAG = "aouj_demo_seeded_v1";

function makeId(n: number) {
  return `demo_deal_${n}`;
}

function ts(daysAgo: number, hoursAgo = 0): string {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  d.setHours(d.getHours() - hoursAgo);
  return d.toISOString();
}

function checklist(overrides: Partial<Record<string, boolean>> = {}): ChecklistItem[] {
  return DEFAULT_CHECKLIST.map(i => ({
    ...i,
    checked: overrides[i.id] ?? false,
    checkedAt: overrides[i.id] ? ts(3) : undefined,
  }));
}

interface DealSpec {
  id: string;
  title: string;
  input: PropertyInput;
  stage: DealStage;
  stageHistory: StageEvent[];
  auditLog: AuditEntry[];
  decisionRecord: DecisionRecord | null;
  assumptionNotes: string;
  createdAt: string;
  checklistOverrides: Partial<Record<string, boolean>>;
  legalStatus: string;
  legalNote?: string;
}

const SPECS: DealSpec[] = [
  // ── 1. Riyadh Al Olaya Mixed-Use · IC Review ────────────────────────────
  {
    id: makeId(1),
    title: "Al Olaya Mixed-Use Tower",
    input: {
      city: "Riyadh", district: "Al Olaya",
      propertyType: "Commercial", size: 2800,
      condition: "Excellent", transactionType: "Sale",
      hasStreetFrontage: true,
    },
    stage: "IC Review",
    stageHistory: [
      { stage: "Screening",      timestamp: ts(22) },
      { stage: "Due Diligence",  timestamp: ts(15) },
      { stage: "IC Review",      timestamp: ts(4)  },
    ],
    auditLog: [
      { timestamp: ts(22),     event: "Case created — initial screen completed" },
      { timestamp: ts(18),     event: "Checklist opened — title items assigned" },
      { timestamp: ts(15),     event: "Stage advanced to Due Diligence" },
      { timestamp: ts(10),     event: "Physical inspection completed" },
      { timestamp: ts(6),      event: "Legal review status updated to In Progress" },
      { timestamp: ts(4),      event: "Stage advanced to IC Review" },
      { timestamp: ts(1),      event: "IC memo drafted — awaiting committee sign-off" },
    ],
    decisionRecord: null,
    assumptionNotes: "Rent assumption: SAR 1,500/sqm/yr based on Q4 2025 Olaya lease comps. Street frontage premium applied. Exit cap assumed flat at 7.5%.",
    createdAt: ts(22),
    checklistOverrides: {
      t1: true, t2: true, t3: true, t5: true,
      r1: true, r2: true,
      p1: true, p2: true,
      f2: true,
    },
    legalStatus: "In Progress",
    legalNote: "Reviewing title deed and REGA registration — no encumbrances identified to date.",
  },

  // ── 2. Riyadh KAFD Office · Due Diligence ──────────────────────────────
  {
    id: makeId(2),
    title: "KAFD Grade-A Office Block",
    input: {
      city: "Riyadh", district: "Al Sulaimaniyah",
      propertyType: "Office", size: 1500,
      condition: "Excellent", transactionType: "Sale",
      floorLevel: 12,
    },
    stage: "Due Diligence",
    stageHistory: [
      { stage: "Screening",     timestamp: ts(12) },
      { stage: "Due Diligence", timestamp: ts(6)  },
    ],
    auditLog: [
      { timestamp: ts(12),  event: "Case created — screened against Q1 2026 benchmarks" },
      { timestamp: ts(9),   event: "High-floor premium confirmed with building management" },
      { timestamp: ts(6),   event: "Stage advanced to Due Diligence" },
      { timestamp: ts(3),   event: "Title deed received from seller — under review" },
    ],
    decisionRecord: null,
    assumptionNotes: "Floor premium: +8% for level 12. Anchor tenant (government entity) on 3-year lease — rent verified via Ejar extract. DSCR marginal at current SAMA rate — model sensitivity tested.",
    createdAt: ts(12),
    checklistOverrides: { t1: true, t2: true, r1: true, r2: true },
    legalStatus: "In Progress",
    legalNote: "Title deed under review. No mortgage identified in initial REGA check.",
  },

  // ── 3. Riyadh Al Nakheel Villa · Screening ─────────────────────────────
  {
    id: makeId(3),
    title: "Al Nakheel Residential Villa",
    input: {
      city: "Riyadh", district: "Al Nakheel",
      propertyType: "Residential Villa", size: 720,
      condition: "Good", transactionType: "Sale",
      yearBuilt: 2018,
    },
    stage: "Screening",
    stageHistory: [
      { stage: "Screening", timestamp: ts(3) },
    ],
    auditLog: [
      { timestamp: ts(3),  event: "Case created — referred by Al Nakheel broker" },
      { timestamp: ts(1),  event: "Initial screen run — price within ±10% of market" },
    ],
    decisionRecord: null,
    assumptionNotes: "Asking price SAR 10.8M. Owner occupier — no lease in place. Rental assumption based on district comp at SAR 220K/yr for similar villas.",
    createdAt: ts(3),
    checklistOverrides: {},
    legalStatus: "Pending",
  },

  // ── 4. Al Khobar Retail Strip · Approved ───────────────────────────────
  {
    id: makeId(4),
    title: "Al Khobar Retail Strip — Al Hamraa",
    input: {
      city: "Khobar", district: "Al Hamraa",
      propertyType: "Commercial", size: 1200,
      condition: "Good", transactionType: "Sale",
      hasStreetFrontage: true,
    },
    stage: "Approved",
    stageHistory: [
      { stage: "Screening",     timestamp: ts(45) },
      { stage: "Due Diligence", timestamp: ts(30) },
      { stage: "IC Review",     timestamp: ts(18) },
      { stage: "Approved",      timestamp: ts(5)  },
    ],
    auditLog: [
      { timestamp: ts(45), event: "Case created" },
      { timestamp: ts(40), event: "Screened — strong yield vs. market, proceed recommended" },
      { timestamp: ts(30), event: "Stage advanced to Due Diligence" },
      { timestamp: ts(22), event: "Physical inspection — property in good order" },
      { timestamp: ts(20), event: "Ejar lease extract verified — 2 tenants, avg 3.5yr remaining" },
      { timestamp: ts(18), event: "Stage advanced to IC Review" },
      { timestamp: ts(12), event: "IC memo circulated" },
      { timestamp: ts(5),  event: "Decision recorded: Approved" },
    ],
    decisionRecord: {
      outcome: "Approved",
      rationale: "Strong yield spread of 280bps over SAMA. Anchor tenant (F&B chain) on 4-year lease with renewal option. Price 12% below Al Hamraa benchmark — distressed seller motivation confirmed. Board approved at SAR 14.4M all-in.",
      decidedAt: ts(5),
    },
    assumptionNotes: "Acquisition at SAR 14.4M (SAR 12,000/sqm vs. benchmark SAR 13,600/sqm). Two tenants: primary F&B anchor (1,000 sqm) + secondary retail (200 sqm). Blended gross yield 8.75%.",
    createdAt: ts(45),
    checklistOverrides: {
      t1: true, t2: true, t3: true, t4: true, t5: true,
      r1: true, r2: true, r3: true, r4: true,
      p1: true, p2: true, p3: true,
      f1: true, f2: true, f3: true,
    },
    legalStatus: "Cleared",
    legalNote: "All title and regulatory items cleared. Transfer registered with municipality. REGA record updated.",
  },

  // ── 5. Jeddah Warehouse · Rejected ─────────────────────────────────────
  {
    id: makeId(5),
    title: "Jeddah Logistics Hub — Al Zahraa",
    input: {
      city: "Jeddah", district: "Al Zahraa",
      propertyType: "Warehouse", size: 5000,
      condition: "Average", transactionType: "Sale",
      yearBuilt: 2008,
    },
    stage: "Rejected",
    stageHistory: [
      { stage: "Screening",     timestamp: ts(20) },
      { stage: "Due Diligence", timestamp: ts(14) },
      { stage: "Rejected",      timestamp: ts(7)  },
    ],
    auditLog: [
      { timestamp: ts(20), event: "Case created — off-market referral" },
      { timestamp: ts(17), event: "Initial screen: price at market but yield compressed below SAMA threshold" },
      { timestamp: ts(14), event: "Stage advanced to Due Diligence — pending yield verification" },
      { timestamp: ts(10), event: "Physical inspection: roof requires SAR 1.2M remediation" },
      { timestamp: ts(8),  event: "Occupier credit reviewed — anchor tenant (logistics SME) rated below investment grade" },
      { timestamp: ts(7),  event: "Decision recorded: Rejected" },
    ],
    decisionRecord: {
      outcome: "Rejected",
      rationale: "Three concurrent issues: (1) roof remediation cost SAR 1.2M reduces effective yield by 40bps, (2) anchor tenant below investment grade with no guarantee, (3) IRR falls to 5.8% after capex — below 8% institutional threshold. Seller unwilling to adjust price.",
      decidedAt: ts(7),
    },
    assumptionNotes: "Asking price SAR 7.5M. Post-inspection capex of SAR 1.2M identified. Adjusted yield 5.8% gross — below institutional floor.",
    createdAt: ts(20),
    checklistOverrides: {
      t1: true, t2: true,
      r1: true, r2: true,
      p1: true, p2: true,
    },
    legalStatus: "Pending",
    legalNote: "Title review paused pending rejection decision.",
  },
];

export function seedDemoData(): void {
  // Idempotent — only seed once
  if (localStorage.getItem(SEED_FLAG)) return;

  const existing = JSON.parse(localStorage.getItem("aouj_cases") ?? "{}") as Record<string, unknown>;
  const toSeed = { ...existing };

  for (const spec of SPECS) {
    // Don't overwrite real data with same ID (unlikely but safe)
    if (toSeed[spec.id]) continue;

    const result = computeValuation(spec.input);

    const c: Case = {
      id: spec.id,
      title: spec.title,
      input: spec.input,
      result,
      stage: spec.stage,
      stageHistory: spec.stageHistory,
      auditLog: spec.auditLog,
      decisionRecord: spec.decisionRecord,
      assumptionNotes: spec.assumptionNotes,
      createdAt: spec.createdAt,
      checklist: checklist(spec.checklistOverrides),
      legalReview: {
        status: spec.legalStatus,
        notes: spec.legalNote
          ? [{ text: spec.legalNote, addedAt: spec.createdAt }]
          : [],
      },
    };

    toSeed[spec.id] = c;
  }

  localStorage.setItem("aouj_cases", JSON.stringify(toSeed));
  localStorage.setItem(SEED_FLAG, "1");
}
