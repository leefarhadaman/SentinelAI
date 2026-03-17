"use client";

interface Props {
  score: number;
  label: string;
  size?: number;
  highlight?: boolean;
}

function scoreColor(score: number): string {
  if (score >= 8) return "#22c55e";
  if (score >= 6) return "#eab308";
  if (score >= 4) return "#f97316";
  return "#ef4444";
}

export default function ScoreRing({ score, label, size = 88, highlight = false }: Props) {
  const radius = (size - 12) / 2;
  const circumference = 2 * Math.PI * radius;
  const pct = Math.min(Math.max(score / 10, 0), 1);
  const offset = circumference * (1 - pct);
  const color = scoreColor(score);
  const strokeWidth = highlight ? 7 : 6;

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
      <div style={{ position: "relative", width: size, height: size }}>
        <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
          {/* Track */}
          <circle
            cx={size / 2} cy={size / 2} r={radius}
            fill="none" stroke="var(--surface2)"
            strokeWidth={strokeWidth}
          />
          {/* Progress */}
          <circle
            cx={size / 2} cy={size / 2} r={radius}
            fill="none" stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            style={{ transition: "stroke-dashoffset 0.8s ease" }}
          />
        </svg>
        {/* Center text */}
        <div style={{
          position: "absolute", inset: 0,
          display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center",
        }}>
          <span style={{
            fontSize: highlight ? 20 : 17,
            fontWeight: 700,
            color,
            lineHeight: 1,
          }}>
            {score.toFixed(1)}
          </span>
        </div>
      </div>
      <span style={{
        fontSize: highlight ? 13 : 12,
        color: highlight ? "var(--text)" : "var(--text-muted)",
        fontWeight: highlight ? 600 : 400,
      }}>
        {label}
      </span>
    </div>
  );
}
