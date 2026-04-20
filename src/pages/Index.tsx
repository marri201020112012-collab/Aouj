import { useState, useMemo } from "react";
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
  Calculator, FlaskConical, SlidersHorizontal,
} from "lucide-react";
import {
  computeIrrResult, DEFAULT_IRR_INPUTS, IrrInputs, HoldYears, RentGrowth, ExitCapDelta,
} from "@/lib/irr";
import { toast } from "sonner";
import { formatSAR } from "@/lib/utils";
import { useLang } from "@/lib/lang";
import {
  cityName, districtName, propTypeName, conditionName, txTypeName,
} from "@/lib/i18n";
import { ProvenanceBadge } from "@/components/ProvenanceBadge";
import { SOURCE_ID } from "@/lib/sources";
import { computeCompBenchmark, CompBenchmark } from "@/lib/compBenchmark";
import { getScenario, hasScenario } from "@/lib/scenario";

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
  const [irrInputs, setIrrInputs] = useState<IrrInputs>(DEFAULT_IRR_INPUTS);
  const navigate = useNavigate();
  const { t, lang, isAr } = useLang();

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
      toast.error(t("form.sizeError"));
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
    const title = `${propTypeName(input.propertyType, lang)} — ${districtName(input.district, lang)}, ${cityName(input.city, lang)}`;
    const id = generateCaseId();
    const now = new Date().toISOString();
    saveCase({
      id, title, input: { ...input }, result,
      stage: "Screening",
      stageHistory: [{ stage: "Screening", timestamp: now }],
      auditLog: [{ timestamp: now, event: "Case created" }],
      decisionRecord: null,
      assumptionNotes: "",
      status: "Draft",
      createdAt: now,
      checklist: DEFAULT_CHECKLIST.map(i => ({ ...i })),
      legalReview: { ...DEFAULT_LEGAL_REVIEW, notes: [] },
    });
    toast.success(t("result.saveCase"), { description: title });
    navigate(`/cases/${id}`);
  };

  const scenario = useMemo(() => getScenario(), []);
  const scenarioActive = hasScenario(scenario);

  const compBenchmark = useMemo<CompBenchmark | null>(() => {
    const cb = computeCompBenchmark(input.city, input.propertyType, {
      district: input.district,
      includeDemo: true,
    });
    return cb && cb.qualityLabel !== "insufficient" ? cb : null;
  }, [input.city, input.propertyType, input.district]);

  const availableDistricts = DISTRICTS[input.city] ?? ["Central District"];
  const isRent = input.transactionType === "Rent";

  const confLevel = result?.confidence.level;
  const confBadgeVariant = confLevel === "High" ? "high" : confLevel === "Medium" ? "medium" : "low";
  const confLabel = confLevel ? `${t(`conf.${confLevel}`)} · ${result!.confidence.score}/100` : "";

  return (
    <div className="min-h-screen bg-background">
      <main className="mx-auto max-w-5xl px-6 py-10 space-y-10">

        {/* Hero */}
        <section className="text-center space-y-4 pt-2 hero-section">
          <div className="inline-flex items-center gap-2 bg-secondary border border-border rounded-full px-3 py-1 text-xs text-muted-foreground">
            <span className="w-1.5 h-1.5 rounded-full bg-primary inline-block animate-pulse" />
            {t("hero.badge")}
          </div>
          <h1 className="text-5xl sm:text-6xl font-serif text-foreground tracking-tight leading-none">
            {t("hero.title")}
          </h1>
          <h2 className="text-xs font-medium tracking-[0.2em] uppercase text-muted-foreground">
            {t("hero.subtitle")}
          </h2>
          <p className="text-sm text-muted-foreground max-w-lg mx-auto leading-relaxed">
            {t("hero.desc")}
          </p>
          {/* Trust strip */}
          <div className="flex items-start justify-center gap-6 sm:gap-10 pt-5 mt-2 border-t border-border/50 flex-wrap">
            {[
              { val: t("hero.stat1"), sub: t("hero.stat1sub") },
              { val: t("hero.stat2"), sub: t("hero.stat2sub") },
              { val: t("hero.stat3"), sub: t("hero.stat3sub") },
              { val: t("hero.stat4"), sub: t("hero.stat4sub") },
            ].map(({ val, sub }, i) => (
              <div key={i} className="text-center min-w-[60px]">
                <p className="text-sm font-semibold text-foreground tabular-nums">{val}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Scenarios */}
        <section className="space-y-3">
          <p className="text-center text-xs font-medium uppercase tracking-widest text-muted-foreground">
            {t("hero.scenarios")}
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            {SAMPLE_SCENARIOS.map((_, i) => (
              <Button key={i} variant="scenario" size="lg"
                className={`flex-1 max-w-xs flex flex-col items-start h-auto py-4 px-5 transition-all ${activeScenario === i ? "border-primary text-primary shadow-sm shadow-primary/10" : ""}`}
                onClick={() => handleScenario(i)}>
                <span className="font-semibold text-sm">{t(`scenario.${i}.label`)}</span>
                <span className="text-xs text-muted-foreground mt-0.5">{t(`scenario.${i}.description`)}</span>
              </Button>
            ))}
          </div>
        </section>

        {/* Form */}
        <section className="bg-card border border-border rounded-lg p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-5">
            <h3 className="text-base text-foreground font-serif shrink-0">{t("form.title")}</h3>
            <div className="flex-1 h-px bg-border" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label={t("form.city")}>
              <select value={input.city} onChange={(e) => handleCityChange(e.target.value)} className={selectCls}>
                {CITIES.map((c) => <option key={c} value={c}>{cityName(c, lang)}</option>)}
              </select>
            </Field>
            <Field label={t("form.district")}>
              <select value={input.district} onChange={(e) => setField("district", e.target.value)} className={selectCls}>
                {availableDistricts.map((d) => <option key={d} value={d}>{districtName(d, lang)}</option>)}
              </select>
            </Field>
            <Field label={t("form.propertyType")}>
              <select value={input.propertyType} onChange={(e) => setField("propertyType", e.target.value)} className={selectCls}>
                {PROPERTY_TYPES.map((type) => <option key={type} value={type}>{propTypeName(type, lang)}</option>)}
              </select>
            </Field>
            <Field label={t("form.size")}>
              <input type="number" value={input.size || ""} min={1} max={100_000}
                onChange={(e) => setField("size", Math.max(0, Number(e.target.value) || 0))}
                className={inputCls} placeholder={t("form.sizePlaceholder")} />
            </Field>
            <Field label={t("form.condition")}>
              <select value={input.condition} onChange={(e) => setField("condition", e.target.value)} className={selectCls}>
                {CONDITIONS.map((c) => <option key={c} value={c}>{conditionName(c, lang)}</option>)}
              </select>
            </Field>
            <Field label={t("form.txType")}>
              <select value={input.transactionType} onChange={(e) => setField("transactionType", e.target.value)} className={selectCls}>
                {TRANSACTION_TYPES.map((tx) => <option key={tx} value={tx}>{txTypeName(tx, lang)}</option>)}
              </select>
            </Field>
            <Field label={t("form.yearBuilt")}>
              <input type="number" value={input.yearBuilt ?? ""} min={1900} max={new Date().getFullYear()}
                onChange={(e) => setField("yearBuilt", e.target.value ? Number(e.target.value) : undefined)}
                className={inputCls} placeholder={t("form.yearPlaceholder")} />
            </Field>
            {input.propertyType === "Apartment" && (
              <Field label={t("form.floorLevel")}>
                <input type="number" value={input.floorLevel ?? ""} min={1} max={80}
                  onChange={(e) => setField("floorLevel", e.target.value ? Number(e.target.value) : undefined)}
                  className={inputCls} placeholder={t("form.floorPlaceholder")} />
              </Field>
            )}
            {input.propertyType === "Commercial" && (
              <Field label={t("form.frontage")}>
                <label className="flex items-center gap-2 cursor-pointer mt-1">
                  <input type="checkbox" checked={!!input.hasStreetFrontage}
                    onChange={(e) => setField("hasStreetFrontage", e.target.checked)}
                    className="w-4 h-4 accent-primary" />
                  <span className="text-sm text-secondary-foreground">{t("form.frontageDesc")}</span>
                </label>
              </Field>
            )}
          </div>
          <div className={`mt-6 flex ${isAr ? "justify-start" : "justify-end"}`}>
            <Button variant="gold" size="lg" onClick={handleGenerate}>
              <TrendingUp className="w-4 h-4 mr-2" />
              {t("form.generate")}
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
                    {isRent ? t("result.rentTitle") : t("result.reconciledTitle")}
                  </h3>
                  <Badge variant={confBadgeVariant}>{confLabel}</Badge>
                </div>
                <Button variant="ghost" size="sm" onClick={handleSaveCase} className="text-primary hover:text-primary">
                  <Save className="w-4 h-4 mr-1.5" />{t("result.saveCase")}
                </Button>
              </div>

              <div className="bg-secondary rounded-lg p-5 text-center">
                <p className="text-xs uppercase tracking-widest text-muted-foreground mb-2">
                  {isRent ? t("result.rentLabel") : t("result.rangeLabel")}
                </p>
                <p className="text-3xl font-serif text-foreground">
                  {fmt(result.reconciledLow)}
                  <span className="text-muted-foreground mx-3">—</span>
                  {fmt(result.reconciledHigh)}
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  {t("result.midpoint")}: {fmt(result.reconciledValue)} · {t("result.perSqm", { v: result.pricePerSqm.toLocaleString() })}
                </p>
              </div>

              {result.incomeApproach && (
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="bg-secondary/60 rounded-lg p-3 text-center">
                    <p className="text-xs text-muted-foreground mb-1">
                      {t("result.salesCompLabel", { w: Math.round(result.salesCompWeight * 100) })}
                    </p>
                    <p className="font-mono text-foreground">{fmt(result.salesCompValue)}</p>
                  </div>
                  <div className="bg-secondary/60 rounded-lg p-3 text-center">
                    <p className="text-xs text-muted-foreground mb-1">
                      {t("result.incomeLabel", { w: Math.round(result.incomeWeight * 100) })}
                    </p>
                    <p className="font-mono text-foreground">{fmt(result.incomeApproach.incomeValue)}</p>
                  </div>
                </div>
              )}

              {result.depreciationNote && (
                <p className="text-xs text-muted-foreground bg-secondary/40 rounded px-3 py-2 border border-border">
                  {t("result.depreciation")}: {result.depreciationNote}
                </p>
              )}

              <div>
                <p className="text-xs uppercase tracking-widest text-muted-foreground mb-3">{t("result.buildUp")}</p>
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

            {/* ── 1.5 Evidence Reference ── */}
            <section className="bg-card border border-border rounded-lg p-6 animate-in fade-in duration-500">
              <SectionHeader icon={<FlaskConical className="w-4 h-4" />} title="Evidence Reference" />

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Model layer */}
                <div className="bg-secondary/60 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <ProvenanceBadge sourceId={SOURCE_ID.MODEL} />
                  </div>
                  <p className="text-xs text-muted-foreground mb-1">Model PSM</p>
                  <p className="text-lg font-mono text-foreground">{result.pricePerSqm.toLocaleString()} SAR/m²</p>
                </div>

                {/* Comp-derived layer */}
                <div className={`rounded-lg p-4 ${compBenchmark ? "bg-secondary/60" : "bg-secondary/30 border border-dashed border-border"}`}>
                  <div className="flex items-center gap-2 mb-2">
                    <FlaskConical className="w-3 h-3 text-amber-400" />
                    <span className="text-xs text-amber-400 font-medium">Comp-Derived</span>
                  </div>
                  {compBenchmark ? (
                    <>
                      <p className="text-xs text-muted-foreground mb-1">{compBenchmark.count} comps · {compBenchmark.qualityLabel}</p>
                      <p className="text-lg font-mono text-foreground">{compBenchmark.avgPsm.toLocaleString()} SAR/m²</p>
                      {(() => {
                        const delta = ((compBenchmark.avgPsm - result.pricePerSqm) / result.pricePerSqm) * 100;
                        return (
                          <p className={`text-xs mt-1 font-mono ${Math.abs(delta) < 5 ? "text-muted-foreground" : delta > 0 ? "text-emerald-400" : "text-red-400"}`}>
                            {delta >= 0 ? "+" : ""}{delta.toFixed(1)}% vs model
                          </p>
                        );
                      })()}
                    </>
                  ) : (
                    <p className="text-xs text-muted-foreground mt-2">No comps for this city/type — add transactions in the Comps repository</p>
                  )}
                </div>

                {/* Scenario layer */}
                <div className={`rounded-lg p-4 ${scenarioActive ? "bg-secondary/60" : "bg-secondary/30 border border-dashed border-border"}`}>
                  <div className="flex items-center gap-2 mb-2">
                    <SlidersHorizontal className="w-3 h-3 text-blue-400" />
                    <span className="text-xs text-blue-400 font-medium">Scenario</span>
                  </div>
                  {scenarioActive && scenario.psmPrice ? (
                    <>
                      <p className="text-xs text-muted-foreground mb-1">Analyst PSM override</p>
                      <p className="text-lg font-mono text-foreground">{scenario.psmPrice.toLocaleString()} SAR/m²</p>
                      {(() => {
                        const delta = ((scenario.psmPrice - result.pricePerSqm) / result.pricePerSqm) * 100;
                        return (
                          <p className={`text-xs mt-1 font-mono ${Math.abs(delta) < 5 ? "text-muted-foreground" : delta > 0 ? "text-emerald-400" : "text-red-400"}`}>
                            {delta >= 0 ? "+" : ""}{delta.toFixed(1)}% vs model
                          </p>
                        );
                      })()}
                    </>
                  ) : scenarioActive ? (
                    <p className="text-xs text-muted-foreground mt-2">Scenario active — other assumptions adjusted, no PSM override set</p>
                  ) : (
                    <p className="text-xs text-muted-foreground mt-2">No scenario — set assumptions in the Screener</p>
                  )}
                </div>
              </div>

              {/* Active scenario overrides detail */}
              {scenarioActive && (scenario.rentPsm || scenario.occupancy || scenario.capRate || scenario.growthRate) && (
                <div className="mt-4 bg-blue-900/10 border border-blue-700/20 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <SlidersHorizontal className="w-3 h-3 text-blue-400" />
                    <p className="text-xs font-medium text-blue-400 uppercase tracking-wider">Active Scenario Overrides</p>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {scenario.rentPsm && (
                      <div className="bg-secondary/50 rounded px-2 py-1.5">
                        <p className="text-xs text-muted-foreground">Rent PSM</p>
                        <p className="text-xs font-mono text-foreground mt-0.5">{scenario.rentPsm.toLocaleString()} SAR/m²/yr</p>
                      </div>
                    )}
                    {scenario.occupancy && (
                      <div className="bg-secondary/50 rounded px-2 py-1.5">
                        <p className="text-xs text-muted-foreground">Occupancy</p>
                        <p className="text-xs font-mono text-foreground mt-0.5">{scenario.occupancy}%</p>
                      </div>
                    )}
                    {scenario.capRate && (
                      <div className="bg-secondary/50 rounded px-2 py-1.5">
                        <p className="text-xs text-muted-foreground">Cap Rate</p>
                        <p className="text-xs font-mono text-foreground mt-0.5">{scenario.capRate}%</p>
                      </div>
                    )}
                    {scenario.growthRate && (
                      <div className="bg-secondary/50 rounded px-2 py-1.5">
                        <p className="text-xs text-muted-foreground">Growth Rate</p>
                        <p className="text-xs font-mono text-foreground mt-0.5">{scenario.growthRate}% p.a.</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </section>

            {/* ── 2. Income Approach ── */}
            {result.incomeApproach && (
              <section className="bg-card border border-border rounded-lg p-6 animate-in fade-in duration-500">
                <SectionHeader icon={<DollarSign className="w-4 h-4" />} title={t("income.title")} />
                <Row label={t("income.gri")} value={fmt(result.incomeApproach.grossRentalIncome)} sub={t("income.perYr")} />
                <Row
                  label={t("income.vacancy", { v: Math.round(result.incomeApproach.vacancyRate * 100), src: result.incomeApproach.vacancySource })}
                  value={`−${fmt(result.incomeApproach.grossRentalIncome - result.incomeApproach.effectiveGrossIncome)}`} sub={t("income.perYr")} />
                <Row label={t("income.egi")} value={fmt(result.incomeApproach.effectiveGrossIncome)} sub={t("income.perYr")} />
                <Row
                  label={t("income.opex", { v: Math.round(result.incomeApproach.opexRatio * 100) })}
                  value={`−${fmt(result.incomeApproach.operatingExpenses)}`} sub={t("income.perYr")} />
                <Row label={t("income.noi")} value={fmt(result.incomeApproach.noi)} sub={t("income.perYr")} bold />
                <Row
                  label={t("income.capRate", { src: result.incomeApproach.capRateSource })}
                  value={`${(result.incomeApproach.capRate * 100).toFixed(2)}%`} />
                <Row label={t("income.value")} value={fmt(result.incomeApproach.incomeValue)} bold />
                <Row label={t("income.yield")} value={`${(result.incomeApproach.impliedGrossYield * 100).toFixed(2)}%`} />
              </section>
            )}

            {/* ── 3. Sensitivity ── */}
            <section className="bg-card border border-border rounded-lg p-6 animate-in fade-in duration-500">
              <SectionHeader icon={<BarChart2 className="w-4 h-4" />}
                title={result.sensitivityType === "cap_rate" ? t("sens.capTitle") : t("sens.mktTitle")} />
              <p className="text-xs text-muted-foreground mb-4">
                {result.sensitivityType === "cap_rate" ? t("sens.capNote") : t("sens.mktNote")}
              </p>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-xs text-muted-foreground uppercase tracking-wider">
                      <th className="text-left pb-3">{t("sens.scenario")}</th>
                      <th className="text-right pb-3">{result.sensitivityType === "cap_rate" ? t("sens.capRate") : t("sens.shift")}</th>
                      <th className="text-right pb-3">{t("sens.value")}</th>
                      <th className="text-right pb-3">{t("sens.delta")}</th>
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

            {/* ── 4. Financing ── */}
            <section className="bg-card border border-border rounded-lg p-6 animate-in fade-in duration-500">
              <SectionHeader icon={<Building2 className="w-4 h-4" />} title={t("fin.title")} />
              {isRent && (
                <p className="text-xs text-amber-400 bg-amber-900/20 border border-amber-700/30 rounded px-3 py-2 mb-4">
                  {t("fin.rentNote")}
                </p>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8">
                <div>
                  <Row label={t("fin.samaLtv")} value={`${Math.round(result.ltvAnalysis.samaMaxLTV * 100)}%`} />
                  <Row label={t("fin.maxLoan")} value={fmt(result.ltvAnalysis.impliedMaxLoan)} bold />
                  <Row label={t("fin.lendingRate")} value={`${(result.ltvAnalysis.lendingRate * 100).toFixed(2)}%`} />
                  {result.ltvAnalysis.annualDebtService !== null && (
                    <Row label={t("fin.debtService")} value={fmt(result.ltvAnalysis.annualDebtService)} sub={t("fin.perYr")} />
                  )}
                </div>
                <div>
                  <Row
                    label={t("fin.fsv", { v: Math.round(result.ltvAnalysis.fsHaircut * 100) })}
                    value={fmt(result.ltvAnalysis.forcedSaleValue)} bold />
                  <Row label={t("fin.fsvPct")} value={`${Math.round((1 - result.ltvAnalysis.fsHaircut) * 100)}%`} />
                  {result.ltvAnalysis.dscr !== null && (
                    <div className="flex justify-between items-center py-2 border-b border-border">
                      <span className="text-sm text-secondary-foreground">{t("fin.dscr")}</span>
                      <span className={`text-sm font-mono font-semibold flex items-center gap-1.5
                        ${result.ltvAnalysis.dscrFlag === "pass" ? "text-emerald-400" : result.ltvAnalysis.dscrFlag === "warn" ? "text-amber-400" : "text-red-400"}`}>
                        {result.ltvAnalysis.dscrFlag === "pass" ? <CheckCircle className="w-3.5 h-3.5" /> : result.ltvAnalysis.dscrFlag === "warn" ? <AlertCircle className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                        {result.ltvAnalysis.dscr.toFixed(2)}x
                        <span className="text-xs font-normal text-muted-foreground">{t("fin.dscrMin")}</span>
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </section>

            {/* ── 4.5 Return Analysis ── */}
            {result.incomeApproach && !isRent && (() => {
              const irr = computeIrrResult(
                result.reconciledValue,
                result.incomeApproach!.noi,
                irrInputs,
                result.ltvAnalysis,
              );
              const holdOpts: HoldYears[]    = [3, 5, 7, 10];
              const growthOpts: { v: RentGrowth; label: string }[] = [
                { v: -0.02, label: "−2%" }, { v: 0.00, label: "0%" },
                { v: 0.02,  label: "+2%" }, { v: 0.04, label: "+4%" },
              ];
              const capOpts: { v: ExitCapDelta; labelKey: string }[] = [
                { v: -0.005, labelKey: "irr.compress"  },
                { v: 0,      labelKey: "irr.flat"      },
                { v: 0.005,  labelKey: "irr.expand50"  },
                { v: 0.010,  labelKey: "irr.expand100" },
              ];
              const pill = (active: boolean) =>
                `px-2.5 py-1 rounded text-xs font-medium border transition-colors ${
                  active
                    ? "bg-primary/15 border-primary text-primary"
                    : "border-border text-muted-foreground hover:border-primary/40 hover:text-foreground"
                }`;
              const irrFmt = (v: number | null) =>
                v == null ? "—" : `${(v * 100).toFixed(1)}%`;
              const moicFmt = (v: number | null) =>
                v == null ? "—" : `${v.toFixed(2)}×`;
              return (
                <section className="bg-card border border-border rounded-lg p-6 animate-in fade-in duration-500">
                  <SectionHeader icon={<Calculator className="w-4 h-4" />} title={t("irr.title")} />

                  {/* Controls */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                    <div className="space-y-2">
                      <p className="text-xs text-muted-foreground uppercase tracking-wider">{t("irr.holdYears")}</p>
                      <div className="flex gap-1.5 flex-wrap">
                        {holdOpts.map(y => (
                          <button key={y} onClick={() => setIrrInputs(p => ({ ...p, holdYears: y }))}
                            className={pill(irrInputs.holdYears === y)}>{y}yr</button>
                        ))}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <p className="text-xs text-muted-foreground uppercase tracking-wider">{t("irr.rentGrowth")}</p>
                      <div className="flex gap-1.5 flex-wrap">
                        {growthOpts.map(o => (
                          <button key={o.v} onClick={() => setIrrInputs(p => ({ ...p, rentGrowthRate: o.v }))}
                            className={pill(irrInputs.rentGrowthRate === o.v)}>{o.label}</button>
                        ))}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <p className="text-xs text-muted-foreground uppercase tracking-wider">{t("irr.exitCap")}</p>
                      <div className="flex gap-1.5 flex-wrap">
                        {capOpts.map(o => (
                          <button key={o.v} onClick={() => setIrrInputs(p => ({ ...p, exitCapRateDelta: o.v }))}
                            className={pill(irrInputs.exitCapRateDelta === o.v)}>{t(o.labelKey)}</button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Output */}
                  {irr && (
                    <>
                      <div className={`grid gap-3 mb-4 ${irr.hasLeverage ? "grid-cols-2" : "grid-cols-1 max-w-xs"}`}>
                        <div className="bg-secondary rounded-lg p-4">
                          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-3">{t("irr.unlevered")}</p>
                          <p className="text-2xl font-serif text-foreground">{irrFmt(irr.unleveredIRR)}</p>
                          <p className="text-xs text-muted-foreground mt-1">{t("irr.moic")} {moicFmt(irr.unleveredMoic)}</p>
                        </div>
                        {irr.hasLeverage && (
                          <div className="bg-secondary rounded-lg p-4">
                            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-3">
                              {t("irr.levered")} <span className="normal-case text-primary/70">· {t("irr.levNote")}</span>
                            </p>
                            <p className="text-2xl font-serif text-foreground">{irrFmt(irr.leveredIRR)}</p>
                            <p className="text-xs text-muted-foreground mt-1">{t("irr.moic")} {moicFmt(irr.leveredMoic)}</p>
                          </div>
                        )}
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                        {[
                          { l: t("irr.entryCapRate"), v: `${(irr.entryCapRate * 100).toFixed(2)}%` },
                          { l: t("irr.exitCapRate"),  v: `${(irr.exitCapRate  * 100).toFixed(2)}%` },
                          { l: t("irr.totalOutlay"),  v: fmt(irr.totalOutlay) },
                          { l: t("irr.equityIn"),     v: fmt(irr.equityInvested) },
                        ].map(({ l, v }) => (
                          <div key={l} className="bg-secondary/50 rounded px-2 py-1.5">
                            <p className="text-muted-foreground">{l}</p>
                            <p className="font-mono text-foreground mt-0.5">{v}</p>
                          </div>
                        ))}
                      </div>
                    </>
                  )}

                  <p className="text-xs text-muted-foreground/70 mt-4 leading-relaxed">{t("irr.note")}</p>
                </section>
              );
            })()}

            {/* ── 5. Market Context ── */}
            <section className="bg-card border border-border rounded-lg p-6 animate-in fade-in duration-500">
              <SectionHeader icon={<TrendingUp className="w-4 h-4" />} title={t("mkt.title")} />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8">
                <div>
                  <Row
                    label={t("mkt.samaRate", { vintage: result.marketContext.rateVintage })}
                    value={`${(result.marketContext.samaRepoRate * 100).toFixed(2)}%`} />
                  <Row label={t("mkt.capFloor")} value={`${(result.marketContext.impliedCapRateFloor * 100).toFixed(2)}%`} />
                  {result.marketContext.yieldSpread !== null && (
                    <Row label={t("mkt.yieldSpread")} value={bps(result.marketContext.yieldSpread)} bold />
                  )}
                </div>
                <div className="mt-4 sm:mt-0">
                  <p className="text-xs text-muted-foreground mb-2">{t("mkt.spreadAssess")}</p>
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

            {/* ── 6. Confidence ── */}
            <section className="bg-card border border-border rounded-lg p-6 animate-in fade-in duration-500">
              <SectionHeader icon={<BarChart2 className="w-4 h-4" />} title={t("conf.title")} />
              <div className="flex items-center gap-4 mb-5">
                <div className="flex-1 bg-secondary rounded-full h-2 overflow-hidden">
                  <div className="h-full bg-primary rounded-full transition-all"
                    style={{ width: `${result.confidence.score}%` }} />
                </div>
                <Badge variant={confBadgeVariant}>{result.confidence.score}/100</Badge>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                {[
                  { labelKey: "conf.cityData",    score: result.confidence.cityScore },
                  { labelKey: "conf.district",     score: result.confidence.districtScore },
                  { labelKey: "conf.assetType",    score: result.confidence.propertyTypeScore },
                  { labelKey: "conf.mktActivity",  score: result.confidence.marketActivityScore },
                ].map(({ labelKey, score }) => (
                  <div key={labelKey} className="bg-secondary rounded-lg p-3 text-center">
                    <p className="text-xs text-muted-foreground">{t(labelKey)}</p>
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

            {/* ── 7. TAQEEM ── */}
            <section className="bg-card border border-border rounded-lg p-6 animate-in fade-in duration-500">
              <SectionHeader icon={<Shield className="w-4 h-4" />} title={t("taqeem.title")} />
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
                <h3 className="text-base font-serif text-foreground">{t("meth.title")}</h3>
              </div>
              <div className="space-y-3 text-sm text-muted-foreground leading-relaxed max-w-3xl">
                <p>{t("meth.p1")}</p>
                <p>{t("meth.p2")}</p>
                {/* Saudi-specific: Islamic finance + acquisition costs */}
                <div className="bg-secondary/40 border border-border rounded-lg p-4 space-y-2">
                  <p className="text-xs font-medium text-secondary-foreground uppercase tracking-wider mb-1">
                    {isAr ? "ملاحظات خاصة بالسوق السعودي" : "Saudi Market Notes"}
                  </p>
                  <p className="text-xs">{t("meth.islamicNote")}</p>
                  <p className="text-xs">{t("meth.acquisitionNote")}</p>
                </div>
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
