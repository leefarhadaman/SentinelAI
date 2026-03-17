"use client";
import { ScanResult } from "../types";
import ScoreRing from "./ScoreRing";
import FileResultCard from "./FileResultCard";
import { ShieldAlert, Bug, Zap, CheckCircle, FileSearch } from "lucide-react";

export default function ScanReport({ result }: { result: ScanResult }) {
  const { scores, summary, fileResults, repoName, fileName, totalFiles, analyzedFiles } = result;

  const summaryItems = [
    { label: "Critical", value: summary.critical, color: "#ef4444", icon: <ShieldAlert size={15} /> },
    { label: "High",     value: summary.high,     color: "#f97316", icon: <Bug size={15} /> },
    { label: "Medium",   value: summary.medium,   color: "#eab308", icon: <Zap size={15} /> },
    { label: "Low",      value: summary.low,      color: "#22c55e", icon: <CheckCircle size={15} /> },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

      {/* Header */}
      <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12, padding: "18px 22px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
          <FileSearch size={18} color="var(--accent)" />
          <h2 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: "var(--text)" }}>
            {repoName || fileName || "Scan Report"}
          </h2>
        </div>
        <p style={{ margin: 0, color: "var(--text-muted)", fontSize: 13 }}>
          {analyzedFiles} of {totalFiles} files analyzed &middot; {summary.totalIssues} total issues found
        </p>
      </div>

      {/* Scores */}
      <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12, padding: "22px 24px" }}>
        <p style={{ margin: "0 0 18px", fontSize: 11, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
          Code Quality Scores
        </p>
        <div style={{ display: "flex", justifyContent: "space-around", flexWrap: "wrap", gap: 16 }}>
          <ScoreRing score={scores.security}        label="Security"        size={88} />
          <ScoreRing score={scores.maintainability} label="Maintainability" size={88} />
          <ScoreRing score={scores.performance}     label="Performance"     size={88} />
          <ScoreRing score={scores.overall}         label="Overall"         size={108} highlight />
        </div>
      </div>

      {/* Issue summary */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10 }}>
        {summaryItems.map(item => (
          <div key={item.label} style={{
            background: "var(--surface)", border: `1px solid ${item.color}28`,
            borderRadius: 10, padding: "14px 16px", textAlign: "center",
          }}>
            <div style={{ display: "flex", justifyContent: "center", color: item.color, marginBottom: 8 }}>
              {item.icon}
            </div>
            <div style={{ fontSize: 26, fontWeight: 700, color: item.color, lineHeight: 1 }}>{item.value}</div>
            <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 4 }}>{item.label}</div>
          </div>
        ))}
      </div>

      {/* File results */}
      <div>
        <p style={{ margin: "0 0 10px", fontSize: 11, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
          File Analysis ({fileResults.length})
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {fileResults.map((file, i) => <FileResultCard key={i} file={file} />)}
        </div>
      </div>
    </div>
  );
}
