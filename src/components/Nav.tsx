import { Link, useLocation } from "react-router-dom";
import { Zap, TrendingUp, FolderOpen, Languages, BarChart3, Search, GitCompare } from "lucide-react";
import { useLang } from "@/lib/lang";

export default function Nav() {
  const { pathname } = useLocation();
  const { t, lang, setLang, isAr } = useLang();

  const isActive = (to: string) =>
    to === "/" ? pathname === "/" :
    to === "/cases" ? pathname.startsWith("/cases") :
    pathname === to;

  const link = (to: string, label: string, icon: React.ReactNode) => (
    <Link
      to={to}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm transition-colors
        ${isActive(to)
          ? "bg-primary/15 text-primary font-medium"
          : "text-muted-foreground hover:text-foreground hover:bg-secondary"
        }`}
    >
      {icon}
      <span className="hidden sm:inline">{label}</span>
    </Link>
  );

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/98 backdrop-blur-sm">
      {/* Gold authority stripe */}
      <div className="h-0.5 bg-gradient-to-r from-transparent via-primary/80 to-transparent" />
      <div className="mx-auto max-w-6xl px-6 h-13 flex items-center justify-between">

        {/* Brand */}
        <Link to="/" className="flex items-center gap-3 shrink-0">
          <span className="w-1.5 h-5 bg-primary shrink-0" style={{ borderRadius: '1px' }} />
          <span className="text-sm font-serif text-foreground tracking-widest uppercase">{t("nav.brand")}</span>
          <span className="text-xs text-muted-foreground/50 hidden md:inline pl-2 border-l border-border">
            {t("nav.subtitle")}
          </span>
        </Link>

        {/* Nav links */}
        <nav className="flex items-center gap-0.5">
          {link("/screen",         t("nav.screen"),    <Zap        className="w-3.5 h-3.5 shrink-0" />)}
          {link("/opportunities",  t("nav.source"),    <Search     className="w-3.5 h-3.5 shrink-0" />)}
          {link("/valuation",      t("nav.valuation"), <TrendingUp className="w-3.5 h-3.5 shrink-0" />)}
          {link("/cases",          t("nav.cases"),     <FolderOpen className="w-3.5 h-3.5 shrink-0" />)}
          {link("/comps",          "Comps",            <GitCompare className="w-3.5 h-3.5 shrink-0" />)}
          {link("/market",         t("nav.market"),    <BarChart3  className="w-3.5 h-3.5 shrink-0" />)}

          {/* Divider */}
          <div className="w-px h-4 bg-border mx-2" />

          {/* Language toggle */}
          <button
            onClick={() => setLang(lang === "en" ? "ar" : "en")}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
            title={isAr ? "Switch to English" : "التبديل إلى العربية"}
          >
            <Languages className="w-3.5 h-3.5" />
            <span className={isAr ? "" : "font-arabic"}>{t("nav.langToggle")}</span>
          </button>
        </nav>
      </div>
    </header>
  );
}
