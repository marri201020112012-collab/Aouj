// ─── COMPARABLE TRANSACTIONS REPOSITORY PAGE ─────────────────────────────────

import { useState, useMemo, useCallback } from "react";
import {
  Comp, getAllComps, saveComp, deleteComp, generateCompId,
  COMP_SOURCES,
} from "@/lib/comps";
import { VerificationStatus, getBadgeConfig } from "@/lib/sources";
import { ProvenanceBadge } from "@/components/ProvenanceBadge";
import { CITIES, DISTRICTS, PROPERTY_TYPES } from "@/lib/valuation";
import { formatSAR } from "@/lib/utils";
import {
  PlusCircle, Pencil, Trash2, X, Check,
  Building2, Search, SlidersHorizontal, Eye, EyeOff,
} from "lucide-react";

// ── Helpers ───────────────────────────────────────────────────────────────────

const fmt = formatSAR;
const psm = (v: number) => `${Math.round(v).toLocaleString()} SAR/sqm`;
const today = () => new Date().toISOString().slice(0, 10);

const inputCls =
  "w-full bg-secondary border border-border rounded-md px-3 py-2 text-sm " +
  "text-foreground focus:outline-none focus:ring-1 focus:ring-primary " +
  "placeholder:text-muted-foreground";
const selectCls = inputCls;

const VERIFICATION_OPTIONS: { value: VerificationStatus; label: string }[] = [
  { value: "verified",     label: "Verified — confirmed primary source (REGA, deed)" },
  { value: "user_entered", label: "User-entered — broker / agent confirmed" },
  { value: "estimated",    label: "Estimated — listing or inferred price" },
];

// ── Empty form ────────────────────────────────────────────────────────────────

function emptyForm(): Omit<Comp, "id" | "psmPrice" | "createdAt" | "isDemo"> {
  return {
    assetName:          "",
    city:               "Riyadh",
    district:           "Al Olaya",
    assetType:          "Commercial",
    area:               0,
    transactionDate:    today(),
    transactionValue:   0,
    source:             "Agent",
    notes:              "",
    verificationStatus: "user_entered",
    confidenceScore:    70,
    isObserved:         true,
  };
}

// ── Comp form ─────────────────────────────────────────────────────────────────

interface FormProps {
  initial?: Comp;
  onSave: (comp: Comp) => void;
  onCancel: () => void;
}

