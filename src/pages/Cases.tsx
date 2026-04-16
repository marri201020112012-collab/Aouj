import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { loadAllCases, Case, ACTIVE_STAGES, TERMINAL_STAGES, DealStage } from "@/lib/cases";
import { Badge } from "@/components/ui/badge";
import { formatSAR } from "@/lib/utils";
import { FolderOpen, ChevronRight, CheckCircle, Clock, XCircle } from "lucide-react";
import { useLang } from "@/lib/lang";

const STAGE_STYLE: Record<DealStage, string> = {
  Screening:       "text-muted-foreground border-border",
  "Due Diligence": "text-amber-400 border-amber-700/50",
  "IC Review":     "text-blue-400 border-blue-700/50",
  Approved:        "text-emerald-400 border-emerald-700/50",
  Rejected:        "text-red-400 border-red-700/50",
  Withdrawn:       "text-muted-foreground border-border",
};

function StageIcon({ stage }: { stage: DealStage }) {
  if (stage === "Approved")  return <CheckCircle className="w-3 h-3 text-emerald-400" />;
  if (stage === "Rejected")  return <XCircle     className="w-3 h-3 text-red-400"     />;
  if (ACTIVE_STAGES.includes(stage)) return <Clock className="w-3 h-3 text-primary" />;
  return null;
}

// Pipeline progress dots for active deals
function PipelineDots({ stage }: { stage: DealStage }) {
  const active = ["Screening", "Due Diligence", "IC Review"];
  const idx = active.indexOf(stage);
  if (idx === -1) return null;
  return (
    <div className="flex items-center gap-1">
      {active.map((_, i) => (
        <span key={i} className={`w-1.5 h-1.5 rounded-full transition-colors ${
          i <= idx ? "bg-primary" : "bg-border"
        }`} />
      ))}
    </div>
  );
}

export default function Cases() {
  const [cases, setCases] = useState<Case[]>([]);
  const navigate = useNavigate();
  const { t, lang } = useLang();

  useEffect(() => {
    setCases(loadAllCases());
  }, []);

  if (cases.length === 0) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4 text-center px-6">
        <FolderOpen className="w-10 h-10 text-muted-foreground/40" />
        <p className="text-muted-foreground">{t("cases.empty")}</p>
        <p className="text-sm text-muted-foreground/60">{t("cases.emptyHint")}</p>
      </div>
    );
  }

  const active   = cases.filter(c => ACTIVE_STAGES.includes(c.stage));
  const terminal = cases.filter(c => TERMINAL_STAGES.includes(c.stage));
  const countLabel = cases.length === 1 ? t("cases.count1") : t("cases.countN", { n: cases.length });

  const noteCountLabel = (n: number) =>
    n === 0 ? t("cases.note0") : n === 1 ? t("cases.note1") : t("cases.noteN", { n });

  const CaseCard = ({ c }: { c: Case }) => (
    <button
      onClick={() => navigate(`/cases/${c.id}`)}
      className="w-full text-left bg-card border border-border rounded-lg p-5 hover:border-primary/40 transition-colors group"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1.5 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-medium text-foreground truncate">{c.title}</span>
            <div className={`inline-flex items-center gap-1 text-xs border rounded-full px-2 py-0.5 ${STAGE_STYLE[c.stage]}`}>
              <StageIcon stage={c.stage} />
              {t(`stage.${c.stage}`)}
            </div>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <Badge variant={
              c.result.confidence.level === "High" ? "high" :
              c.result.confidence.level === "Medium" ? "medium" : "low"
            }>
              {t(`conf.${c.result.confidence.level}`)} · {c.result.confidence.score}/100
            </Badge>
            <span className="text-xs text-muted-foreground">
              {new Date(c.createdAt).toLocaleDateString(lang === "ar" ? "ar-SA" : "en-SA", { dateStyle: "medium" })}
            </span>
            {ACTIVE_STAGES.includes(c.stage) && <PipelineDots stage={c.stage} />}
          </div>

          <p className="text-sm font-mono text-secondary-foreground">
            {formatSAR(c.result.rangeLow)}
            <span className="text-muted-foreground mx-2">—</span>
            {formatSAR(c.result.rangeHigh)}
          </p>

          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span>{t("cases.checklist", { done: c.checklist.filter(i => i.checked).length, total: c.checklist.length })}</span>
            <span>·</span>
            <span>{noteCountLabel(c.legalReview.notes.length)}</span>
          </div>
        </div>
        <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors shrink-0 mt-0.5" />
      </div>
    </button>
  );

  return (
    <main className="mx-auto max-w-3xl px-6 py-10 space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-serif text-foreground">{t("cases.title")}</h1>
        <span className="text-xs text-muted-foreground">{countLabel}</span>
      </div>

      {active.length > 0 && (
        <div className="space-y-3">
          <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">Active</p>
          <ul className="space-y-3">
            {active.map(c => <li key={c.id}><CaseCard c={c} /></li>)}
          </ul>
        </div>
      )}

      {terminal.length > 0 && (
        <div className="space-y-3">
          <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">Closed</p>
          <ul className="space-y-3">
            {terminal.map(c => <li key={c.id}><CaseCard c={c} /></li>)}
          </ul>
        </div>
      )}
    </main>
  );
}
