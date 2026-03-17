import { Severity } from "../types";

const config: Record<Severity, { label: string; color: string; bg: string }> = {
  critical: { label: "Critical", color: "#ef4444", bg: "#ef444420" },
  high:     { label: "High",     color: "#f97316", bg: "#f9731620" },
  medium:   { label: "Medium",   color: "#eab308", bg: "#eab30820" },
  low:      { label: "Low",      color: "#22c55e", bg: "#22c55e20" },
  info:     { label: "Info",     color: "#3b82f6", bg: "#3b82f620" },
};

export default function SeverityBadge({ severity }: { severity: Severity }) {
  const c = config[severity] ?? config.info;
  return (
    <span style={{
      background: c.bg, color: c.color,
      padding: "2px 10px", borderRadius: 999,
      fontSize: 11, fontWeight: 600, letterSpacing: "0.05em",
      border: `1px solid ${c.color}40`,
    }}>
      {c.label}
    </span>
  );
}
