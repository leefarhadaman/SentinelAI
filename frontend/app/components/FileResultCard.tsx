"use client";
import { useState } from "react";
import { FileCode, ChevronDown, ChevronUp, SkipForward } from "lucide-react";
import { FileResult } from "../types";
import IssueCard from "./IssueCard";

const langColor: Record<string, string> = {
  javascript: "#f7df1e", typescript: "#3178c6", python: "#3572a5",
  java: "#b07219", go: "#00add8", rust: "#dea584", php: "#4f5d95",
};

export default function FileResultCard({ file }: { file: FileResult }) {
  const [open, setOpen] = useState(false);

  const criticalCount = file.issues?.filter(i => i.severity === "critical").length ?? 0;
  const highCount = file.issues?.filter(i => i.severity === "high").length ?? 0;
  const totalIssues = file.issues?.length ?? 0;
  const dotColor = langColor[file.language] ?? "#8892a4";

  // Severity bar: pick worst
  const barColor = criticalCount > 0 ? "#ef4444" : highCount > 0 ? "#f97316" : totalIssues > 0 ? "#eab308" : "#22c55e";

  return (
    <div style={{
      background: "var(--surface)", border: "1px solid var(--border)",
      borderRadius: 10, overflow: "hidden",
      borderLeft: `3px solid ${barColor}`,
    }}>
      <button
        onClick={() => !file.skipped && setOpen(!open)}
        style={{
          width: "100%", padding: "13px 16px",
          display: "flex", alignItems: "center", gap: 10,
          background: "none", border: "none",
          cursor: file.skipped ? "default" : "pointer", textAlign: "left",
        }}
      >
        <FileCode size={16} color={dotColor} style={{ flexShrink: 0 }} />

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <span style={{ color: "var(--text)", fontSize: 13, fontWeight: 600 }}>{file.fileName}</span>
            <span style={{
              fontSize: 10, color: dotColor, background: `${dotColor}18`,
              padding: "1px 6px", borderRadius: 4, fontWeight: 500,
            }}>
              {file.language}
            </span>
          </div>
          <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 3, fontFamily: "var(--font-geist-mono)" }}>
            {file.filePath}
          </div>
        </div>

        <div style={{ flexShrink: 0, display: "flex", alignItems: "center", gap: 8 }}>
          {file.skipped ? (
            <>
              <span style={{ fontSize: 11, color: "var(--text-muted)" }}>skipped</span>
              <SkipForward size={14} color="var(--text-muted)" />
            </>
          ) : (
            <>
              <span style={{
                fontSize: 12,
                color: totalIssues === 0 ? "#22c55e" : criticalCount > 0 ? "#ef4444" : highCount > 0 ? "#f97316" : "var(--text-muted)",
                fontWeight: 500,
              }}>
                {totalIssues === 0 ? "clean" : `${totalIssues} issue${totalIssues !== 1 ? "s" : ""}`}
              </span>
              {open ? <ChevronUp size={14} color="var(--text-muted)" /> : <ChevronDown size={14} color="var(--text-muted)" />}
            </>
          )}
        </div>
      </button>

      {open && !file.skipped && (
        <div style={{ padding: "0 16px 14px", display: "flex", flexDirection: "column", gap: 6 }}>
          {totalIssues === 0 ? (
            <p style={{ color: "#22c55e", fontSize: 13, margin: 0 }}>No issues found in this file.</p>
          ) : (
            file.issues.map((issue, i) => <IssueCard key={i} issue={issue} />)
          )}
        </div>
      )}
    </div>
  );
}
