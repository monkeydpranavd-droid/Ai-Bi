"use client";

import { useState, useEffect, useRef } from "react";
import Papa from "papaparse";
import { DATA } from "../data/dataset";
import {
  BarChart, Bar, LineChart, Line, AreaChart, Area, ScatterChart, Scatter,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, ReferenceLine, Legend
} from "recharts";

/* ─── Real data from India Life Insurance Claims CSV ──────────────────── */
const QUERIES = [
  { label: "Settlement ratio 2021-22", key: "settlement", icon: "◈" },
  { label: "Industry trend 5Y", key: "trend", icon: "∿" },
  { label: "Repudiation leaders", key: "repud", icon: "⊗" },
  { label: "Volume vs performance", key: "scatter", icon: "⊕" },
];

/* ─── Custom tooltip ────────────────────────────────────────────────────── */
const CustomTip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: "rgba(10,12,16,0.97)",
      border: "1px solid rgba(255,255,255,0.07)",
      borderRadius: 10,
      padding: "10px 14px",
      fontSize: 12,
      color: "#e2e8f0",
      boxShadow: "0 20px 40px rgba(0,0,0,0.5)",
      backdropFilter: "blur(12px)",
    }}>
      <div style={{ color: "#94a3b8", marginBottom: 6, fontFamily: "monospace", letterSpacing: "0.05em" }}>
        {label}
      </div>
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
    background: "rgba(255,255,255,0.025)",
    border: "1px solid rgba(255,255,255,0.06)",
    borderRadius: 16,
    padding: "20px 22px",
    position: "relative",
    overflow: "hidden",
    animation: `fadeUp 0.5s ease ${delay}s both`,
  }}>
    <div style={{
      position: "absolute", top: 0, left: 0, right: 0, height: 2,
      background: `linear-gradient(90deg, transparent, ${accent}, transparent)`,
    }} />
    <div style={{ color: "#475569", fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", fontFamily: "monospace", marginBottom: 8 }}>
      {label}
    </div>
    <div style={{ color: "#f1f5f9", fontSize: 28, fontWeight: 700, letterSpacing: "-0.02em", fontFamily: "'DM Serif Display', Georgia, serif" }}>
      {value}
    </div>
    {sub && <div style={{ color: "#334155", fontSize: 11, marginTop: 4 }}>{sub}</div>}
  </div>
);

/* ─── Chart Panel ───────────────────────────────────────────────────────── */
const Panel = ({ title, tag, children, delay = 0 }: any) => (
  <div style={{
    background: "rgba(255,255,255,0.02)",
    border: "1px solid rgba(255,255,255,0.06)",
    borderRadius: 20,
    padding: "22px 20px 18px",
    animation: `fadeUp 0.5s ease ${delay}s both`,
  }}>
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 18 }}>
      <div style={{ color: "#e2e8f0", fontSize: 13, fontWeight: 600, letterSpacing: "-0.01em" }}>{title}</div>
      <span style={{
        fontSize: 10, color: "#22d3ee", letterSpacing: "0.12em", textTransform: "uppercase",
        fontFamily: "monospace", background: "rgba(34,211,238,0.08)", padding: "2px 8px", borderRadius: 20,
        border: "1px solid rgba(34,211,238,0.15)"
      }}>{tag}</span>
    </div>
    {children}
  </div>
);

