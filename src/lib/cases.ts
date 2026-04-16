import { PropertyInput, ValuationResult } from "./valuation";

// ── Types ─────────────────────────────────────────────────────────────────────

export const DEAL_STAGES = [
  "Screening",
  "Due Diligence",
  "IC Review",
  "Approved",
  "Rejected",
  "Withdrawn",
] as const;
export type DealStage = typeof DEAL_STAGES[number];

// Stages that represent an active (in-progress) deal
export const ACTIVE_STAGES: DealStage[] = ["Screening", "Due Diligence", "IC Review"];
// Terminal stages
export const TERMINAL_STAGES: DealStage[] = ["Approved", "Rejected", "Withdrawn"];

export interface StageEvent {
  stage: DealStage;
  timestamp: string;
  note?: string;
}

export interface AuditEntry {
  timestamp: string;
  event: string;
}

export interface DecisionRecord {
  outcome: "Approved" | "Rejected" | "Withdrawn";
  rationale: string;
  decidedAt: string;
}

export interface ChecklistItem {
  id: string;
  label: string;
  checked: boolean;
  category: "title" | "regulatory" | "physical" | "financial";
  checkedAt?: string;
}

export interface LegalReview {
  status: string;
  notes: Array<{ text: string; addedAt: string }>;
}

export interface Case {
  id: string;
  title: string;
  input: PropertyInput;
  result: ValuationResult;
  // Pipeline
  stage: DealStage;
  stageHistory: StageEvent[];
  auditLog: AuditEntry[];
  decisionRecord: DecisionRecord | null;
  assumptionNotes: string;
  // Metadata
  createdAt: string;
  checklist: ChecklistItem[];
  legalReview: LegalReview;
  // Legacy compat
  status?: string;
}

// ── Default checklist — Saudi institutional due diligence ─────────────────────

export const DEFAULT_CHECKLIST: ChecklistItem[] = [
  // Title & Ownership
  { id: "t1", label: "Title deed (Sak) verified",            checked: false, category: "title" },
  { id: "t2", label: "REGA registration confirmed",          checked: false, category: "title" },
  { id: "t3", label: "Mortgage / encumbrance clearance",     checked: false, category: "title" },
  { id: "t4", label: "Joint ownership (shuyu') confirmed",   checked: false, category: "title" },
  { id: "t5", label: "Boundary and area matches Sak",        checked: false, category: "title" },
  // Regulatory & Planning
  { id: "r1", label: "Municipal permit confirmed",           checked: false, category: "regulatory" },
  { id: "r2", label: "Zoning / permitted use verified",      checked: false, category: "regulatory" },
  { id: "r3", label: "Wafi registration (if off-plan)",      checked: false, category: "regulatory" },
  { id: "r4", label: "White Land Tax (WLT) status checked",  checked: false, category: "regulatory" },
  // Physical & Technical
  { id: "p1", label: "Physical inspection conducted",        checked: false, category: "physical" },
  { id: "p2", label: "Structural survey completed",          checked: false, category: "physical" },
  { id: "p3", label: "Outstanding utilities cleared",        checked: false, category: "physical" },
  // Financial
  { id: "f1", label: "Service charges / HOA settled",        checked: false, category: "financial" },
  { id: "f2", label: "Rental income verified (if income-producing)", checked: false, category: "financial" },
  { id: "f3", label: "Zakat / tax clearance obtained",       checked: false, category: "financial" },
];

export const DEFAULT_LEGAL_REVIEW: LegalReview = {
  status: "Pending",
  notes: [],
};

// ── Migration helper — upgrades stored cases to current schema ────────────────

