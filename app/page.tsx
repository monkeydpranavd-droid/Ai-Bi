"use client";

import { useState, useEffect, useRef } from "react";

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
          <span style={{ color: "#f1f5f9", fontWeight: 600 }}>{typeof p.value === "number" ? p.value.toLocaleString() : p.value}</span>
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
const Panel = ({ title, tag, children, delay = 0 }) => (
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
  const [activeQuery, setActiveQuery] = useState("settlement")
  const [inputVal, setInputVal] = useState("")
  const [insight, setInsight] = useState("")

  const [isTyping, setIsTyping] = useState(false)
  const [loaded, setLoaded] = useState(false)

  const inputRef = useRef(null)
  useEffect(() => {
    setTimeout(() => setLoaded(true), 100);
  }, []);

  /* Debug to confirm state updates */
  useEffect(() => {
    console.log("ACTIVE QUERY CHANGED:", activeQuery);
  }, [activeQuery]);

  const handleQuery = (key, label) => {
    setActiveQuery(key);
    setInputVal(label);
    setIsTyping(false);
  };

  const handleInput = (e) => {
    setInputVal(e.target.value);
    setIsTyping(true);
  };

  const handleSubmit = async () => {

    console.log("RUN BUTTON CLICKED")

    if (!inputVal.trim()) {
      console.log("EMPTY INPUT")
      return
    }

    try {

      console.log("Sending prompt:", inputVal)

      const res = await fetch("/api/query", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          prompt: inputVal.trim()
        })
      })

      const data = await res.json()

      console.log("API RESPONSE:", data)

      const validCharts = ["settlement", "trend", "repud", "scatter"]

      if (data?.chart && validCharts.includes(data.chart)) {

        setActiveQuery(data.chart)

        console.log("ACTIVE QUERY SET TO:", data.chart)

      }

      // ⭐ NEW LINE FOR AI INSIGHT
      if (data?.insight) {
        setInsight(data.insight)
      }

    } catch (err) {

      console.error("Query failed:", err)

    }

  }

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
  const settlementColor = (ratio) => {
    if (ratio >= 99) return "#10b981";
    if (ratio >= 98.5) return "#22d3ee";
    if (ratio >= 97.5) return "#f59e0b";
    return "#f43f5e";
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: "#070a0f",
      color: "#e2e8f0",
      fontFamily: "'DM Sans', system-ui, sans-serif",
      position: "relative",
      overflow: "hidden",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=DM+Serif+Display&family=JetBrains+Mono:wght@400;600&display=swap');
        @keyframes fadeUp { from { opacity:0; transform:translateY(18px) } to { opacity:1; transform:translateY(0) } }
        @keyframes pulse { 0%,100%{opacity:0.4} 50%{opacity:1} }
        @keyframes scan { 0%{top:0%} 100%{top:100%} }
        ::-webkit-scrollbar{width:4px;background:transparent}
        ::-webkit-scrollbar-thumb{background:rgba(255,255,255,0.08);border-radius:4px}
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
              }} onMouseEnter={e => e.target.style.color = "#94a3b8"}
                onMouseLeave={e => e.target.style.color = "#475569"}>{n}</button>
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
              onClick={() => handleSubmit()}
              style={{
                background: "linear-gradient(135deg, #22d3ee22, #8b5cf622)",
                border: "1px solid rgba(34,211,238,0.2)",
                color: "#22d3ee",
                fontSize: 12,
                fontWeight: 600,
                padding: "10px 20px",
                borderRadius: 12,
                cursor: "pointer",
                fontFamily: "'JetBrains Mono', monospace",
                letterSpacing: "0.05em",
                whiteSpace: "nowrap",
              }}
            >
              RUN →
            </button>
          </div>

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

          {/* ── CHARTS ── */}
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
                      {DATA.settlement2022.map((d, i) => (
                        <Cell key={i} fill={settlementColor(d.ratio)} opacity={0.85} />
                      ))}
                    </Bar>
                    <ReferenceLine x={97} stroke="rgba(245,158,11,0.3)" strokeDasharray="4 4" />
                  </BarChart>
                </ResponsiveContainer>
                <div style={{ display: "flex", gap: 16, marginTop: 12, justifyContent: "flex-end" }}>
                  {[["≥99%", "#10b981"], ["≥98.5%", "#22d3ee"], ["≥97.5%", "#f59e0b"], ["<97.5%", "#f43f5e"]].map(([l, c]) => (
                    <div key={l} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 10, color: "#475569", fontFamily: "monospace" }}>
                      <span style={{ width: 8, height: 8, borderRadius: 2, background: c, display: "inline-block" }} />
                      {l}
                    </div>
                  ))}
                </div>
              </Panel>

              <Panel title="Repudiation Rate by Insurer (Bottom 12) · FY 2021-22" tag="BAR" delay={0.1}>
                <ResponsiveContainer width="100%" height={320}>
                  <BarChart data={[...DATA.repudiation].reverse()} layout="vertical" margin={{ left: 10, right: 20, top: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="2 4" stroke="rgba(255,255,255,0.04)" horizontal={false} />
                    <XAxis type="number" tick={{ fontSize: 10, fill: "#334155", fontFamily: "monospace" }} axisLine={false} tickLine={false} />
                    <YAxis type="category" dataKey="name" width={80} tick={{ fontSize: 10, fill: "#64748b" }} axisLine={false} tickLine={false} />
                    <Tooltip content={<CustomTip />} />
                    <Bar dataKey="rate" name="Repud. %" radius={[0, 4, 4, 0]} maxBarSize={14}>
                      {[...DATA.repudiation].reverse().map((d, i) => (
                        <Cell key={i} fill={d.rate > 3 ? "#f43f5e" : d.rate > 2 ? "#f59e0b" : "#22d3ee"} opacity={0.8} />
                      ))}
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
                    <Area type="monotone" dataKey="ratio" name="Settlement %" stroke="#22d3ee" strokeWidth={2} fill="url(#ratioGrad)" dot={{ r: 4, fill: "#22d3ee", strokeWidth: 0 }} activeDot={{ r: 6 }} />
                  </AreaChart>
                </ResponsiveContainer>
              </Panel>

              <Panel title="Total Claims Filed vs Paid · 5-Year" tag="BAR" delay={0.1}>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={DATA.trend} margin={{ left: -10, right: 10, top: 4, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="2 4" stroke="rgba(255,255,255,0.04)" />
                    <XAxis dataKey="year" tick={{ fontSize: 10, fill: "#475569", fontFamily: "monospace" }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 10, fill: "#334155", fontFamily: "monospace" }} axisLine={false} tickLine={false} tickFormatter={v => `${(v / 1000).toFixed(0)}k`} />
                    <Tooltip content={<CustomTip />} />
                    <Legend wrapperStyle={{ fontSize: 10, color: "#475569" }} />
                    <Bar dataKey="total" name="Filed" fill="rgba(139,92,246,0.5)" radius={[4, 4, 0, 0]} maxBarSize={32} />
                    <Bar dataKey="paid" name="Paid" fill="#22d3ee" radius={[4, 4, 0, 0]} maxBarSize={32} />
                  </BarChart>
                </ResponsiveContainer>
              </Panel>

              <Panel title="Repudiated Claims Count · 5-Year" tag="LINE" delay={0.2} >
                <ResponsiveContainer width="100%" height={220}>
                  <LineChart data={DATA.trend} margin={{ left: -10, right: 10, top: 4, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="2 4" stroke="rgba(255,255,255,0.04)" />
                    <XAxis dataKey="year" tick={{ fontSize: 10, fill: "#475569", fontFamily: "monospace" }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 10, fill: "#334155", fontFamily: "monospace" }} axisLine={false} tickLine={false} />
                    <Tooltip content={<CustomTip />} />
                    <Line type="monotone" dataKey="repud" name="Repudiated" stroke="#f43f5e" strokeWidth={2} dot={{ r: 4, fill: "#f43f5e", strokeWidth: 0 }} activeDot={{ r: 6 }} />
                  </LineChart>
                </ResponsiveContainer>
                <div style={{ marginTop: 8, fontSize: 11, color: "#334155", fontFamily: "monospace" }}>
                  ↓ Repudiations fell from 4,501 (2017-18) to 3,388 (2021-22) — industry improving
                </div>
              </Panel>
            </div>
          )}

          {activeQuery === "repud" && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(500px,1fr))", gap: 16 }}>

              <Panel title="Highest Repudiation Rates · FY 2021-22" tag="BAR" delay={0}>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={DATA.repudiation} margin={{ left: -10, right: 20, top: 4, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="2 4" stroke="rgba(255,255,255,0.04)" />
                    <XAxis dataKey="name" tick={{ fontSize: 9, fill: "#475569" }} axisLine={false} tickLine={false} angle={-30} textAnchor="end" height={40} />
                    <YAxis tick={{ fontSize: 10, fill: "#334155", fontFamily: "monospace" }} axisLine={false} tickLine={false} />
                    <Tooltip content={<CustomTip />} />
                    <ReferenceLine y={2} stroke="rgba(245,158,11,0.4)" strokeDasharray="4 4" label={{ value: "2% threshold", fill: "#f59e0b", fontSize: 9, position: "right" }} />
                    <Bar dataKey="rate" name="Repud. %" radius={[4, 4, 0, 0]} maxBarSize={28}>
                      {DATA.repudiation.map((d, i) => (
                        <Cell key={i} fill={d.rate > 3 ? "#f43f5e" : d.rate > 2 ? "#f59e0b" : "#22d3ee"} opacity={0.85} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </Panel>

              <Panel title="Settlement vs Repudiation Trade-off" tag="SCATTER" delay={0.1}>
                <ResponsiveContainer width="100%" height={300}>
                  <ScatterChart margin={{ left: -10, right: 20, top: 4, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="2 4" stroke="rgba(255,255,255,0.04)" />
                    <XAxis dataKey="ratio" name="Settlement %" type="number" domain={[95, 100]} tick={{ fontSize: 10, fill: "#475569", fontFamily: "monospace" }} axisLine={false} tickLine={false} label={{ value: "Settlement %", fill: "#334155", fontSize: 9, position: "insideBottom", offset: -4 }} />
                    <YAxis dataKey="repud" name="Repud. %" type="number" tick={{ fontSize: 10, fill: "#334155", fontFamily: "monospace" }} axisLine={false} tickLine={false} label={{ value: "Repud %", fill: "#334155", fontSize: 9, angle: -90, position: "insideLeft" }} />
                    <Tooltip content={<CustomTip />} />
                    <Scatter data={DATA.settlement2022.map(d => ({ ...d, repud: d.repud }))} fill="#22d3ee" opacity={0.7} />
                  </ScatterChart>
                </ResponsiveContainer>
                <div style={{ fontSize: 11, color: "#334155", fontFamily: "monospace", marginTop: 8 }}>
                  Strong negative correlation: higher repudiation → lower settlement ratio
                </div>
              </Panel>
            </div>
          )}

          {activeQuery === "scatter" && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(500px,1fr))", gap: 16 }}>

              <Panel title="Claim Volume vs Settlement Ratio · FY 2021-22" tag="SCATTER" delay={0}>
                <ResponsiveContainer width="100%" height={320}>
                  <ScatterChart margin={{ left: 0, right: 20, top: 8, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="2 4" stroke="rgba(255,255,255,0.04)" />
                    <XAxis dataKey="x" name="Total Claims" type="number" tick={{ fontSize: 10, fill: "#475569", fontFamily: "monospace" }} axisLine={false} tickLine={false} tickFormatter={v => `${(v / 1000).toFixed(0)}k`} label={{ value: "Total Claims (volume)", fill: "#334155", fontSize: 9, position: "insideBottom", offset: -10 }} />
                    <YAxis dataKey="y" name="Settlement %" type="number" domain={[94, 100]} tick={{ fontSize: 10, fill: "#334155", fontFamily: "monospace" }} axisLine={false} tickLine={false} label={{ value: "Settlement %", fill: "#334155", fontSize: 9, angle: -90, position: "insideLeft", offset: 10 }} />
                    <Tooltip content={(props) => {
                      if (!props.active || !props.payload?.length) return null;
                      const d = props.payload[0]?.payload;
                      return (
                        <div style={{ background: "rgba(10,12,16,0.97)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 10, padding: "10px 14px", fontSize: 12, color: "#e2e8f0" }}>
                          <div style={{ color: "#22d3ee", fontWeight: 600, marginBottom: 4 }}>{d?.name}</div>
                          <div style={{ color: "#64748b" }}>Volume: <span style={{ color: "#f1f5f9" }}>{d?.x?.toLocaleString()}</span></div>
                          <div style={{ color: "#64748b" }}>Settlement: <span style={{ color: "#10b981" }}>{d?.y}%</span></div>
                          <div style={{ color: "#64748b" }}>Repud: <span style={{ color: "#f43f5e" }}>{d?.r}%</span></div>
                        </div>
                      );
                    }} />
                    <Scatter data={DATA.scatter} fill="#22d3ee">
                      {DATA.scatter.map((d, i) => (
                        <Cell key={i} fill={d.r > 3 ? "#f43f5e" : d.r > 1.5 ? "#f59e0b" : "#10b981"} opacity={0.8} />
                      ))}
                    </Scatter>
                  </ScatterChart>
                </ResponsiveContainer>
                <div style={{ display: "flex", gap: 16, marginTop: 8, justifyContent: "center" }}>
                  {[["Repud >3%", "#f43f5e"], ["Repud >1.5%", "#f59e0b"], ["Repud ≤1.5%", "#10b981"]].map(([l, c]) => (
                    <div key={l} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 10, color: "#475569", fontFamily: "monospace" }}>
                      <span style={{ width: 8, height: 8, borderRadius: "50%", background: c, display: "inline-block" }} />
                      {l}
                    </div>
                  ))}
                </div>
              </Panel>

              <Panel title="Top Insurers by Total Claims Volume · FY 2021-22" tag="BAR" delay={0.1}>
                <ResponsiveContainer width="100%" height={320}>
                  <BarChart data={[...DATA.scatter].sort((a, b) => b.x - a.x).slice(0, 10)} layout="vertical" margin={{ left: 10, right: 30, top: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="2 4" stroke="rgba(255,255,255,0.04)" horizontal={false} />
                    <XAxis type="number" tick={{ fontSize: 10, fill: "#334155", fontFamily: "monospace" }} axisLine={false} tickLine={false} tickFormatter={v => `${(v / 1000).toFixed(0)}k`} />
                    <YAxis type="category" dataKey="name" width={80} tick={{ fontSize: 10, fill: "#64748b" }} axisLine={false} tickLine={false} />
                    <Tooltip content={<CustomTip />} />
                    <Bar dataKey="x" name="Total Claims" radius={[0, 4, 4, 0]} maxBarSize={16}>
                      {[...DATA.scatter].sort((a, b) => b.x - a.x).slice(0, 10).map((_, i) => (
                        <Cell key={i} fill={BAR_GRADIENT[i % BAR_GRADIENT.length]} opacity={0.8} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </Panel>
            </div>
          )}
          {insight && (

            <div
              style={{
                marginTop: 20,
                padding: "18px",
                borderRadius: "12px",
                background: "rgba(34,211,238,0.05)",
                border: "1px solid rgba(34,211,238,0.2)"
              }}
            >

              <div style={{ color: "#22d3ee", fontWeight: 600 }}>
                AI Insight
              </div>

              <p style={{ marginTop: 6, color: "#e2e8f0" }}>
                {insight}
              </p>

            </div>

          )}
          {/* ── FOOTER ── */}
          <div style={{
            marginTop: 48, borderTop: "1px solid rgba(255,255,255,0.04)",
            paddingTop: 24, display: "flex", justifyContent: "space-between", alignItems: "center",
            flexWrap: "wrap", gap: 12,
          }}>
            <div style={{ fontFamily: "monospace", fontSize: 11, color: "#1e293b" }}>
              © 2024 ConverSight · Source: IRDAI Annual Reports · India Life Insurance Death Claims
            </div>
            <div style={{ display: "flex", gap: 16 }}>
              {["19 Insurers", "5 FY Periods", "151 Records", "Individual Death Claims"].map(t => (
                <span key={t} style={{
                  fontSize: 10, color: "#22d3ee", fontFamily: "monospace", letterSpacing: "0.08em",
                  background: "rgba(34,211,238,0.06)", padding: "3px 10px", borderRadius: 20,
                  border: "1px solid rgba(34,211,238,0.12)",
                }}>{t}</span>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
