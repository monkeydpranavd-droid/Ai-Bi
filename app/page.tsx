"use client";

import { useState, useEffect, useRef } from "react";
import Papa from "papaparse";
import { DATA } from "../data/dataset";
import {
  BarChart, Bar, LineChart, Line, AreaChart, Area, ScatterChart, Scatter,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
  ReferenceLine,
} from "recharts";

/* ─── Query chips for Demo mode ─────────────────────────────────────────── */
const QUERIES = [
  { label: "Settlement ratio 2021-22", key: "settlement", icon: "◈" },
  { label: "Industry trend 5Y", key: "trend", icon: "∿" },
  { label: "Repudiation leaders", key: "repud", icon: "⊗" },
  { label: "Volume vs performance", key: "scatter", icon: "⊕" },
];

/* ─── Suggested CSV queries ─────────────────────────────────────────────── */
const CSV_SUGGESTIONS = [
  { label: "Top 5 insurers", query: "top 5" },
  { label: "Ratio above 98", query: "ratio above 98" },
  { label: "Repud above 2", query: "repud above 2" },
  { label: "Repud below 1", query: "repud below 1" },
  { label: "Lowest settlement", query: "lowest settlement" },
  { label: "Only LIC", query: "only LIC" },
];

/* ─── Custom tooltip ────────────────────────────────────────────────────── */
const CustomTip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: "rgba(10,12,16,0.97)", border: "1px solid rgba(255,255,255,0.07)",
      borderRadius: 10, padding: "10px 14px", fontSize: 12, color: "#e2e8f0",
      boxShadow: "0 20px 40px rgba(0,0,0,0.5)", backdropFilter: "blur(12px)",
    }}>
      <div style={{ color: "#94a3b8", marginBottom: 6, fontFamily: "monospace", letterSpacing: "0.05em" }}>{label}</div>
      {payload.map((p: any, i: number) => (
        <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}>
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: p.color, display: "inline-block" }} />
          <span style={{ color: "#64748b" }}>{p.name}:</span>
          <span style={{ color: "#f1f5f9", fontWeight: 600 }}>
            {typeof p.value === "number" ? p.value.toLocaleString() : p.value}
          </span>
        </div>
      ))}
    </div>
  );
};

