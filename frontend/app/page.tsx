"use client";
import { useState, useRef } from "react";
import { Github, Upload, Shield, AlertCircle, X, Lock, Bug, Zap, BarChart2 } from "lucide-react";
import { ScanResult, ProgressEvent } from "./types";
import ScanReport from "./components/ScanReport";
import ScanProgress from "./components/ScanProgress";

const API = "http://localhost:5001";

type AppState = "idle" | "scanning" | "done" | "error";

export default function Home() {
  const [tab, setTab] = useState<"github" | "upload">("github");
  const [repoUrl, setRepoUrl] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [appState, setAppState] = useState<AppState>("idle");
  const [error, setError] = useState("");
  const [result, setResult] = useState<ScanResult | null>(null);
  const [events, setEvents] = useState<ProgressEvent[]>([]);
  const abortRef = useRef<AbortController | null>(null);

  const reset = () => {
    abortRef.current?.abort();
    setResult(null);
    setError("");
    setRepoUrl("");
    setFile(null);
    setEvents([]);
    setAppState("idle");
  };

  const runGithubScan = async () => {
    if (!repoUrl.trim()) return setError("Please enter a GitHub repository URL.");
    setAppState("scanning");
    setError("");
    setResult(null);
    setEvents([]);

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const res = await fetch(`${API}/api/github/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ repoUrl }),
        signal: controller.signal,
      });

      if (!res.body) throw new Error("No response stream.");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const parts = buffer.split("\n\n");
        buffer = parts.pop() ?? "";

        for (const part of parts) {
          const lines = part.trim().split("\n");
          let eventType = "message";
          let dataStr = "";

          for (const line of lines) {
            if (line.startsWith("event: ")) eventType = line.slice(7).trim();
            else if (line.startsWith("data: ")) dataStr = line.slice(6).trim();
          }

          if (!dataStr) continue;

          try {
            const parsed: ProgressEvent = { ...JSON.parse(dataStr), type: eventType as ProgressEvent["type"] };

            if (eventType === "complete") {
              setResult(parsed as unknown as ScanResult);
              setAppState("done");
            } else if (eventType === "error") {
              setError(parsed.message ?? "An error occurred.");
              setAppState("error");
            } else {
              setEvents(prev => [...prev, parsed]);
            }
          } catch {
            // skip malformed chunk
          }
        }
      }
    } catch (e: unknown) {
      if ((e as Error).name === "AbortError") return;
      setError(e instanceof Error ? e.message : "Something went wrong.");
      setAppState("error");
    }
  };

  const runUploadScan = async () => {
    if (!file) return setError("Please select a .zip file.");
    setAppState("scanning");
    setError("");
    setResult(null);
    setEvents([]);

    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch(`${API}/api/upload/analyze`, { method: "POST", body: form });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      setResult(data);
      setAppState("done");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
      setAppState("error");
    }
  };

  const features = [
    { icon: <Lock size={18} />, title: "Security Analysis", desc: "Detects hardcoded secrets, injection risks, and unsafe auth patterns" },
    { icon: <Bug size={18} />, title: "Bug Detection", desc: "Finds logic errors, null dereferences, and edge case failures" },
    { icon: <Zap size={18} />, title: "Performance", desc: "Identifies bottlenecks, blocking calls, and optimization opportunities" },
    { icon: <BarChart2 size={18} />, title: "Quality Score", desc: "Security, maintainability, and performance scores out of 10" },
  ];

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)" }}>

      {/* Navbar */}
      <nav style={{
        borderBottom: "1px solid var(--border)",
        padding: "0 24px", height: 56,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        background: "var(--surface)",
        position: "sticky", top: 0, zIndex: 50,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Shield size={20} color="var(--accent)" />
          <span style={{ fontWeight: 700, fontSize: 17, color: "var(--text)" }}>SentinelAI</span>
          <span style={{ fontSize: 10, color: "var(--text-muted)", background: "var(--surface2)", padding: "2px 7px", borderRadius: 4, marginLeft: 2, letterSpacing: "0.05em" }}>BETA</span>
        </div>
        <span style={{ fontSize: 12, color: "var(--text-muted)" }}>AI-Powered Code Review</span>
      </nav>

      <div style={{ maxWidth: 860, margin: "0 auto", padding: "40px 24px" }}>

        {/* ── IDLE: input form ── */}
        {(appState === "idle" || appState === "error") && (
          <div className="animate-fade-in">
            {/* Hero */}
            <div style={{ textAlign: "center", marginBottom: 40 }}>
              <div style={{
                display: "inline-flex", alignItems: "center", justifyContent: "center",
                width: 60, height: 60, background: "var(--accent)18", borderRadius: 14,
                marginBottom: 18, border: "1px solid var(--accent)30",
              }}>
                <Shield size={28} color="var(--accent)" />
              </div>
              <h1 style={{ margin: "0 0 12px", fontSize: 34, fontWeight: 800, color: "var(--text)", lineHeight: 1.2 }}>
                AI Code Security Scanner
              </h1>
              <p style={{ margin: 0, color: "var(--text-muted)", fontSize: 15, maxWidth: 480, marginInline: "auto", lineHeight: 1.6 }}>
                Detect bugs, security vulnerabilities, and code quality issues using local AI — no data leaves your machine.
              </p>
            </div>

            {/* Input card */}
            <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 14, overflow: "hidden", marginBottom: 28 }}>
              {/* Tabs */}
              <div style={{ display: "flex", borderBottom: "1px solid var(--border)" }}>
                {(["github", "upload"] as const).map(t => (
                  <button key={t} onClick={() => { setTab(t); setError(""); }}
                    style={{
                      flex: 1, padding: "13px", display: "flex", alignItems: "center",
                      justifyContent: "center", gap: 8,
                      background: tab === t ? "var(--surface2)" : "none",
                      border: "none",
                      borderBottom: tab === t ? "2px solid var(--accent)" : "2px solid transparent",
                      color: tab === t ? "var(--text)" : "var(--text-muted)",
                      cursor: "pointer", fontSize: 13, fontWeight: 600, transition: "all 0.15s",
                    }}>
                    {t === "github" ? <Github size={15} /> : <Upload size={15} />}
                    {t === "github" ? "GitHub URL" : "Upload ZIP"}
                  </button>
                ))}
              </div>

              <div style={{ padding: 24 }}>
                {tab === "github" ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", letterSpacing: "0.05em", textTransform: "uppercase" }}>
                      Public GitHub Repository URL
                    </label>
                    <div style={{ display: "flex", gap: 10 }}>
                      <div style={{
                        flex: 1, display: "flex", alignItems: "center",
                        background: "var(--surface2)", border: "1px solid var(--border)",
                        borderRadius: 8, padding: "0 14px", gap: 10,
                      }}>
                        <Github size={15} color="var(--text-muted)" />
                        <input
                          value={repoUrl}
                          onChange={e => setRepoUrl(e.target.value)}
                          onKeyDown={e => e.key === "Enter" && runGithubScan()}
                          placeholder="https://github.com/username/repository"
                          style={{
                            flex: 1, background: "none", border: "none", outline: "none",
                            color: "var(--text)", fontSize: 14, padding: "12px 0",
                          }}
                        />
                      </div>
                      <button onClick={runGithubScan}
                        style={{
                          padding: "0 22px", background: "var(--accent)", color: "white",
                          border: "none", borderRadius: 8, cursor: "pointer",
                          fontSize: 13, fontWeight: 600, whiteSpace: "nowrap",
                          transition: "opacity 0.15s",
                        }}>
                        Scan Repo
                      </button>
                    </div>
                    <p style={{ margin: 0, fontSize: 12, color: "var(--text-muted)" }}>
                      Only public repositories are supported. Up to 15 files will be analyzed.
                    </p>
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", letterSpacing: "0.05em", textTransform: "uppercase" }}>
                      Upload Project Archive (.zip)
                    </label>
                    <label
                      style={{
                        display: "flex", flexDirection: "column", alignItems: "center",
                        justifyContent: "center", gap: 8, padding: "28px",
                        background: "var(--surface2)", border: "2px dashed var(--border)",
                        borderRadius: 10, cursor: "pointer",
                      }}
                      onDragOver={e => e.preventDefault()}
                      onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f?.name.endsWith(".zip")) setFile(f); }}
                    >
                      <Upload size={24} color="var(--text-muted)" />
                      <span style={{ color: file ? "var(--accent)" : "var(--text-muted)", fontSize: 14 }}>
                        {file ? file.name : "Drop your .zip file here or click to browse"}
                      </span>
                      <input type="file" accept=".zip" style={{ display: "none" }} onChange={e => setFile(e.target.files?.[0] ?? null)} />
                    </label>
                    <button onClick={runUploadScan} disabled={!file}
                      style={{
                        padding: "12px", background: !file ? "var(--surface2)" : "var(--accent)",
                        color: !file ? "var(--text-muted)" : "white",
                        border: "none", borderRadius: 8, cursor: !file ? "not-allowed" : "pointer",
                        fontSize: 13, fontWeight: 600,
                      }}>
                      Analyze Upload
                    </button>
                  </div>
                )}

                {error && (
                  <div style={{
                    marginTop: 14, background: "#ef444412", border: "1px solid #ef444435",
                    borderRadius: 8, padding: "11px 14px", display: "flex", alignItems: "center", gap: 10,
                  }}>
                    <AlertCircle size={15} color="#ef4444" />
                    <span style={{ color: "#ef4444", fontSize: 13, flex: 1 }}>{error}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Feature cards */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))", gap: 12 }}>
              {features.map(f => (
                <div key={f.title} style={{
                  background: "var(--surface)", border: "1px solid var(--border)",
                  borderRadius: 10, padding: "16px",
                }}>
                  <div style={{ color: "var(--accent)", marginBottom: 10 }}>{f.icon}</div>
                  <div style={{ fontWeight: 600, fontSize: 13, color: "var(--text)", marginBottom: 4 }}>{f.title}</div>
                  <div style={{ fontSize: 12, color: "var(--text-muted)", lineHeight: 1.55 }}>{f.desc}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── SCANNING: live progress ── */}
        {appState === "scanning" && (
          <div className="animate-fade-in">
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
              <div>
                <h2 style={{ margin: "0 0 4px", fontSize: 20, fontWeight: 700, color: "var(--text)" }}>Scanning Repository</h2>
                <p style={{ margin: 0, fontSize: 13, color: "var(--text-muted)" }}>AI is analyzing your code — this may take 1–3 minutes</p>
              </div>
              <button onClick={reset}
                style={{
                  display: "flex", alignItems: "center", gap: 6, padding: "7px 14px",
                  background: "var(--surface)", border: "1px solid var(--border)",
                  borderRadius: 8, color: "var(--text-muted)", cursor: "pointer", fontSize: 12,
                }}>
                <X size={13} /> Cancel
              </button>
            </div>
            <ScanProgress events={events} repoUrl={repoUrl} />
          </div>
        )}

        {/* ── DONE: results ── */}
        {appState === "done" && result && (
          <div className="animate-fade-in">
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
              <div>
                <h2 style={{ margin: "0 0 4px", fontSize: 20, fontWeight: 700, color: "var(--text)" }}>Scan Complete</h2>
                <p style={{ margin: 0, fontSize: 13, color: "var(--text-muted)" }}>{result.repoName ?? result.fileName}</p>
              </div>
              <button onClick={reset}
                style={{
                  display: "flex", alignItems: "center", gap: 6, padding: "7px 14px",
                  background: "var(--surface)", border: "1px solid var(--border)",
                  borderRadius: 8, color: "var(--text-muted)", cursor: "pointer", fontSize: 12,
                }}>
                <X size={13} /> New Scan
              </button>
            </div>
            <ScanReport result={result} />
          </div>
        )}

      </div>
    </div>
  );
}
