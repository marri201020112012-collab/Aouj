import { Link, useLocation } from "react-router-dom";
import { TrendingUp, FolderOpen, Languages } from "lucide-react";
import { useLang } from "@/lib/lang";

export default function Nav() {
  const { pathname } = useLocation();
  const { t, lang, setLang, isAr } = useLang();

  const link = (to: string, labelKey: string, icon: React.ReactNode) => {
    const active = pathname === to || (to === "/cases" && pathname.startsWith("/cases"));
    return (
      <Link
        to={to}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm transition-colors
          ${active
            ? "bg-primary/15 text-primary font-medium"
            : "text-muted-foreground hover:text-foreground hover:bg-secondary"
          }`}
      >
        {icon}
        {t(labelKey)}
      </Link>
    );
  };

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/90 backdrop-blur-sm">
      <div className="mx-auto max-w-5xl px-6 h-14 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <span className="text-lg font-serif text-foreground tracking-tight">{t("nav.brand")}</span>
          <span className="text-xs text-muted-foreground hidden sm:inline">
            · {t("nav.subtitle")}
          </span>
        </Link>

        <nav className="flex items-center gap-1">
          {link("/", "nav.valuation", <TrendingUp className="w-3.5 h-3.5" />)}
          {link("/cases", "nav.cases", <FolderOpen className="w-3.5 h-3.5" />)}

          {/* Language toggle */}
          <button
            onClick={() => setLang(lang === "en" ? "ar" : "en")}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors ml-1"
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
