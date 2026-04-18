import { getSource, getBadgeConfig, VerificationStatus } from "@/lib/sources";

// ── ProvenanceBadge ───────────────────────────────────────────────────────────
// Renders a compact inline badge showing the verification status of a data point.
// Pass a sourceId (registry key) or a bare VerificationStatus for quick use.
//
// Usage:
//   <ProvenanceBadge sourceId="aouj-model-q1-2026" />
//   <ProvenanceBadge status="estimated" />
//   <ProvenanceBadge sourceId="aouj-model-q1-2026" showMeta />

interface Props {
  sourceId?: string;
  status?: VerificationStatus;
  showMeta?: boolean;   // show confidence score + source name on hover tooltip
  className?: string;
}

export function ProvenanceBadge({ sourceId, status, showMeta = false, className = "" }: Props) {
  const source = sourceId ? getSource(sourceId) : null;
  const resolvedStatus: VerificationStatus = status ?? source?.verification_status ?? "estimated";
  const cfg = getBadgeConfig(resolvedStatus);

  const tooltipParts: string[] = [];
  if (source) {
    tooltipParts.push(source.source_name);
    if (source.external_reference) tooltipParts.push(source.external_reference);
    if (source.effective_date)     tooltipParts.push(`Effective: ${source.effective_date.slice(0, 10)}`);
    tooltipParts.push(`Confidence: ${source.confidence_score}/100`);
    if (source.access_or_license_notes) tooltipParts.push(source.access_or_license_notes);
  }

  return (
    <span
      title={tooltipParts.join(" · ") || cfg.label}
      className={[
        "inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded border",
        cfg.color, cfg.bg, cfg.border, className,
      ].join(" ")}
    >
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${cfg.dot}`} />
      {cfg.label}
      {showMeta && source && (
        <span className="opacity-70 ml-0.5">{source.confidence_score}/100</span>
      )}
    </span>
  );
}

// ── ProvenanceBlock ───────────────────────────────────────────────────────────
// Expanded version for source detail sections (e.g. Market table footer).

export function ProvenanceBlock({ sourceId }: { sourceId: string }) {
  const source = getSource(sourceId);
  if (!source) return null;
  const cfg = getBadgeConfig(source.verification_status);

  return (
    <div className={`rounded-lg border px-3 py-2.5 text-xs ${cfg.bg} ${cfg.border}`}>
      <div className="flex items-center gap-2 mb-1">
        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${cfg.dot}`} />
        <span className={`font-medium ${cfg.color}`}>{source.source_name}</span>
        <ProvenanceBadge status={source.verification_status} />
        <span className="text-muted-foreground ml-auto">
          Confidence {source.confidence_score}/100
        </span>
      </div>
      {source.external_reference && (
        <p className="text-muted-foreground">{source.external_reference}</p>
      )}
      {source.access_or_license_notes && (
        <p className="text-muted-foreground/70 mt-1 leading-relaxed">
          {source.access_or_license_notes}
        </p>
      )}
      {source.source_url && (
        <a
          href={source.source_url}
          target="_blank"
          rel="noreferrer"
          className={`mt-1 inline-block underline underline-offset-2 ${cfg.color} hover:opacity-80`}
        >
          {source.source_url}
        </a>
      )}
    </div>
  );
}
