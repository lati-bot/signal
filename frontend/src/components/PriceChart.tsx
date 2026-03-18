"use client";

import { useState, useRef, useCallback } from "react";

interface PricePoint {
  timestamp: number;
  price: number;
}

interface PriceChartProps {
  data: PricePoint[];
  interval: string;
  onIntervalChange: (interval: string) => void;
  loading?: boolean;
}

const INTERVALS = [
  { label: "24h", value: "1d" },
  { label: "1W", value: "1w" },
  { label: "1M", value: "1m" },
  { label: "All", value: "all" },
];

function fmtDate(ts: number, interval: string): string {
  const d = new Date(ts * 1000);
  if (interval === "1d") {
    return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  }
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function fmtTooltipDate(ts: number): string {
  const d = new Date(ts * 1000);
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function PriceChart({
  data,
  interval,
  onIntervalChange,
  loading,
}: PriceChartProps) {
  const [tooltip, setTooltip] = useState<{
    x: number;
    y: number;
    price: number;
    timestamp: number;
  } | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  const W = 700;
  const H = 200;
  const padTop = 20;
  const padBottom = 30;
  const padLeft = 42;
  const padRight = 12;
  const innerW = W - padLeft - padRight;
  const innerH = H - padTop - padBottom;

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<SVGSVGElement>) => {
      if (!data.length || !svgRef.current) return;
      const rect = svgRef.current.getBoundingClientRect();
      const scaleX = W / rect.width;
      const mx = (e.clientX - rect.left) * scaleX - padLeft;
      const idx = Math.round((mx / innerW) * (data.length - 1));
      const clamped = Math.max(0, Math.min(data.length - 1, idx));
      const pt = data[clamped];
      const x = padLeft + (clamped / (data.length - 1)) * innerW;
      const y =
        padTop + innerH - ((pt.price - yMin) / (yRange || 0.01)) * innerH;
      setTooltip({ x, y, price: pt.price, timestamp: pt.timestamp });
    },
    [data]
  );

  if (loading || !data.length) {
    return (
      <div className="border border-sand rounded-lg p-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-serif text-lg">Price history</h2>
          <div className="flex gap-1">
            {INTERVALS.map((iv) => (
              <button
                key={iv.value}
                onClick={() => onIntervalChange(iv.value)}
                className={`text-xs px-2 py-1 rounded transition-colors ${
                  interval === iv.value
                    ? "bg-warm-200 text-ink"
                    : "text-warm-400 hover:text-warm-600"
                }`}
              >
                {iv.label}
              </button>
            ))}
          </div>
        </div>
        <div
          className="bg-sand rounded animate-pulse"
          style={{ height: 200 }}
        />
      </div>
    );
  }

  const prices = data.map((d) => d.price);
  const yMin = Math.max(0, Math.min(...prices) - 0.03);
  const yMax = Math.min(1, Math.max(...prices) + 0.03);
  const yRange = yMax - yMin || 0.01;

  // Build path
  const points = data.map((d, i) => ({
    x: padLeft + (i / (data.length - 1)) * innerW,
    y: padTop + innerH - ((d.price - yMin) / yRange) * innerH,
  }));

  let path = `M${points[0].x},${points[0].y}`;
  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1];
    const curr = points[i];
    const cpx = (prev.x + curr.x) / 2;
    path += ` C${cpx},${prev.y} ${cpx},${curr.y} ${curr.x},${curr.y}`;
  }

  // Grid lines (horizontal) at 10% intervals within visible range
  const gridLines: { y: number; label: string }[] = [];
  const step = yRange > 0.3 ? 0.2 : yRange > 0.1 ? 0.1 : 0.05;
  for (
    let v = Math.ceil(yMin / step) * step;
    v <= yMax;
    v += step
  ) {
    gridLines.push({
      y: padTop + innerH - ((v - yMin) / yRange) * innerH,
      label: `${Math.round(v * 100)}%`,
    });
  }

  // X-axis labels (5-7 evenly spaced)
  const xLabelCount = Math.min(6, data.length);
  const xLabels: { x: number; label: string }[] = [];
  for (let i = 0; i < xLabelCount; i++) {
    const idx = Math.round((i / (xLabelCount - 1)) * (data.length - 1));
    xLabels.push({
      x: padLeft + (idx / (data.length - 1)) * innerW,
      label: fmtDate(data[idx].timestamp, interval),
    });
  }

  const last = prices[prices.length - 1];
  const first = prices[0];
  const lineColor =
    Math.abs(last - first) < 0.005
      ? "#94a3b8"
      : last > first
        ? "#2d6a4f"
        : "#9b2226";

  return (
    <div className="border border-sand rounded-lg p-5">
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-serif text-lg">Price history</h2>
        <div className="flex gap-1">
          {INTERVALS.map((iv) => (
            <button
              key={iv.value}
              onClick={() => onIntervalChange(iv.value)}
              className={`text-xs px-2 py-1 rounded transition-colors ${
                interval === iv.value
                  ? "bg-warm-200 text-ink"
                  : "text-warm-400 hover:text-warm-600"
              }`}
            >
              {iv.label}
            </button>
          ))}
        </div>
      </div>
      <svg
        ref={svgRef}
        viewBox={`0 0 ${W} ${H}`}
        className="w-full"
        style={{ maxHeight: 220 }}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setTooltip(null)}
      >
        {/* Grid */}
        {gridLines.map((gl, i) => (
          <g key={i}>
            <line
              x1={padLeft}
              y1={gl.y}
              x2={W - padRight}
              y2={gl.y}
              stroke="#e8e2d9"
              strokeWidth={0.5}
            />
            <text
              x={padLeft - 6}
              y={gl.y + 3}
              textAnchor="end"
              fontSize={10}
              fill="#94a3b8"
              fontFamily="ui-monospace, monospace"
            >
              {gl.label}
            </text>
          </g>
        ))}

        {/* X labels */}
        {xLabels.map((xl, i) => (
          <text
            key={i}
            x={xl.x}
            y={H - 6}
            textAnchor="middle"
            fontSize={10}
            fill="#94a3b8"
          >
            {xl.label}
          </text>
        ))}

        {/* Line */}
        <path
          d={path}
          fill="none"
          stroke={lineColor}
          strokeWidth={1.8}
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Tooltip crosshair */}
        {tooltip && (
          <>
            <line
              x1={tooltip.x}
              y1={padTop}
              x2={tooltip.x}
              y2={padTop + innerH}
              stroke="#94a3b8"
              strokeWidth={0.5}
              strokeDasharray="3 3"
            />
            <circle cx={tooltip.x} cy={tooltip.y} r={3.5} fill={lineColor} />
            <rect
              x={Math.min(tooltip.x + 8, W - 115)}
              y={Math.max(tooltip.y - 28, 4)}
              width={105}
              height={24}
              rx={4}
              fill="#1a1a1a"
              opacity={0.9}
            />
            <text
              x={Math.min(tooltip.x + 14, W - 109)}
              y={Math.max(tooltip.y - 12, 20)}
              fontSize={10}
              fill="#faf8f5"
              fontFamily="ui-monospace, monospace"
            >
              {Math.round(tooltip.price * 100)}% · {fmtTooltipDate(tooltip.timestamp)}
            </text>
          </>
        )}
      </svg>
    </div>
  );
}
