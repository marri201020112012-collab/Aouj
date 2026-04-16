import { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  loadCase, updateCase, Case,
  DealStage, ACTIVE_STAGES, TERMINAL_STAGES,
  advanceStage, setTerminalStage, addAuditEntry,
} from "@/lib/cases";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatSAR } from "@/lib/utils";
import {
  ArrowLeft, ChevronRight, AlertTriangle, CheckSquare, Square,
  Plus, Trash2, Printer, Eye, EyeOff, CheckCircle, XCircle,
  AlertCircle, Clock, Shield,
} from "lucide-react";
import { useLang } from "@/lib/lang";
import { checklistLabel } from "@/lib/i18n";
import type { ChecklistItem } from "@/lib/cases";

// ── Stage colours ─────────────────────────────────────────────────────────────

const STAGE_STYLE: Record<DealStage, string> = {
  Screening:       "border-border text-muted-foreground",
  "Due Diligence": "border-amber-700/60 text-amber-400 bg-amber-900/20",
  "IC Review":     "border-blue-700/60 text-blue-400 bg-blue-900/20",
  Approved:        "border-emerald-700/60 text-emerald-400 bg-emerald-900/20",
  Rejected:        "border-red-700/60 text-red-400 bg-red-900/20",
  Withdrawn:       "border-border text-muted-foreground bg-secondary/60",
};

const CHECKLIST_CATEGORIES: Array<{ key: "title" | "regulatory" | "physical" | "financial"; labelKey: string }> = [
  { key: "title",      labelKey: "chk.cat.title"      },
  { key: "regulatory", labelKey: "chk.cat.regulatory" },
  { key: "physical",   labelKey: "chk.cat.physical"   },
  { key: "financial",  labelKey: "chk.cat.financial"  },
];

