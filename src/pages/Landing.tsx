import { useMemo } from "react";
import { Link } from "react-router-dom";
import {
  Zap, TrendingUp, FolderOpen, ArrowRight, BarChart3,
  Database, Search, ShieldCheck, Globe, Clock,
  CheckCircle, AlertCircle, XCircle, Check,
  Building2, Users, Briefcase,
} from "lucide-react";
import { runScreen } from "@/lib/screen";

// ── Live deal preview (real engine output, rendered statically) ───────────────

function LivePreview() {
  const result = useMemo(() => runScreen({
    city:        "Riyadh",
    district:    "Al Olaya",
    assetType:   "Commercial",
    price:       42_000_000,
    size:        2_400,
    annualRent:  3_360_000,
    yieldPct:    null,
    ltvOverride: null,
    holdYears:   5,
  }), []);

  const irr = (v: number | null) => v == null ? "—" : `${(v * 100).toFixed(1)}%`;
  const pct = (v: number) => `${v >= 0 ? "+" : ""}${v.toFixed(1)}%`;
  const psm = (v: number | null) => v == null ? "—" : `${Math.round(v).toLocaleString()} SAR/m²`;

  return (
    <div className="relative rounded-2xl border border-border bg-card overflow-hidden shadow-2xl">
      {/* Title bar */}
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-border bg-secondary/40">
        <div className="flex gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-border" />
          <span className="w-2.5 h-2.5 rounded-full bg-border" />
          <span className="w-2.5 h-2.5 rounded-full bg-border" />
        </div>
        <span className="text-xs text-muted-foreground ml-2">
          AOUJ Deal Screener — Al Olaya Commercial · SAR 42M · 2,400 m²
        </span>
      </div>

      <div className="grid grid-cols-5 divide-x divide-border">
        {/* Left: inputs summary */}
        <div className="col-span-2 p-4 space-y-3 bg-background/50">
          <p className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">Deal inputs</p>
          {[
            ["Location", "Al Olaya, Riyadh"],
            ["Asset Type", "Commercial"],
            ["Asking Price", "SAR 42,000,000"],
            ["Size", "2,400 sqm"],
            ["Annual Rent", "SAR 3,360,000"],
            ["Hold Period", "5 years"],
            ["LTV", "70% (SAMA max)"],
          ].map(([k, v]) => (
            <div key={k}>
              <p className="text-[10px] text-muted-foreground">{k}</p>
              <p className="text-xs font-medium text-foreground">{v}</p>
            </div>
          ))}
        </div>

        {/* Right: results */}
        <div className="col-span-3 p-4 space-y-3">
          {/* Verdict */}
          <div className={`rounded-lg border px-3 py-2.5 flex items-center gap-2
            ${result.verdict === "proceed"
              ? "border-emerald-700/50 bg-emerald-900/20"
              : result.verdict === "clarify"
              ? "border-amber-700/50 bg-amber-900/20"
              : "border-red-700/50 bg-red-900/20"
            }`}>
            {result.verdict === "proceed"
              ? <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
              : result.verdict === "clarify"
              ? <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
              : <XCircle className="w-4 h-4 text-red-400 shrink-0" />
            }
            <div>
              <p className={`text-xs font-semibold ${
                result.verdict === "proceed" ? "text-emerald-400" :
                result.verdict === "clarify" ? "text-amber-400" : "text-red-400"
              }`}>
                {result.verdict === "proceed" ? "Proceed to DD" :
                 result.verdict === "clarify" ? "Needs Clarification" : "Likely Reject"}
              </p>
              <p className="text-[10px] text-muted-foreground leading-tight mt-0.5 line-clamp-2">
                {result.verdictReason}
              </p>
            </div>
          </div>

          {/* Metrics */}
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: "Unlevered IRR", value: irr(result.unleveredIRR), hi: (result.unleveredIRR ?? 0) >= 0.08 },
              { label: "Levered IRR", value: irr(result.leveredIRR), hi: false },
              { label: "vs Market", value: result.psmDeltaPct != null ? pct(result.psmDeltaPct) : "—", hi: false },
              { label: "Your PSM", value: psm(result.pricePerSqm), hi: false },
            ].map(({ label, value, hi }) => (
              <div key={label} className="bg-secondary/60 rounded-md p-2">
                <p className="text-[10px] text-muted-foreground">{label}</p>
                <p className={`text-sm font-mono font-semibold ${hi ? "text-primary" : "text-foreground"}`}>{value}</p>
              </div>
            ))}
          </div>

          {/* Flags */}
          <div className="space-y-1">
            {result.flags.slice(0, 3).map((f, i) => (
              <div key={i} className={`flex items-center gap-1.5 text-[10px] rounded px-2 py-1 ${
                f.level === "critical" ? "bg-red-900/20 text-red-300" :
                f.level === "warn"    ? "bg-amber-900/15 text-amber-300" :
                "bg-secondary/40 text-muted-foreground"
              }`}>
                <span className="shrink-0">{f.level === "critical" ? "●" : f.level === "warn" ? "◆" : "○"}</span>
                <span className="line-clamp-1">{f.message}</span>
              </div>
            ))}
          </div>

          {/* Confidence */}
          <div className="flex items-center gap-2">
            <div className="flex-1 bg-secondary rounded-full h-1 overflow-hidden">
              <div className="h-full bg-primary rounded-full" style={{ width: `${result.confidenceScore}%` }} />
            </div>
            <span className="text-[10px] text-muted-foreground whitespace-nowrap">
              {result.confidenceScore}/100 confidence
            </span>
          </div>
        </div>
      </div>

      {/* Glow overlay label */}
      <div className="absolute bottom-3 right-3">
        <span className="text-[9px] text-muted-foreground/40 uppercase tracking-widest">Live engine output</span>
      </div>
    </div>
  );
}

