import { useState, useMemo } from "react";
import { computeValuation } from "@/lib/valuation";
import { formatSAR } from "@/lib/utils";
import { PlusCircle, Trash2, TrendingUp, TrendingDown, Minus, Database } from "lucide-react";
import { ProvenanceBadge, ProvenanceBlock } from "@/components/ProvenanceBadge";
import { SOURCE_ID } from "@/lib/sources";

// ── Types ─────────────────────────────────────────────────────────────────────

interface MarketEntry {
  id: string;
  city: string;
  district: string;
  assetType: string;
  psmPrice: number;
  source: string;
  date: string;
  notes: string;
}

const STORAGE_KEY = "aouj_market_data";

function loadEntries(): MarketEntry[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]");
  } catch { return []; }
}
function saveEntries(entries: MarketEntry[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}

// ── Benchmark grid data ───────────────────────────────────────────────────────

const CITIES_GRID   = ["Riyadh", "Jeddah", "Khobar", "Dammam"];
const TYPES_GRID    = ["Residential Villa", "Apartment", "Commercial", "Office", "Warehouse"];
const DISTRICTS_FOR: Record<string, string> = {
  Riyadh: "Al Olaya",
  Jeddah: "Al Hamra",
  Khobar: "Al Hamraa",
  Dammam: "Al Faisaliyah",
};

const fmt  = formatSAR;
const psm  = (v: number) => `${Math.round(v).toLocaleString()}`;

// ── Sub-components ────────────────────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-4">
      <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">{title}</p>
      {children}
    </div>
  );
}

const inputCls = "w-full bg-secondary border border-border rounded-md px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary placeholder:text-muted-foreground";
const selectCls = inputCls;

// ── Benchmark table ───────────────────────────────────────────────────────────

