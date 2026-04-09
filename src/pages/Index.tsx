import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  PropertyInput, ValuationResult, computeValuation,
  SAMPLE_SCENARIOS, CITIES, DISTRICTS, PROPERTY_TYPES, CONDITIONS, TRANSACTION_TYPES,
} from "@/lib/valuation";
import { saveCase, generateCaseId, DEFAULT_CHECKLIST, DEFAULT_LEGAL_REVIEW } from "@/lib/cases";
import {
  Shield, AlertTriangle, TrendingUp, ChevronRight, Save,
  DollarSign, BarChart2, Building2, Info, CheckCircle, XCircle, AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import { formatSAR } from "@/lib/utils";

const defaultInput: PropertyInput = {
  city: "Riyadh", district: "Al Olaya", propertyType: "Residential Villa",
  size: 300, condition: "Good", transactionType: "Sale",
};

const fmt = formatSAR;

const pct = (n: number, decimals = 1) => `${n >= 0 ? "+" : ""}${n.toFixed(decimals)}%`;
const bps = (n: number) => `${(n * 10_000).toFixed(0)}bps`;

function Row({ label, value, sub, bold }: { label: string; value: string; sub?: string; bold?: boolean }) {
  return (
    <div className="flex justify-between items-baseline py-2 border-b border-border last:border-0">
      <span className={`text-sm ${bold ? "text-foreground font-medium" : "text-secondary-foreground"}`}>{label}</span>
      <span className={`text-sm font-mono ${bold ? "text-foreground font-semibold" : "text-secondary-foreground"}`}>
        {value}{sub && <span className="text-xs text-muted-foreground ml-1">{sub}</span>}
      </span>
    </div>
  );
}

function SectionHeader({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <span className="text-primary">{icon}</span>
      <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">{title}</h3>
    </div>
  );
}

const Index = () => {
  const [input, setInput] = useState<PropertyInput>(defaultInput);
  const [result, setResult] = useState<ValuationResult | null>(null);
  const [activeScenario, setActiveScenario] = useState<number | null>(null);
  const navigate = useNavigate();

  const setField = <K extends keyof PropertyInput>(key: K, value: PropertyInput[K]) => {
    setInput((prev) => ({ ...prev, [key]: value }));
    setActiveScenario(null);
    setResult(null);
  };

  const handleCityChange = (city: string) => {
    const districts = DISTRICTS[city] ?? ["Central District"];
    setInput((prev) => ({ ...prev, city, district: districts[0] }));
    setActiveScenario(null);
    setResult(null);
  };

  const handleGenerate = () => {
    if (!input.size || input.size <= 0) {
      toast.error("Please enter a valid size (sqm > 0)");
      return;
    }
    setResult(computeValuation(input));
  };

  const handleScenario = (idx: number) => {
    const s = SAMPLE_SCENARIOS[idx];
    setInput({ ...s.input });
    setActiveScenario(idx);
    setResult(computeValuation(s.input));
  };

  const handleSaveCase = () => {
    if (!result) return;
    const title = `${input.propertyType} — ${input.district}, ${input.city}`;
    const id = generateCaseId();
    saveCase({ id, title, input: { ...input }, result, status: "Draft", createdAt: new Date().toISOString(), checklist: DEFAULT_CHECKLIST.map(i => ({ ...i })), legalReview: { ...DEFAULT_LEGAL_REVIEW, notes: [] } });
    toast.success("Case saved", { description: title });
    navigate(`/cases/${id}`);
  };

  const availableDistricts = DISTRICTS[input.city] ?? ["Central District"];
  const isRent = input.transactionType === "Rent";

  return (
    <div className="min-h-screen bg-background">
      <main className="mx-auto max-w-5xl px-6 py-10 space-y-10">

        {/* Hero */}
        <section className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 bg-secondary border border-border rounded-full px-3 py-1 text-xs text-muted-foreground mb-2">
            <span className="w-1.5 h-1.5 rounded-full bg-primary inline-block" />
            Dual-Approach Valuation Engine · Q1 2026
          </div>
          <h1 className="text-3xl font-serif text-foreground tracking-tight">AOUJ</h1>
          <h2 className="text-lg text-muted-foreground">Directional Property Valuation</h2>
          <p className="text-sm text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Sales comparison + income approach reconciliation with financing analysis,
            cap rate sensitivity, and TAQEEM compliance signals.
          </p>
        </section>

        {/* Scenarios */}
        <section className="flex flex-col sm:flex-row gap-3 justify-center">
          {SAMPLE_SCENARIOS.map((s, i) => (
            <Button key={i} variant="scenario" size="lg"
              className={`flex-1 max-w-xs flex flex-col items-start h-auto py-4 px-5 ${activeScenario === i ? "border-primary text-primary" : ""}`}
              onClick={() => handleScenario(i)}>
              <span className="font-semibold text-sm">{s.label}</span>
              <span className="text-xs text-muted-foreground mt-0.5">{s.description}</span>
            </Button>
          ))}
        </section>

        {/* Form */}
        <section className="bg-card border border-border rounded-lg p-6">
          <h3 className="text-base text-foreground mb-5 font-serif">Property Details</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="City / Region">
              <select value={input.city} onChange={(e) => handleCityChange(e.target.value)} className={selectCls}>
                {CITIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </Field>
            <Field label="District">
              <select value={input.district} onChange={(e) => setField("district", e.target.value)} className={selectCls}>
                {availableDistricts.map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
            </Field>
            <Field label="Property Type">
              <select value={input.propertyType} onChange={(e) => setField("propertyType", e.target.value)} className={selectCls}>
                {PROPERTY_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </Field>
            <Field label="Size (sqm)">
              <input type="number" value={input.size || ""} min={1} max={100_000}
                onChange={(e) => setField("size", Math.max(0, Number(e.target.value) || 0))}
                className={inputCls} placeholder="e.g. 300" />
            </Field>
            <Field label="Condition">
              <select value={input.condition} onChange={(e) => setField("condition", e.target.value)} className={selectCls}>
                {CONDITIONS.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </Field>
            <Field label="Transaction Type">
              <select value={input.transactionType} onChange={(e) => setField("transactionType", e.target.value)} className={selectCls}>
                {TRANSACTION_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </Field>
            <Field label="Year Built (optional)">
              <input type="number" value={input.yearBuilt ?? ""} min={1900} max={new Date().getFullYear()}
                onChange={(e) => setField("yearBuilt", e.target.value ? Number(e.target.value) : undefined)}
                className={inputCls} placeholder="e.g. 2010" />
            </Field>
            {input.propertyType === "Apartment" && (
              <Field label="Floor Level (optional)">
                <input type="number" value={input.floorLevel ?? ""} min={1} max={80}
                  onChange={(e) => setField("floorLevel", e.target.value ? Number(e.target.value) : undefined)}
                  className={inputCls} placeholder="e.g. 8" />
              </Field>
            )}
            {input.propertyType === "Commercial" && (
              <Field label="Street Frontage / Corner Plot">
                <label className="flex items-center gap-2 cursor-pointer mt-1">
                  <input type="checkbox" checked={!!input.hasStreetFrontage}
                    onChange={(e) => setField("hasStreetFrontage", e.target.checked)}
                    className="w-4 h-4 accent-primary" />
                  <span className="text-sm text-secondary-foreground">Corner / street-facing plot (+25%)</span>
                </label>
              </Field>
            )}
          </div>
          <div className="mt-6 flex justify-end">
            <Button variant="gold" size="lg" onClick={handleGenerate}>
              <TrendingUp className="w-4 h-4 mr-2" />
              Generate Analysis
            </Button>
          </div>
        </section>

        {result && (
          <>
            {/* ── 1. Reconciled Headline ── */}
            <section className="bg-card border border-border rounded-lg p-6 space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-3">
                  <h3 className="text-base font-serif text-foreground">
                    {isRent ? "Annual Rent Estimate" : "Reconciled Valuation"}
                  </h3>
                  <Badge variant={result.confidence.level === "High" ? "high" : result.confidence.level === "Medium" ? "medium" : "low"}>
                    {result.confidence.level} Confidence · {result.confidence.score}/100
                  </Badge>
                </div>
                <Button variant="ghost" size="sm" onClick={handleSaveCase} className="text-primary hover:text-primary">
                  <Save className="w-4 h-4 mr-1.5" />Save as Case
                </Button>
              </div>

              <div className="bg-secondary rounded-lg p-5 text-center">
                <p className="text-xs uppercase tracking-widest text-muted-foreground mb-2">
                  {isRent ? "Estimated Annual Rent (SAR/yr)" : "Estimated Range (SAR)"}
                </p>
                <p className="text-3xl font-serif text-foreground">
                  {fmt(result.reconciledLow)}
                  <span className="text-muted-foreground mx-3">—</span>
                  {fmt(result.reconciledHigh)}
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  Midpoint: {fmt(result.reconciledValue)} · SAR {result.pricePerSqm.toLocaleString()}/sqm
                </p>
              </div>

              {result.incomeApproach && (
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="bg-secondary/60 rounded-lg p-3 text-center">
                    <p className="text-xs text-muted-foreground mb-1">
                      Sales Comparison ({Math.round(result.salesCompWeight * 100)}% weight)
                    </p>
                    <p className="font-mono text-foreground">{fmt(result.salesCompValue)}</p>
                  </div>
                  <div className="bg-secondary/60 rounded-lg p-3 text-center">
                    <p className="text-xs text-muted-foreground mb-1">
                      Income Approach ({Math.round(result.incomeWeight * 100)}% weight)
                    </p>
                    <p className="font-mono text-foreground">{fmt(result.incomeApproach.incomeValue)}</p>
                  </div>
                </div>
              )}

              {result.depreciationNote && (
                <p className="text-xs text-muted-foreground bg-secondary/40 rounded px-3 py-2 border border-border">
                  Depreciation: {result.depreciationNote}
                </p>
              )}

              {/* Reasoning */}
              <div>
                <p className="text-xs uppercase tracking-widest text-muted-foreground mb-3">Valuation Build-Up</p>
                <ul className="space-y-1.5">
                  {result.reasoning.map((r, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-secondary-foreground">
                      <ChevronRight className="w-3.5 h-3.5 mt-0.5 text-primary shrink-0" />
                      <span>{r}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {result.governanceWarning && (
                <div className="flex items-start gap-3 rounded-lg border p-4"
                  style={{ borderColor: "hsl(var(--warning-border))", backgroundColor: "hsl(var(--warning-bg))" }}>
                  <AlertTriangle className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                  <p className="text-sm text-secondary-foreground leading-relaxed">{result.governanceWarning}</p>
                </div>
              )}
            </section>

            {/* ── 2. Income Approach Detail ── */}
            {result.incomeApproach && (
              <section className="bg-card border border-border rounded-lg p-6 animate-in fade-in duration-500">
                <SectionHeader icon={<DollarSign className="w-4 h-4" />} title="Income Approach — NOI Analysis" />
                <Row label="Gross Rental Income" value={fmt(result.incomeApproach.grossRentalIncome)} sub="/yr" />
                <Row
                  label={`Vacancy Allowance (${Math.round(result.incomeApproach.vacancyRate * 100)}% — ${result.incomeApproach.vacancySource})`}
                  value={`−${fmt(result.incomeApproach.grossRentalIncome - result.incomeApproach.effectiveGrossIncome)}`} sub="/yr" />
                <Row label="Effective Gross Income" value={fmt(result.incomeApproach.effectiveGrossIncome)} sub="/yr" />
                <Row label={`Operating Expenses (${Math.round(result.incomeApproach.opexRatio * 100)}% of EGI)`}
                  value={`−${fmt(result.incomeApproach.operatingExpenses)}`} sub="/yr" />
                <Row label="Net Operating Income (NOI)" value={fmt(result.incomeApproach.noi)} sub="/yr" bold />
                <Row
                  label={`Market Cap Rate — ${result.incomeApproach.capRateSource}`}
                  value={`${(result.incomeApproach.capRate * 100).toFixed(2)}%`} />
                <Row label="Income Approach Value" value={fmt(result.incomeApproach.incomeValue)} bold />
                <Row label="Implied Gross Yield (GRI ÷ Sales Comp)"
                  value={`${(result.incomeApproach.impliedGrossYield * 100).toFixed(2)}%`} />
              </section>
            )}

            {/* ── 3. Sensitivity Analysis ── */}
            <section className="bg-card border border-border rounded-lg p-6 animate-in fade-in duration-500">
              <SectionHeader icon={<BarChart2 className="w-4 h-4" />}
                title={result.sensitivityType === "cap_rate" ? "Cap Rate Sensitivity" : "Market Price Sensitivity"} />
              <p className="text-xs text-muted-foreground mb-4">
                {result.sensitivityType === "cap_rate"
                  ? "Impact on income approach value from cap rate movements (NOI held constant)."
                  : "Impact on reconciled value from market price movements (bull / base / bear)."}
              </p>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-xs text-muted-foreground uppercase tracking-wider">
                      <th className="text-left pb-3">Scenario</th>
                      <th className="text-right pb-3">{result.sensitivityType === "cap_rate" ? "Cap Rate" : "Shift"}</th>
                      <th className="text-right pb-3">Value</th>
                      <th className="text-right pb-3">Δ vs Base</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.sensitivityTable.map((row) => (
                      <tr key={row.label}
                        className={`border-t border-border ${row.isBase ? "text-foreground font-semibold" : "text-secondary-foreground"}`}>
                        <td className="py-2">{row.label}</td>
                        <td className="text-right py-2 font-mono">
                          {result.sensitivityType === "cap_rate"
                            ? `${row.shiftValue.toFixed(2)}%`
                            : `${row.shiftValue > 0 ? "+" : ""}${row.shiftValue.toFixed(0)}%`}
                        </td>
                        <td className="text-right py-2 font-mono">{fmt(row.value)}</td>
                        <td className={`text-right py-2 font-mono text-xs ${row.isBase ? "" : row.deltaPercent > 0 ? "text-emerald-400" : "text-red-400"}`}>
                          {row.isBase ? "—" : pct(row.deltaPercent)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            {/* ── 4. Financing & LTV ── */}
            <section className="bg-card border border-border rounded-lg p-6 animate-in fade-in duration-500">
              <SectionHeader icon={<Building2 className="w-4 h-4" />} title="Financing & Risk Analysis" />
              {isRent && (
                <p className="text-xs text-amber-400 bg-amber-900/20 border border-amber-700/30 rounded px-3 py-2 mb-4">
                  LTV analysis based on implied capital value of the income stream. For rent mandates, financing is assessed against the underlying asset value.
                </p>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8">
                <div>
                  <Row label="SAMA Max LTV" value={`${Math.round(result.ltvAnalysis.samaMaxLTV * 100)}%`} />
                  <Row label="Implied Max Loan" value={fmt(result.ltvAnalysis.impliedMaxLoan)} bold />
                  <Row label="Lending Rate (proxy)" value={`${(result.ltvAnalysis.lendingRate * 100).toFixed(2)}%`} />
                  {result.ltvAnalysis.annualDebtService !== null && (
                    <Row label="Annual Debt Service (20yr)" value={fmt(result.ltvAnalysis.annualDebtService)} sub="/yr" />
                  )}
                </div>
                <div>
                  <Row label={`Forced Sale Value (${Math.round(result.ltvAnalysis.fsHaircut * 100)}% haircut)`}
                    value={fmt(result.ltvAnalysis.forcedSaleValue)} bold />
                  <Row label="FSV as % of Market Value"
                    value={`${Math.round((1 - result.ltvAnalysis.fsHaircut) * 100)}%`} />
                  {result.ltvAnalysis.dscr !== null && (
                    <div className="flex justify-between items-center py-2 border-b border-border">
                      <span className="text-sm text-secondary-foreground">DSCR</span>
                      <span className={`text-sm font-mono font-semibold flex items-center gap-1.5
                        ${result.ltvAnalysis.dscrFlag === "pass" ? "text-emerald-400" : result.ltvAnalysis.dscrFlag === "warn" ? "text-amber-400" : "text-red-400"}`}>
                        {result.ltvAnalysis.dscrFlag === "pass" ? <CheckCircle className="w-3.5 h-3.5" /> : result.ltvAnalysis.dscrFlag === "warn" ? <AlertCircle className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                        {result.ltvAnalysis.dscr.toFixed(2)}x
                        <span className="text-xs font-normal text-muted-foreground">(min 1.25x)</span>
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </section>

            {/* ── 5. Market Context ── */}
            <section className="bg-card border border-border rounded-lg p-6 animate-in fade-in duration-500">
              <SectionHeader icon={<TrendingUp className="w-4 h-4" />} title="Market Context" />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8">
                <div>
                  <Row label={`SAMA Repo Rate (${result.marketContext.rateVintage})`}
                    value={`${(result.marketContext.samaRepoRate * 100).toFixed(2)}%`} />
                  <Row label="Implied Cap Rate Floor (Repo +150bps)"
                    value={`${(result.marketContext.impliedCapRateFloor * 100).toFixed(2)}%`} />
                  {result.marketContext.yieldSpread !== null && (
                    <Row label="Yield Spread over Repo" value={bps(result.marketContext.yieldSpread)} bold />
                  )}
                </div>
                <div className="mt-4 sm:mt-0">
                  <p className="text-xs text-muted-foreground mb-2">Spread Assessment</p>
                  <p className="text-sm text-secondary-foreground leading-relaxed">{result.marketContext.spreadComment}</p>
                </div>
              </div>
              {result.marketContext.vision2030Flag && (
                <div className="mt-4 flex items-start gap-3 rounded-lg bg-primary/10 border border-primary/20 p-3">
                  <span className="text-primary text-sm mt-0.5">⚡</span>
                  <p className="text-sm text-secondary-foreground leading-relaxed">{result.marketContext.vision2030Flag}</p>
                </div>
              )}
            </section>

            {/* ── 6. Confidence Breakdown ── */}
            <section className="bg-card border border-border rounded-lg p-6 animate-in fade-in duration-500">
              <SectionHeader icon={<BarChart2 className="w-4 h-4" />} title="Confidence Scoring" />
              <div className="flex items-center gap-4 mb-5">
                <div className="flex-1 bg-secondary rounded-full h-2 overflow-hidden">
                  <div className="h-full bg-primary rounded-full transition-all"
                    style={{ width: `${result.confidence.score}%` }} />
                </div>
                <Badge variant={result.confidence.level === "High" ? "high" : result.confidence.level === "Medium" ? "medium" : "low"}>
                  {result.confidence.score}/100
                </Badge>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                {[
                  { label: "City Data", score: result.confidence.cityScore },
                  { label: "District", score: result.confidence.districtScore },
                  { label: "Asset Type", score: result.confidence.propertyTypeScore },
                  { label: "Market Activity", score: result.confidence.marketActivityScore },
                ].map(({ label, score }) => (
                  <div key={label} className="bg-secondary rounded-lg p-3 text-center">
                    <p className="text-xs text-muted-foreground">{label}</p>
                    <p className="text-lg font-mono text-foreground mt-1">{score}<span className="text-xs text-muted-foreground">/25</span></p>
                  </div>
                ))}
              </div>
              <ul className="space-y-1.5">
                {result.confidence.explanation.map((e, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                    <ChevronRight className="w-3 h-3 mt-0.5 text-primary shrink-0" />
                    <span>{e}</span>
                  </li>
                ))}
              </ul>
            </section>

            {/* ── 7. TAQEEM Compliance ── */}
            <section className="bg-card border border-border rounded-lg p-6 animate-in fade-in duration-500">
              <SectionHeader icon={<Shield className="w-4 h-4" />} title="TAQEEM Compliance Signals" />
              <div className="space-y-3">
                {result.taqeemFlags.map((flag) => (
                  <div key={flag.code}
                    className={`flex items-start gap-3 rounded-lg border p-3 text-sm leading-relaxed
                      ${flag.level === "required" ? "border-red-700/50 bg-red-900/20 text-red-300" :
                        flag.level === "warning" ? "border-amber-700/40 bg-amber-900/15 text-amber-300" :
                          "border-border bg-secondary/40 text-muted-foreground"}`}>
                    <span className="shrink-0 text-xs font-mono mt-0.5 opacity-60">{flag.code}</span>
                    <span>{flag.message}</span>
                  </div>
                ))}
              </div>
            </section>

            {/* ── 8. Methodology ── */}
            <section className="border-t border-border pt-8 pb-12">
              <div className="flex items-center gap-2 mb-4">
                <Info className="w-4 h-4 text-primary" />
                <h3 className="text-base font-serif text-foreground">Methodology & Limitations</h3>
              </div>
              <div className="space-y-3 text-sm text-muted-foreground leading-relaxed max-w-3xl">
                <p>
                  AOUJ reconciles a <strong className="text-secondary-foreground">sales comparison approach</strong> (comparable transactions, district-adjusted) with an <strong className="text-secondary-foreground">income approach</strong> (NOI ÷ market cap rate, independently derived from rental comparables). Weights reflect asset class conventions used by institutional investors.
                </p>
                <p>
                  Cap rates are sourced from investment transaction evidence (Q1 2026). Rental comparables are independently benchmarked from active lease market data. Neither dataset incorporates live REGA transaction feeds or TAQEEM-certified appraisals.
                </p>
                <p className="italic">{result.caveat}</p>
              </div>
            </section>
          </>
        )}
      </main>
    </div>
  );
};

const selectCls = "w-full bg-secondary border border-border rounded-md px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary";
const inputCls = "w-full bg-secondary border border-border rounded-md px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{label}</label>
      {children}
    </div>
  );
}

export default Index;