// ── Pricing tier ──────────────────────────────────────────────────────────────

function PricingCard({
  name, price, priceSub, desc, features, cta, highlighted,
}: {
  name: string; price: string; priceSub: string; desc: string;
  features: string[]; cta: string; highlighted?: boolean;
}) {
  return (
    <div className={`relative flex flex-col rounded-2xl border p-6 gap-5 transition-all
      ${highlighted
        ? "border-primary/60 bg-primary/5 shadow-lg shadow-primary/10"
        : "border-border bg-card"
      }`}>
      {highlighted && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <span className="text-[10px] font-semibold bg-primary text-primary-foreground px-3 py-1 rounded-full uppercase tracking-wider">
            Most popular
          </span>
        </div>
      )}
      <div>
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-widest mb-2">{name}</p>
        <p className="text-3xl font-serif font-semibold text-foreground">{price}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{priceSub}</p>
        <p className="text-sm text-muted-foreground mt-3 leading-relaxed">{desc}</p>
      </div>
      <ul className="space-y-2.5 flex-1">
        {features.map(f => (
          <li key={f} className="flex items-start gap-2 text-sm text-secondary-foreground">
            <Check className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
            {f}
          </li>
        ))}
      </ul>
      <Link
        to="/screen"
        className={`flex items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-medium transition-colors
          ${highlighted
            ? "bg-primary text-primary-foreground hover:bg-primary/90"
            : "border border-border text-foreground hover:bg-secondary"
          }`}
      >
        {cta}
        <ArrowRight className="w-3.5 h-3.5" />
      </Link>
    </div>
  );
}

// ── ICP card ──────────────────────────────────────────────────────────────────

function IcpCard({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <div className="flex items-start gap-4 p-5 rounded-xl border border-border bg-card">
      <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
        {icon}
      </div>
      <div>
        <p className="text-sm font-medium text-foreground mb-1">{title}</p>
        <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
      </div>
    </div>
  );
}

// ── Roadmap item ──────────────────────────────────────────────────────────────

