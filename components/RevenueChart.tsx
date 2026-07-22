"use client";

import { useEffect, useRef, useState, useCallback } from "react";

type Period = "daily" | "weekly" | "monthly" | "yearly";

interface ChartData {
  labels: string[];
  data: number[];
  total: number;
  prevTotal: number;
  changePct: number;
  period: Period;
}

const PERIOD_LABELS: Record<Period, string> = {
  daily: "Last 30 Days",
  weekly: "Last 12 Weeks",
  monthly: "Last 12 Months",
  yearly: "Last 5 Years",
};

const PERIODS: Period[] = ["daily", "weekly", "monthly", "yearly"];

function formatINR(val: number): string {
  if (val >= 10_00_000) return `₹${(val / 10_00_000).toFixed(1)}L`;
  if (val >= 1_000) return `₹${(val / 1_000).toFixed(1)}K`;
  return `₹${val.toLocaleString("en-IN")}`;
}

function formatINRFull(val: number): string {
  return `₹${val.toLocaleString("en-IN")}`;
}

export function RevenueChart() {
  const [period, setPeriod] = useState<Period>("monthly");
  const [chartData, setChartData] = useState<ChartData | null>(null);
  const [loading, setLoading] = useState(true);
  const [tooltip, setTooltip] = useState<{
    visible: boolean;
    x: number;
    y: number;
    label: string;
    value: number;
    index: number;
  }>({ visible: false, x: 0, y: 0, label: "", value: 0, index: -1 });

  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [svgWidth, setSvgWidth] = useState(800);

  const fetchData = useCallback(async (p: Period) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/revenue-chart?period=${p}`);
      if (res.ok) {
        const json = await res.json();
        setChartData(json);
      }
    } catch (err) {
      console.error("RevenueChart fetch failed:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData(period);
  }, [period, fetchData]);

  // Responsive width observer
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setSvgWidth(entry.contentRect.width || 800);
      }
    });
    ro.observe(el);
    setSvgWidth(el.getBoundingClientRect().width || 800);
    return () => ro.disconnect();
  }, []);

  // ─── SVG chart geometry ───────────────────────────────────────────────
  // On small screens narrow the left pad so the chart isn't squeezed
  const isMobile = svgWidth < 480;
  const PAD = {
    top: 20,
    right: isMobile ? 8 : 24,
    bottom: 44,
    left: isMobile ? 46 : 64,
  };
  const svgHeight = isMobile ? 180 : 220;
  const chartW = Math.max(svgWidth - PAD.left - PAD.right, 1);
  const chartH = svgHeight - PAD.top - PAD.bottom;

  const data = chartData?.data ?? [];
  const labels = chartData?.labels ?? [];
  const maxVal = Math.max(...data, 1);

  // Y-axis tick helpers
  const yTicks = 4;
  const step = Math.ceil(maxVal / yTicks / 100) * 100 || 500;
  const yMax = step * yTicks;

  function xPos(i: number): number {
    if (data.length <= 1) return PAD.left + chartW / 2;
    return PAD.left + (i / (data.length - 1)) * chartW;
  }

  function yPos(val: number): number {
    return PAD.top + chartH - (val / yMax) * chartH;
  }

  // Build smooth bezier path
  function buildPath(): string {
    if (data.length === 0) return "";
    if (data.length === 1) {
      const x = xPos(0);
      const y = yPos(data[0]);
      return `M ${x} ${y}`;
    }

    let d = `M ${xPos(0)} ${yPos(data[0])}`;
    for (let i = 1; i < data.length; i++) {
      const x1 = xPos(i - 1);
      const y1 = yPos(data[i - 1]);
      const x2 = xPos(i);
      const y2 = yPos(data[i]);
      const cpx = (x1 + x2) / 2;
      d += ` C ${cpx} ${y1} ${cpx} ${y2} ${x2} ${y2}`;
    }
    return d;
  }

  function buildArea(): string {
    if (data.length === 0) return "";
    const bottom = PAD.top + chartH;
    const path = buildPath();
    return `${path} L ${xPos(data.length - 1)} ${bottom} L ${xPos(0)} ${bottom} Z`;
  }

  // How many labels to show so they don't overlap
  // On mobile be much more aggressive about thinning
  function shouldShowLabel(i: number): boolean {
    const total = labels.length;
    // Estimate how many pixels per label
    const pxPerLabel = chartW / Math.max(total - 1, 1);
    // If labels are too close, thin them out
    const minPx = isMobile ? 36 : 48;
    const step = Math.max(1, Math.ceil(minPx / pxPerLabel));
    return i % step === 0 || i === total - 1;
  }

  function handleMouseMove(e: React.MouseEvent<SVGSVGElement>) {
    if (data.length === 0) return;
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect) return;
    const mouseX = e.clientX - rect.left;
    const relX = mouseX - PAD.left;
    const ratio = Math.max(0, Math.min(1, relX / chartW));
    const idx = Math.round(ratio * (data.length - 1));
    const x = xPos(idx);
    const y = yPos(data[idx]);
    setTooltip({
      visible: true,
      x,
      y,
      label: labels[idx] ?? "",
      value: data[idx] ?? 0,
      index: idx,
    });
  }

  function handleMouseLeave() {
    setTooltip((t) => ({ ...t, visible: false, index: -1 }));
  }

  const linePath = buildPath();
  const areaPath = buildArea();
  const changePct = chartData?.changePct ?? 0;
  const isUp = changePct >= 0;

  return (
    <div
      className="card pad"
      style={{ display: "grid", gap: 0, animation: "fadeInUp 0.5s ease forwards" }}
    >
      {/* ── Header ── */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          flexWrap: "wrap",
          gap: 12,
          marginBottom: 20,
        }}
      >
        <div>
          <p
            className="filters-group-title"
            style={{ margin: 0, fontSize: 11, marginBottom: 4 }}
          >
            Revenue Overview
          </p>
          <div style={{ display: "flex", alignItems: "baseline", gap: 12, flexWrap: "wrap" }}>
            <h2
              style={{
                fontSize: 28,
                fontWeight: 800,
                color: "var(--sage-dark)",
                margin: 0,
                letterSpacing: "-0.5px",
                lineHeight: 1.1,
              }}
            >
              {loading ? "—" : formatINRFull(chartData?.total ?? 0)}
            </h2>

            {!loading && chartData && (
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 4,
                  fontSize: 12,
                  fontWeight: 700,
                  padding: "3px 10px",
                  borderRadius: 999,
                  background: isUp
                    ? "rgba(62, 142, 117, 0.12)"
                    : "rgba(201, 74, 74, 0.10)",
                  color: isUp ? "var(--success)" : "var(--error)",
                }}
              >
                <span style={{ fontSize: 10 }}>{isUp ? "▲" : "▼"}</span>
                {Math.abs(changePct)}% vs prev period
              </span>
            )}
          </div>
          {!loading && chartData && (
            <p style={{ fontSize: 12, color: "var(--muted)", margin: "4px 0 0 0" }}>
              {PERIOD_LABELS[period]}
            </p>
          )}
        </div>

        {/* Period filter tabs */}
        <div
          style={{
            display: "flex",
            gap: 4,
            background: "var(--bg-secondary)",
            padding: 4,
            borderRadius: "var(--radius-sm)",
            border: "1px solid var(--line)",
            flexShrink: 0,
            flexWrap: "wrap",
          }}
        >
          {PERIODS.map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              style={{
                padding: isMobile ? "5px 8px" : "5px 12px",
                fontSize: isMobile ? 11 : 12,
                fontWeight: 600,
                borderRadius: "var(--radius-sm)",
                border: "none",
                cursor: "pointer",
                transition: "all 0.2s ease",
                background:
                  period === p ? "var(--sage-dark)" : "transparent",
                color: period === p ? "#fff" : "var(--muted)",
                letterSpacing: 0.3,
                whiteSpace: "nowrap",
              }}
            >
              {p.charAt(0).toUpperCase() + p.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* ── Chart ── */}
      <div
        ref={containerRef}
        style={{
          width: "100%",
          position: "relative",
          overflowX: "hidden",
        }}
      >
        {loading ? (
          <div
            className="skeleton"
            style={{ height: svgHeight, borderRadius: "var(--radius-sm)" }}
          />
        ) : data.length === 0 || data.every((v) => v === 0) ? (
          <div
            style={{
              height: svgHeight,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              color: "var(--muted)",
              fontSize: 14,
              gap: 8,
              background: "var(--bg-secondary)",
              borderRadius: "var(--radius-sm)",
              border: "1px solid var(--line)",
            }}
          >
            <span style={{ fontSize: 28 }}>📊</span>
            <span>No revenue data for this period yet</span>
            <span style={{ fontSize: 12 }}>Revenue will appear here once orders are placed</span>
          </div>
        ) : (
          <svg
            ref={svgRef}
            width={svgWidth}
            height={svgHeight}
            style={{ display: "block", overflow: "hidden", cursor: "crosshair" }}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
          >
            <defs>
              <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#0F7F8F" stopOpacity="0.18" />
                <stop offset="100%" stopColor="#0F7F8F" stopOpacity="0.01" />
              </linearGradient>
              <linearGradient id="lineGrad" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#14B8C4" />
                <stop offset="100%" stopColor="#0F7F8F" />
              </linearGradient>
            </defs>

            {/* Y-axis grid lines + labels */}
            {Array.from({ length: yTicks + 1 }, (_, i) => {
              const val = step * i;
              const y = yPos(val);
              return (
                <g key={i}>
                  <line
                    x1={PAD.left}
                    y1={y}
                    x2={PAD.left + chartW}
                    y2={y}
                    stroke="var(--line)"
                    strokeWidth={1}
                    strokeDasharray={i === 0 ? "none" : "4 4"}
                  />
                  <text
                    x={PAD.left - 8}
                    y={y + 4}
                    textAnchor="end"
                    fontSize={10}
                    fill="var(--muted)"
                    fontFamily="Outfit, sans-serif"
                  >
                    {formatINR(val)}
                  </text>
                </g>
              );
            })}

            {/* Area fill */}
            <path d={areaPath} fill="url(#revenueGrad)" />

            {/* Line */}
            <path
              d={linePath}
              fill="none"
              stroke="url(#lineGrad)"
              strokeWidth={2.5}
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* X-axis labels */}
            {labels.map((label, i) =>
              shouldShowLabel(i) ? (
                <text
                  key={i}
                  x={xPos(i)}
                  y={PAD.top + chartH + 18}
                  textAnchor="middle"
                  fontSize={10}
                  fill="var(--muted)"
                  fontFamily="Outfit, sans-serif"
                >
                  {label}
                </text>
              ) : null
            )}

            {/* Hover vertical line + dot */}
            {tooltip.visible && tooltip.index >= 0 && (
              <>
                <line
                  x1={tooltip.x}
                  y1={PAD.top}
                  x2={tooltip.x}
                  y2={PAD.top + chartH}
                  stroke="var(--sage)"
                  strokeWidth={1}
                  strokeDasharray="4 3"
                />
                <circle
                  cx={tooltip.x}
                  cy={tooltip.y}
                  r={5}
                  fill="#0F7F8F"
                  stroke="#fff"
                  strokeWidth={2}
                />
              </>
            )}
          </svg>
        )}

        {/* Floating tooltip */}
        {tooltip.visible && tooltip.index >= 0 && !loading && (
          <div
            style={{
              position: "absolute",
              pointerEvents: "none",
              left: Math.min(
                Math.max(tooltip.x - 60, 0),
                svgWidth - 130
              ),
              top: Math.max(tooltip.y - 60, 4),
              background: "var(--ink)",
              color: "#fff",
              fontSize: 12,
              fontWeight: 600,
              padding: "6px 12px",
              borderRadius: "var(--radius-sm)",
              boxShadow: "0 4px 16px rgba(0,0,0,0.18)",
              whiteSpace: "nowrap",
              zIndex: 10,
            }}
          >
            <div style={{ fontSize: 10, fontWeight: 400, opacity: 0.7, marginBottom: 2 }}>
              {tooltip.label}
            </div>
            {formatINRFull(tooltip.value)}
          </div>
        )}
      </div>
    </div>
  );
}
