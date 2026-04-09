type Variant = "high" | "medium" | "low" | "default";

interface BadgeProps {
  variant?: Variant;
  children: React.ReactNode;
  className?: string;
}

const variantClasses: Record<Variant, string> = {
  high: "bg-emerald-900/40 text-emerald-400 border-emerald-700/50",
  medium: "bg-amber-900/40 text-amber-400 border-amber-700/50",
  low: "bg-red-900/40 text-red-400 border-red-700/50",
  default: "bg-secondary text-secondary-foreground border-border",
};

export function Badge({ variant = "default", children, className = "" }: BadgeProps) {
  return (
    <span
      className={[
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border",
        variantClasses[variant],
        className,
      ].join(" ")}
    >
      {children}
    </span>
  );
}
