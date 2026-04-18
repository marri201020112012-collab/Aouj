import { useState, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search, ExternalLink, TrendingDown, TrendingUp, Minus,
  CheckCircle, AlertCircle, XCircle, Loader2, Save,
  Building2, MapPin, Tag, Zap,
} from "lucide-react";
import { computeValuation, CITIES, DISTRICTS, PROPERTY_TYPES } from "@/lib/valuation";
import { runScreen } from "@/lib/screen";
import { formatSAR } from "@/lib/utils";
import { saveCase, generateCaseId, DEFAULT_CHECKLIST, DEFAULT_LEGAL_REVIEW } from "@/lib/cases";
import { toast } from "sonner";

// ── Types ─────────────────────────────────────────────────────────────────────

interface SearchResult {
  title: string;
  url: string;
  description: string;
  page_age?: string;
}

interface QuickCheck {
  price: number;
  size: number;
  rent: number | null;
  city: string;
  district: string;
  assetType: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const fmt = formatSAR;
const psm = (v: number) => `${Math.round(v).toLocaleString()} SAR/m²`;

function extractPriceHint(text: string): string | null {
  const patterns = [
    /(\d{1,3}(?:,\d{3})+)\s*(?:ريال|SAR|ر\.س)/i,
    /(?:ريال|SAR|ر\.س)\s*(\d{1,3}(?:,\d{3})+)/i,
    /(\d+(?:\.\d+)?)\s*(?:مليون|million)/i,
    /(\d{1,3}(?:,\d{3}){2,})/,
  ];
  for (const p of patterns) {
    const m = text.match(p);
    if (m) return m[0];
  }
  return null;
}

function sourceBadge(url: string): { label: string; color: string } {
  if (url.includes("aqar"))         return { label: "Aqar",            color: "bg-blue-900/30 text-blue-400 border-blue-700/40" };
  if (url.includes("bayut"))        return { label: "Bayut",           color: "bg-purple-900/30 text-purple-400 border-purple-700/40" };
  if (url.includes("propertyfinder")) return { label: "Property Finder", color: "bg-green-900/30 text-green-400 border-green-700/40" };
  if (url.includes("haraj"))        return { label: "Haraj",           color: "bg-orange-900/30 text-orange-400 border-orange-700/40" };
  return { label: new URL(url).hostname.replace("www.", ""),            color: "bg-secondary text-muted-foreground border-border" };
}

// ── Platform direct links ─────────────────────────────────────────────────────

function buildPlatformLinks(city: string, district: string, assetType: string) {
  const q = encodeURIComponent(`${assetType} للبيع ${district} ${city} السعودية`);
  const qEn = encodeURIComponent(`${assetType} for sale ${district} ${city} Saudi Arabia`);
  return [
    { label: "Aqar.fm",            url: `https://www.google.com/search?q=${q}+site:aqar.fm`,            color: "text-blue-400"   },
    { label: "Bayut Saudi",        url: `https://www.google.com/search?q=${qEn}+site:bayut.sa`,          color: "text-purple-400" },
    { label: "Property Finder SA", url: `https://www.google.com/search?q=${qEn}+site:propertyfinder.sa`, color: "text-green-400"  },
    { label: "Haraj",              url: `https://www.google.com/search?q=${q}+site:haraj.com.sa`,        color: "text-orange-400" },
  ];
}

// ── Sub-components ────────────────────────────────────────────────────────────

const selectCls = "w-full bg-secondary border border-border rounded-md px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary";
const inputCls  = "w-full bg-secondary border border-border rounded-md px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary placeholder:text-muted-foreground";

function Label({ children }: { children: React.ReactNode }) {
  return <p className="text-xs font-medium text-muted-foreground mb-1.5">{children}</p>;
}

// ── Quick price checker ───────────────────────────────────────────────────────

function QuickChecker({ city, district, assetType }: { city: string; district: string; assetType: string }) {
  const navigate = useNavigate();
  const [price, setPrice] = useState("");
  const [size,  setSize]  = useState("");
  const [rent,  setRent]  = useState("");

  const check = useMemo<QuickCheck | null>(() => {
    const p = Number(price.replace(/,/g, ""));
    const s = Number(size.replace(/,/g, ""));
    if (!p) return null;
    return { price: p, size: s || 0, rent: rent ? Number(rent.replace(/,/g, "")) : null, city, district, assetType };
  }, [price, size, rent, city, district, assetType]);

  const result = useMemo(() => {
    if (!check?.price) return null;
    return runScreen({
      city: check.city, district: check.district, assetType: check.assetType,
      price: check.price, size: check.size || null, annualRent: check.rent,
      yieldPct: null, ltvOverride: null, holdYears: 5,
    });
  }, [check]);

  const benchmark = useMemo(() => {
    const v = computeValuation({ city, district, propertyType: assetType, size: 100, condition: "Good", transactionType: "Sale" });
    return v.reconciledValue / 100;
  }, [city, district, assetType]);

  function handleSave() {
    if (!check?.price) return;
    const input = { city, district, propertyType: assetType, size: check.size || 500, condition: "Good", transactionType: "Sale" };
    const valResult = computeValuation(input);
    const c = {
      id: generateCaseId(),
      title: `${city} ${assetType} — from Opportunity Scan`,
      input, result: valResult, stage: "Screening" as const,
      stageHistory: [{ stage: "Screening" as const, timestamp: new Date().toISOString() }],
      auditLog: [{ timestamp: new Date().toISOString(), event: "Case created from opportunity scan" }],
      decisionRecord: null, assumptionNotes: `Scanned price: ${fmt(check.price)}${check.rent ? ` · Rent: ${fmt(check.rent)}/yr` : ""}`,
      createdAt: new Date().toISOString(),
      checklist: DEFAULT_CHECKLIST.map(i => ({ ...i })),
      legalReview: { ...DEFAULT_LEGAL_REVIEW, notes: [] },
    };
    saveCase(c);
    toast.success("Saved to pipeline");
    navigate(`/cases/${c.id}`);
  }

  const irr = (v: number | null) => v == null ? "—" : `${(v * 100).toFixed(1)}%`;
  const delta = check?.price ? ((check.price / 100 - benchmark) / benchmark * 100) : null;
  const psmEntered = (check?.price && check?.size) ? check.price / check.size : null;

  return (
    <div className="rounded-xl border border-border bg-card p-5 space-y-4">
      <div className="flex items-center gap-2">
        <Zap className="w-4 h-4 text-primary" />
        <p className="text-sm font-semibold text-foreground">Quick Price Check</p>
        <span className="text-xs text-muted-foreground">— paste a listing price, get an instant verdict</span>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div>
          <Label>Price (SAR)</Label>
          <input value={price} onChange={e => setPrice(e.target.value)} placeholder="e.g. 8,500,000" className={inputCls} />
        </div>
        <div>
          <Label>Size (sqm)</Label>
          <input value={size} onChange={e => setSize(e.target.value)} placeholder="e.g. 500" className={inputCls} />
        </div>
        <div>
          <Label>Annual Rent (optional)</Label>
          <input value={rent} onChange={e => setRent(e.target.value)} placeholder="e.g. 680,000" className={inputCls} />
        </div>
      </div>

      {result && check?.price ? (
        <div className="space-y-3 pt-1">
          {/* Verdict strip */}
          <div className={`rounded-lg border px-4 py-3 flex items-center gap-3 ${
            result.verdict === "proceed"      ? "border-emerald-700/50 bg-emerald-900/15" :
            result.verdict === "clarify"      ? "border-amber-700/50 bg-amber-900/15" :
            result.verdict === "insufficient" ? "border-border bg-secondary/30" :
                                               "border-red-700/50 bg-red-900/15"
          }`}>
            {result.verdict === "proceed"      ? <CheckCircle  className="w-5 h-5 text-emerald-400 shrink-0" /> :
             result.verdict === "clarify"      ? <AlertCircle  className="w-5 h-5 text-amber-400 shrink-0" />  :
             result.verdict === "insufficient" ? <Minus        className="w-5 h-5 text-muted-foreground shrink-0" /> :
                                                <XCircle      className="w-5 h-5 text-red-400 shrink-0" />}
            <div className="flex-1">
              <p className={`text-sm font-semibold ${
                result.verdict === "proceed"      ? "text-emerald-400" :
                result.verdict === "clarify"      ? "text-amber-400"   :
                result.verdict === "insufficient" ? "text-muted-foreground" :
                                                   "text-red-400"
              }`}>
                {result.verdict === "proceed"      ? "Proceed to DD" :
                 result.verdict === "clarify"      ? "Needs Clarification" :
                 result.verdict === "insufficient" ? "Enter a size or rent to get a verdict" :
                                                    "Likely Reject"}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">{result.verdictReason}</p>
            </div>
            {result.verdict !== "insufficient" && (
              <button onClick={handleSave}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-primary/10 text-primary text-xs font-medium hover:bg-primary/20 transition-colors shrink-0">
                <Save className="w-3.5 h-3.5" />
                Save to pipeline
              </button>
            )}
          </div>

          {/* Metrics row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[
              { label: "Your Price", value: fmt(check.price) },
              { label: "vs Market PSM", value: delta != null ? `${delta >= 0 ? "+" : ""}${delta.toFixed(1)}%` : "—",
                color: delta == null ? "" : delta > 20 ? "text-red-400" : delta < -10 ? "text-emerald-400" : "text-amber-400" },
              { label: "Unlevered IRR", value: irr(result.unleveredIRR),
                color: (result.unleveredIRR ?? 0) >= 0.08 ? "text-primary" : "" },
              { label: "Your PSM", value: psmEntered ? psm(psmEntered) : "—" },
            ].map(({ label, value, color }) => (
              <div key={label} className="bg-secondary/60 rounded-lg p-3">
                <p className="text-xs text-muted-foreground mb-1">{label}</p>
                <p className={`text-sm font-mono font-semibold text-foreground ${color ?? ""}`}>{value}</p>
              </div>
            ))}
          </div>

          {/* Benchmark reference */}
          <div className="flex items-center gap-3 text-xs text-muted-foreground border-t border-border pt-3">
            <span>Market benchmark:</span>
            <span className="font-mono text-foreground font-medium">{psm(benchmark)}</span>
            {psmEntered && (
              <>
                <span>·</span>
                <span>Your PSM:</span>
                <span className={`font-mono font-medium ${
                  psmEntered > benchmark * 1.2 ? "text-red-400" :
                  psmEntered < benchmark * 0.85 ? "text-emerald-400" : "text-foreground"
                }`}>{psm(psmEntered)}</span>
              </>
            )}
          </div>
        </div>
      ) : (
        <div className="border-t border-border pt-3">
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span>Market benchmark for {city} · {assetType}:</span>
            <span className="font-mono text-foreground font-medium">{psm(benchmark)}</span>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Search result card ────────────────────────────────────────────────────────

function ResultCard({ r, benchmark }: { r: SearchResult; benchmark: number }) {
  const badge = (() => { try { return sourceBadge(r.url); } catch { return { label: "Web", color: "bg-secondary text-muted-foreground border-border" }; } })();
  const priceHint = extractPriceHint(r.description ?? "");

  return (
    <a href={r.url} target="_blank" rel="noreferrer"
      className="group flex flex-col gap-2 rounded-lg border border-border bg-card p-4 hover:border-primary/40 transition-colors">
      <div className="flex items-start gap-3 justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded border ${badge.color}`}>{badge.label}</span>
            {r.page_age && <span className="text-[10px] text-muted-foreground">{r.page_age}</span>}
          </div>
          <p className="text-sm font-medium text-foreground group-hover:text-primary transition-colors line-clamp-1">
            {r.title}
          </p>
        </div>
        <ExternalLink className="w-3.5 h-3.5 text-muted-foreground group-hover:text-primary shrink-0 mt-1 transition-colors" />
      </div>
      <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">{r.description}</p>
      {priceHint && (
        <div className="flex items-center gap-2 pt-1 border-t border-border/50">
          <Tag className="w-3 h-3 text-primary shrink-0" />
          <span className="text-xs font-mono text-foreground">{priceHint}</span>
          <span className="text-xs text-muted-foreground">· benchmark {psm(benchmark)}</span>
        </div>
      )}
    </a>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function Opportunities() {
  const [city,      setCity]      = useState("Riyadh");
  const [district,  setDistrict]  = useState("Al Olaya");
  const [assetType, setAssetType] = useState("Commercial");
  const [keywords,  setKeywords]  = useState("");
  const [loading,   setLoading]   = useState(false);
  const [results,   setResults]   = useState<SearchResult[]>([]);
  const [searched,  setSearched]  = useState(false);
  const [apiReady,  setApiReady]  = useState(false);

  const availDistricts = DISTRICTS[city] ?? [];

  const benchmark = useMemo(() => {
    const v = computeValuation({ city, district, propertyType: assetType, size: 100, condition: "Good", transactionType: "Sale" });
    return v.reconciledValue / 100;
  }, [city, district, assetType]);

  const platformLinks = useMemo(() => buildPlatformLinks(city, district, assetType), [city, district, assetType]);

  const handleSearch = useCallback(async () => {
    setLoading(true);
    setSearched(true);
    const q = [assetType, "للبيع", district, city, "السعودية", keywords].filter(Boolean).join(" ");
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
      const data = await res.json() as { configured?: boolean; web?: { results?: SearchResult[] } };
      setApiReady(data.configured ?? false);
      setResults(data.web?.results ?? []);
    } catch {
      setApiReady(false);
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, [city, district, assetType, keywords]);

  const handleCityChange = (c: string) => {
    setCity(c);
    setDistrict(DISTRICTS[c]?.[0] ?? "");
    setResults([]);
    setSearched(false);
  };

  return (
    <div className="mx-auto max-w-5xl px-6 py-8 space-y-8">

      {/* Header */}
      <div>
        <h1 className="text-xl font-serif text-foreground">Opportunity Sourcing</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Find deals on Saudi listing platforms and instantly check them against market benchmarks.
        </p>
      </div>

      {/* ── Criteria ── */}
      <div className="rounded-xl border border-border bg-card p-5 space-y-4">
        <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">Search Criteria</p>

        <div className="grid sm:grid-cols-4 gap-3">
          <div>
            <Label>City</Label>
            <select value={city} onChange={e => handleCityChange(e.target.value)} className={selectCls}>
              {CITIES.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <Label>District</Label>
            <select value={district} onChange={e => setDistrict(e.target.value)} className={selectCls}>
              {availDistricts.map(d => <option key={d}>{d}</option>)}
            </select>
          </div>
          <div>
            <Label>Asset Type</Label>
            <select value={assetType} onChange={e => setAssetType(e.target.value)} className={selectCls}>
              {PROPERTY_TYPES.map(t => <option key={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <Label>Keywords (optional)</Label>
            <input value={keywords} onChange={e => setKeywords(e.target.value)}
              placeholder="e.g. واجهة تجارية, corner" className={inputCls} />
          </div>
        </div>

        <div className="flex items-center gap-3 pt-1">
          <button onClick={handleSearch}
            disabled={loading}
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-60">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            {loading ? "Searching..." : "Find Opportunities"}
          </button>
          <div className="flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">
              Benchmark for {city} · {assetType}:
            </span>
            <span className="text-xs font-mono font-medium text-foreground">{psm(benchmark)}</span>
          </div>
        </div>
      </div>

      {/* ── Platform links (always visible) ── */}
      <div className="space-y-3">
        <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">Search on platforms</p>
        <div className="grid sm:grid-cols-4 gap-2">
          {platformLinks.map(({ label, url, color }) => (
            <a key={label} href={url} target="_blank" rel="noreferrer"
              className="flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-3 hover:border-primary/40 transition-colors group">
              <Building2 className={`w-4 h-4 shrink-0 ${color} group-hover:scale-105 transition-transform`} />
              <span className="text-sm font-medium text-foreground">{label}</span>
              <ExternalLink className="w-3 h-3 text-muted-foreground ml-auto" />
            </a>
          ))}
        </div>
        <p className="text-xs text-muted-foreground/60">
          Opens Google search filtered to each platform — click through to see live listings.
        </p>
      </div>

      {/* ── Quick Price Check ── */}
      <QuickChecker city={city} district={district} assetType={assetType} />

      {/* ── Search results ── */}
      {searched && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
              {apiReady ? `Results (${results.length})` : "Live search results"}
            </p>
            {!apiReady && (
              <span className="text-xs text-amber-400 border border-amber-700/40 bg-amber-900/20 px-2 py-0.5 rounded">
                Connect Brave API for inline results
              </span>
            )}
          </div>

          {!apiReady ? (
            <div className="rounded-xl border border-dashed border-primary/30 bg-primary/5 p-6 space-y-4">
              <div className="flex items-start gap-3">
                <Search className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-foreground mb-1">
                    Use the platform links above to find listings
                  </p>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Click any platform link → find a deal → paste the price and size into the Quick
                    Price Check above → get an instant IRR and verdict → save to your pipeline.
                  </p>
                </div>
              </div>
              <div className="border-t border-border/50 pt-4">
                <p className="text-xs font-medium text-foreground mb-2">
                  To enable inline search results — add a Brave Search API key:
                </p>
                <ol className="space-y-1 text-xs text-muted-foreground list-decimal list-inside">
                  <li>Go to <span className="text-primary font-mono">api.search.brave.com</span> → sign up (free tier: 2,000 searches/month)</li>
                  <li>Copy your API key</li>
                  <li>In Vercel dashboard → your project → Settings → Environment Variables</li>
                  <li>Add <span className="font-mono text-foreground">BRAVE_API_KEY</span> = your key</li>
                  <li>Redeploy → results appear inline here</li>
                </ol>
              </div>
            </div>
          ) : results.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground text-sm">
              No results found. Try different keywords or a broader district.
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 gap-3">
              {results.map((r, i) => (
                <ResultCard key={i} r={r} benchmark={benchmark} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Delta indicator key ── */}
      <div className="rounded-lg border border-border bg-card p-4 grid sm:grid-cols-3 gap-4 text-xs">
        <div className="flex items-center gap-2">
          <TrendingDown className="w-3.5 h-3.5 text-emerald-400" />
          <span className="text-muted-foreground">Below benchmark → <span className="text-emerald-400 font-medium">potential buy</span></span>
        </div>
        <div className="flex items-center gap-2">
          <Minus className="w-3.5 h-3.5 text-foreground" />
          <span className="text-muted-foreground">Within ±10% → <span className="text-foreground font-medium">fair market</span></span>
        </div>
        <div className="flex items-center gap-2">
          <TrendingUp className="w-3.5 h-3.5 text-red-400" />
          <span className="text-muted-foreground">Above benchmark → <span className="text-red-400 font-medium">verify or pass</span></span>
        </div>
      </div>

    </div>
  );
}
