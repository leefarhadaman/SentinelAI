"use client";
import { useState } from "react";
import { ChevronDown, ChevronUp, Wrench } from "lucide-react";
import { Issue } from "../types";
import SeverityBadge from "./SeverityBadge";
import CategoryBadge from "./CategoryBadge";

export default function IssueCard({ issue }: { issue: Issue }) {
  const [open, setOpen] = useState(false);

  return (
    <div style={{
      background: "var(--surface2)", border: "1px solid var(--border)",
      borderRadius: 8, overflow: "hidden",
    }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          width: "100%", padding: "10px 14px",
          display: "flex", alignItems: "center", gap: 8,
          background: "none", border: "none", cursor: "pointer", textAlign: "left",
        }}
      >
        <SeverityBadge severity={issue.severity} />
        <CategoryBadge category={issue.category} />
        <span style={{ color: "var(--text)", fontSize: 13, fontWeight: 500, flex: 1 }}>
          {issue.issueType}
        </span>
        {open ? <ChevronUp size={14} color="var(--text-muted)" /> : <ChevronDown size={14} color="var(--text-muted)" />}
      </button>

      {open && (
        <div style={{ padding: "0 14px 14px", display: "flex", flexDirection: "column", gap: 10 }}>
          <p style={{ color: "var(--text-dim)", fontSize: 13, lineHeight: 1.65, margin: 0 }}>
            {issue.explanation}
          </p>
          {issue.suggestedFix && (
            <div style={{
              background: "#22c55e0d", border: "1px solid #22c55e28",
              borderRadius: 6, padding: "10px 12px",
              display: "flex", gap: 8, alignItems: "flex-start",
            }}>
              <Wrench size={13} color="#22c55e" style={{ marginTop: 2, flexShrink: 0 }} />
              <p style={{ color: "#4ade80", fontSize: 13, margin: 0, lineHeight: 1.65 }}>
                {issue.suggestedFix}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