function BenchmarkTable() {
  const grid = useMemo(() => {
    return CITIES_GRID.map(city => ({
      city,
      rows: TYPES_GRID.map(type => {
        const district = DISTRICTS_FOR[city] ?? "Al Olaya";
        const v = computeValuation({
          city, district, propertyType: type,
          size: 100, condition: "Good", transactionType: "Sale",
        });
        const capRate = v.incomeApproach?.capRate ?? null;
        return {
          type,
          psm: v.reconciledValue / 100,
          low: v.reconciledLow  / 100,
          high: v.reconciledHigh / 100,
          capRate,
        };
      }),
    }));
  }, []);

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="border-b border-border">
            <th className="text-left py-2.5 pr-4 text-xs font-medium text-muted-foreground whitespace-nowrap">
              Asset Type
              <ProvenanceBadge sourceId={SOURCE_ID.MODEL} className="ml-2 align-middle" />
            </th>
            {CITIES_GRID.map(c => (
              <th key={c} className="text-right py-2.5 px-4 text-xs font-medium text-muted-foreground whitespace-nowrap">
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {TYPES_GRID.map(type => (
            <tr key={type} className="border-b border-border/50 hover:bg-secondary/30 transition-colors">
              <td className="py-2.5 pr-4 text-xs text-foreground font-medium whitespace-nowrap">
                {type}
              </td>
              {grid.map(({ city, rows }) => {
                const row = rows.find(r => r.type === type)!;
                return (
                  <td key={city} className="py-2.5 px-4 text-right">
                    <p className="font-mono text-xs text-foreground">{psm(row.psm)} SAR/sqm</p>
                    <p className="text-[10px] text-muted-foreground/70">
                      {psm(row.low)} – {psm(row.high)}
                    </p>
                    {row.capRate && (
                      <p className="text-[10px] text-muted-foreground/70">
                        Cap {(row.capRate * 100).toFixed(1)}%
                      </p>
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
      <div className="mt-4">
        <ProvenanceBlock sourceId={SOURCE_ID.MODEL} />
      </div>
    </div>
  );
}

// ── Entry form ────────────────────────────────────────────────────────────────

function EntryForm({ onAdd }: { onAdd: (e: MarketEntry) => void }) {
  const [city,      setCity]      = useState("Riyadh");
  const [district,  setDistrict]  = useState("");
  const [assetType, setAssetType] = useState("Commercial");
  const [psmPrice,  setPsmPrice]  = useState("");
  const [source,    setSource]    = useState("Agent");
  const [date,      setDate]      = useState(new Date().toISOString().slice(0, 10));
  const [notes,     setNotes]     = useState("");

  function handleAdd() {
    const p = Number(psmPrice);
    if (!p || !district.trim()) return;
    onAdd({
      id: `me_${Date.now()}`,
      city, district: district.trim(), assetType,
      psmPrice: p, source, date, notes,
    });
    setPsmPrice(""); setNotes(""); setDistrict("");
  }

  return (
    <div className="rounded-lg border border-border bg-card p-4 space-y-3">
      <p className="text-xs font-medium text-foreground">Log a market data point</p>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        <select value={city} onChange={e => setCity(e.target.value)} className={selectCls}>
          {["Riyadh","Jeddah","Khobar","Dammam","Makkah","Medina","Abha"].map(c =>
            <option key={c}>{c}</option>)}
        </select>
        <input value={district} onChange={e => setDistrict(e.target.value)}
          placeholder="District" className={inputCls} />
        <select value={assetType} onChange={e => setAssetType(e.target.value)} className={selectCls}>
          {["Residential Villa","Apartment","Commercial","Office","Warehouse","Land"].map(t =>
            <option key={t}>{t}</option>)}
        </select>
        <input type="number" min={0} value={psmPrice} onChange={e => setPsmPrice(e.target.value)}
          placeholder="Price SAR/sqm" className={inputCls} />
        <select value={source} onChange={e => setSource(e.target.value)} className={selectCls}>
          {["Agent","Aqar","Bayut","Property Finder","Broker","Transaction","Other"].map(s =>
            <option key={s}>{s}</option>)}
        </select>
        <input type="date" value={date} onChange={e => setDate(e.target.value)} className={inputCls} />
      </div>
      <input value={notes} onChange={e => setNotes(e.target.value)}
        placeholder="Notes (optional — tenant, condition, context)" className={inputCls} />
      <button onClick={handleAdd}
        className="flex items-center gap-1.5 text-xs font-medium text-primary hover:underline transition-colors">
        <PlusCircle className="w-3.5 h-3.5" />
        Add entry
      </button>
    </div>
  );
}

// ── Comparison indicator ──────────────────────────────────────────────────────

function VsMarket({ entry }: { entry: MarketEntry }) {
  const benchmark = useMemo(() => {
    try {
      const districts: Record<string, string[]> = {
        Riyadh: ["Al Olaya","Al Sulaimaniyah","Hitteen","Al Nakheel","Al Yasmin","Al Rabwah","Al Malaz","Al Rawabi"],
        Jeddah: ["Al Hamra","Al Shati","Al Zahraa","Al Rawdah","Al Safa","Al Marjaan","Al Balad"],
        Khobar: ["Al Hamraa","Al Yarmouk","Al Thuqbah","Al Rakah","Al Khobar Al Shamaliyah"],
        Dammam: ["Al Faisaliyah","Al Badi","Al Shula","Al Noor","Al Jawharah"],
        Makkah: ["Al Aziziyah","Al Nuzha","Al Awali","Batha Quraysh","Al Zaher"],
        Medina: ["Al Azizia","Quba","Al Rawda","Al Khalidiyah","Al Salam"],
        Abha:   ["Al Marooj","Al Manhal","Al Namas","Al Qabel","Al Sad"],
      };
      const cityDistricts = districts[entry.city] ?? [];
      const district = cityDistricts.includes(entry.district)
        ? entry.district
        : (cityDistricts[0] ?? entry.district);

      const v = computeValuation({
        city: entry.city, district, propertyType: entry.assetType,
        size: 100, condition: "Good", transactionType: "Sale",
      });
      return v.reconciledValue / 100;
    } catch { return null; }
  }, [entry]);

  if (!benchmark) return null;
  const delta = ((entry.psmPrice - benchmark) / benchmark) * 100;
  const isAbove = delta > 0;

  return (
    <span className={`flex items-center gap-0.5 text-[10px] font-mono ${
      Math.abs(delta) < 5 ? "text-muted-foreground" :
      isAbove ? "text-red-400" : "text-emerald-400"
    }`}>
      {Math.abs(delta) < 5
        ? <Minus className="w-3 h-3" />
        : isAbove
          ? <TrendingUp className="w-3 h-3" />
          : <TrendingDown className="w-3 h-3" />
      }
      {isAbove ? "+" : ""}{delta.toFixed(0)}% vs mkt ({psm(benchmark)})
    </span>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────

export default function Market() {
  const [entries, setEntries] = useState<MarketEntry[]>(loadEntries);

  function handleAdd(entry: MarketEntry) {
    const next = [entry, ...entries];
    setEntries(next);
    saveEntries(next);
  }

  function handleDelete(id: string) {
    const next = entries.filter(e => e.id !== id);
    setEntries(next);
    saveEntries(next);
  }

  return (
    <div className="mx-auto max-w-5xl px-6 py-8 space-y-10">

      {/* Header */}
      <div>
        <h1 className="text-xl font-serif text-foreground">Market Intelligence</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Regional benchmarks and a running log of market data points you collect.
        </p>
      </div>

      {/* ── Benchmark table ── */}
      <Section title="Regional Benchmarks — Q1 2026">
        <BenchmarkTable />
      </Section>

      {/* ── Market Activity Log ── */}
      <Section title="Market Activity Log">
        <p className="text-xs text-muted-foreground -mt-2">
          Log price data points from agents, listings, or transactions. Each entry is compared against the benchmark above.
        </p>
        <EntryForm onAdd={handleAdd} />

        {entries.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-12 text-center border border-dashed border-border rounded-lg">
            <Database className="w-7 h-7 text-muted-foreground/30" />
            <p className="text-sm text-muted-foreground">No market entries yet.</p>
            <p className="text-xs text-muted-foreground/60">
              Add a data point above — from a broker quote, listing, or transaction.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {entries.map(entry => (
              <div key={entry.id}
                className="flex items-start justify-between gap-4 rounded-lg border border-border bg-card px-4 py-3 hover:border-border/80 transition-colors">
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-medium text-foreground">
                      {entry.city} · {entry.district}
                    </span>
                    <span className="text-xs text-muted-foreground px-1.5 py-0.5 bg-secondary rounded">
                      {entry.assetType}
                    </span>
                    <span className="text-xs text-muted-foreground">{entry.source}</span>
                    <span className="text-xs text-muted-foreground">{entry.date}</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="font-mono text-sm text-foreground">
                      {psm(entry.psmPrice)} SAR/sqm
                      {entry.psmPrice >= 1_000_000
                        ? "" : ` · ${fmt(entry.psmPrice * 100)} per 100 sqm`}
                    </span>
                    <VsMarket entry={entry} />
                  </div>
                  {entry.notes && (
                    <p className="text-xs text-muted-foreground">{entry.notes}</p>
                  )}
                </div>
                <button
                  onClick={() => handleDelete(entry.id)}
                  className="text-muted-foreground/40 hover:text-red-400 transition-colors shrink-0 mt-0.5"
                  title="Delete entry"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </Section>

      {/* ── Opportunity sourcing roadmap ── */}
      <Section title="Opportunity Sourcing — Coming Next">
        <div className="rounded-xl border border-dashed border-primary/30 bg-primary/5 p-6 space-y-4">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <TrendingDown className="w-4 h-4 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">Live deal sourcing</p>
              <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                When live data feeds are connected (REGA, Ejar, Aqar), this section will automatically
                surface properties listed below their market benchmark — filtered by your acquisition
                criteria and ranked by IRR potential.
              </p>
            </div>
          </div>
          <div className="grid sm:grid-cols-3 gap-3 pt-2">
            {[
              { label: "Source", desc: "Aqar · Bayut · Property Finder · REGA" },
              { label: "Filter", desc: "City · type · size · price band · yield floor" },
              { label: "Score", desc: "Below-market delta · IRR · risk flags · verdict" },
            ].map(({ label, desc }) => (
              <div key={label} className="bg-background/60 rounded-lg p-3 border border-border">
                <p className="text-xs font-medium text-primary mb-1">{label}</p>
                <p className="text-xs text-muted-foreground">{desc}</p>
              </div>
            ))}
          </div>
          <p className="text-xs text-muted-foreground/60">
            To connect live data: add a Brave Search API key or a custom data integration.
            Contact us for the roadmap.
          </p>
        </div>
      </Section>

    </div>
  );
}
