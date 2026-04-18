import { useMemo, useState } from "react";
import {
  runScreen, ScreenInput, DEFAULT_SCREEN, Verdict, ConfLevel,
} from "@/lib/screen";
import { CITIES, DISTRICTS, PROPERTY_TYPES } from "@/lib/valuation";
import { formatSAR } from "@/lib/utils";
import { useLang } from "@/lib/lang";
import { cityName, districtName, propTypeName } from "@/lib/i18n";
import {
  CheckCircle, AlertCircle, XCircle, Minus,
  TrendingUp, AlertTriangle, Info, ChevronRight,
} from "lucide-react";
import { ProvenanceBadge } from "@/components/ProvenanceBadge";
import { ScenarioPanel } from "@/components/ScenarioPanel";
import {
  ScenarioOverrides, getScenario, saveScenario, resetScenario,
} from "@/lib/scenario";

// ── Helpers ───────────────────────────────────────────────────────────────────

const fmt  = formatSAR;
const pct  = (v: number) => `${v >= 0 ? "+" : ""}${v.toFixed(1)}%`;
const bps  = (v: number) => `${v >= 0 ? "+" : ""}${v.toFixed(0)}bps`;
const irr  = (v: number | null) => v == null ? "—" : `${(v * 100).toFixed(1)}%`;
const psm  = (v: number | null) => v == null ? "—" : `${Math.round(v).toLocaleString()} SAR/sqm`;

const HOLD_OPTS = [3, 5, 7, 10] as const;

const selectCls = "w-full bg-secondary border border-border rounded-md px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary";
const inputCls  = "w-full bg-secondary border border-border rounded-md px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary placeholder:text-muted-foreground";

// ── Verdict config ────────────────────────────────────────────────────────────

const VERDICT_CFG: Record<Verdict, {
  icon: React.ReactNode;
  label: string;
  labelAr: string;
  border: string;
  bg: string;
  text: string;
}> = {
  proceed: {
    icon: <CheckCircle className="w-5 h-5" />,
    label: "Proceed to DD",
    labelAr: "المضي إلى العناية الواجبة",
    border: "border-emerald-700/60",
    bg:     "bg-emerald-900/20",
    text:   "text-emerald-400",
  },
  clarify: {
    icon: <AlertCircle className="w-5 h-5" />,
    label: "Needs Clarification",
    labelAr: "يحتاج إلى توضيح",
    border: "border-amber-700/60",
    bg:     "bg-amber-900/20",
    text:   "text-amber-400",
  },
  reject: {
    icon: <XCircle className="w-5 h-5" />,
    label: "Likely Reject",
    labelAr: "مرشح للرفض",
    border: "border-red-700/60",
    bg:     "bg-red-900/20",
    text:   "text-red-400",
  },
  insufficient: {
    icon: <Minus className="w-5 h-5" />,
    label: "Insufficient Data",
    labelAr: "بيانات غير كافية",
    border: "border-border",
    bg:     "bg-secondary/40",
    text:   "text-muted-foreground",
  },
};

const CONF_CFG: Record<ConfLevel, { label: string; labelAr: string; color: string }> = {
  high:         { label: "High",         labelAr: "عالية",    color: "bg-emerald-500" },
  medium:       { label: "Medium",       labelAr: "متوسطة",   color: "bg-amber-500"   },
  low:          { label: "Low",          labelAr: "منخفضة",   color: "bg-red-500"     },
  insufficient: { label: "Insufficient", labelAr: "غير كافية",color: "bg-border"      },
};

const FLAG_ICON: Record<string, React.ReactNode> = {
  critical: <XCircle     className="w-3.5 h-3.5 text-red-400    shrink-0" />,
  warn:     <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />,
  info:     <Info        className="w-3.5 h-3.5 text-primary/70  shrink-0" />,
};

// ── Sub-components ────────────────────────────────────────────────────────────

function Label({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground mb-1.5">
      {children}
    </p>
  );
}

