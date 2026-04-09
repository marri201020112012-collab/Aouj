import { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { loadCase, updateCase, Case, ChecklistItem } from "@/lib/cases";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatSAR } from "@/lib/utils";
import { ArrowLeft, ChevronRight, AlertTriangle, CheckSquare, Square, Plus, Trash2 } from "lucide-react";

const STATUSES = ["Draft", "In Review", "Approved", "Closed"] as const;
type Status = typeof STATUSES[number];

const STATUS_STYLES: Record<Status, string> = {
  Draft:       "border-border text-muted-foreground",
  "In Review": "border-amber-700/60 text-amber-400 bg-amber-900/20",
  Approved:    "border-emerald-700/60 text-emerald-400 bg-emerald-900/20",
  Closed:      "border-blue-700/60 text-blue-400 bg-blue-900/20",
};

export default function CaseDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [c, setC] = useState<Case | null>(null);
  const [loading, setLoading] = useState(true);
  const [noteInput, setNoteInput] = useState("");
  const noteRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (id) {
      setC(loadCase(id));
      setLoading(false);
    }
  }, [id]);

  if (loading) return null;

  if (!c) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3 text-center px-6">
        <p className="text-muted-foreground">Case not found.</p>
        <Button variant="ghost" size="sm" onClick={() => navigate("/cases")}>
          <ArrowLeft className="w-4 h-4 mr-1.5" /> Back to Cases
        </Button>
      </div>
    );
  }

  // ── helpers ──────────────────────────────────────────────────────────────────

  function persist(updates: Partial<Case>) {
    const next = { ...c!, ...updates };
    updateCase(c!.id, updates);
    setC(next);
  }

  const toggleChecklist = (itemId: string) => {
    const checklist = c.checklist.map((item: ChecklistItem) =>
      item.id === itemId ? { ...item, checked: !item.checked } : item
    );
    persist({ checklist });
  };

  const setStatus = (status: string) => persist({ status });

  const addNote = () => {
    const text = noteInput.trim();
    if (!text) return;
    const notes = [...c.legalReview.notes, text];
    persist({ legalReview: { ...c.legalReview, notes } });
    setNoteInput("");
    noteRef.current?.focus();
  };

  const deleteNote = (idx: number) => {
    const notes = c.legalReview.notes.filter((_, i) => i !== idx);
    persist({ legalReview: { ...c.legalReview, notes } });
  };

  const completedCount = c.checklist.filter((i: ChecklistItem) => i.checked).length;

  // ── render ────────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-background">
      <main className="mx-auto max-w-3xl px-6 py-10 space-y-8">

        {/* Back */}
        <Button variant="ghost" size="sm" onClick={() => navigate("/cases")}>
          <ArrowLeft className="w-4 h-4 mr-1.5" /> Cases
        </Button>

        {/* Title + Status */}
        <div className="space-y-3">
          <h1 className="text-xl font-serif text-foreground">{c.title}</h1>
          <p className="text-xs text-muted-foreground">
            Created {new Date(c.createdAt).toLocaleDateString("en-SA", { dateStyle: "medium" })}
          </p>

          {/* Status toggle */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-muted-foreground mr-1">Status:</span>
            {STATUSES.map((s) => (
              <button
                key={s}
                onClick={() => setStatus(s)}
                className={`text-xs border rounded-full px-3 py-1 transition-colors
                  ${c.status === s
                    ? STATUS_STYLES[s]
                    : "border-border text-muted-foreground hover:border-primary/40 hover:text-foreground"
                  }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Property Details */}
        <section className="bg-card border border-border rounded-lg p-6">
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-4">
            Property Details
          </h2>
          <dl className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {[
              ["City", c.input.city],
              ["District", c.input.district],
              ["Type", c.input.propertyType],
              ["Size", `${c.input.size} sqm`],
              ["Condition", c.input.condition],
              ["Transaction", c.input.transactionType],
            ].map(([label, value]) => (
              <div key={label}>
                <dt className="text-xs text-muted-foreground">{label}</dt>
                <dd className="text-sm text-foreground mt-0.5">{value}</dd>
              </div>
            ))}
          </dl>
        </section>

        {/* Valuation */}
        <section className="bg-card border border-border rounded-lg p-6 space-y-5">
          <div className="flex items-center gap-3">
            <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
              Valuation Estimate
            </h2>
            <Badge variant={c.result.confidence.level === "High" ? "high" : c.result.confidence.level === "Medium" ? "medium" : "low"}>
              {c.result.confidence.level} · {c.result.confidence.score}/100
            </Badge>
          </div>

          <div className="bg-secondary rounded-lg p-5 text-center">
            <p className="text-xs uppercase tracking-widest text-muted-foreground mb-2">
              Estimated Range (SAR)
            </p>
            <p className="text-2xl font-serif text-foreground">
              {formatSAR(c.result.rangeLow)}
              <span className="text-muted-foreground mx-3">—</span>
              {formatSAR(c.result.rangeHigh)}
            </p>
          </div>

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

        {/* Due Diligence Checklist */}
        <section className="bg-card border border-border rounded-lg p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
              Due Diligence Checklist
            </h2>
            <span className="text-xs text-muted-foreground">{completedCount}/{c.checklist.length} complete</span>
          </div>
          <ul className="space-y-2">
            {c.checklist.map((item: ChecklistItem) => (
              <li key={item.id}
                className="flex items-center gap-3 cursor-pointer group"
                onClick={() => toggleChecklist(item.id)}
              >
                {item.checked
                  ? <CheckSquare className="w-4 h-4 text-primary shrink-0" />
                  : <Square className="w-4 h-4 text-muted-foreground shrink-0 group-hover:text-foreground transition-colors" />
                }
                <span className={`text-sm ${item.checked ? "line-through text-muted-foreground" : "text-secondary-foreground"}`}>
                  {item.label}
                </span>
              </li>
            ))}
          </ul>
        </section>

        {/* Legal Review */}
        <section className="bg-card border border-border rounded-lg p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
              Legal Review
            </h2>
            <span className={`text-xs border rounded-full px-2.5 py-0.5
              ${STATUS_STYLES[(c.status as Status)] ?? STATUS_STYLES["Draft"]}`}>
              {c.legalReview.status}
            </span>
          </div>

          {/* Notes list */}
          {c.legalReview.notes.length === 0 ? (
            <p className="text-sm text-muted-foreground">No notes yet.</p>
          ) : (
            <ul className="space-y-2">
              {c.legalReview.notes.map((note, i) => (
                <li key={i} className="flex items-start justify-between gap-3 group">
                  <span className="text-sm text-secondary-foreground leading-relaxed">
                    <span className="text-muted-foreground mr-2">{i + 1}.</span>{note}
                  </span>
                  <button
                    onClick={() => deleteNote(i)}
                    className="shrink-0 text-muted-foreground hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
                    title="Delete note"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </li>
              ))}
            </ul>
          )}

          {/* Add note input */}
          <div className="flex gap-2 pt-1">
            <input
              ref={noteRef}
              type="text"
              value={noteInput}
              onChange={(e) => setNoteInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addNote()}
              placeholder="Add a legal note…"
              className="flex-1 bg-secondary border border-border rounded-md px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
            <Button variant="ghost" size="sm" onClick={addNote} disabled={!noteInput.trim()}
              className="shrink-0 border border-border hover:border-primary/40">
              <Plus className="w-4 h-4" />
            </Button>
          </div>
        </section>

      </main>
    </div>
  );
}