function RoadmapItem({ icon, title, desc, status }: {
  icon: React.ReactNode; title: string; desc: string;
  status: "live" | "next" | "planned";
}) {
  const badge = {
    live:    { label: "Live",    cls: "bg-emerald-900/40 text-emerald-400 border border-emerald-700/40" },
    next:    { label: "Next",    cls: "bg-amber-900/40 text-amber-400 border border-amber-700/40" },
    planned: { label: "Planned", cls: "bg-secondary text-muted-foreground border border-border" },
  }[status];

  return (
    <div className="flex items-start gap-4 py-3.5 border-b border-border last:border-0">
      <div className="w-7 h-7 rounded-md bg-secondary flex items-center justify-center text-muted-foreground shrink-0 mt-0.5">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5 flex-wrap">
          <p className="text-sm font-medium text-foreground">{title}</p>
          <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${badge.cls}`}>{badge.label}</span>
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed">{desc}</p>
      </div>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────

export default function Landing() {
  return (
    <div className="min-h-[calc(100vh-3.5rem)] bg-background">

      {/* ══ HERO ══════════════════════════════════════════════════════════════ */}
      <div className="hero-section border-b border-border">
        <div className="mx-auto max-w-6xl px-6 py-16 sm:py-20">
          <div className="grid lg:grid-cols-2 gap-12 items-center">

            {/* Left */}
            <div>
              {/* Badge */}
              <div className="inline-flex items-center gap-2 border border-primary/30 bg-primary/8 rounded-full px-3 py-1 mb-8">
                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse shrink-0" />
                <span className="text-xs text-primary/90 font-medium tracking-wide">
                  Saudi Arabia · Institutional Grade
                </span>
              </div>

              <h1 className="text-4xl sm:text-5xl font-serif text-foreground leading-[1.1] tracking-tight">
                The deal intelligence
                <br />
                <span className="text-primary">layer</span> for Saudi
                <br />
                real estate teams.
              </h1>

              <p className="mt-6 text-base text-muted-foreground leading-relaxed max-w-lg">
                Screen any opportunity in seconds. Run TAQEEM-aligned valuations.
                Manage your pipeline from first look to IC approval.
                Built for acquisitions analysts who move fast.
              </p>

              <div className="flex flex-wrap items-center gap-3 mt-8">
                <Link
                  to="/screen"
                  className="flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20"
                >
                  <Zap className="w-4 h-4" />
                  Try the Screener — free
                </Link>
                <Link
                  to="/cases"
                  className="flex items-center gap-2 px-6 py-3 rounded-xl border border-border text-sm font-medium text-foreground hover:bg-secondary transition-colors"
                >
                  <FolderOpen className="w-4 h-4" />
                  See live pipeline
                </Link>
              </div>

              {/* Trust signals */}
              <div className="flex flex-wrap gap-6 mt-10 pt-8 border-t border-border">
                {[
                  { v: "7",        l: "cities" },
                  { v: "40+",      l: "districts" },
                  { v: "< 1s",     l: "screen to verdict" },
                  { v: "TAQEEM",   l: "aligned" },
                  { v: "SAMA",     l: "referenced" },
                ].map(({ v, l }) => (
                  <div key={l}>
                    <p className="text-lg font-serif font-semibold text-foreground">{v}</p>
                    <p className="text-xs text-muted-foreground">{l}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: Live preview */}
            <div className="hidden lg:block">
              <LivePreview />
            </div>
          </div>
        </div>
      </div>

      {/* ══ WHO IT'S FOR ══════════════════════════════════════════════════════ */}
      <div className="mx-auto max-w-6xl px-6 py-14 space-y-6">
        <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">Built for</p>
        <div className="grid sm:grid-cols-3 gap-4">
          <IcpCard
            icon={<Briefcase className="w-4.5 h-4.5" />}
            title="Family office investment teams"
            desc="Screen off-market deals fast. Get an IRR and benchmark before the broker presentation ends."
          />
          <IcpCard
            icon={<Building2 className="w-4.5 h-4.5" />}
            title="Saudi REITs & funds"
            desc="Standardise your acquisitions workflow across analysts. IC memos, audit trail, and compliance signals built in."
          />
          <IcpCard
            icon={<Users className="w-4.5 h-4.5" />}
            title="Real estate developers"
            desc="Benchmark land and commercial acquisitions against live market data before committing capital."
          />
        </div>
      </div>

      {/* ══ HOW IT WORKS ══════════════════════════════════════════════════════ */}
      <div className="border-t border-border">
        <div className="mx-auto max-w-6xl px-6 py-14">
          <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground mb-8">Workflow</p>
          <div className="grid sm:grid-cols-4 gap-6 relative">
            {/* Connector line */}
            <div className="hidden sm:block absolute top-5 left-[12.5%] right-[12.5%] h-px bg-border" />
            {[
              { step: "01", title: "Spot a deal", desc: "Broker referral, off-market lead, or listing platform." },
              { step: "02", title: "Screen in 30 seconds", desc: "Price + size + rent → IRR, benchmark delta, verdict." },
              { step: "03", title: "Full valuation", desc: "Dual-approach TAQEEM analysis with sensitivity and financing overlay." },
              { step: "04", title: "IC approval", desc: "DD checklist, audit log, printable IC memo — decision recorded." },
            ].map(({ step, title, desc }) => (
              <div key={step} className="relative">
                <div className="w-10 h-10 rounded-full border border-border bg-background flex items-center justify-center mb-4 relative z-10">
                  <span className="text-xs font-mono text-primary">{step}</span>
                </div>
                <p className="text-sm font-medium text-foreground mb-1.5">{title}</p>
                <p className="text-xs text-muted-foreground leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ══ CAPABILITIES ══════════════════════════════════════════════════════ */}
      <div className="border-t border-border bg-secondary/20">
        <div className="mx-auto max-w-6xl px-6 py-14">
          <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground mb-8">Capabilities</p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              {
                icon: <Zap className="w-4 h-4" />,
                title: "Deal Screener",
                desc: "Instant IRR, cap rate vs market, risk flags, and a Proceed / Clarify / Reject verdict. No submit button — updates live.",
                href: "/screen",
              },
              {
                icon: <TrendingUp className="w-4 h-4" />,
                title: "Valuation Engine",
                desc: "Sales comparison + income approach with TAQEEM compliance signals, sensitivity table, LTV/DSCR, and financing analysis.",
                href: "/valuation",
              },
              {
                icon: <FolderOpen className="w-4 h-4" />,
                title: "Deal Pipeline",
                desc: "Screening → DD → IC Review. Saudi-specific DD checklist, assumption notes, decision record, printable IC memo.",
                href: "/cases",
              },
              {
                icon: <BarChart3 className="w-4 h-4" />,
                title: "Market Intel",
                desc: "Regional benchmark table across 4 cities × 5 asset types. Log market data points and track vs benchmark.",
                href: "/market",
              },
            ].map(({ icon, title, desc, href }) => (
              <Link
                key={title}
                to={href}
                className="group flex flex-col gap-4 rounded-xl border border-border bg-card p-5 hover:border-primary/40 hover:bg-card/80 transition-all duration-200"
              >
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                  {icon}
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-semibold text-foreground mb-1.5">{title}</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">{desc}</p>
                </div>
                <div className="flex items-center gap-1 text-xs text-primary font-medium">
                  Open <ArrowRight className="w-3 h-3 transition-transform group-hover:translate-x-0.5" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* ══ PRICING ════════════════════════════════════════════════════════════ */}
      <div className="border-t border-border">
        <div className="mx-auto max-w-6xl px-6 py-16">
          <div className="text-center mb-12">
            <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground mb-3">Pricing</p>
            <h2 className="text-2xl sm:text-3xl font-serif text-foreground">
              Start free. Scale when you need it.
            </h2>
            <p className="text-sm text-muted-foreground mt-3 max-w-lg mx-auto">
              No credit card required to start. Billed monthly or annually (20% off).
              All prices in SAR.
            </p>
          </div>

          <div className="grid sm:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <PricingCard
              name="Starter"
              price="SAR 499"
              priceSub="per month · 1 analyst seat"
              desc="For solo analysts and small teams getting started with structured deal evaluation."
              features={[
                "Unlimited deal screens",
                "Full dual-approach valuation",
                "Pipeline — up to 15 cases",
                "Saudi DD checklist",
                "IC view & PDF export",
                "7 cities, 40+ districts",
              ]}
              cta="Start free trial"
            />
            <PricingCard
              name="Pro"
              price="SAR 1,999"
              priceSub="per month · up to 5 seats"
              desc="For acquisition teams managing an active deal pipeline with multiple analysts."
              features={[
                "Everything in Starter",
                "5 analyst seats",
                "Unlimited pipeline cases",
                "Market Intelligence module",
                "Market data log & benchmarking",
                "Audit log & decision records",
                "Priority support",
              ]}
              cta="Start Pro trial"
              highlighted
            />
            <PricingCard
              name="Enterprise"
              price="Custom"
              priceSub="tailored to your firm"
              desc="For REITs, funds, and family offices that need live data feeds and custom integration."
              features={[
                "Everything in Pro",
                "Unlimited seats",
                "Live REGA & Ejar data feeds",
                "Opportunity sourcing engine",
                "API access",
                "White-label option",
                "Dedicated account manager",
                "Custom data integration",
              ]}
              cta="Book a demo"
            />
          </div>

          <p className="text-center text-xs text-muted-foreground/60 mt-8">
            All plans include a 14-day free trial. Annual billing saves 20%.
            Enterprise pricing depends on seat count and data requirements.
          </p>
        </div>
      </div>

      {/* ══ ROADMAP ════════════════════════════════════════════════════════════ */}
      <div className="border-t border-border bg-secondary/20">
        <div className="mx-auto max-w-6xl px-6 py-14">
          <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground mb-8">Roadmap</p>
          <div className="grid sm:grid-cols-2 gap-10">
            <div>
              <p className="text-xs text-muted-foreground mb-4 font-medium">Available now</p>
              <RoadmapItem icon={<Zap className="w-3.5 h-3.5" />} title="Deal Screener" desc="Instant IRR, benchmark, risk flags, verdict." status="live" />
              <RoadmapItem icon={<TrendingUp className="w-3.5 h-3.5" />} title="Dual-approach valuation" desc="Sales comp + income approach, TAQEEM flags, SAMA overlay." status="live" />
              <RoadmapItem icon={<FolderOpen className="w-3.5 h-3.5" />} title="Deal pipeline & IC view" desc="Stages, Saudi DD checklist, audit log, printable memo." status="live" />
              <RoadmapItem icon={<BarChart3 className="w-3.5 h-3.5" />} title="Market Intel" desc="Benchmark table + manual market data log." status="live" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-4 font-medium">Coming next</p>
              <RoadmapItem icon={<Database className="w-3.5 h-3.5" />} title="Live REGA & Ejar data feeds" desc="Real pricing and rental benchmarks from official Saudi registries." status="next" />
              <RoadmapItem icon={<Search className="w-3.5 h-3.5" />} title="Opportunity sourcing engine" desc="Scans Aqar, Bayut, Property Finder — flags deals below benchmark." status="next" />
              <RoadmapItem icon={<Globe className="w-3.5 h-3.5" />} title="District price history" desc="Transaction-sourced price trend charts, updated quarterly." status="planned" />
              <RoadmapItem icon={<ShieldCheck className="w-3.5 h-3.5" />} title="Multi-user & roles" desc="Team accounts, analyst vs IC permissions, approval workflows." status="planned" />
              <RoadmapItem icon={<Clock className="w-3.5 h-3.5" />} title="Deal alerts" desc="Get notified when new listings match your acquisition criteria." status="planned" />
            </div>
          </div>
        </div>
      </div>

      {/* ══ BOTTOM CTA ═════════════════════════════════════════════════════════ */}
      <div className="border-t border-border">
        <div className="mx-auto max-w-6xl px-6 py-16 text-center">
          <div className="max-w-xl mx-auto">
            <h2 className="text-2xl sm:text-3xl font-serif text-foreground mb-4">
              Ready to screen your next deal?
            </h2>
            <p className="text-sm text-muted-foreground mb-8 leading-relaxed">
              Start with a free deal screen — no account needed.
              Or book a 20-minute demo to see the full platform with your team.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <Link
                to="/screen"
                className="flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20"
              >
                <Zap className="w-4 h-4" />
                Open Deal Screener
              </Link>
              <a
                href="mailto:hello@aouj.sa"
                className="flex items-center gap-2 px-6 py-3 rounded-xl border border-border text-sm font-medium text-foreground hover:bg-secondary transition-colors"
              >
                Book a demo →
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* ══ FOOTER ═════════════════════════════════════════════════════════════ */}
      <div className="border-t border-border">
        <div className="mx-auto max-w-6xl px-6 py-6 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-sm bg-primary shrink-0" />
            <span className="text-sm font-serif text-foreground">AOUJ</span>
            <span className="text-xs text-muted-foreground">· Institutional Real Estate Intelligence</span>
          </div>
          <p className="text-xs text-muted-foreground/50">
            AOUJ Market Reference Q1 2026 · SAMA Repo 6.0% · TAQEEM methodology · Not a certified valuation
          </p>
        </div>
      </div>

    </div>
  );
}