function MetricCell({ label, value, sub, highlight }: {
  label: string; value: string; sub?: string; highlight?: boolean;
}) {
  return (
    <div className="bg-secondary/60 rounded-lg p-3">
      <p className="text-xs text-muted-foreground mb-1">{label}</p>
      <p className={`text-base font-mono font-semibold ${highlight ? "text-primary" : "text-foreground"}`}>
        {value}
      </p>
      {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function Screen() {
  const { lang, isAr } = useLang();
  const [inp, setInp] = useState<ScreenInput>(DEFAULT_SCREEN);
  const [incomeMode, setIncomeMode] = useState<"rent" | "yield">("rent");
  const [scenario, setScenario] = useState<ScenarioOverrides>(() => getScenario());

  const set = <K extends keyof ScreenInput>(k: K, v: ScreenInput[K]) =>
    setInp(p => ({ ...p, [k]: v }));

  const handleCity = (city: string) => {
    const first = DISTRICTS[city]?.[0] ?? "";
    setInp(p => ({ ...p, city, district: first }));
  };

  const clearIncome = () => setInp(p => ({ ...p, annualRent: null, yieldPct: null }));
  const handleReset = () => setInp(DEFAULT_SCREEN);

  const handleScenarioChange = (s: ScenarioOverrides) => {
    setScenario(s);
    saveScenario(s);
  };
  const handleScenarioReset = () => {
    resetScenario();
    setScenario({});
  };

  const availDistricts = DISTRICTS[inp.city] ?? [];

  // Reactive — compute on every input change. Pure sync math, no debounce needed.
  const result = useMemo(() => runScreen(inp, scenario), [inp, scenario]);
  const vcfg   = VERDICT_CFG[result.verdict];
  const ccfg   = CONF_CFG[result.confidence];

  // Derived display
  const priceStr = inp.price ? fmt(inp.price) : null;
  const impliedYieldStr = inp.price && result.effectiveRent
    ? `${((result.effectiveRent / inp.price) * 100).toFixed(2)}% gross yield`
    : null;
  const impliedRentStr = inp.price && inp.yieldPct && incomeMode === "yield"
    ? `≈ ${fmt(inp.price * inp.yieldPct / 100)}/yr`
    : null;

  return (
    <div className={`flex ${isAr ? "flex-row-reverse" : "flex-row"} h-[calc(100vh-3.5rem)] overflow-hidden`}>

      {/* ── LEFT: Input panel ──────────────────────────────────────────────── */}
      <div className="w-[340px] shrink-0 overflow-y-auto border-r border-border bg-background flex flex-col">
        <div className="px-5 py-5 space-y-5 flex-1">

          {/* Header */}
          <div>
            <h1 className="text-base font-serif text-foreground">Deal Screen</h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Enter a deal to get an instant screening decision.
            </p>
          </div>

          {/* Location */}
          <div className="space-y-2">
            <Label>Location</Label>
            <select value={inp.city} onChange={e => handleCity(e.target.value)} className={selectCls}>
              {CITIES.map(c => <option key={c} value={c}>{cityName(c, lang)}</option>)}
            </select>
            <select value={inp.district} onChange={e => set("district", e.target.value)} className={selectCls}>
              {availDistricts.map(d => <option key={d} value={d}>{districtName(d, lang)}</option>)}
            </select>
          </div>

          {/* Asset type */}
          <div className="space-y-2">
            <Label>Asset Type</Label>
            <select value={inp.assetType} onChange={e => set("assetType", e.target.value)} className={selectCls}>
              {PROPERTY_TYPES.map(t => <option key={t} value={t}>{propTypeName(t, lang)}</option>)}
            </select>
          </div>

          {/* Acquisition */}
          <div className="space-y-2">
            <Label>Acquisition</Label>
            <div className="relative">
              <input
                type="number" min={0}
                value={inp.price ?? ""}
                onChange={e => set("price", e.target.value ? Number(e.target.value) : null)}
                placeholder="Price (SAR)"
                className={inputCls}
              />
              {priceStr && (
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground pointer-events-none">
                  {priceStr}
                </span>
              )}
            </div>
            <div className="relative">
              <input
                type="number" min={0}
                value={inp.size ?? ""}
                onChange={e => set("size", e.target.value ? Number(e.target.value) : null)}
                placeholder="Size (sqm)"
                className={inputCls}
              />
            </div>
            {/* Live price/sqm */}
            {result.pricePerSqm && (
              <div className="flex items-center gap-2 text-xs">
                <span className="text-muted-foreground font-mono">
                  {Math.round(result.pricePerSqm).toLocaleString()} SAR/sqm
                </span>
                {result.psmDeltaPct != null && (
                  <span className={`font-medium ${
                    result.psmDeltaPct > 20  ? "text-red-400"   :
                    result.psmDeltaPct > 0   ? "text-amber-400" :
                    result.psmDeltaPct < -15 ? "text-blue-400"  : "text-emerald-400"
                  }`}>
                    {pct(result.psmDeltaPct)} vs market
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Income (optional) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Income</Label>
              <div className="flex gap-0.5 mb-1.5">
                {(["rent", "yield"] as const).map(m => (
                  <button key={m}
                    onClick={() => { setIncomeMode(m); clearIncome(); }}
                    className={`text-xs px-2 py-0.5 rounded transition-colors ${
                      incomeMode === m
                        ? "bg-primary/15 text-primary border border-primary/30"
                        : "text-muted-foreground hover:text-foreground"
                    }`}>
                    {m === "rent" ? "Rent" : "Yield %"}
                  </button>
                ))}
              </div>
            </div>
            {incomeMode === "rent" ? (
              <div>
                <input
                  type="number" min={0}
                  value={inp.annualRent ?? ""}
                  onChange={e => set("annualRent", e.target.value ? Number(e.target.value) : null)}
                  placeholder="Annual rent (SAR/yr) — optional"
                  className={inputCls}
                />
                {impliedYieldStr && (
                  <p className="text-xs text-muted-foreground mt-1 font-mono">{impliedYieldStr}</p>
                )}
              </div>
            ) : (
              <div>
                <input
                  type="number" min={0} max={50} step={0.1}
                  value={inp.yieldPct ?? ""}
                  onChange={e => set("yieldPct", e.target.value ? Number(e.target.value) : null)}
                  placeholder="Gross yield % — optional"
                  className={inputCls}
                />
                {impliedRentStr && (
                  <p className="text-xs text-muted-foreground mt-1 font-mono">{impliedRentStr}</p>
                )}
              </div>
            )}
          </div>

          {/* Financing (optional) */}
          <div className="space-y-2">
            <Label>Financing</Label>
            <div className="relative">
              <input
                type="number" min={0} max={100} step={1}
                value={inp.ltvOverride ?? ""}
                onChange={e => set("ltvOverride", e.target.value ? Number(e.target.value) : null)}
                placeholder={`LTV % (SAMA max: ${Math.round(result.ltv * 100)}%)`}
                className={inputCls}
              />
            </div>
          </div>

          {/* Hold period */}
          <div className="space-y-2">
            <Label>Hold Period</Label>
            <div className="flex gap-1.5">
              {HOLD_OPTS.map(y => (
                <button key={y}
                  onClick={() => set("holdYears", y)}
                  className={`flex-1 py-1.5 rounded text-xs font-medium border transition-colors ${
                    inp.holdYears === y
                      ? "bg-primary/15 border-primary text-primary"
                      : "border-border text-muted-foreground hover:border-primary/40 hover:text-foreground"
                  }`}>
                  {y}yr
                </button>
              ))}
            </div>
          </div>
          {/* My Assumptions / Scenario */}
          <ScenarioPanel
            scenario={scenario}
            onChange={handleScenarioChange}
            onReset={handleScenarioReset}
            modelPsm={result.modelBenchmarkPsm}
            modelRentPsm={result.modelRentPsm}
            modelOccupancy={result.modelOccupancy}
            modelCapRate={result.modelBenchmarkCapRate}
          />
        </div>

        {/* Reset */}
        <div className="px-5 pb-5 pt-2 border-t border-border">
          <button onClick={handleReset}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors underline underline-offset-2">
            Clear all
          </button>
        </div>
      </div>

      {/* ── RIGHT: Results panel ────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto bg-background">
        {result.verdict === "insufficient" && !inp.price ? (
          /* Empty state */
          <div className="h-full flex flex-col items-center justify-center gap-3 text-center px-8">
            <TrendingUp className="w-8 h-8 text-muted-foreground/30" />
            <p className="text-sm text-muted-foreground">Enter a price to screen this deal.</p>
            <p className="text-xs text-muted-foreground/60">
              Results update live. No submit button needed.
            </p>
          </div>
        ) : (
          <div className="px-6 py-6 space-y-5 max-w-2xl">

            {/* ── Verdict ── */}
            <div className={`rounded-xl border p-5 ${vcfg.border} ${vcfg.bg}`}>
              <div className={`flex items-center gap-2.5 mb-2 ${vcfg.text}`}>
                {vcfg.icon}
                <span className="text-base font-semibold">
                  {isAr ? vcfg.labelAr : vcfg.label}
                </span>
              </div>
              <p className="text-sm text-secondary-foreground leading-relaxed">
                {result.verdictReason}
              </p>
            </div>

            {/* ── Key metrics ── */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <MetricCell
                label="Unlevered IRR"
                value={irr(result.unleveredIRR)}
                sub={result.irrBear && result.irrBull ? `${irr(result.irrBear)} – ${irr(result.irrBull)} range` : undefined}
                highlight={result.unleveredIRR != null && result.unleveredIRR >= 0.08}
              />
              <MetricCell
                label={`Levered IRR · ${Math.round(result.ltv * 100)}% LTV`}
                value={irr(result.leveredIRR)}
              />
              <MetricCell
                label="Yield vs. Market"
                value={result.yieldVsBenchBps != null ? bps(result.yieldVsBenchBps) : "—"}
                sub={result.benchmarkCapRate != null ? `Mkt cap: ${(result.benchmarkCapRate * 100).toFixed(2)}%` : undefined}
              />
              <MetricCell
                label="Price vs. Market"
                value={result.psmDeltaPct != null ? pct(result.psmDeltaPct) : "—"}
                sub={result.pricePerSqm != null ? psm(result.pricePerSqm) : undefined}
              />
            </div>

            {/* ── Benchmark bar ── */}
            {result.benchmarkPsm && (
              <div className="bg-card border border-border rounded-lg p-4 space-y-3">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
                    Market Reference
                  </p>
                  <ProvenanceBadge sourceId={result.benchmarkSourceId} />
                  {result.scenarioActive && (
                    <ProvenanceBadge sourceId="aouj-model-q1-2026" className="opacity-50" />
                  )}
                </div>

                {/* Model vs Scenario delta row — only when scenario overrides PSM */}
                {result.scenarioActive && scenario.psmPrice != null && (
                  <div className="flex items-center gap-4 rounded-md bg-secondary/60 px-3 py-2 text-xs">
                    <div>
                      <p className="text-muted-foreground">Model</p>
                      <p className="font-mono text-muted-foreground">
                        {psm(result.modelBenchmarkPsm)}
                      </p>
                    </div>
                    <div className="text-muted-foreground/40">→</div>
                    <div>
                      <p className="text-foreground font-medium">Your Assumption</p>
                      <p className="font-mono text-blue-400">{psm(result.benchmarkPsm)}</p>
                    </div>
                    {result.modelBenchmarkPsm > 0 && (
                      <div className="ml-auto">
                        <p className="text-muted-foreground">Δ</p>
                        <p className={`font-mono text-xs ${
                          scenario.psmPrice > result.modelBenchmarkPsm
                            ? "text-amber-400" : "text-emerald-400"
                        }`}>
                          {pct((scenario.psmPrice - result.modelBenchmarkPsm) / result.modelBenchmarkPsm * 100)}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                <div className="space-y-2">
                  {/* Bar — anchored to effective benchmarkPsm */}
                  <div className="relative h-6 bg-secondary rounded-full overflow-hidden">
                    {result.benchmarkLow && result.benchmarkHigh && (
                      <div
                        className="absolute inset-y-0 bg-primary/20 rounded-full"
                        style={{ left: "20%", right: "20%" }}
                      />
                    )}
                    {/* Model PSM marker when scenario active */}
                    {result.scenarioActive && scenario.psmPrice != null && (() => {
                      const min = result.benchmarkPsm * 0.5;
                      const max = result.benchmarkPsm * 1.5;
                      const pos = Math.max(2, Math.min(96,
                        ((result.modelBenchmarkPsm - min) / (max - min)) * 100
                      ));
                      return (
                        <div className="absolute inset-y-0 flex items-center" style={{ left: `${pos}%` }} title="Model benchmark">
                          <div className="w-0.5 h-full bg-muted-foreground/40" />
                        </div>
                      );
                    })()}
                    {/* User price marker */}
                    {result.pricePerSqm && result.benchmarkPsm && (() => {
                      const min = result.benchmarkPsm * 0.5;
                      const max = result.benchmarkPsm * 1.5;
                      const pos = Math.max(2, Math.min(96,
                        ((result.pricePerSqm - min) / (max - min)) * 100
                      ));
                      return (
                        <div className="absolute inset-y-0 flex items-center" style={{ left: `${pos}%` }}>
                          <div className="w-0.5 h-full bg-primary" />
                        </div>
                      );
                    })()}
                    {/* Benchmark / scenario marker */}
                    <div className="absolute inset-y-0 flex items-center" style={{ left: "50%" }}>
                      <div className={`w-0.5 h-full ${result.scenarioActive && scenario.psmPrice != null ? "bg-blue-400/70" : "bg-border"}`} />
                    </div>
                  </div>
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>−50%</span>
                    <span className={`font-medium ${result.scenarioActive && scenario.psmPrice != null ? "text-blue-400" : "text-foreground"}`}>
                      {result.scenarioActive && scenario.psmPrice != null ? "Your benchmark: " : "Market: "}
                      {psm(result.benchmarkPsm)}
                    </span>
                    <span>+50%</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-1 text-xs">
                  <div>
                    <p className="text-muted-foreground">Your Price</p>
                    <p className="font-mono text-foreground">{psm(result.pricePerSqm)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Benchmark Range</p>
                    <p className="font-mono text-foreground">
                      {psm(result.benchmarkLow)} – {psm(result.benchmarkHigh)}
                    </p>
                  </div>
                  {result.benchmarkCapRate && (
                    <div>
                      <p className="text-muted-foreground">
                        {result.scenarioActive && scenario.capRate != null ? "Your Cap Rate" : "Market Cap Rate"}
                      </p>
                      <p className={`font-mono ${result.scenarioActive && scenario.capRate != null ? "text-blue-400" : "text-foreground"}`}>
                        {(result.benchmarkCapRate * 100).toFixed(2)}%
                        {result.scenarioActive && scenario.capRate != null && result.modelBenchmarkCapRate != null && (
                          <span className="text-muted-foreground ml-1.5">
                            (Model: {(result.modelBenchmarkCapRate * 100).toFixed(2)}%)
                          </span>
                        )}
                      </p>
                    </div>
                  )}
                  {result.impliedCapRate && (
                    <div>
                      <p className="text-muted-foreground">Your Implied Cap Rate</p>
                      <p className="font-mono text-foreground">
                        {(result.impliedCapRate * 100).toFixed(2)}%
                      </p>
                    </div>
                  )}
                </div>
                <p className="text-xs text-muted-foreground/60">{result.benchmarkSource}</p>
              </div>
            )}

            {/* ── Financing summary ── */}
            {result.maxLoan && (
              <div className="bg-card border border-border rounded-lg p-4">
                <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground mb-3">
                  Financing
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                  <div>
                    <p className="text-muted-foreground">Max Loan ({Math.round(result.ltv * 100)}% LTV)</p>
                    <p className="font-mono text-foreground">{fmt(result.maxLoan)}</p>
                  </div>
                  {result.annualDebtService && (
                    <div>
                      <p className="text-muted-foreground">Debt Service / yr</p>
                      <p className="font-mono text-foreground">{fmt(result.annualDebtService)}</p>
                    </div>
                  )}
                  {result.forcedSaleValue && (
                    <div>
                      <p className="text-muted-foreground">Forced Sale Value</p>
                      <p className="font-mono text-foreground">{fmt(result.forcedSaleValue)}</p>
                    </div>
                  )}
                  {result.yieldVsSamaBps != null && (
                    <div>
                      <p className="text-muted-foreground">Yield Spread / SAMA</p>
                      <p className={`font-mono ${result.yieldVsSamaBps < 150 ? "text-amber-400" : "text-foreground"}`}>
                        {bps(result.yieldVsSamaBps)}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ── Risk flags ── */}
            {result.flags.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
                  Flags
                </p>
                {result.flags.map((f, i) => (
                  <div key={i} className={`flex items-start gap-2.5 rounded-lg border px-3 py-2.5 text-sm leading-snug ${
                    f.level === "critical" ? "border-red-700/40 bg-red-900/15 text-red-300"      :
                    f.level === "warn"     ? "border-amber-700/40 bg-amber-900/10 text-amber-300" :
                    "border-border bg-secondary/30 text-muted-foreground"
                  }`}>
                    {FLAG_ICON[f.level]}
                    <span>{f.message}</span>
                  </div>
                ))}
              </div>
            )}

            {/* ── Confidence ── */}
            <div className="flex items-center gap-3">
              <div className="flex-1 bg-secondary rounded-full h-1.5 overflow-hidden">
                <div className={`h-full rounded-full transition-all ${ccfg.color}`}
                  style={{ width: `${result.confidenceScore}%` }} />
              </div>
              <span className="text-xs text-muted-foreground whitespace-nowrap">
                {isAr ? ccfg.labelAr : ccfg.label} confidence · {result.confidenceScore}/100
              </span>
            </div>

            {/* ── Next steps hint ── */}
            {result.verdict === "proceed" && (
              <div className="flex items-start gap-2 text-xs text-muted-foreground border-t border-border pt-4">
                <ChevronRight className="w-3.5 h-3.5 mt-0.5 text-primary shrink-0" />
                <span>Run a full dual-approach valuation on the Valuation tab to generate an IC-ready analysis.</span>
              </div>
            )}

            {/* Source note */}
            <div className="flex items-center gap-2 pb-4">
              <ProvenanceBadge sourceId={result.benchmarkSourceId} showMeta />
              <p className="text-xs text-muted-foreground/50">
                Directional only. Not a certified valuation.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