/* ─── Main App ──────────────────────────────────────────────────────────── */
export default function ConverSight() {
  const [activeQuery, setActiveQuery] = useState("settlement");
  const [inputVal, setInputVal] = useState("");
  const [insight, setInsight] = useState("");

  // CSV Dataset Support
  const [dataset, setDataset] = useState<any[]>([]);
  const [columns, setColumns] = useState<string[]>([]);
  const [filteredData, setFilteredData] = useState<any[]>([]);

  const [isTyping, setIsTyping] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setTimeout(() => setLoaded(true), 100);
  }, []);

  /* Debug to confirm state updates */
  useEffect(() => {
    console.log("ACTIVE QUERY CHANGED:", activeQuery);
  }, [activeQuery]);

  // ─── FIX 1: handleFileUpload moved OUT of handleSubmit ───────────────────
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: true,   // ← converts "98.7" → 98.7, "1000" → 1000 automatically
      complete: (results: any) => {
        console.log("CSV DATA:", results.data);
        setDataset(results.data);
        if (results.data.length > 0) {
          setColumns(Object.keys(results.data[0]));
        }
      },
    });
  };

  const handleQuery = (key: string, label: string) => {
    setActiveQuery(key);
    setInputVal(label);
    setIsTyping(false);
  };

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputVal(e.target.value);
    setIsTyping(true);
  };

  const handleSubmit = async () => {
    console.log("RUN BUTTON CLICKED");

    // Clear previous filters on every new submission
    setFilteredData([]);

    if (!inputVal.trim()) {
      console.log("EMPTY INPUT");
      return;
    }

    // ─── Local filter engine (runs before API call) ───────────────────────
    if (isCSV) {
      const text = inputVal.toLowerCase();

      // FILTER: ratio above X
      if (text.includes("ratio above")) {
        const value = parseFloat(text.split("above")[1]);
        const filtered = dataset.filter((row: any) => Number(row.ratio) > value);
        setFilteredData(filtered);
        return;
      }

      // FILTER: repud above X
      if (text.includes("repud above")) {
        const value = parseFloat(text.split("above")[1]);
        const filtered = dataset.filter((row: any) => Number(row.repud) > value);
        setFilteredData(filtered);
        return;
      }

      // FILTER: repud below X
      if (text.includes("repud below") || text.includes("repudiation below")) {
        const value = parseFloat(text.split("below")[1]);
        const filtered = dataset.filter((row: any) => Number(row.repud) < value);
        setFilteredData(filtered);
        return;
      }

      // FILTER: only <insurer name>
      if (text.includes("only")) {
        const name = text.split("only")[1].trim();
        const filtered = dataset.filter((row: any) =>
          row.name.toLowerCase().includes(name)
        );
        setFilteredData(filtered);
        return;
      }

      // FILTER: top N insurers (by ratio)
      if (text.includes("top")) {
        const match = text.match(/top\s+(\d+)/);
        const n = match ? parseInt(match[1]) : 3;
        const filtered = [...dataset]
          .sort((a: any, b: any) => Number(b.ratio) - Number(a.ratio))
          .slice(0, n);
        setFilteredData(filtered);
        return;
      }

      // FILTER: lowest settlement
      if (text.includes("lowest settlement")) {
        const filtered = [...dataset]
          .sort((a: any, b: any) => Number(a.ratio) - Number(b.ratio))
          .slice(0, 3);
        setFilteredData(filtered);
        return;
      }
    }
    // ─────────────────────────────────────────────────────────────────────

    try {
      console.log("Sending prompt:", inputVal);

      const res = await fetch("/api/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: inputVal.trim() }),
      });

      const data = await res.json();
      console.log("API RESPONSE:", data);

      const validCharts = ["settlement", "trend", "repud", "scatter"];

      if (data?.chart && validCharts.includes(data.chart)) {
        setActiveQuery(data.chart);
        console.log("ACTIVE QUERY SET TO:", data.chart);
      }

      // ─── FIX 2: insight render ────────────────────────────────────────────
      if (data?.insight) {
        setInsight(data.insight);
      }

    } catch (err) {
      console.error("Query failed:", err);
    }
  };

  const C = {
    cyan: "#22d3ee",
    amber: "#f59e0b",
    rose: "#f43f5e",
    violet: "#8b5cf6",
    green: "#10b981",
    slate: "#94a3b8",
  };

  const BAR_GRADIENT = ["#22d3ee", "#0ea5e9", "#6366f1", "#8b5cf6", "#a855f7"];

  // Settlement bar colors — green→red based on ratio
  // +ratio coerces CSV strings ("98.7") to numbers correctly
  const settlementColor = (ratio: any) => {
    const r = +ratio;
    if (r >= 99) return "#10b981";
    if (r >= 98.5) return "#22d3ee";
    if (r >= 97.5) return "#f59e0b";
    return "#f43f5e";
  };

  // ─── CSV-aware data flag ──────────────────────────────────────────────────
  const isCSV = dataset.length > 0;
  // activeData = filtered subset if filter active, else full CSV
  const activeData = filteredData.length ? filteredData : dataset;

  return (
    <div style={{
      minHeight: "100vh",
      background: "#070a0f",
      color: "#e2e8f0",
      fontFamily: "'DM Sans', system-ui, sans-serif",
      position: "relative",
      overflow: "hidden",
    }}>
      {/* ─── FIX 4: Properly wrapped <style> template literal ─────────────── */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=DM+Serif+Display&family=JetBrains+Mono:wght@400;600&display=swap');
        @keyframes fadeUp { from { opacity:0; transform:translateY(18px) } to { opacity:1; transform:translateY(0) } }
        @keyframes pulse  { 0%,100%{opacity:0.4} 50%{opacity:1} }
        @keyframes scan   { 0%{top:0%} 100%{top:100%} }
        ::-webkit-scrollbar { width:4px; background:transparent }
        ::-webkit-scrollbar-thumb { background:rgba(255,255,255,0.08); border-radius:4px }
        * { box-sizing:border-box; margin:0; padding:0 }
        input:focus { outline:none }
      `}</style>

      {/* Background grid */}
      <div style={{
        position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none",
        backgroundImage: `linear-gradient(rgba(34,211,238,0.025) 1px, transparent 1px),
                          linear-gradient(90deg, rgba(34,211,238,0.025) 1px, transparent 1px)`,
        backgroundSize: "40px 40px",
      }} />

      {/* Glow orbs */}
      <div style={{ position: "fixed", top: "-20%", left: "-10%", width: 600, height: 600, borderRadius: "50%", background: "radial-gradient(circle, rgba(34,211,238,0.04) 0%, transparent 70%)", pointerEvents: "none", zIndex: 0 }} />
      <div style={{ position: "fixed", bottom: "-10%", right: "-5%", width: 500, height: 500, borderRadius: "50%", background: "radial-gradient(circle, rgba(139,92,246,0.04) 0%, transparent 70%)", pointerEvents: "none", zIndex: 0 }} />

      <div style={{ position: "relative", zIndex: 1 }}>

        {/* ── NAV ── */}
        <nav style={{
          borderBottom: "1px solid rgba(255,255,255,0.05)",
          padding: "0 28px",
          height: 56,
          display: "flex", alignItems: "center", justifyContent: "space-between",
          background: "rgba(7,10,15,0.8)",
          backdropFilter: "blur(20px)",
          position: "sticky", top: 0, zIndex: 100,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{
              width: 32, height: 32, borderRadius: 8,
              background: "linear-gradient(135deg, #22d3ee, #8b5cf6)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 14, fontWeight: 800, color: "#fff",
              fontFamily: "'JetBrains Mono', monospace",
            }}>CS</div>
            <span style={{ fontSize: 15, fontWeight: 600, letterSpacing: "-0.02em" }}>
              Conver<span style={{ color: "#22d3ee" }}>Sight</span>
            </span>
            <span style={{
              fontSize: 10, color: "#22d3ee", letterSpacing: "0.12em",
              fontFamily: "monospace", background: "rgba(34,211,238,0.08)",
              padding: "2px 8px", borderRadius: 20, border: "1px solid rgba(34,211,238,0.15)",
              marginLeft: 4,
            }}>LIVE · FY 2021-22</span>
          </div>

          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
            {["Dashboard", "Reports", "Insurers", "Docs"].map(n => (
              <button key={n} style={{
                background: "none", border: "none", color: "#475569",
                fontSize: 12, padding: "6px 12px", borderRadius: 8, cursor: "pointer",
                fontFamily: "inherit",
              }}
                onMouseEnter={(e: any) => e.target.style.color = "#94a3b8"}
                onMouseLeave={(e: any) => e.target.style.color = "#475569"}>{n}</button>
            ))}
            <button style={{
              background: "linear-gradient(135deg, #22d3ee, #0ea5e9)",
              border: "none", color: "#070a0f", fontSize: 12, fontWeight: 600,
              padding: "7px 16px", borderRadius: 8, cursor: "pointer",
              fontFamily: "inherit", marginLeft: 8,
            }}>Sign in →</button>
          </div>
        </nav>

        <div style={{ maxWidth: 1280, margin: "0 auto", padding: "32px 28px 60px" }}>

          {/* ── HEADER ── */}
          <div style={{ marginBottom: 36, animation: "fadeUp 0.5s ease 0s both" }}>
            <div style={{
              fontSize: 11, color: "#22d3ee", letterSpacing: "0.2em", textTransform: "uppercase",
              fontFamily: "monospace", marginBottom: 12, display: "flex", alignItems: "center", gap: 8,
            }}>
              <span style={{ display: "inline-block", width: 6, height: 6, borderRadius: "50%", background: "#22d3ee", animation: "pulse 2s infinite" }} />
              India Life Insurance · Death Claims · IRDAI Dataset
            </div>
            <h1 style={{
              fontSize: "clamp(28px, 4vw, 44px)", fontWeight: 700,
              letterSpacing: "-0.03em", lineHeight: 1.1,
              fontFamily: "'DM Serif Display', Georgia, serif",
              color: "#f8fafc",
            }}>
              Claim Intelligence<br />
              <span style={{
                background: "linear-gradient(90deg, #22d3ee, #8b5cf6)",
                WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
              }}>Dashboard</span>
            </h1>
            <p style={{ color: "#334155", fontSize: 13, marginTop: 10, maxWidth: 420 }}>
              19 insurers · 5 financial years · Individual death claims · Paid, repudiated & pending analysis
            </p>
          </div>

          {/* ── KPI STRIP ── */}
          <div style={{
            display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
            gap: 12, marginBottom: 28,
          }}>
            <KpiCard label="Total Claims 2021-22" value="1.71L" sub="+56k vs 2019-20" accent={C.cyan} delay={0.05} />
            <KpiCard label="Industry Settlement" value="97.81%" sub="↑ from 95.24% in 2017-18" accent={C.green} delay={0.1} />
            <KpiCard label="Claims Paid (count)" value="1.67L" sub="FY 2021-22" accent={C.violet} delay={0.15} />
            <KpiCard label="Repudiated + Rejected" value="3,388" sub="↓ from 4,501 in 2017-18" accent={C.amber} delay={0.2} />
            <KpiCard label="Worst Repud. Rate" value="4.11%" sub="Shriram Life FY22" accent={C.rose} delay={0.25} />
          </div>

          {/* ── CSV UPLOAD ── */}
          <div style={{ marginBottom: 20 }}>
            <input
              type="file"
              accept=".csv"
              onChange={handleFileUpload}
              style={{ color: "#22d3ee", fontSize: "12px" }}
            />
            {dataset.length > 0 && (
              <div style={{ marginTop: 6, fontSize: 11, color: "#22d3ee" }}>
                Dataset loaded: {dataset.length} rows · {columns.length} columns
              </div>
            )}
          </div>

          {/* ── SEARCH BAR ── */}
          <div style={{
            background: "rgba(255,255,255,0.025)",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: 16, padding: "4px 4px 4px 18px",
            display: "flex", gap: 8, alignItems: "center",
            marginBottom: 24,
            animation: "fadeUp 0.5s ease 0.3s both",
            boxShadow: "0 0 40px rgba(34,211,238,0.04)",
          }}>
            <span style={{ color: "#22d3ee", fontSize: 16, fontFamily: "monospace" }}>›_</span>
            <input
              ref={inputRef}
              value={inputVal}
              onChange={handleInput}
              onKeyDown={e => e.key === "Enter" && handleSubmit()}
              placeholder="Ask anything… e.g. 'Show settlement ratio by insurer' or 'repudiation trend'"
              style={{
                flex: 1, background: "none", border: "none", color: "#e2e8f0",
                fontSize: 13, fontFamily: "'JetBrains Mono', monospace",
                caretColor: "#22d3ee",
              }}
            />
            <button
              onClick={handleSubmit}
              style={{
                background: "linear-gradient(135deg, #22d3ee22, #8b5cf622)",
                border: "1px solid rgba(34,211,238,0.2)",
                color: "#22d3ee",
                fontSize: 12, fontWeight: 600,
                padding: "10px 20px", borderRadius: 12,
                cursor: "pointer",
                fontFamily: "'JetBrains Mono', monospace",
                letterSpacing: "0.05em", whiteSpace: "nowrap",
              }}
            >
              RUN →
            </button>
          </div>

          {/* ─── FIX 5: AI Insight banner rendered when present ──────────── */}
          {insight && (
            <div style={{
              background: "rgba(34,211,238,0.06)",
              border: "1px solid rgba(34,211,238,0.2)",
              borderRadius: 12,
              padding: "12px 18px",
              marginBottom: 20,
              fontSize: 13,
              color: "#94a3b8",
              fontFamily: "'JetBrains Mono', monospace",
              lineHeight: 1.6,
              animation: "fadeUp 0.4s ease both",
            }}>
              <span style={{ color: "#22d3ee", marginRight: 8 }}>✦ AI Insight:</span>
              {insight}
            </div>
          )}

          {/* ── QUERY CHIPS ── */}
          <div style={{ color: "white", marginBottom: "10px" }}>
            Current Query: {activeQuery}
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 32 }}>
            {QUERIES.map(q => (
              <button key={q.key} onClick={() => handleQuery(q.key, q.label)} style={{
                background: activeQuery === q.key ? "rgba(34,211,238,0.12)" : "rgba(255,255,255,0.03)",
                border: activeQuery === q.key ? "1px solid rgba(34,211,238,0.35)" : "1px solid rgba(255,255,255,0.06)",
                color: activeQuery === q.key ? "#22d3ee" : "#475569",
                fontSize: 11, padding: "7px 14px", borderRadius: 20, cursor: "pointer",
                fontFamily: "monospace", letterSpacing: "0.05em",
                transition: "all 0.2s",
              }}>
                {q.icon} {q.label}
              </button>
            ))}
          </div>

          {/* ── FILTER INDICATOR ── */}
          {filteredData.length > 0 && (
            <div style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              background: "rgba(34,211,238,0.06)",
              border: "1px solid rgba(34,211,238,0.2)",
              borderRadius: 10, padding: "8px 16px",
              marginBottom: 16, fontSize: 12,
              fontFamily: "'JetBrains Mono', monospace",
            }}>
              <span style={{ color: "#22d3ee" }}>
                ⟨ Filter active → showing {filteredData.length} of {dataset.length} rows
              </span>
              <button
                onClick={() => setFilteredData([])}
                style={{
                  background: "none", border: "1px solid rgba(244,63,94,0.3)",
                  color: "#f43f5e", fontSize: 11, padding: "3px 10px",
                  borderRadius: 6, cursor: "pointer", fontFamily: "inherit",
                }}
              >
                ✕ Clear filter
              </button>
            </div>
          )}

          {/* ── CHARTS ── */}
          {activeQuery === "settlement" && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(560px,1fr))", gap: 16 }}>

              <Panel title="Claim Settlement Ratio by Insurer · FY 2021-22" tag="BAR" delay={0}>
                <ResponsiveContainer width="100%" height={320}>
                  {/* Uses isCSV ? activeData : DATA.settlement2022 */}
                  <BarChart data={isCSV ? activeData : DATA.settlement2022} layout="vertical" margin={{ left: 10, right: 20, top: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="2 4" stroke="rgba(255,255,255,0.04)" horizontal={false} />
                    <XAxis type="number" domain={[94, 100]} tick={{ fontSize: 10, fill: "#334155", fontFamily: "monospace" }} axisLine={false} tickLine={false} />
                    <YAxis type="category" dataKey="name" width={80} tick={{ fontSize: 10, fill: "#64748b" }} axisLine={false} tickLine={false} />
                    <Tooltip content={<CustomTip />} />
                    <Bar dataKey="ratio" name="Settlement %" radius={[0, 4, 4, 0]} maxBarSize={14}>
                      {(isCSV ? activeData : DATA.settlement2022)?.map((d: any, i: number) => (
                        <Cell key={i} fill={settlementColor(d.ratio)} opacity={0.85} />
                      ))}
                    </Bar>
                    <ReferenceLine x={97} stroke="rgba(245,158,11,0.3)" strokeDasharray="4 4" />
                  </BarChart>
                </ResponsiveContainer>
                <div style={{ display: "flex", gap: 16, marginTop: 12, justifyContent: "flex-end" }}>
                  {[["≥99%", "#10b981"], ["≥98.5%", "#22d3ee"], ["≥97.5%", "#f59e0b"], ["<97.5%", "#f43f5e"]].map(([l, c]) => (
                    <div key={l} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 10, color: "#475569", fontFamily: "monospace" }}>
                      <span style={{ width: 8, height: 8, borderRadius: 2, background: c as string, display: "inline-block" }} />
                      {l}
                    </div>
                  ))}
                </div>
              </Panel>

              <Panel title="Repudiation Rate by Insurer (Bottom 12) · FY 2021-22" tag="BAR" delay={0.1}>
                <ResponsiveContainer width="100%" height={320}>
                  <BarChart data={[...(isCSV ? activeData : DATA.repudiation ?? [])].reverse()} layout="vertical" margin={{ left: 10, right: 20, top: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="2 4" stroke="rgba(255,255,255,0.04)" horizontal={false} />
                    <XAxis type="number" tick={{ fontSize: 10, fill: "#334155", fontFamily: "monospace" }} axisLine={false} tickLine={false} />
                    <YAxis type="category" dataKey="name" width={80} tick={{ fontSize: 10, fill: "#64748b" }} axisLine={false} tickLine={false} />
                    <Tooltip content={<CustomTip />} />
                    <Bar dataKey={isCSV ? "repud" : "rate"} name="Repud. %" radius={[0, 4, 4, 0]} maxBarSize={14}>
                      {[...(isCSV ? activeData : DATA.repudiation ?? [])].reverse().map((d: any, i: number) => {
                        const v = isCSV ? +d.repud : d.rate;
                        return <Cell key={i} fill={v > 3 ? "#f43f5e" : v > 2 ? "#f59e0b" : "#22d3ee"} opacity={0.8} />;
                      })}
                    </Bar>
                    <ReferenceLine x={2} stroke="rgba(244,63,94,0.3)" strokeDasharray="4 4" />
                  </BarChart>
                </ResponsiveContainer>
              </Panel>
            </div>
          )}

          {activeQuery === "trend" && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(500px,1fr))", gap: 16 }}>

              <Panel title="Industry Settlement Ratio · 5-Year Trend" tag="AREA" delay={0}>
                <ResponsiveContainer width="100%" height={280}>
                  <AreaChart data={isCSV ? activeData : DATA.trend} margin={{ left: -10, right: 10, top: 4, bottom: 0 }}>
                    <defs>
                      <linearGradient id="ratioGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="#22d3ee" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="2 4" stroke="rgba(255,255,255,0.04)" />
                    <XAxis dataKey={isCSV ? "name" : "year"} tick={{ fontSize: 10, fill: "#475569", fontFamily: "monospace" }} axisLine={false} tickLine={false} />
                    <YAxis domain={[94, 99]} tick={{ fontSize: 10, fill: "#334155", fontFamily: "monospace" }} axisLine={false} tickLine={false} />
                    <Tooltip content={<CustomTip />} />
                    <Area type="monotone" dataKey="ratio" name="Settlement %" stroke="#22d3ee" strokeWidth={2} fill="url(#ratioGrad)" dot={{ fill: "#22d3ee", r: 3 }} />
                  </AreaChart>
                </ResponsiveContainer>
              </Panel>

              <Panel title="Total Claims Filed · 5-Year Trend" tag="LINE" delay={0.1}>
                <ResponsiveContainer width="100%" height={280}>
                  <LineChart data={isCSV ? activeData : DATA.trend} margin={{ left: -10, right: 10, top: 4, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="2 4" stroke="rgba(255,255,255,0.04)" />
                    <XAxis dataKey={isCSV ? "name" : "year"} tick={{ fontSize: 10, fill: "#475569", fontFamily: "monospace" }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 10, fill: "#334155", fontFamily: "monospace" }} axisLine={false} tickLine={false} />
                    <Tooltip content={<CustomTip />} />
                    <Line type="monotone" dataKey={isCSV ? "total" : "claims"} name="Claims Filed" stroke="#8b5cf6" strokeWidth={2} dot={{ fill: "#8b5cf6", r: 3 }} />
                  </LineChart>
                </ResponsiveContainer>
              </Panel>
            </div>
          )}

          {activeQuery === "repud" && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(500px,1fr))", gap: 16 }}>
              <Panel title="Top Repudiation Rates · FY 2021-22" tag="BAR" delay={0}>
                <ResponsiveContainer width="100%" height={320}>
                  <BarChart data={isCSV ? activeData : DATA.repudiation} margin={{ left: 10, right: 20, top: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="2 4" stroke="rgba(255,255,255,0.04)" vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 10, fill: "#64748b" }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 10, fill: "#334155", fontFamily: "monospace" }} axisLine={false} tickLine={false} />
                    <Tooltip content={<CustomTip />} />
                    <Bar dataKey={isCSV ? "repud" : "rate"} name="Repud. %" radius={[4, 4, 0, 0]} maxBarSize={28}>
                      {(isCSV ? activeData : DATA.repudiation)?.map((d: any, i: number) => (
                        <Cell key={i} fill={BAR_GRADIENT[i % BAR_GRADIENT.length]} opacity={0.85} />
                      ))}
                    </Bar>
                    <ReferenceLine y={2} stroke="rgba(244,63,94,0.4)" strokeDasharray="4 4" />
                  </BarChart>
                </ResponsiveContainer>
              </Panel>
            </div>
          )}

          {activeQuery === "scatter" && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(500px,1fr))", gap: 16 }}>
              <Panel title="Volume vs Settlement Performance · FY 2021-22" tag="SCATTER" delay={0}>
                <ResponsiveContainer width="100%" height={320}>
                  <ScatterChart margin={{ left: 10, right: 20, top: 10, bottom: 10 }}>
                    <CartesianGrid strokeDasharray="2 4" stroke="rgba(255,255,255,0.04)" />
                    <XAxis dataKey={isCSV ? "total" : "claims"} name="Claims" tick={{ fontSize: 10, fill: "#475569", fontFamily: "monospace" }} axisLine={false} tickLine={false} label={{ value: "Claims Filed", position: "insideBottom", offset: -2, fill: "#334155", fontSize: 10 }} />
                    <YAxis dataKey="ratio" name="Settlement %" domain={[94, 100]} tick={{ fontSize: 10, fill: "#334155", fontFamily: "monospace" }} axisLine={false} tickLine={false} />
                    <Tooltip content={<CustomTip />} cursor={{ strokeDasharray: "3 3" }} />
                    <Scatter name="Insurers" data={isCSV ? activeData : DATA.scatter} fill="#22d3ee" opacity={0.7} />
                  </ScatterChart>
                </ResponsiveContainer>
              </Panel>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}