import { Link, useLocation } from "react-router-dom";
import { TrendingUp, FolderOpen } from "lucide-react";

export default function Nav() {
  const { pathname } = useLocation();

  const link = (to: string, label: string, icon: React.ReactNode) => {
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
        {label}
      </Link>
    );
  };

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/90 backdrop-blur-sm">
      <div className="mx-auto max-w-5xl px-6 h-14 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <span className="text-lg font-serif text-foreground tracking-tight">AOUJ</span>
          <span className="text-xs text-muted-foreground hidden sm:inline">
            · Property Valuation
          </span>
        </Link>

        <nav className="flex items-center gap-1">
          {link("/", "Valuation", <TrendingUp className="w-3.5 h-3.5" />)}
          {link("/cases", "Cases", <FolderOpen className="w-3.5 h-3.5" />)}
        </nav>
      </div>
    </header>
  );
}
