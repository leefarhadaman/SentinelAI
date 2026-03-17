import { Category } from "../types";

const config: Record<Category, { label: string; color: string }> = {
  security:    { label: "Security",    color: "#a855f7" },
  bug:         { label: "Bug",         color: "#ef4444" },
  performance: { label: "Performance", color: "#f97316" },
  quality:     { label: "Quality",     color: "#3b82f6" },
};

export default function CategoryBadge({ category }: { category: Category }) {
  const c = config[category] ?? config.quality;
  return (
    <span style={{
      color: c.color, background: `${c.color}15`,
      padding: "2px 8px", borderRadius: 4,
      fontSize: 11, fontWeight: 500,
    }}>
      {c.label}
    </span>
  );
}
