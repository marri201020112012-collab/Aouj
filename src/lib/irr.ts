// ─── IRR ENGINE ───────────────────────────────────────────────────────────────
// Levered and unlevered return analysis for Saudi real estate.
// Newton-Raphson IRR solver. Standard AOUJ acquisition cost structure.
//
// Acquisition costs:   8.1% (transfer tax 5% + agent 2.5% + registration 0.6%)
// Disposal costs:      2.5% (agent fee on exit)
// Loan term assumed:   20 years (Saudi institutional standard)

// ── Solver ───────────────────────────────────────────────────────────────────

function npv(rate: number, cfs: number[]): number {
  return cfs.reduce((acc, cf, t) => acc + cf / Math.pow(1 + rate, t), 0);
}

function npvPrime(rate: number, cfs: number[]): number {
  return cfs.reduce((acc, cf, t) => acc - (t * cf) / Math.pow(1 + rate, t + 1), 0);
}

export function solveIRR(cfs: number[]): number | null {
  if (cfs.length < 2) return null;
  if (!cfs.some(c => c > 0) || !cfs.some(c => c < 0)) return null;
  let rate = 0.10;
  for (let i = 0; i < 200; i++) {
    const nv = npv(rate, cfs);
    const nd = npvPrime(rate, cfs);
    if (Math.abs(nd) < 1e-12) break;
    const step = nv / nd;
    rate -= step;
    if (Math.abs(step) < 1e-8) return rate;
    if (rate < -0.99) rate = -0.50;
    if (rate > 15)    rate = 5;
  }
  return null;
}

// ── Inputs & outputs ─────────────────────────────────────────────────────────

export type HoldYears = 3 | 5 | 7 | 10;
export type RentGrowth = -0.02 | 0.00 | 0.02 | 0.04;
export type ExitCapDelta = -0.005 | 0 | 0.005 | 0.010;

export interface IrrInputs {
  holdYears: HoldYears;
  rentGrowthRate: RentGrowth;
  exitCapRateDelta: ExitCapDelta;
}

export const DEFAULT_IRR_INPUTS: IrrInputs = {
  holdYears: 5,
  rentGrowthRate: 0.02,
  exitCapRateDelta: 0,
};

export interface IrrResult {
  holdYears: number;
  entryCapRate: number;
  exitCapRate: number;
  totalOutlay: number;            // purchase price + acq. costs
  acquisitionCostsSAR: number;
  equityInvested: number;         // totalOutlay - loan
  // Unlevered
  unleveredIRR: number | null;
  unleveredMoic: number;
  // Levered
  leveredIRR: number | null;
  leveredMoic: number | null;
  hasLeverage: boolean;
  // Exit
  exitValue: number;              // net of disposal costs
  equityOnExit: number | null;    // exitValue - loan balance at exit
  loanOutstanding: number | null;
}

// ── Loan balance helper (standard amortisation) ───────────────────────────────

const LOAN_TERM = 20;
const ACQ_COST  = 0.081;
const DISP_COST = 0.025;

function loanBalance(principal: number, annualRate: number, yearsElapsed: number): number {
  if (annualRate === 0) return principal * (1 - yearsElapsed / LOAN_TERM);
  const r  = annualRate / 12;
  const n  = LOAN_TERM * 12;
  const m  = yearsElapsed * 12;
  const mp = principal * (r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
  return principal * Math.pow(1 + r, m) - mp * (Math.pow(1 + r, m) - 1) / r;
}

// ── Main computation ──────────────────────────────────────────────────────────

export function computeIrrResult(
  purchasePrice: number,
  noi: number,
  inputs: IrrInputs,
  ltvData: { impliedMaxLoan: number; annualDebtService: number | null; lendingRate: number } | null,
): IrrResult | null {
  if (!noi || !purchasePrice || noi <= 0 || purchasePrice <= 0) return null;

  const { holdYears, rentGrowthRate, exitCapRateDelta } = inputs;
  const entryCapRate = noi / purchasePrice;
  const exitCapRate  = Math.max(0.025, entryCapRate + exitCapRateDelta);

  const acquisitionCostsSAR = purchasePrice * ACQ_COST;
  const totalOutlay         = purchasePrice + acquisitionCostsSAR;

  // Annual NOI stream with rent growth (applied from year 2 onwards)
  const noiStream: number[] = [];
  for (let y = 1; y <= holdYears; y++) {
    noiStream.push(noi * Math.pow(1 + rentGrowthRate, y - 1));
  }

  const terminalNOI = noi * Math.pow(1 + rentGrowthRate, holdYears);
  const exitValue   = (terminalNOI / exitCapRate) * (1 - DISP_COST);

  // Unlevered cash flows
  const unlCFs: number[] = [-totalOutlay];
  for (let y = 0; y < holdYears; y++) {
    unlCFs.push(y === holdYears - 1 ? noiStream[y] + exitValue : noiStream[y]);
  }
  const unleveredIRR  = solveIRR(unlCFs);
  const totalNoiSum   = noiStream.reduce((a, b) => a + b, 0);
  const unleveredMoic = (totalNoiSum + exitValue) / totalOutlay;

  // Levered
  let leveredIRR:     number | null = null;
  let leveredMoic:    number | null = null;
  let equityInvested               = totalOutlay;
  let equityOnExit:   number | null = null;
  let loanOutstanding:number | null = null;
  let hasLeverage                  = false;

  if (ltvData?.annualDebtService && ltvData.impliedMaxLoan > 0) {
    const loan    = ltvData.impliedMaxLoan;
    equityInvested = totalOutlay - loan;
    if (equityInvested > 0) {
      hasLeverage    = true;
      loanOutstanding = Math.max(0, loanBalance(loan, ltvData.lendingRate, holdYears));
      equityOnExit    = Math.max(0, exitValue - loanOutstanding);

      const levCFs: number[] = [-equityInvested];
      for (let y = 0; y < holdYears; y++) {
        const annualCF = noiStream[y] - ltvData.annualDebtService;
        levCFs.push(y === holdYears - 1 ? annualCF + equityOnExit : annualCF);
      }
      leveredIRR  = solveIRR(levCFs);
      const totalLev = levCFs.slice(1).reduce((a, b) => a + b, 0);
      leveredMoic = equityInvested > 0 ? totalLev / equityInvested : null;
    }
  }

  return {
    holdYears, entryCapRate, exitCapRate,
    totalOutlay, acquisitionCostsSAR, equityInvested,
    unleveredIRR, unleveredMoic,
    leveredIRR, leveredMoic, hasLeverage,
    exitValue, equityOnExit, loanOutstanding,
  };
}