// ── Row helper ────────────────────────────────────────────────────────────────

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className="flex justify-between items-baseline py-1.5 border-b border-border last:border-0">
      <span className={`text-xs ${bold ? "text-foreground font-medium" : "text-muted-foreground"}`}>{label}</span>
      <span className={`text-xs font-mono ${bold ? "text-foreground font-semibold" : "text-secondary-foreground"}`}>{value}</span>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function CaseDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [c, setC] = useState<Case | null>(null);
  const [loading, setLoading] = useState(true);
  const [noteInput, setNoteInput] = useState("");
  const [decisionRationale, setDecisionRationale] = useState("");
  const [pendingOutcome, setPendingOutcome] = useState<"Approved" | "Rejected" | "Withdrawn" | null>(null);
  const [assumptionDraft, setAssumptionDraft] = useState("");
  const [assumptionEditing, setAssumptionEditing] = useState(false);
  const [icView, setIcView] = useState(false);
  const noteRef = useRef<HTMLInputElement>(null);
  const { t, lang } = useLang();

  useEffect(() => {
    if (id) {
      const loaded = loadCase(id);
      setC(loaded);
      setAssumptionDraft(loaded?.assumptionNotes ?? "");
      setLoading(false);
    }
  }, [id]);

  if (loading) return null;
  if (!c) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3 text-center px-6">
        <p className="text-muted-foreground">{t("detail.notFound")}</p>
        <Button variant="ghost" size="sm" onClick={() => navigate("/cases")}>
          <ArrowLeft className="w-4 h-4 mr-1.5" /> {t("detail.backFull")}
        </Button>
      </div>
    );
  }

  function persist(updates: Partial<Case>) {
    const next = { ...c!, ...updates };
    updateCase(c!.id, updates);
    setC(next);
  }

  // Checklist
  const toggleChecklist = (itemId: string) => {
    const ts = new Date().toISOString();
    const checklist = c.checklist.map((item: ChecklistItem) =>
      item.id === itemId
        ? { ...item, checked: !item.checked, checkedAt: !item.checked ? ts : undefined }
        : item
    );
    const auditLog = addAuditEntry(c, `Checklist item "${c.checklist.find(i => i.id === itemId)?.label}" ${c.checklist.find(i => i.id === itemId)?.checked ? "unchecked" : "checked"}`);
    persist({ checklist, auditLog });
  };

  // Notes
  const addNote = () => {
    const text = noteInput.trim();
    if (!text) return;
    const notes = [...c.legalReview.notes, { text, addedAt: new Date().toISOString() }];
    const auditLog = addAuditEntry(c, "Legal note added");
    persist({ legalReview: { ...c.legalReview, notes }, auditLog });
    setNoteInput("");
    noteRef.current?.focus();
  };

  const deleteNote = (idx: number) => {
    const notes = c.legalReview.notes.filter((_, i) => i !== idx);
    const auditLog = addAuditEntry(c, "Legal note removed");
    persist({ legalReview: { ...c.legalReview, notes }, auditLog });
  };

  // Pipeline
  const handleAdvanceStage = () => {
    const update = advanceStage(c);
    if (update) persist(update);
  };

  const handleTerminate = () => {
    if (!pendingOutcome) return;
    const update = setTerminalStage(c, pendingOutcome, decisionRationale);
    persist(update);
    setPendingOutcome(null);
    setDecisionRationale("");
  };

  const handleReopen = () => {
    const ts = new Date().toISOString();
    persist({
      stage: "Screening",
      stageHistory: [...c.stageHistory, { stage: "Screening", timestamp: ts, note: "Reopened" }],
      auditLog: addAuditEntry(c, "Deal reopened"),
      decisionRecord: null,
    });
  };

  // Assumption notes
  const saveAssumptionNotes = () => {
    const auditLog = addAuditEntry(c, "Assumption notes updated");
    persist({ assumptionNotes: assumptionDraft, auditLog });
    setAssumptionEditing(false);
  };

  const completedCount = c.checklist.filter((i: ChecklistItem) => i.checked).length;
  const confLevel = c.result.confidence.level;
  const confBadgeVariant = confLevel === "High" ? "high" : confLevel === "Medium" ? "medium" : "low";
  const isTerminal = TERMINAL_STAGES.includes(c.stage);
  const canAdvance = ACTIVE_STAGES.includes(c.stage) && c.stage !== "IC Review";
  const atIC = c.stage === "IC Review";

  const fmt = formatSAR;

  // ── IC View ───────────────────────────────────────────────────────────────
  if (icView) {
    return (
      <div className="min-h-screen bg-background">
        <div className="no-print sticky top-0 z-50 border-b border-border bg-background/90 backdrop-blur-sm">
          <div className="mx-auto max-w-3xl px-6 h-12 flex items-center justify-between">
            <Button variant="ghost" size="sm" onClick={() => setIcView(false)}>
              <EyeOff className="w-4 h-4 mr-1.5" /> {t("detail.workingView")}
            </Button>
            <Button variant="ghost" size="sm" onClick={() => window.print()}>
              <Printer className="w-4 h-4 mr-1.5" /> {t("detail.print")}
            </Button>
          </div>
        </div>

        <main className="mx-auto max-w-3xl px-6 py-10 space-y-8 print-area">
          {/* Header */}
          <div className="border-b border-border pb-6">
            <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground mb-1">{t("detail.icTitle")}</p>
            <h1 className="text-2xl font-serif text-foreground mb-1">{c.title}</h1>
            <div className="flex items-center gap-3 flex-wrap">
              <span className="text-xs text-muted-foreground">
                {new Date(c.createdAt).toLocaleDateString(lang === "ar" ? "ar-SA" : "en-SA", { dateStyle: "long" })}
              </span>
              <span className={`text-xs border rounded-full px-2.5 py-0.5 ${STAGE_STYLE[c.stage]}`}>
                {t(`stage.${c.stage}`)}
              </span>
              <Badge variant={confBadgeVariant}>{t(`conf.${confLevel}`)} · {c.result.confidence.score}/100</Badge>
              <span className="text-xs text-muted-foreground italic">{t("detail.icConfid")}</span>
            </div>
          </div>

          {/* Valuation */}
          <section>
            <h2 className="text-xs font-medium uppercase tracking-widest text-muted-foreground mb-4">
              {t("detail.valuation")}
            </h2>
            <div className="bg-secondary rounded-lg p-5 text-center mb-4">
              <p className="text-xs uppercase tracking-widest text-muted-foreground mb-2">
                {t("detail.rangeLabel")}
              </p>
              <p className="text-3xl font-serif text-foreground">
                {fmt(c.result.rangeLow)}
                <span className="text-muted-foreground mx-3">—</span>
                {fmt(c.result.rangeHigh)}
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                {t("result.midpoint")}: {fmt(c.result.reconciledValue)} · {c.result.pricePerSqm.toLocaleString()} SAR/sqm
              </p>
            </div>
            <ul className="space-y-1.5">
              {c.result.reasoning.map((r, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-secondary-foreground">
                  <ChevronRight className="w-3.5 h-3.5 mt-0.5 text-primary shrink-0" />
                  <span>{r}</span>
                </li>
              ))}
            </ul>
          </section>

          {/* Key metrics grid */}
          <section>
            <h2 className="text-xs font-medium uppercase tracking-widest text-muted-foreground mb-4">
              {t("detail.keyMetrics")}
            </h2>
            <div className="grid grid-cols-2 gap-x-8">
              <div>
                {c.result.incomeApproach && (
                  <>
                    <Row label="NOI" value={`${fmt(c.result.incomeApproach.noi)}/yr`} bold />
                    <Row label="Cap Rate (market)" value={`${(c.result.incomeApproach.capRate * 100).toFixed(2)}%`} />
                    <Row label="Gross Yield" value={`${(c.result.incomeApproach.impliedGrossYield * 100).toFixed(2)}%`} />
                  </>
                )}
                <Row label="SAMA Repo Rate" value={`${(c.result.marketContext.samaRepoRate * 100).toFixed(2)}%`} />
                {c.result.marketContext.yieldSpread !== null && (
                  <Row label="Yield Spread vs. Repo" value={`${(c.result.marketContext.yieldSpread * 10000).toFixed(0)}bps`} bold />
                )}
              </div>
              <div>
                <Row label="SAMA Max LTV" value={`${Math.round(c.result.ltvAnalysis.samaMaxLTV * 100)}%`} />
                <Row label="Implied Max Loan" value={fmt(c.result.ltvAnalysis.impliedMaxLoan)} bold />
                <Row label="Forced Sale Value" value={fmt(c.result.ltvAnalysis.forcedSaleValue)} />
                {c.result.ltvAnalysis.dscr !== null && (
                  <Row label="DSCR" value={`${c.result.ltvAnalysis.dscr.toFixed(2)}x`} bold />
                )}
              </div>
            </div>
          </section>

          {/* Property */}
          <section>
            <h2 className="text-xs font-medium uppercase tracking-widest text-muted-foreground mb-4">
              {t("detail.propDetails")}
            </h2>
            <dl className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {[
                [t("detail.city"),      c.input.city],
                [t("detail.district"),  c.input.district],
                [t("detail.type"),      c.input.propertyType],
                [t("detail.size"),      `${c.input.size} sqm`],
                [t("detail.condition"), c.input.condition],
                [t("detail.tx"),        c.input.transactionType],
              ].map(([label, value]) => (
                <div key={label}>
                  <dt className="text-xs text-muted-foreground">{label}</dt>
                  <dd className="text-sm text-foreground mt-0.5">{value}</dd>
                </div>
              ))}
            </dl>
          </section>

          {/* DD Status */}
          <section>
            <h2 className="text-xs font-medium uppercase tracking-widest text-muted-foreground mb-4">
              {t("detail.checklist")}
            </h2>
            <p className="text-sm text-secondary-foreground mb-3">
              {completedCount} / {c.checklist.length} {t("detail.complete")}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
              {c.checklist.map(item => (
                <div key={item.id} className="flex items-center gap-2">
                  {item.checked
                    ? <CheckSquare className="w-3.5 h-3.5 text-primary shrink-0" />
                    : <Square className="w-3.5 h-3.5 text-muted-foreground/40 shrink-0" />
                  }
                  <span className={`text-xs ${item.checked ? "text-muted-foreground line-through" : "text-secondary-foreground"}`}>
                    {checklistLabel(item.label, lang)}
                  </span>
                </div>
              ))}
            </div>
          </section>

          {/* TAQEEM flags */}
          {c.result.taqeemFlags.filter(f => f.level !== "info").length > 0 && (
            <section>
              <h2 className="text-xs font-medium uppercase tracking-widest text-muted-foreground mb-4">
                {t("taqeem.title")}
              </h2>
              <div className="space-y-2">
                {c.result.taqeemFlags.filter(f => f.level !== "info").map(flag => (
                  <div key={flag.code}
                    className={`flex items-start gap-3 rounded-lg border p-3 text-xs leading-relaxed
                      ${flag.level === "required"
                        ? "border-red-700/50 bg-red-900/20 text-red-300"
                        : "border-amber-700/40 bg-amber-900/15 text-amber-300"}`}>
                    <span className="font-mono opacity-60 shrink-0">{flag.code}</span>
                    <span>{flag.message}</span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Decision Record */}
          {c.decisionRecord && (
            <section>
              <h2 className="text-xs font-medium uppercase tracking-widest text-muted-foreground mb-4">
                {t("detail.decision")}
              </h2>
              <div className={`rounded-lg border p-4 ${STAGE_STYLE[c.decisionRecord.outcome]}`}>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-sm font-medium">{t(`detail.outcome.${c.decisionRecord.outcome}`)}</span>
                  <span className="text-xs text-muted-foreground">·</span>
                  <span className="text-xs text-muted-foreground">
                    {new Date(c.decisionRecord.decidedAt).toLocaleDateString(lang === "ar" ? "ar-SA" : "en-SA", { dateStyle: "medium" })}
                  </span>
                </div>
                {c.decisionRecord.rationale && (
                  <p className="text-sm text-secondary-foreground leading-relaxed">{c.decisionRecord.rationale}</p>
                )}
              </div>
            </section>
          )}

          {/* Assumption notes */}
          {c.assumptionNotes && (
            <section>
              <h2 className="text-xs font-medium uppercase tracking-widest text-muted-foreground mb-4">
                {t("detail.assumNotes")}
              </h2>
              <p className="text-sm text-secondary-foreground leading-relaxed whitespace-pre-wrap">{c.assumptionNotes}</p>
            </section>
          )}

          {/* Caveat */}
          <p className="text-xs text-muted-foreground/70 leading-relaxed border-t border-border pt-6 italic">
            {c.result.caveat}
          </p>
        </main>
      </div>
    );
  }

  // ── Working View ──────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-background">
      <main className="mx-auto max-w-3xl px-6 py-10 space-y-8">

        {/* Header bar */}
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={() => navigate("/cases")}>
            <ArrowLeft className="w-4 h-4 mr-1.5" /> {t("detail.back")}
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setIcView(true)}>
            <Eye className="w-4 h-4 mr-1.5" /> {t("detail.icView")}
          </Button>
        </div>

        {/* Title */}
        <div className="space-y-1">
          <h1 className="text-xl font-serif text-foreground">{c.title}</h1>
          <p className="text-xs text-muted-foreground">
            {t("detail.created")} {new Date(c.createdAt).toLocaleDateString(lang === "ar" ? "ar-SA" : "en-SA", { dateStyle: "medium" })}
          </p>
        </div>

        {/* ── Deal Pipeline ── */}
        <section className="bg-card border border-border rounded-lg p-6 space-y-5">
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
            {t("detail.pipeline")}
          </h2>

          {/* Stage rail */}
          <div className="flex items-center gap-0 overflow-x-auto pb-1">
            {(() => {
              // For terminal deals, replace "Approved" with the actual terminal stage unless it IS Approved
              const terminalStage = c.stage === "Rejected" || c.stage === "Withdrawn" ? c.stage : null;
              const railStages: DealStage[] = terminalStage
                ? ["Screening", "Due Diligence", "IC Review", terminalStage]
                : ["Screening", "Due Diligence", "IC Review", "Approved"];
              return railStages;
            })().map((stage, idx, arr) => {
              const stageIndex = arr.indexOf(stage);
              const currentIndex = arr.indexOf(c.stage);
              const isDone = currentIndex > stageIndex;
              const isCurrent = c.stage === stage;
              const event = c.stageHistory.find(h => h.stage === stage);
              return (
                <div key={stage} className="flex items-center shrink-0">
                  <div className="flex flex-col items-center">
                    <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-colors
                      ${isDone ? "bg-primary border-primary" :
                        isCurrent ? "border-primary bg-primary/15" :
                        "border-border bg-background"}`}>
                      {isDone
                        ? <CheckCircle className="w-4 h-4 text-primary-foreground" />
                        : isCurrent
                          ? <Clock className="w-3.5 h-3.5 text-primary" />
                          : <span className="w-2 h-2 rounded-full bg-border" />
                      }
                    </div>
                    <p className={`text-xs mt-1.5 whitespace-nowrap ${isCurrent ? "text-foreground font-medium" : isDone ? "text-muted-foreground" : "text-muted-foreground/50"}`}>
                      {t(`stage.${stage}`)}
                    </p>
                    {event && (
                      <p className="text-xs text-muted-foreground/50 mt-0.5">
                        {new Date(event.timestamp).toLocaleDateString(lang === "ar" ? "ar-SA" : "en-SA", { dateStyle: "short" })}
                      </p>
                    )}
                  </div>
                  {idx < arr.length - 1 && (
                    <div className={`h-px w-8 sm:w-12 mx-1 mt-[-18px] ${currentIndex > stageIndex ? "bg-primary" : "bg-border"}`} />
                  )}
                </div>
              );
            })}
          </div>

          {/* Actions */}
          {!isTerminal && (
            <div className="flex gap-2 flex-wrap pt-1">
              {canAdvance && (
                <Button variant="gold" size="sm" onClick={handleAdvanceStage}>
                  {t("detail.advanceStage")} →
                </Button>
              )}
              {(atIC || canAdvance) && (
                <div className="flex gap-2 flex-wrap">
                  {(["Approved", "Rejected", "Withdrawn"] as const).map(outcome => (
                    <button key={outcome}
                      onClick={() => setPendingOutcome(pendingOutcome === outcome ? null : outcome)}
                      className={`text-xs border rounded-full px-3 py-1 transition-colors
                        ${pendingOutcome === outcome ? STAGE_STYLE[outcome] : "border-border text-muted-foreground hover:border-primary/40"}`}>
                      {t(`detail.outcome.${outcome}`)}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {isTerminal && (
            <button onClick={handleReopen}
              className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-2 transition-colors">
              {t("detail.decisionReopen")}
            </button>
          )}

          {/* Decision panel */}
          {pendingOutcome && (
            <div className={`rounded-lg border p-4 space-y-3 ${STAGE_STYLE[pendingOutcome]}`}>
              <p className="text-xs font-medium">{t("detail.decisionIntro")}</p>
              <textarea
                value={decisionRationale}
                onChange={e => setDecisionRationale(e.target.value)}
                rows={3}
                placeholder={t("detail.decisionPH")}
                className="w-full bg-background/50 border border-border rounded-md px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary resize-none"
              />
              <div className="flex gap-2">
                <Button variant="gold" size="sm" onClick={handleTerminate}>
                  {t("detail.decisionSave")}
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setPendingOutcome(null)}>
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {/* Decision record (if exists) */}
          {c.decisionRecord && (
            <div className={`rounded-lg border p-4 ${STAGE_STYLE[c.decisionRecord.outcome]}`}>
              <div className="flex items-center gap-2 mb-1">
                {c.decisionRecord.outcome === "Approved"
                  ? <CheckCircle className="w-4 h-4" />
                  : c.decisionRecord.outcome === "Rejected"
                    ? <XCircle className="w-4 h-4" />
                    : <AlertCircle className="w-4 h-4" />
                }
                <span className="text-sm font-medium">{t(`detail.outcome.${c.decisionRecord.outcome}`)}</span>
                <span className="text-xs text-muted-foreground">
                  · {new Date(c.decisionRecord.decidedAt).toLocaleDateString(lang === "ar" ? "ar-SA" : "en-SA", { dateStyle: "medium" })}
                </span>
              </div>
              {c.decisionRecord.rationale && (
                <p className="text-sm leading-relaxed mt-2">{c.decisionRecord.rationale}</p>
              )}
            </div>
          )}
        </section>

        {/* ── Assumption Notes ── */}
        <section className="bg-card border border-border rounded-lg p-6 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">{t("detail.assumNotes")}</h2>
            {!assumptionEditing && (
              <button onClick={() => setAssumptionEditing(true)}
                className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-2 transition-colors">
                Edit
              </button>
            )}
          </div>
          {assumptionEditing ? (
            <>
              <textarea
                value={assumptionDraft}
                onChange={e => setAssumptionDraft(e.target.value)}
                rows={4}
                placeholder={t("detail.assumPH")}
                className="w-full bg-secondary border border-border rounded-md px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary resize-none"
              />
              <div className="flex gap-2">
                <Button variant="gold" size="sm" onClick={saveAssumptionNotes}>{t("detail.assumSave")}</Button>
                <Button variant="ghost" size="sm" onClick={() => { setAssumptionDraft(c.assumptionNotes); setAssumptionEditing(false); }}>Cancel</Button>
              </div>
            </>
          ) : (
            <p className={`text-sm leading-relaxed whitespace-pre-wrap ${c.assumptionNotes ? "text-secondary-foreground" : "text-muted-foreground/60 italic"}`}>
              {c.assumptionNotes || t("detail.assumPH")}
            </p>
          )}
        </section>

        {/* ── Property Details ── */}
        <section className="bg-card border border-border rounded-lg p-6">
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-4">
            {t("detail.propDetails")}
          </h2>
          <dl className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {[
              [t("detail.city"),      c.input.city],
              [t("detail.district"),  c.input.district],
              [t("detail.type"),      c.input.propertyType],
              [t("detail.size"),      `${c.input.size} ${t("detail.sqm")}`],
              [t("detail.condition"), c.input.condition],
              [t("detail.tx"),        c.input.transactionType],
            ].map(([label, value]) => (
              <div key={label}>
                <dt className="text-xs text-muted-foreground">{label}</dt>
                <dd className="text-sm text-foreground mt-0.5">{value}</dd>
              </div>
            ))}
          </dl>
        </section>

        {/* ── Valuation ── */}
        <section className="bg-card border border-border rounded-lg p-6 space-y-5">
          <div className="flex items-center gap-3">
            <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
              {t("detail.valuation")}
            </h2>
            <Badge variant={confBadgeVariant}>
              {t(`conf.${confLevel}`)} · {c.result.confidence.score}/100
            </Badge>
          </div>

          <div className="bg-secondary rounded-lg p-5 text-center">
            <p className="text-xs uppercase tracking-widest text-muted-foreground mb-2">
              {t("detail.rangeLabel")}
            </p>
            <p className="text-2xl font-serif text-foreground">
              {fmt(c.result.rangeLow)}
              <span className="text-muted-foreground mx-3">—</span>
              {fmt(c.result.rangeHigh)}
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              {t("result.midpoint")}: {fmt(c.result.reconciledValue)} · {c.result.pricePerSqm.toLocaleString()} SAR/sqm
            </p>
          </div>

          {/* Key metrics */}
          {c.result.incomeApproach && (
            <div className="grid grid-cols-2 gap-x-8">
              <div>
                <Row label="NOI" value={`${fmt(c.result.incomeApproach.noi)}/yr`} bold />
                <Row label="Cap Rate" value={`${(c.result.incomeApproach.capRate * 100).toFixed(2)}%`} />
                <Row label="DSCR" value={c.result.ltvAnalysis.dscr ? `${c.result.ltvAnalysis.dscr.toFixed(2)}x` : "N/A"} />
              </div>
              <div>
                <Row label="Max Loan" value={fmt(c.result.ltvAnalysis.impliedMaxLoan)} bold />
                <Row label="FSV" value={fmt(c.result.ltvAnalysis.forcedSaleValue)} />
                {c.result.marketContext.yieldSpread !== null && (
                  <Row label="Yield Spread" value={`${(c.result.marketContext.yieldSpread * 10000).toFixed(0)}bps`} bold />
                )}
              </div>
            </div>
          )}

          <ul className="space-y-2">
            {c.result.reasoning.map((r, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-secondary-foreground">
                <ChevronRight className="w-3.5 h-3.5 mt-0.5 text-primary shrink-0" />
                <span>{r}</span>
              </li>
            ))}
          </ul>

          {c.result.governanceWarning && (
            <div className="flex items-start gap-3 rounded-lg border p-4"
              style={{ borderColor: "hsl(var(--warning-border))", backgroundColor: "hsl(var(--warning-bg))" }}>
              <AlertTriangle className="w-5 h-5 text-primary shrink-0 mt-0.5" />
              <p className="text-sm text-secondary-foreground leading-relaxed">{c.result.governanceWarning}</p>
            </div>
          )}

          <p className="text-xs text-muted-foreground leading-relaxed border-t border-border pt-4">
            {c.result.caveat}
          </p>
        </section>

        {/* ── TAQEEM flags ── */}
        {c.result.taqeemFlags.length > 0 && (
          <section className="bg-card border border-border rounded-lg p-6 space-y-3">
            <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-2">
              <Shield className="w-4 h-4 text-primary" /> {t("taqeem.title")}
            </h2>
            <div className="space-y-2">
              {c.result.taqeemFlags.map(flag => (
                <div key={flag.code}
                  className={`flex items-start gap-3 rounded-lg border p-3 text-xs leading-relaxed
                    ${flag.level === "required" ? "border-red-700/50 bg-red-900/20 text-red-300" :
                      flag.level === "warning" ? "border-amber-700/40 bg-amber-900/15 text-amber-300" :
                        "border-border bg-secondary/40 text-muted-foreground"}`}>
                  <span className="font-mono opacity-60 shrink-0">{flag.code}</span>
                  <span>{flag.message}</span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ── Due Diligence Checklist (categorised) ── */}
        <section className="bg-card border border-border rounded-lg p-6 space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
              {t("detail.checklist")}
            </h2>
            <span className="text-xs text-muted-foreground">{completedCount}/{c.checklist.length} {t("detail.complete")}</span>
          </div>

          {/* Progress bar */}
          <div className="w-full bg-secondary rounded-full h-1.5 overflow-hidden">
            <div className="h-full bg-primary rounded-full transition-all"
              style={{ width: `${(completedCount / c.checklist.length) * 100}%` }} />
          </div>

          {CHECKLIST_CATEGORIES.map(({ key, labelKey }) => {
            const items = c.checklist.filter(i => i.category === key);
            if (!items.length) return null;
            return (
              <div key={key}>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">{t(labelKey)}</p>
                <ul className="space-y-1.5">
                  {items.map(item => (
                    <li key={item.id}
                      className="flex items-start gap-3 cursor-pointer group"
                      onClick={() => toggleChecklist(item.id)}>
                      {item.checked
                        ? <CheckSquare className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                        : <Square className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5 group-hover:text-foreground transition-colors" />
                      }
                      <div className="flex-1 min-w-0">
                        <span className={`text-sm ${item.checked ? "line-through text-muted-foreground" : "text-secondary-foreground"}`}>
                          {checklistLabel(item.label, lang)}
                        </span>
                        {item.checkedAt && (
                          <span className="text-xs text-muted-foreground/50 ml-2">
                            {new Date(item.checkedAt).toLocaleDateString(lang === "ar" ? "ar-SA" : "en-SA", { dateStyle: "short" })}
                          </span>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </section>

        {/* ── Legal Review ── */}
        <section className="bg-card border border-border rounded-lg p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
              {t("detail.legal")}
            </h2>
            <span className={`text-xs border rounded-full px-2.5 py-0.5 ${STAGE_STYLE[c.stage]}`}>
              {t(`status.${c.legalReview.status}`) || c.legalReview.status}
            </span>
          </div>

          {c.legalReview.notes.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t("detail.noNotes")}</p>
          ) : (
            <ul className="space-y-2">
              {c.legalReview.notes.map((note, i) => (
                <li key={i} className="flex items-start justify-between gap-3 group">
                  <div className="min-w-0">
                    <span className="text-xs text-muted-foreground/60 mr-2">{i + 1}.</span>
                    <span className="text-sm text-secondary-foreground leading-relaxed">{note.text}</span>
                    <span className="block text-xs text-muted-foreground/50 mt-0.5">
                      {new Date(note.addedAt).toLocaleDateString(lang === "ar" ? "ar-SA" : "en-SA", { dateStyle: "short" })}
                    </span>
                  </div>
                  <button
                    onClick={() => deleteNote(i)}
                    className="shrink-0 text-muted-foreground hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
                    title={t("detail.deleteNote")}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </li>
              ))}
            </ul>
          )}

          <div className="flex gap-2 pt-1">
            <input
              ref={noteRef}
              type="text"
              value={noteInput}
              onChange={e => setNoteInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && addNote()}
              placeholder={t("detail.notePlaceholder")}
              className="flex-1 bg-secondary border border-border rounded-md px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
            <Button variant="ghost" size="sm" onClick={addNote} disabled={!noteInput.trim()}
              className="shrink-0 border border-border hover:border-primary/40">
              <Plus className="w-4 h-4" />
            </Button>
          </div>
        </section>

        {/* ── Activity Log ── */}
        {c.auditLog.length > 0 && (
          <section className="border-t border-border pt-6 pb-10">
            <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-4">
              {t("detail.auditLog")}
            </h2>
            <ul className="space-y-3">
              {[...c.auditLog].reverse().map((entry, i) => (
                <li key={i} className="flex items-start gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-border mt-2 shrink-0" />
                  <div>
                    <p className="text-sm text-secondary-foreground">{entry.event}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {new Date(entry.timestamp).toLocaleString(lang === "ar" ? "ar-SA" : "en-SA", { dateStyle: "medium", timeStyle: "short" })}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        )}

      </main>
    </div>
  );
}