function CompForm({ initial, onSave, onCancel }: FormProps) {
  const isEdit = !!initial;
  const [form, setForm] = useState<Omit<Comp, "id" | "psmPrice" | "createdAt" | "isDemo">>(
    initial
      ? {
          assetName:          initial.assetName,
          city:               initial.city,
          district:           initial.district,
          assetType:          initial.assetType,
          area:               initial.area,
          transactionDate:    initial.transactionDate,
          transactionValue:   initial.transactionValue,
          source:             initial.source,
          notes:              initial.notes,
          verificationStatus: initial.verificationStatus,
          confidenceScore:    initial.confidenceScore,
          isObserved:         initial.isObserved,
        }
      : emptyForm()
  );

  function set<K extends keyof typeof form>(k: K, v: (typeof form)[K]) {
    setForm(p => ({ ...p, [k]: v }));
  }

  function handleCityChange(city: string) {
    const first = DISTRICTS[city]?.[0] ?? "";
    setForm(p => ({ ...p, city, district: first }));
  }

  const derivedPsm = form.area > 0 && form.transactionValue > 0
    ? Math.round(form.transactionValue / form.area)
    : null;

  function handleSave() {
    if (!form.assetName.trim() || !form.area || !form.transactionValue) return;
    const now = new Date().toISOString();
    const comp: Comp = {
      ...form,
      id:        initial?.id ?? generateCompId(),
      psmPrice:  derivedPsm ?? 0,
      createdAt: initial?.createdAt ?? now,
      isDemo:    initial?.isDemo ?? false,
    };
    onSave(comp);
  }

  const availDistricts = DISTRICTS[form.city] ?? [];

  return (
    <div className="rounded-lg border border-primary/30 bg-card p-5 space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-foreground">
          {isEdit ? "Edit comparable" : "Add comparable transaction"}
        </p>
        <button onClick={onCancel} className="text-muted-foreground hover:text-foreground transition-colors">
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Row 1 — Asset name */}
      <input
        value={form.assetName}
        onChange={e => set("assetName", e.target.value)}
        placeholder="Asset name (e.g. Al Olaya Office Tower — Unit 5)"
        className={inputCls}
      />

      {/* Row 2 — Location */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        <select value={form.city} onChange={e => handleCityChange(e.target.value)} className={selectCls}>
          {CITIES.map(c => <option key={c}>{c}</option>)}
        </select>
        <select value={form.district} onChange={e => set("district", e.target.value)} className={selectCls}>
          {availDistricts.map(d => <option key={d}>{d}</option>)}
        </select>
        <select value={form.assetType} onChange={e => set("assetType", e.target.value)} className={selectCls}>
          {PROPERTY_TYPES.map(t => <option key={t}>{t}</option>)}
        </select>
      </div>

      {/* Row 3 — Transaction */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <div className="relative">
          <input
            type="number" min={0}
            value={form.area || ""}
            onChange={e => set("area", Number(e.target.value))}
            placeholder="Area (sqm)"
            className={inputCls}
          />
        </div>
        <div className="relative">
          <input
            type="number" min={0}
            value={form.transactionValue || ""}
            onChange={e => set("transactionValue", Number(e.target.value))}
            placeholder="Transaction value (SAR)"
            className={inputCls}
          />
        </div>
        <input type="date" value={form.transactionDate}
          onChange={e => set("transactionDate", e.target.value)}
          className={inputCls} />
        <div className="bg-secondary/60 rounded-md px-3 py-2 flex items-center">
          {derivedPsm ? (
            <span className="text-sm font-mono text-foreground">
              {derivedPsm.toLocaleString()} SAR/sqm
            </span>
          ) : (
            <span className="text-sm text-muted-foreground/50">PSM auto-computed</span>
          )}
        </div>
      </div>

      {/* Row 4 — Evidence / provenance */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        <select value={form.source} onChange={e => set("source", e.target.value)} className={selectCls}>
          {COMP_SOURCES.map(s => <option key={s}>{s}</option>)}
        </select>
        <select
          value={form.verificationStatus}
          onChange={e => set("verificationStatus", e.target.value as VerificationStatus)}
          className={selectCls}
        >
          {VERIFICATION_OPTIONS.map(o => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
        <div className="flex items-center gap-2 px-3 py-2 bg-secondary/60 rounded-md">
          <span className="text-xs text-muted-foreground shrink-0">Confidence</span>
          <input
            type="number" min={0} max={100}
            value={form.confidenceScore}
            onChange={e => set("confidenceScore", Math.max(0, Math.min(100, Number(e.target.value))))}
            className="w-12 bg-transparent text-sm font-mono text-foreground focus:outline-none text-right"
          />
          <span className="text-xs text-muted-foreground">/100</span>
        </div>
      </div>

      {/* Row 5 — Observed flag + notes */}
      <div className="flex items-start gap-4">
        <label className="flex items-center gap-2 cursor-pointer shrink-0 mt-0.5">
          <div
            onClick={() => set("isObserved", !form.isObserved)}
            className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors cursor-pointer ${
              form.isObserved
                ? "bg-primary border-primary"
                : "border-border bg-transparent"
            }`}
          >
            {form.isObserved && <Check className="w-2.5 h-2.5 text-primary-foreground" />}
          </div>
          <span className="text-xs text-muted-foreground">
            Directly observed transaction (not inferred or estimated)
          </span>
        </label>
      </div>
      <textarea
        value={form.notes}
        onChange={e => set("notes", e.target.value)}
        placeholder="Notes — tenant type, condition, encumbrances, lease terms, context"
        rows={2}
        className={`${inputCls} resize-none`}
      />

      {/* Actions */}
      <div className="flex items-center gap-3">
        <button
          onClick={handleSave}
          disabled={!form.assetName.trim() || !form.area || !form.transactionValue}
          className="flex items-center gap-1.5 text-sm font-medium text-primary hover:opacity-80 transition-opacity disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <PlusCircle className="w-4 h-4" />
          {isEdit ? "Save changes" : "Add comparable"}
        </button>
        <button
          onClick={onCancel}
          className="text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

// ── Comp card ─────────────────────────────────────────────────────────────────

function CompCard({
  comp,
  onEdit,
  onDelete,
}: {
  comp: Comp;
  onEdit: (c: Comp) => void;
  onDelete: (id: string) => void;
}) {
  const cfg = getBadgeConfig(comp.verificationStatus);

  return (
    <div className={`rounded-lg border bg-card px-4 py-3.5 space-y-2 transition-colors hover:border-border/80 ${
      comp.isDemo ? "border-border/50 opacity-80" : "border-border"
    }`}>
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-0.5">
            <span className="text-sm font-medium text-foreground truncate">{comp.assetName}</span>
            {comp.isDemo && (
              <span className="text-[10px] px-1.5 py-0.5 rounded border border-border bg-secondary/60 text-muted-foreground shrink-0">
                Demo
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            {comp.city} · {comp.district} · {comp.assetType} · {comp.area.toLocaleString()} sqm
          </p>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          {!comp.isDemo && (
            <button
              onClick={() => onEdit(comp)}
              className="p-1 text-muted-foreground/50 hover:text-muted-foreground transition-colors"
              title="Edit"
            >
              <Pencil className="w-3.5 h-3.5" />
            </button>
          )}
          <button
            onClick={() => onDelete(comp.id)}
            className="p-1 text-muted-foreground/40 hover:text-red-400 transition-colors"
            title="Delete"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Key metrics */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
        <span className="font-mono text-base font-semibold text-foreground">
          {psm(comp.psmPrice)}
        </span>
        <span className="text-sm text-muted-foreground font-mono">
          {fmt(comp.transactionValue)}
        </span>
        <span className="text-xs text-muted-foreground">{comp.transactionDate}</span>
      </div>

      {/* Evidence row */}
      <div className="flex flex-wrap items-center gap-2">
        <ProvenanceBadge status={comp.verificationStatus} />
        <span className={`flex items-center gap-1 text-[10px] font-medium ${cfg.color}`}>
          {comp.isObserved
            ? <><Eye className="w-3 h-3" /> Observed</>
            : <><EyeOff className="w-3 h-3" /> Inferred</>
          }
        </span>
        <span className="text-[10px] text-muted-foreground">
          {comp.source} · {comp.confidenceScore}/100
        </span>
      </div>

      {/* Notes */}
      {comp.notes && (
        <p className="text-xs text-muted-foreground/70 leading-relaxed">{comp.notes}</p>
      )}
    </div>
  );
}

// ── Sort / filter types ───────────────────────────────────────────────────────

type SortKey = "date" | "psm_high" | "psm_low" | "confidence";

// ── Main page ─────────────────────────────────────────────────────────────────

export default function Comps() {
  const [comps, setComps]           = useState<Comp[]>(() => getAllComps());
  const [editingComp, setEditingComp] = useState<Comp | null>(null);
  const [isAdding, setIsAdding]     = useState(false);

  // Filters
  const [searchText,  setSearchText]  = useState("");
  const [filterCity,  setFilterCity]  = useState("All");
  const [filterType,  setFilterType]  = useState("All");
  const [filterStatus, setFilterStatus] = useState<VerificationStatus | "All">("All");
  const [showDemo,    setShowDemo]    = useState(true);
  const [sortKey,     setSortKey]     = useState<SortKey>("date");

  const refresh = useCallback(() => setComps(getAllComps()), []);

  function handleSave(comp: Comp) {
    saveComp(comp);
    refresh();
    setIsAdding(false);
    setEditingComp(null);
  }

  function handleDelete(id: string) {
    deleteComp(id);
    refresh();
  }

  // Filtered + sorted comps
  const displayed = useMemo(() => {
    let list = comps;

    if (!showDemo)                   list = list.filter(c => !c.isDemo);
    if (filterCity !== "All")        list = list.filter(c => c.city === filterCity);
    if (filterType !== "All")        list = list.filter(c => c.assetType === filterType);
    if (filterStatus !== "All")      list = list.filter(c => c.verificationStatus === filterStatus);
    if (searchText.trim()) {
      const q = searchText.toLowerCase();
      list = list.filter(c =>
        c.assetName.toLowerCase().includes(q) ||
        c.district.toLowerCase().includes(q) ||
        c.notes.toLowerCase().includes(q) ||
        c.source.toLowerCase().includes(q)
      );
    }

    switch (sortKey) {
      case "psm_high":   return [...list].sort((a, b) => b.psmPrice - a.psmPrice);
      case "psm_low":    return [...list].sort((a, b) => a.psmPrice - b.psmPrice);
      case "confidence": return [...list].sort((a, b) => b.confidenceScore - a.confidenceScore);
      default:           return [...list].sort((a, b) => b.transactionDate.localeCompare(a.transactionDate));
    }
  }, [comps, showDemo, filterCity, filterType, filterStatus, searchText, sortKey]);

  const userCount = comps.filter(c => !c.isDemo).length;
  const demoCount = comps.filter(c => c.isDemo).length;

  return (
    <div className="mx-auto max-w-4xl px-6 py-8 space-y-6">

      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-serif text-foreground">Comparable Transactions</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {userCount > 0
              ? `${userCount} user-entered comp${userCount > 1 ? "s" : ""} · ${demoCount} demo`
              : `${demoCount} demo comps — add your own to build the evidence base`
            }
          </p>
        </div>
        {!isAdding && !editingComp && (
          <button
            onClick={() => setIsAdding(true)}
            className="flex items-center gap-1.5 text-sm font-medium text-primary hover:opacity-80 transition-opacity shrink-0"
          >
            <PlusCircle className="w-4 h-4" />
            Add comp
          </button>
        )}
      </div>

      {/* ── Add form ── */}
      {isAdding && (
        <CompForm
          onSave={handleSave}
          onCancel={() => setIsAdding(false)}
        />
      )}

      {/* ── Edit form ── */}
      {editingComp && (
        <CompForm
          initial={editingComp}
          onSave={handleSave}
          onCancel={() => setEditingComp(null)}
        />
      )}

      {/* ── Filter bar ── */}
      <div className="space-y-2">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground/50" />
          <input
            value={searchText}
            onChange={e => setSearchText(e.target.value)}
            placeholder="Search by asset name, district, source, notes…"
            className={`${inputCls} pl-8`}
          />
        </div>

        {/* Selectors + sort */}
        <div className="flex flex-wrap items-center gap-2">
          <SlidersHorizontal className="w-3.5 h-3.5 text-muted-foreground/50 shrink-0" />
          <select value={filterCity} onChange={e => setFilterCity(e.target.value)}
            className="bg-secondary border border-border rounded px-2 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary">
            <option value="All">All cities</option>
            {CITIES.map(c => <option key={c}>{c}</option>)}
          </select>
          <select value={filterType} onChange={e => setFilterType(e.target.value)}
            className="bg-secondary border border-border rounded px-2 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary">
            <option value="All">All types</option>
            {PROPERTY_TYPES.map(t => <option key={t}>{t}</option>)}
          </select>
          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value as VerificationStatus | "All")}
            className="bg-secondary border border-border rounded px-2 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="All">All statuses</option>
            <option value="verified">Verified</option>
            <option value="user_entered">User-entered</option>
            <option value="estimated">Estimated</option>
            <option value="demo">Demo</option>
          </select>

          <div className="ml-auto flex items-center gap-2">
            {/* Demo toggle */}
            <button
              onClick={() => setShowDemo(s => !s)}
              className={`flex items-center gap-1 text-xs px-2 py-1.5 rounded border transition-colors ${
                showDemo
                  ? "border-border text-muted-foreground hover:text-foreground"
                  : "border-border/40 text-muted-foreground/40"
              }`}
            >
              {showDemo ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
              Demo
            </button>
            {/* Sort */}
            <select value={sortKey} onChange={e => setSortKey(e.target.value as SortKey)}
              className="bg-secondary border border-border rounded px-2 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary">
              <option value="date">Sort: Date ↓</option>
              <option value="psm_high">Sort: PSM high → low</option>
              <option value="psm_low">Sort: PSM low → high</option>
              <option value="confidence">Sort: Confidence ↓</option>
            </select>
          </div>
        </div>
      </div>

      {/* ── Results ── */}
      {displayed.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 py-16 text-center border border-dashed border-border rounded-lg">
          <Building2 className="w-8 h-8 text-muted-foreground/25" />
          <p className="text-sm text-muted-foreground">No comparables match the current filters.</p>
          <p className="text-xs text-muted-foreground/50">
            Try adjusting the city, type, or status filter.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {displayed.map(comp => (
            <CompCard
              key={comp.id}
              comp={comp}
              onEdit={setEditingComp}
              onDelete={handleDelete}
            />
          ))}
          <p className="text-xs text-muted-foreground/50 text-center pt-2">
            {displayed.length} of {comps.length} total · sorted by {
              sortKey === "date" ? "transaction date" :
              sortKey === "psm_high" ? "PSM high → low" :
              sortKey === "psm_low"  ? "PSM low → high" : "confidence"
            }
          </p>
        </div>
      )}
    </div>
  );
}