function migrateCase(raw: Record<string, unknown>): Case {
  // Infer stage from legacy status field
  const legacyStatus = (raw.status as string) ?? "Draft";
  const inferredStage: DealStage =
    legacyStatus === "Approved"   ? "Approved"  :
    legacyStatus === "Closed"     ? "Approved"  :
    legacyStatus === "In Review"  ? "IC Review" : "Screening";

  const createdAt = (raw.createdAt as string) ?? new Date().toISOString();

  // Migrate legacy notes (string[]) to { text, addedAt }[]
  let legalReview = raw.legalReview as LegalReview | { status: string; notes: string[] } | undefined;
  if (!legalReview) {
    legalReview = { ...DEFAULT_LEGAL_REVIEW, notes: [] };
  } else if (legalReview.notes && typeof legalReview.notes[0] === "string") {
    legalReview = {
      status: legalReview.status,
      notes: (legalReview.notes as unknown as string[]).map(text => ({ text, addedAt: createdAt })),
    };
  }

  // Migrate checklist — add category if missing
  const checklist = ((raw.checklist as ChecklistItem[]) ?? DEFAULT_CHECKLIST.map(i => ({ ...i }))).map(
    (item): ChecklistItem => ({
      id: item.id,
      label: item.label,
      checked: item.checked,
      category: item.category ?? "title",
      checkedAt: item.checkedAt,
    })
  );

  return {
    id: raw.id as string,
    title: raw.title as string,
    input: raw.input as PropertyInput,
    result: raw.result as ValuationResult,
    stage: (raw.stage as DealStage) ?? inferredStage,
    stageHistory: (raw.stageHistory as StageEvent[]) ?? [
      { stage: inferredStage, timestamp: createdAt },
    ],
    auditLog: (raw.auditLog as AuditEntry[]) ?? [
      { timestamp: createdAt, event: "Case created (migrated from legacy format)" },
    ],
    decisionRecord: (raw.decisionRecord as DecisionRecord) ?? null,
    assumptionNotes: (raw.assumptionNotes as string) ?? "",
    createdAt,
    checklist,
    legalReview: legalReview as LegalReview,
    status: legacyStatus,
  };
}

// ── ID generation ─────────────────────────────────────────────────────────────

export function generateCaseId(): string {
  return `case_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

// ── Storage ───────────────────────────────────────────────────────────────────

function loadAll(): Record<string, Case> {
  try {
    const raw = JSON.parse(localStorage.getItem("aouj_cases") ?? "{}") as Record<string, Record<string, unknown>>;
    const migrated: Record<string, Case> = {};
    for (const [id, c] of Object.entries(raw)) {
      migrated[id] = migrateCase(c);
    }
    return migrated;
  } catch {
    return {};
  }
}

export function saveCase(c: Case): void {
  const cases = loadAll();
  cases[c.id] = c;
  localStorage.setItem("aouj_cases", JSON.stringify(cases));
}

export function loadCase(id: string): Case | null {
  return loadAll()[id] ?? null;
}

export function loadAllCases(): Case[] {
  return Object.values(loadAll()).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

export function updateCase(id: string, updates: Partial<Case>): void {
  const cases = loadAll();
  if (cases[id]) {
    cases[id] = { ...cases[id], ...updates };
    localStorage.setItem("aouj_cases", JSON.stringify(cases));
  }
}

// ── Audit helpers ─────────────────────────────────────────────────────────────

export function addAuditEntry(c: Case, event: string): AuditEntry[] {
  return [...c.auditLog, { timestamp: new Date().toISOString(), event }];
}

export function advanceStage(c: Case, note?: string): { stage: DealStage; stageHistory: StageEvent[]; auditLog: AuditEntry[] } | null {
  const idx = DEAL_STAGES.indexOf(c.stage);
  // Can only advance through active stages (Screening → Due Diligence → IC Review)
  if (idx < 0 || idx >= 2) return null;
  const next = DEAL_STAGES[idx + 1] as DealStage;
  const ts = new Date().toISOString();
  return {
    stage: next,
    stageHistory: [...c.stageHistory, { stage: next, timestamp: ts, note }],
    auditLog: addAuditEntry(c, `Stage advanced to "${next}"`),
  };
}

export function setTerminalStage(
  c: Case,
  outcome: "Approved" | "Rejected" | "Withdrawn",
  rationale: string,
): { stage: DealStage; stageHistory: StageEvent[]; auditLog: AuditEntry[]; decisionRecord: DecisionRecord } {
  const ts = new Date().toISOString();
  return {
    stage: outcome,
    stageHistory: [...c.stageHistory, { stage: outcome, timestamp: ts }],
    auditLog: addAuditEntry(c, `Decision recorded: ${outcome}`),
    decisionRecord: { outcome, rationale, decidedAt: ts },
  };
}
