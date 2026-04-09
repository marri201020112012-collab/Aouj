import { PropertyInput, ValuationResult } from "./valuation";

export interface ChecklistItem {
  id: string;
  label: string;
  checked: boolean;
}

export interface LegalReview {
  status: string;
  notes: string[];
}

export interface Case {
  id: string;
  title: string;
  input: PropertyInput;
  result: ValuationResult;
  status: string;
  createdAt: string;
  checklist: ChecklistItem[];
  legalReview: LegalReview;
}

export const DEFAULT_CHECKLIST: ChecklistItem[] = [
  { id: "1", label: "Title deed (Sak) verified", checked: false },
  { id: "2", label: "Municipal permit confirmed", checked: false },
  { id: "3", label: "Property survey conducted", checked: false },
  { id: "4", label: "Mortgage clearance obtained", checked: false },
  { id: "5", label: "REGA registration checked", checked: false },
  { id: "6", label: "Outstanding utilities cleared", checked: false },
];

export const DEFAULT_LEGAL_REVIEW: LegalReview = {
  status: "Pending",
  notes: [],
};

export function generateCaseId(): string {
  return `case_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

function loadAll(): Record<string, Case> {
  try {
    return JSON.parse(localStorage.getItem("aouj_cases") ?? "{}") as Record<string, Case>;
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
