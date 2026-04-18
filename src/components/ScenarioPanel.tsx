// ─── SCENARIO PANEL ───────────────────────────────────────────────────────────
// Collapsible panel for entering custom market assumptions.
// Shows model default vs user value and the delta for each field.
// Rendered inside the Deal Screener left sidebar.

import { useState } from "react";
import { ChevronDown, ChevronUp, RotateCcw, SlidersHorizontal } from "lucide-react";
import { ScenarioOverrides, hasScenario, SCENARIO_DEFAULTS } from "@/lib/scenario";
import { ProvenanceBadge } from "@/components/ProvenanceBadge";
import { SCENARIO_SOURCE_ID } from "@/lib/scenario";

// ── Props ─────────────────────────────────────────────────────────────────────

export interface ScenarioPanelProps {
  scenario:       ScenarioOverrides;
  onChange:       (s: ScenarioOverrides) => void;
  onReset:        () => void;
  // Model defaults — passed in so panel can show delta
  modelPsm:       number | null;   // SAR/sqm
  modelRentPsm:   number | null;   // SAR/sqm/yr
  modelOccupancy: number | null;   // %
  modelCapRate:   number | null;   // fraction e.g. 0.075
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const inputCls =
  "w-full bg-background border border-border rounded px-2.5 py-1.5 text-xs " +
  "text-foreground focus:outline-none focus:ring-1 focus:ring-primary " +
  "placeholder:text-muted-foreground/50";

function pct(delta: number, decimals = 1) {
  return `${delta >= 0 ? "+" : ""}${delta.toFixed(decimals)}%`;
}
function bps(a: number, b: number) {
  const d = (a - b) * 100;
  return `${d >= 0 ? "+" : ""}${d.toFixed(0)}bps`;
}

// ── Row ───────────────────────────────────────────────────────────────────────

function FieldRow({
  label,
  placeholder,
  unit,
  value,
  modelDefault,
  deltaLabel,
  step,
  min,
  max,
  onChange,
}: {
  label:        string;
  placeholder:  string;
  unit:         string;
  value:        number | undefined;
  modelDefault: string | null;
  deltaLabel:   string | null;  // pre-computed delta string, null = no model to compare
  step?:        number;
  min?:         number;
  max?:         number;
  onChange:     (v: number | undefined) => void;
}) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
          {label}
        </span>
        {modelDefault && (
          <span className="text-[10px] text-muted-foreground/60">
            Model: {modelDefault}
          </span>
        )}
      </div>
      <div className="flex items-center gap-1.5">
        <div className="relative flex-1">
          <input
            type="number"
            step={step ?? 1}
            min={min}
            max={max}
            value={value ?? ""}
            onChange={e => onChange(e.target.value ? Number(e.target.value) : undefined)}
            placeholder={placeholder}
            className={inputCls}
          />
          <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground/50 pointer-events-none">
            {unit}
          </span>
        </div>
        {value != null && deltaLabel && (
          <span className={`text-[10px] font-mono whitespace-nowrap ${
            deltaLabel.startsWith("+") ? "text-amber-400" :
            deltaLabel.startsWith("−") || deltaLabel.startsWith("-") ? "text-emerald-400" :
            "text-muted-foreground"
          }`}>
            {deltaLabel}
          </span>
        )}
        {value != null && (
          <button
            onClick={() => onChange(undefined)}
            className="text-muted-foreground/40 hover:text-muted-foreground transition-colors text-[10px] leading-none"
            title="Clear"
          >
            ×
          </button>
        )}
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function ScenarioPanel({
  scenario, onChange, onReset,
  modelPsm, modelRentPsm, modelOccupancy, modelCapRate,
}: ScenarioPanelProps) {
  const [open, setOpen] = useState(false);
  const active = hasScenario(scenario);

  function set<K extends keyof ScenarioOverrides>(k: K, v: ScenarioOverrides[K]) {
    onChange({ ...scenario, [k]: v });
  }

  // Delta computations
  const psmDelta = scenario.psmPrice != null && modelPsm != null
    ? pct((scenario.psmPrice - modelPsm) / modelPsm * 100)
    : null;
  const rentDelta = scenario.rentPsm != null && modelRentPsm != null
    ? pct((scenario.rentPsm - modelRentPsm) / modelRentPsm * 100)
    : null;
  const occDelta = scenario.occupancy != null && modelOccupancy != null
    ? `${scenario.occupancy >= modelOccupancy ? "+" : ""}${(scenario.occupancy - modelOccupancy).toFixed(0)}pp`
    : null;
  const capDelta = scenario.capRate != null && modelCapRate != null
    ? bps(scenario.capRate / 100, modelCapRate)
    : null;
  const growthDelta = scenario.growthRate != null
    ? `${scenario.growthRate >= SCENARIO_DEFAULTS.growthRate ? "+" : ""}${(scenario.growthRate - SCENARIO_DEFAULTS.growthRate).toFixed(1)}pp`
    : null;

  return (
    <div className="border border-border rounded-lg overflow-hidden">
      {/* Header / toggle */}
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-3 py-2.5 bg-secondary/40 hover:bg-secondary/70 transition-colors"
      >
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="w-3.5 h-3.5 text-muted-foreground" />
          <span className="text-xs font-medium text-foreground">My Assumptions</span>
          {active ? (
            <ProvenanceBadge
              sourceId={SCENARIO_SOURCE_ID}
              status="user_entered"
              className="text-[9px]"
            />
          ) : (
            <span className="text-[10px] text-muted-foreground/50">model defaults</span>
          )}
        </div>
        {open
          ? <ChevronUp className="w-3.5 h-3.5 text-muted-foreground" />
          : <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
        }
      </button>

      {/* Body */}
      {open && (
        <div className="px-3 py-3 space-y-3 bg-background">
          <p className="text-[10px] text-muted-foreground/70 leading-relaxed">
            Override market assumptions for scenario analysis. Model defaults remain visible as reference.
            Changes persist across refreshes.
          </p>

          <FieldRow
            label="Price benchmark"
            placeholder={modelPsm ? Math.round(modelPsm).toString() : "SAR/sqm"}
            unit="SAR/sqm"
            value={scenario.psmPrice}
            modelDefault={modelPsm ? `${Math.round(modelPsm).toLocaleString()}` : null}
            deltaLabel={psmDelta}
            step={100}
            min={0}
            onChange={v => set("psmPrice", v)}
          />

          <FieldRow
            label="Market rent"
            placeholder={modelRentPsm ? Math.round(modelRentPsm).toString() : "SAR/sqm/yr"}
            unit="SAR/sqm/yr"
            value={scenario.rentPsm}
            modelDefault={modelRentPsm ? `${Math.round(modelRentPsm).toLocaleString()}` : null}
            deltaLabel={rentDelta}
            step={50}
            min={0}
            onChange={v => set("rentPsm", v)}
          />

          <FieldRow
            label="Occupancy"
            placeholder={modelOccupancy != null ? modelOccupancy.toString() : "% occupied"}
            unit="%"
            value={scenario.occupancy}
            modelDefault={modelOccupancy != null ? `${modelOccupancy}%` : null}
            deltaLabel={occDelta}
            step={1}
            min={0}
            max={100}
            onChange={v => set("occupancy", v)}
          />

          <FieldRow
            label="Cap rate"
            placeholder={modelCapRate != null ? (modelCapRate * 100).toFixed(2) : "%"}
            unit="%"
            value={scenario.capRate}
            modelDefault={modelCapRate != null ? `${(modelCapRate * 100).toFixed(2)}%` : null}
            deltaLabel={capDelta}
            step={0.1}
            min={0}
            max={30}
            onChange={v => set("capRate", v)}
          />

          <FieldRow
            label="Rent growth"
            placeholder={SCENARIO_DEFAULTS.growthRate.toString()}
            unit="%/yr"
            value={scenario.growthRate}
            modelDefault={`${SCENARIO_DEFAULTS.growthRate}%`}
            deltaLabel={growthDelta}
            step={0.5}
            min={-10}
            max={20}
            onChange={v => set("growthRate", v)}
          />

          {active && (
            <button
              onClick={onReset}
              className="flex items-center gap-1 text-[10px] text-muted-foreground/60 hover:text-muted-foreground transition-colors underline underline-offset-2 mt-1"
            >
              <RotateCcw className="w-2.5 h-2.5" />
              Reset to model defaults
            </button>
          )}
        </div>
      )}
    </div>
  );
}