/* ─── KPI Card ──────────────────────────────────────────────────────────── */
const KpiCard = ({ label, value, sub, accent, delay }: any) => (
  <div style={{
    background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.06)",
    borderRadius: 16, padding: "20px 22px", position: "relative", overflow: "hidden",
    animation: `fadeUp 0.5s ease ${delay}s both`,
  }}>
    <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, transparent, ${accent}, transparent)` }} />
    <div style={{ color: "#475569", fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", fontFamily: "monospace", marginBottom: 8 }}>{label}</div>
    <div style={{ color: "#f1f5f9", fontSize: 28, fontWeight: 700, letterSpacing: "-0.02em", fontFamily: "'DM Serif Display', Georgia, serif" }}>{value}</div>
    {sub && <div style={{ color: "#334155", fontSize: 11, marginTop: 4 }}>{sub}</div>}
  </div>
);

/* ─── Chart Panel ───────────────────────────────────────────────────────── */
const Panel = ({ title, tag, children, delay = 0 }: any) => (
  <div style={{
    background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)",
    borderRadius: 20, padding: "22px 20px 18px", animation: `fadeUp 0.5s ease ${delay}s both`,
  }}>
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 18 }}>
      <div style={{ color: "#e2e8f0", fontSize: 13, fontWeight: 600, letterSpacing: "-0.01em" }}>{title}</div>
      <span style={{
        fontSize: 10, color: "#22d3ee", letterSpacing: "0.12em", textTransform: "uppercase",
        fontFamily: "monospace", background: "rgba(34,211,238,0.08)", padding: "2px 8px",
        borderRadius: 20, border: "1px solid rgba(34,211,238,0.15)",
      }}>{tag}</span>
    </div>
    {children}
  </div>
);

/* ─── Mode Tab ──────────────────────────────────────────────────────────── */
const ModeTab = ({ label, active, onClick, icon, accentRgb }: any) => (
  <button onClick={onClick} style={{
    background: active ? `rgba(${accentRgb},0.12)` : "rgba(255,255,255,0.03)",
    border: active ? `1px solid rgba(${accentRgb},0.4)` : "1px solid rgba(255,255,255,0.06)",
    color: active ? `rgb(${accentRgb})` : "#475569",
    fontSize: 12, fontWeight: active ? 600 : 400, padding: "10px 22px", borderRadius: 12,
    cursor: "pointer", fontFamily: "monospace", letterSpacing: "0.06em",
    transition: "all 0.2s", display: "flex", alignItems: "center", gap: 8,
  }}>
    <span style={{ fontSize: 14 }}>{icon}</span> {label}
  </button>
);

/* ─── Main App ──────────────────────────────────────────────────────────── */
export default function ConverSight() {

  /* ── Mode ── */
  const [mode, setMode] = useState<"demo" | "csv">("demo");

  /* ── Demo state ── */
  const [activeQuery, setActiveQuery] = useState("settlement");
  const [demoInput, setDemoInput] = useState("");
  const [insight, setInsight] = useState("");

  /* ── CSV state ── */
  const [dataset, setDataset] = useState<any[]>([]);
  const [columns, setColumns] = useState<string[]>([]);
  const [filteredData, setFilteredData] = useState<any[]>([]);
  const [csvInput, setCsvInput] = useState("");
  const [csvChart, setCsvChart] = useState<"bars" | "table">("bars");
  const [filterLabel, setFilterLabel] = useState("");

  const demoInputRef = useRef<HTMLInputElement>(null);
  const csvInputRef = useRef<HTMLInputElement>(null);

  const settlementColor = (ratio: any) => {
    const r = +ratio;
    if (r >= 99) return "#10b981";
    if (r >= 98.5) return "#22d3ee";
    if (r >= 97.5) return "#f59e0b";
    return "#f43f5e";
  };

  const BAR_GRADIENT = ["#22d3ee", "#0ea5e9", "#6366f1", "#8b5cf6", "#a855f7", "#ec4899", "#f43f5e", "#f59e0b", "#10b981", "#06b6d4"];

  /* ── CSV Upload ── */
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    Papa.parse(file, {
      header: true, skipEmptyLines: true, dynamicTyping: true,
      complete: (results: any) => {
        const rows = results.data as any[];
        setDataset(rows);
        setFilteredData(rows);
        setFilterLabel(`All ${rows.length} rows`);
        if (rows.length > 0) setColumns(Object.keys(rows[0]));
        setCsvChart("bars");
      },
    });
  };

  /* ── CSV Filter Engine ── */
  const runCsvQuery = (text: string) => {
    if (!dataset.length) return;
    const t = text.toLowerCase().trim();
    let result: any[] = [];
    let label = "";

    if (t.includes("ratio above")) {
      const val = parseFloat(t.split("above")[1]);
      result = dataset.filter((r: any) => +r.ratio > val);
      label = `ratio > ${val}`;
      setCsvChart("bars");
    } else if (t.includes("repud above") || t.includes("repudiation above")) {
      const val = parseFloat(t.split("above")[1]);
      result = dataset.filter((r: any) => +r.repud > val);
      label = `repud > ${val}`;
      setCsvChart("bars");
    } else if (t.includes("repud below") || t.includes("repudiation below")) {
      const val = parseFloat(t.split("below")[1]);
      result = dataset.filter((r: any) => +r.repud < val);
      label = `repud < ${val}`;
      setCsvChart("bars");
    } else if (t.includes("lowest settlement")) {
      result = [...dataset].sort((a: any, b: any) => +a.ratio - +b.ratio).slice(0, 3);
      label = "3 lowest settlement";
      setCsvChart("bars");
    } else if (t.includes("top")) {
      const match = t.match(/top\s+(\d+)/);
      const n = match ? parseInt(match[1]) : 3;
      result = [...dataset].sort((a: any, b: any) => +b.ratio - +a.ratio).slice(0, n);
      label = `top ${n} by ratio`;
      setCsvChart("bars");
    } else if (t.includes("only")) {
      const name = t.split("only")[1].trim();
      result = dataset.filter((r: any) => r.name?.toLowerCase().includes(name));
      label = `"${name}" only`;
      setCsvChart("table");
    } else {
      result = dataset;
      label = `All ${dataset.length} rows`;
      setCsvChart("bars");
    }

    setFilteredData(result);
    setFilterLabel(label);
  };

  /* ── Demo AI Query ── */
  const handleDemoSubmit = async () => {
    if (!demoInput.trim()) return;
    try {
      const res = await fetch("/api/query", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: demoInput.trim() }),
      });
      const data = await res.json();
      if (data?.chart && ["settlement", "trend", "repud", "scatter"].includes(data.chart)) {
        setActiveQuery(data.chart);
      }
      if (data?.insight) setInsight(data.insight);
    } catch (err) {
      console.error("Query failed:", err);
    }
  };

  const csvData = filteredData.length ? filteredData : dataset;

  return (
    <div style={{ minHeight: "100vh", background: "#070a0f", color: "#e2e8f0", fontFamily: "'DM Sans', system-ui, sans-serif", position: "relative", overflow: "hidden" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=DM+Serif+Display&family=JetBrains+Mono:wght@400;600&display=swap');
        @keyframes fadeUp { from { opacity:0; transform:translateY(18px) } to { opacity:1; transform:translateY(0) } }
        @keyframes pulse  { 0%,100%{opacity:0.4} 50%{opacity:1} }
        ::-webkit-scrollbar { width:4px; background:transparent }
        ::-webkit-scrollbar-thumb { background:rgba(255,255,255,0.08); border-radius:4px }
        * { box-sizing:border-box; margin:0; padding:0 }
        input:focus { outline:none }
        .csv-row:hover td { background: rgba(34,211,238,0.03) !important; }
      `}</style>

      {/* Background grid */}
      <div style={{ position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none", backgroundImage: `linear-gradient(rgba(34,211,238,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(34,211,238,0.025) 1px, transparent 1px)`, backgroundSize: "40px 40px" }} />
      <div style={{ position: "fixed", top: "-20%", left: "-10%", width: 600, height: 600, borderRadius: "50%", background: "radial-gradient(circle, rgba(34,211,238,0.04) 0%, transparent 70%)", pointerEvents: "none", zIndex: 0 }} />
      <div style={{ position: "fixed", bottom: "-10%", right: "-5%", width: 500, height: 500, borderRadius: "50%", background: "radial-gradient(circle, rgba(139,92,246,0.04) 0%, transparent 70%)", pointerEvents: "none", zIndex: 0 }} />

      <div style={{ position: "relative", zIndex: 1 }}>

        {/* ── NAV ── */}
        <nav style={{ borderBottom: "1px solid rgba(255,255,255,0.05)", padding: "0 28px", height: 56, display: "flex", alignItems: "center", justifyContent: "space-between", background: "rgba(7,10,15,0.8)", backdropFilter: "blur(20px)", position: "sticky", top: 0, zIndex: 100 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: "linear-gradient(135deg,#22d3ee,#8b5cf6)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 800, color: "#fff", fontFamily: "'JetBrains Mono',monospace" }}>CS</div>
            <span style={{ fontSize: 15, fontWeight: 600, letterSpacing: "-0.02em" }}>Conver<span style={{ color: "#22d3ee" }}>Sight</span></span>
            <span style={{ fontSize: 10, color: "#22d3ee", letterSpacing: "0.12em", fontFamily: "monospace", background: "rgba(34,211,238,0.08)", padding: "2px 8px", borderRadius: 20, border: "1px solid rgba(34,211,238,0.15)", marginLeft: 4 }}>LIVE · FY 2021-22</span>
          </div>
          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
            {["Dashboard", "Reports", "Insurers", "Docs"].map(n => (
              <button key={n} style={{ background: "none", border: "none", color: "#475569", fontSize: 12, padding: "6px 12px", borderRadius: 8, cursor: "pointer", fontFamily: "inherit" }}
                onMouseEnter={(e: any) => e.target.style.color = "#94a3b8"} onMouseLeave={(e: any) => e.target.style.color = "#475569"}>{n}</button>
            ))}
            <button style={{ background: "linear-gradient(135deg,#22d3ee,#0ea5e9)", border: "none", color: "#070a0f", fontSize: 12, fontWeight: 600, padding: "7px 16px", borderRadius: 8, cursor: "pointer", fontFamily: "inherit", marginLeft: 8 }}>Sign in →</button>
          </div>
        </nav>

        <div style={{ maxWidth: 1280, margin: "0 auto", padding: "32px 28px 60px" }}>

          {/* ── HEADER ── */}
          <div style={{ marginBottom: 28, animation: "fadeUp 0.5s ease 0s both" }}>
            <div style={{ fontSize: 11, color: "#22d3ee", letterSpacing: "0.2em", textTransform: "uppercase", fontFamily: "monospace", marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ display: "inline-block", width: 6, height: 6, borderRadius: "50%", background: "#22d3ee", animation: "pulse 2s infinite" }} />
              India Life Insurance · Death Claims · IRDAI Dataset
            </div>
            <h1 style={{ fontSize: "clamp(28px,4vw,44px)", fontWeight: 700, letterSpacing: "-0.03em", lineHeight: 1.1, fontFamily: "'DM Serif Display',Georgia,serif", color: "#f8fafc" }}>
              Claim Intelligence<br />
              <span style={{ background: "linear-gradient(90deg,#22d3ee,#8b5cf6)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Dashboard</span>
            </h1>
            <p style={{ color: "#334155", fontSize: 13, marginTop: 10, maxWidth: 420 }}>19 insurers · 5 financial years · Individual death claims · Paid, repudiated & pending analysis</p>
          </div>

          {/* ── KPI STRIP ── */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))", gap: 12, marginBottom: 32 }}>
            <KpiCard label="Total Claims 2021-22" value="1.71L" sub="+56k vs 2019-20" accent="#22d3ee" delay={0.05} />
            <KpiCard label="Industry Settlement" value="97.81%" sub="↑ from 95.24% in 2017-18" accent="#10b981" delay={0.1} />
            <KpiCard label="Claims Paid (count)" value="1.67L" sub="FY 2021-22" accent="#8b5cf6" delay={0.15} />
            <KpiCard label="Repudiated + Rejected" value="3,388" sub="↓ from 4,501 in 2017-18" accent="#f59e0b" delay={0.2} />
            <KpiCard label="Worst Repud. Rate" value="4.11%" sub="Shriram Life FY22" accent="#f43f5e" delay={0.25} />
          </div>

          {/* ══ MODE SWITCHER ══ */}
          <div style={{ display: "flex", gap: 10, marginBottom: 28, animation: "fadeUp 0.5s ease 0.3s both" }}>
            <ModeTab label="DEMO — IRDAI Verified Data" icon="◉" active={mode === "demo"} onClick={() => setMode("demo")} accentRgb="34,211,238" />
            <ModeTab label="CSV EXPLORER — Your Data" icon="⌗" active={mode === "csv"} onClick={() => setMode("csv")} accentRgb="139,92,246" />
          </div>

          {/* ══════════════════════════ DEMO MODE ══════════════════════════ */}
          {mode === "demo" && (
            <div style={{ animation: "fadeUp 0.4s ease both" }}>

              {/* Search bar */}
              <div style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16, padding: "4px 4px 4px 18px", display: "flex", gap: 8, alignItems: "center", marginBottom: 16, boxShadow: "0 0 40px rgba(34,211,238,0.04)" }}>
                <span style={{ color: "#22d3ee", fontSize: 16, fontFamily: "monospace" }}>›_</span>
                <input ref={demoInputRef} value={demoInput} onChange={e => setDemoInput(e.target.value)} onKeyDown={e => e.key === "Enter" && handleDemoSubmit()}
                  placeholder="Ask anything… e.g. 'Show settlement ratio' or 'repudiation trend'"
                  style={{ flex: 1, background: "none", border: "none", color: "#e2e8f0", fontSize: 13, fontFamily: "'JetBrains Mono',monospace", caretColor: "#22d3ee" }} />
                <button onClick={handleDemoSubmit} style={{ background: "linear-gradient(135deg,#22d3ee22,#8b5cf622)", border: "1px solid rgba(34,211,238,0.2)", color: "#22d3ee", fontSize: 12, fontWeight: 600, padding: "10px 20px", borderRadius: 12, cursor: "pointer", fontFamily: "'JetBrains Mono',monospace", letterSpacing: "0.05em", whiteSpace: "nowrap" }}>RUN →</button>
              </div>

              {/* AI Insight */}
              {insight && (
                <div style={{ background: "rgba(34,211,238,0.06)", border: "1px solid rgba(34,211,238,0.2)", borderRadius: 12, padding: "12px 18px", marginBottom: 16, fontSize: 13, color: "#94a3b8", fontFamily: "'JetBrains Mono',monospace", lineHeight: 1.6, animation: "fadeUp 0.4s ease both" }}>
                  <span style={{ color: "#22d3ee", marginRight: 8 }}>✦ AI Insight:</span>{insight}
                </div>
              )}

              {/* Query chips */}
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 28 }}>
                {QUERIES.map(q => (
                  <button key={q.key} onClick={() => { setActiveQuery(q.key); setDemoInput(q.label); }} style={{
                    background: activeQuery === q.key ? "rgba(34,211,238,0.12)" : "rgba(255,255,255,0.03)",
                    border: activeQuery === q.key ? "1px solid rgba(34,211,238,0.35)" : "1px solid rgba(255,255,255,0.06)",
                    color: activeQuery === q.key ? "#22d3ee" : "#475569",
                    fontSize: 11, padding: "7px 14px", borderRadius: 20, cursor: "pointer", fontFamily: "monospace", letterSpacing: "0.05em", transition: "all 0.2s",
                  }}>{q.icon} {q.label}</button>
                ))}
              </div>

              {/* Settlement */}
              {activeQuery === "settlement" && (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(560px,1fr))", gap: 16 }}>
                  <Panel title="Claim Settlement Ratio by Insurer · FY 2021-22" tag="BAR" delay={0}>
                    <ResponsiveContainer width="100%" height={320}>
                      <BarChart data={DATA.settlement2022} layout="vertical" margin={{ left: 10, right: 20, top: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="2 4" stroke="rgba(255,255,255,0.04)" horizontal={false} />
                        <XAxis type="number" domain={[94, 100]} tick={{ fontSize: 10, fill: "#334155", fontFamily: "monospace" }} axisLine={false} tickLine={false} />
                        <YAxis type="category" dataKey="name" width={80} tick={{ fontSize: 10, fill: "#64748b" }} axisLine={false} tickLine={false} />
                        <Tooltip content={<CustomTip />} />
                        <Bar dataKey="ratio" name="Settlement %" radius={[0, 4, 4, 0]} maxBarSize={14}>
                          {DATA.settlement2022?.map((d: any, i: number) => <Cell key={i} fill={settlementColor(d.ratio)} opacity={0.85} />)}
                        </Bar>
                        <ReferenceLine x={97} stroke="rgba(245,158,11,0.3)" strokeDasharray="4 4" />
                      </BarChart>
                    </ResponsiveContainer>
                    <div style={{ display: "flex", gap: 16, marginTop: 12, justifyContent: "flex-end" }}>
                      {[["≥99%", "#10b981"], ["≥98.5%", "#22d3ee"], ["≥97.5%", "#f59e0b"], ["<97.5%", "#f43f5e"]].map(([l, c]) => (
                        <div key={l} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 10, color: "#475569", fontFamily: "monospace" }}>
                          <span style={{ width: 8, height: 8, borderRadius: 2, background: c as string, display: "inline-block" }} />{l}
                        </div>
                      ))}
                    </div>
                  </Panel>
                  <Panel title="Repudiation Rate by Insurer · FY 2021-22" tag="BAR" delay={0.1}>
                    <ResponsiveContainer width="100%" height={320}>
                      <BarChart data={[...DATA.repudiation].reverse()} layout="vertical" margin={{ left: 10, right: 20, top: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="2 4" stroke="rgba(255,255,255,0.04)" horizontal={false} />
                        <XAxis type="number" tick={{ fontSize: 10, fill: "#334155", fontFamily: "monospace" }} axisLine={false} tickLine={false} />
                        <YAxis type="category" dataKey="name" width={80} tick={{ fontSize: 10, fill: "#64748b" }} axisLine={false} tickLine={false} />
                        <Tooltip content={<CustomTip />} />
                        <Bar dataKey="rate" name="Repud. %" radius={[0, 4, 4, 0]} maxBarSize={14}>
                          {[...DATA.repudiation].reverse().map((d: any, i: number) => (
                            <Cell key={i} fill={d.rate > 3 ? "#f43f5e" : d.rate > 2 ? "#f59e0b" : "#22d3ee"} opacity={0.8} />
                          ))}
                        </Bar>
                        <ReferenceLine x={2} stroke="rgba(244,63,94,0.3)" strokeDasharray="4 4" />
                      </BarChart>
                    </ResponsiveContainer>
                  </Panel>
                </div>
              )}

              {/* Trend */}
              {activeQuery === "trend" && (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(500px,1fr))", gap: 16 }}>
                  <Panel title="Industry Settlement Ratio · 5-Year Trend" tag="AREA" delay={0}>
                    <ResponsiveContainer width="100%" height={280}>
                      <AreaChart data={DATA.trend} margin={{ left: -10, right: 10, top: 4, bottom: 0 }}>
                        <defs>
                          <linearGradient id="ratioGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.2} />
                            <stop offset="95%" stopColor="#22d3ee" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="2 4" stroke="rgba(255,255,255,0.04)" />
                        <XAxis dataKey="year" tick={{ fontSize: 10, fill: "#475569", fontFamily: "monospace" }} axisLine={false} tickLine={false} />
                        <YAxis domain={[94, 99]} tick={{ fontSize: 10, fill: "#334155", fontFamily: "monospace" }} axisLine={false} tickLine={false} />
                        <Tooltip content={<CustomTip />} />
                        <Area type="monotone" dataKey="ratio" name="Settlement %" stroke="#22d3ee" strokeWidth={2} fill="url(#ratioGrad)" dot={{ fill: "#22d3ee", r: 3 }} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </Panel>
                  <Panel title="Total Claims Filed · 5-Year Trend" tag="LINE" delay={0.1}>
                    <ResponsiveContainer width="100%" height={280}>
                      <LineChart data={DATA.trend} margin={{ left: -10, right: 10, top: 4, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="2 4" stroke="rgba(255,255,255,0.04)" />
                        <XAxis dataKey="year" tick={{ fontSize: 10, fill: "#475569", fontFamily: "monospace" }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fontSize: 10, fill: "#334155", fontFamily: "monospace" }} axisLine={false} tickLine={false} />
                        <Tooltip content={<CustomTip />} />
                        <Line type="monotone" dataKey="claims" name="Claims Filed" stroke="#8b5cf6" strokeWidth={2} dot={{ fill: "#8b5cf6", r: 3 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </Panel>
                </div>
              )}

              {/* Repud leaders */}
              {activeQuery === "repud" && (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(500px,1fr))", gap: 16 }}>
                  <Panel title="Top Repudiation Rates · FY 2021-22" tag="BAR" delay={0}>
                    <ResponsiveContainer width="100%" height={320}>
                      <BarChart data={DATA.repudiation} margin={{ left: 10, right: 20, top: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="2 4" stroke="rgba(255,255,255,0.04)" vertical={false} />
                        <XAxis dataKey="name" tick={{ fontSize: 10, fill: "#64748b" }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fontSize: 10, fill: "#334155", fontFamily: "monospace" }} axisLine={false} tickLine={false} />
                        <Tooltip content={<CustomTip />} />
                        <Bar dataKey="rate" name="Repud. %" radius={[4, 4, 0, 0]} maxBarSize={28}>
                          {DATA.repudiation?.map((_: any, i: number) => <Cell key={i} fill={BAR_GRADIENT[i % BAR_GRADIENT.length]} opacity={0.85} />)}
                        </Bar>
                        <ReferenceLine y={2} stroke="rgba(244,63,94,0.4)" strokeDasharray="4 4" />
                      </BarChart>
                    </ResponsiveContainer>
                  </Panel>
                </div>
              )}

              {/* Scatter */}
              {activeQuery === "scatter" && (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(500px,1fr))", gap: 16 }}>
                  <Panel title="Volume vs Settlement Performance · FY 2021-22" tag="SCATTER" delay={0}>
                    <ResponsiveContainer width="100%" height={320}>
                      <ScatterChart margin={{ left: 10, right: 20, top: 10, bottom: 10 }}>
                        <CartesianGrid strokeDasharray="2 4" stroke="rgba(255,255,255,0.04)" />
                        <XAxis dataKey="claims" name="Claims" tick={{ fontSize: 10, fill: "#475569", fontFamily: "monospace" }} axisLine={false} tickLine={false} label={{ value: "Claims Filed", position: "insideBottom", offset: -2, fill: "#334155", fontSize: 10 }} />
                        <YAxis dataKey="ratio" name="Settlement %" domain={[94, 100]} tick={{ fontSize: 10, fill: "#334155", fontFamily: "monospace" }} axisLine={false} tickLine={false} />
                        <Tooltip content={<CustomTip />} cursor={{ strokeDasharray: "3 3" }} />
                        <Scatter name="Insurers" data={DATA.scatter} fill="#22d3ee" opacity={0.7} />
                      </ScatterChart>
                    </ResponsiveContainer>
                  </Panel>
                </div>
              )}
            </div>
          )}

          {/* ══════════════════════════ CSV MODE ══════════════════════════ */}
          {mode === "csv" && (
            <div style={{ animation: "fadeUp 0.4s ease both" }}>

              {/* Upload zone — shown when no CSV loaded */}
              {dataset.length === 0 && (
                <div style={{ border: "2px dashed rgba(139,92,246,0.3)", borderRadius: 20, padding: "48px 32px", textAlign: "center", marginBottom: 24, background: "rgba(139,92,246,0.03)" }}>
                  <div style={{ fontSize: 36, marginBottom: 12 }}>⌗</div>
                  <div style={{ color: "#64748b", fontSize: 13, marginBottom: 20, fontFamily: "monospace" }}>
                    Upload your CSV to explore with natural language queries
                  </div>
                  <label style={{ background: "linear-gradient(135deg,rgba(139,92,246,0.2),rgba(34,211,238,0.1))", border: "1px solid rgba(139,92,246,0.4)", color: "#8b5cf6", fontSize: 12, fontWeight: 600, padding: "11px 28px", borderRadius: 12, cursor: "pointer", fontFamily: "monospace", letterSpacing: "0.06em", display: "inline-block" }}>
                    ↑ Choose CSV File
                    <input type="file" accept=".csv" onChange={handleFileUpload} style={{ display: "none" }} />
                  </label>
                  <div style={{ color: "#1e293b", fontSize: 11, marginTop: 16, fontFamily: "monospace" }}>
                    Expected columns: name · ratio · repud · total · paid
                  </div>
                </div>
              )}

              {/* Once CSV loaded */}
              {dataset.length > 0 && (
                <>
                  {/* Header row */}
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#8b5cf6", display: "inline-block", animation: "pulse 2s infinite" }} />
                      <span style={{ color: "#8b5cf6", fontSize: 12, fontFamily: "monospace" }}>
                        CSV loaded — {dataset.length} rows · {columns.length} columns
                      </span>
                      {filterLabel && (
                        <span style={{ color: "#334155", fontSize: 11, fontFamily: "monospace" }}>
                          › showing: <span style={{ color: "#22d3ee" }}>{filterLabel}</span>
                        </span>
                      )}
                    </div>
                    <label style={{ color: "#475569", fontSize: 11, fontFamily: "monospace", cursor: "pointer", border: "1px solid rgba(255,255,255,0.06)", padding: "4px 12px", borderRadius: 8 }}>
                      ↑ Replace CSV
                      <input type="file" accept=".csv" onChange={handleFileUpload} style={{ display: "none" }} />
                    </label>
                  </div>

                  {/* CSV Search bar */}
                  <div style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(139,92,246,0.2)", borderRadius: 16, padding: "4px 4px 4px 18px", display: "flex", gap: 8, alignItems: "center", marginBottom: 12, boxShadow: "0 0 40px rgba(139,92,246,0.04)" }}>
                    <span style={{ color: "#8b5cf6", fontSize: 16, fontFamily: "monospace" }}>›_</span>
                    <input ref={csvInputRef} value={csvInput} onChange={e => setCsvInput(e.target.value)}
                      onKeyDown={e => e.key === "Enter" && runCsvQuery(csvInput)}
                      placeholder='Try: "top 5"  "ratio above 98"  "repud below 1"  "only LIC"'
                      style={{ flex: 1, background: "none", border: "none", color: "#e2e8f0", fontSize: 13, fontFamily: "'JetBrains Mono',monospace", caretColor: "#8b5cf6" }} />
                    <button onClick={() => runCsvQuery(csvInput)} style={{ background: "linear-gradient(135deg,rgba(139,92,246,0.2),rgba(34,211,238,0.1))", border: "1px solid rgba(139,92,246,0.3)", color: "#8b5cf6", fontSize: 12, fontWeight: 600, padding: "10px 20px", borderRadius: 12, cursor: "pointer", fontFamily: "'JetBrains Mono',monospace", letterSpacing: "0.05em", whiteSpace: "nowrap" }}>FILTER →</button>
                  </div>

                  {/* Suggestion chips */}
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 24 }}>
                    {CSV_SUGGESTIONS.map(s => (
                      <button key={s.query} onClick={() => { setCsvInput(s.query); runCsvQuery(s.query); }} style={{
                        background: csvInput === s.query ? "rgba(139,92,246,0.12)" : "rgba(255,255,255,0.03)",
                        border: csvInput === s.query ? "1px solid rgba(139,92,246,0.35)" : "1px solid rgba(255,255,255,0.06)",
                        color: csvInput === s.query ? "#8b5cf6" : "#475569",
                        fontSize: 11, padding: "6px 14px", borderRadius: 20, cursor: "pointer", fontFamily: "monospace", letterSpacing: "0.05em", transition: "all 0.2s",
                      }}>⟨ {s.label}</button>
                    ))}
                    {filteredData.length > 0 && filteredData.length < dataset.length && (
                      <button onClick={() => { setFilteredData(dataset); setFilterLabel(`All ${dataset.length} rows`); setCsvInput(""); }} style={{ background: "rgba(244,63,94,0.08)", border: "1px solid rgba(244,63,94,0.25)", color: "#f43f5e", fontSize: 11, padding: "6px 14px", borderRadius: 20, cursor: "pointer", fontFamily: "monospace" }}>✕ Clear filter</button>
                    )}
                  </div>

                  {/* CSV Charts (shown unless "only X" query which uses table) */}
                  {csvChart === "bars" && csvData.length > 0 && (
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(500px,1fr))", gap: 16, marginBottom: 24 }}>

                      <Panel title={`Settlement Ratio — ${filterLabel}`} tag="CSV · BAR" delay={0}>
                        <ResponsiveContainer width="100%" height={Math.max(240, csvData.length * 30)}>
                          <BarChart data={[...csvData].sort((a: any, b: any) => +b.ratio - +a.ratio)} layout="vertical" margin={{ left: 10, right: 20, top: 0, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="2 4" stroke="rgba(255,255,255,0.04)" horizontal={false} />
                            <XAxis type="number" domain={[90, 101]} tick={{ fontSize: 10, fill: "#334155", fontFamily: "monospace" }} axisLine={false} tickLine={false} />
                            <YAxis type="category" dataKey="name" width={90} tick={{ fontSize: 10, fill: "#64748b" }} axisLine={false} tickLine={false} />
                            <Tooltip content={<CustomTip />} />
                            <Bar dataKey="ratio" name="Settlement %" radius={[0, 4, 4, 0]} maxBarSize={16}>
                              {[...csvData].sort((a: any, b: any) => +b.ratio - +a.ratio).map((d: any, i: number) => (
                                <Cell key={i} fill={settlementColor(d.ratio)} opacity={0.85} />
                              ))}
                            </Bar>
                            <ReferenceLine x={97} stroke="rgba(245,158,11,0.3)" strokeDasharray="4 4" />
                          </BarChart>
                        </ResponsiveContainer>
                      </Panel>

                      <Panel title={`Repudiation Rate — ${filterLabel}`} tag="CSV · BAR" delay={0.1}>
                        <ResponsiveContainer width="100%" height={Math.max(240, csvData.length * 30)}>
                          <BarChart data={[...csvData].sort((a: any, b: any) => +b.repud - +a.repud)} layout="vertical" margin={{ left: 10, right: 20, top: 0, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="2 4" stroke="rgba(255,255,255,0.04)" horizontal={false} />
                            <XAxis type="number" tick={{ fontSize: 10, fill: "#334155", fontFamily: "monospace" }} axisLine={false} tickLine={false} />
                            <YAxis type="category" dataKey="name" width={90} tick={{ fontSize: 10, fill: "#64748b" }} axisLine={false} tickLine={false} />
                            <Tooltip content={<CustomTip />} />
                            <Bar dataKey="repud" name="Repud. %" radius={[0, 4, 4, 0]} maxBarSize={16}>
                              {[...csvData].sort((a: any, b: any) => +b.repud - +a.repud).map((d: any, i: number) => (
                                <Cell key={i} fill={+d.repud > 3 ? "#f43f5e" : +d.repud > 2 ? "#f59e0b" : "#22d3ee"} opacity={0.8} />
                              ))}
                            </Bar>
                            <ReferenceLine x={2} stroke="rgba(244,63,94,0.3)" strokeDasharray="4 4" />
                          </BarChart>
                        </ResponsiveContainer>
                      </Panel>
                    </div>
                  )}

                  {/* Data table — always shown below charts */}
                  {csvData.length > 0 && (
                    <Panel title={`Data Table — ${filterLabel} (${csvData.length} rows)`} tag="CSV · TABLE" delay={0.2}>
                      <div style={{ overflowX: "auto" }}>
                        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12, fontFamily: "monospace" }}>
                          <thead>
                            <tr>
                              {columns.map(col => (
                                <th key={col} style={{ textAlign: "left", color: "#334155", padding: "8px 12px", borderBottom: "1px solid rgba(255,255,255,0.06)", fontSize: 10, letterSpacing: "0.08em", textTransform: "uppercase" }}>{col}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {csvData.map((row: any, i: number) => (
                              <tr key={i} className="csv-row" style={{ borderBottom: "1px solid rgba(255,255,255,0.03)" }}>
                                {columns.map(col => (
                                  <td key={col} style={{ padding: "8px 12px", color: col === "name" ? "#e2e8f0" : col === "ratio" ? settlementColor(row[col]) : col === "repud" ? (+row[col] > 3 ? "#f43f5e" : +row[col] > 2 ? "#f59e0b" : "#22d3ee") : "#64748b" }}>
                                    {row[col]}
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </Panel>
                  )}
                </>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}