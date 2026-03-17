"use client";
import { useEffect, useRef } from "react";
import { GitBranch, FileCode, CheckCircle } from "lucide-react";
import { ProgressEvent } from "../types";

interface Props {
  events: ProgressEvent[];
  repoUrl?: string;
}

const langColor: Record<string, string> = {
  javascript: "#f7df1e", typescript: "#3178c6", python: "#3572a5",
  java: "#b07219", go: "#00add8", rust: "#dea584", php: "#4f5d95",
  ruby: "#701516", swift: "#f05138", kotlin: "#a97bff",
  css: "#563d7c", html: "#e34c26", bash: "#89e051", sql: "#e38c00",
};

export default function ScanProgress({ events, repoUrl }: Props) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [events]);

  // Deduplicate: keep only the latest event per fileName
  const fileMap = new Map<string, ProgressEvent>();
  for (const e of events) {
    if (e.type === "file" || e.type === "file_done") {
      const key = e.fileName ?? e.filePath ?? String(Math.random());
      // file_done should override file
      const existing = fileMap.get(key);
      if (!existing || e.type === "file_done") {
        fileMap.set(key, e);
      }
    }
  }
  const fileList = Array.from(fileMap.values());

  const latestFile = [...events].reverse().find(e => e.type === "file");
  const total = latestFile?.total ?? 0;
  const current = latestFile?.current ?? 0;
  const progress = total > 0 ? Math.round((current / total) * 100) : 0;

  const cloned = events.some(e => e.type === "status" && e.step === "cloning");
  const scanning = events.some(e => e.type === "status" && e.step === "scanning");

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

      {/* Status header */}
      <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12, padding: "18px 22px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: total > 0 ? 16 : 0 }}>
          <div style={{
            width: 34, height: 34, borderRadius: 8,
            background: "var(--accent)18", border: "1px solid var(--accent)30",
            display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
          }}>
            <GitBranch size={16} color="var(--accent)" />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontWeight: 600, fontSize: 14, color: "var(--text)" }}>
                {scanning ? "Analyzing files..." : cloned ? "Repository cloned" : "Connecting to repository..."}
              </span>
              {!scanning && (
                <span style={{
                  width: 7, height: 7, borderRadius: "50%",
                  background: "var(--accent)",
                  display: "inline-block",
                  animation: "pulse-dot 1.2s ease-in-out infinite",
                }} />
              )}
            </div>
            <div style={{
              fontSize: 12, color: "var(--text-muted)", marginTop: 2,
              overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
            }}>
              {repoUrl}
            </div>
          </div>
          {total > 0 && (
            <span style={{ fontSize: 13, fontWeight: 700, color: "var(--accent)", flexShrink: 0 }}>
              {progress}%
            </span>
          )}
        </div>

        {total > 0 && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
              <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
                {current} of {total} files analyzed
              </span>
            </div>
            <div style={{ height: 5, background: "var(--surface2)", borderRadius: 999, overflow: "hidden" }}>
              <div style={{
                height: "100%", borderRadius: 999,
                background: "linear-gradient(90deg, var(--accent), #818cf8)",
                width: `${progress}%`,
                transition: "width 0.5s ease",
              }} />
            </div>
          </div>
        )}
      </div>

      {/* File log */}
      <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12, overflow: "hidden" }}>
        <div style={{
          padding: "12px 18px", borderBottom: "1px solid var(--border)",
          display: "flex", alignItems: "center", gap: 8,
        }}>
          <FileCode size={14} color="var(--text-muted)" />
          <span style={{ fontSize: 11, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.07em" }}>
            File Analysis Log
          </span>
          {fileList.length > 0 && (
            <span style={{ marginLeft: "auto", fontSize: 11, color: "var(--text-muted)" }}>
              {fileList.filter(e => e.type === "file_done").length}/{fileList.length}
            </span>
          )}
        </div>

        <div style={{ maxHeight: 360, overflowY: "auto", padding: "6px 0" }}>
          {fileList.length === 0 ? (
            <div style={{ padding: "24px", textAlign: "center" }}>
              <div style={{ display: "flex", justifyContent: "center", gap: 5, marginBottom: 8 }}>
                {[0, 1, 2].map(i => (
                  <div key={i} style={{
                    width: 6, height: 6, borderRadius: "50%", background: "var(--accent)",
                    animation: `pulse-dot 1.2s ease-in-out ${i * 0.2}s infinite`,
                  }} />
                ))}
              </div>
              <span style={{ color: "var(--text-muted)", fontSize: 13 }}>Cloning repository...</span>
            </div>
          ) : (
            fileList.map((e, i) => {
              const isDone = e.type === "file_done";
              const dotColor = langColor[e.language ?? ""] ?? "#8892a4";

              return (
                <div key={i} className={i === fileList.length - 1 && !isDone ? "" : ""}
                  style={{
                    display: "flex", alignItems: "center", gap: 10,
                    padding: "8px 18px",
                    background: !isDone ? "var(--accent)08" : "transparent",
                    borderLeft: !isDone ? "2px solid var(--accent)" : "2px solid transparent",
                    animation: "slide-in 0.2s ease forwards",
                    transition: "background 0.3s",
                  }}>

                  {/* Status */}
                  <div style={{ width: 16, flexShrink: 0, display: "flex", justifyContent: "center" }}>
                    {isDone ? (
                      <CheckCircle size={14} color="#22c55e" />
                    ) : (
                      <div style={{
                        width: 14, height: 14, borderRadius: "50%",
                        border: "2px solid var(--accent)",
                        borderTopColor: "transparent",
                        animation: "spin 0.8s linear infinite",
                      }} />
                    )}
                  </div>

                  {/* Lang dot */}
                  <div style={{ width: 7, height: 7, borderRadius: "50%", background: dotColor, flexShrink: 0 }} />

                  {/* File path */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <span style={{
                      fontSize: 12, fontFamily: "var(--font-geist-mono)",
                      color: isDone ? "var(--text-muted)" : "var(--text)",
                      fontWeight: isDone ? 400 : 500,
                      overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                      display: "block",
                    }}>
                      {e.filePath ?? e.fileName}
                    </span>
                  </div>

                  {/* Right badges */}
                  <div style={{ flexShrink: 0, display: "flex", alignItems: "center", gap: 6 }}>
                    {e.language && (
                      <span style={{
                        fontSize: 10, color: dotColor, background: `${dotColor}18`,
                        padding: "1px 6px", borderRadius: 4, fontWeight: 500,
                      }}>
                        {e.language}
                      </span>
                    )}
                    {isDone ? (
                      <span style={{
                        fontSize: 11,
                        color: (e.issueCount ?? 0) > 0 ? "#f97316" : "#22c55e",
                      }}>
                        {(e.issueCount ?? 0) === 0 ? "clean" : `${e.issueCount} issue${e.issueCount !== 1 ? "s" : ""}`}
                      </span>
                    ) : (
                      <span style={{ fontSize: 11, color: "var(--accent)" }}>analyzing</span>
                    )}
                  </div>
                </div>
              );
            })
          )}
          <div ref={bottomRef} />
        </div>
      </div>
    </div>
  );
}
