"use client";

interface SparklineProps {
  data: { timestamp: number; price: number }[];
  width?: number;
  height?: number;
  className?: string;
}

export function Sparkline({
  data,
  width = 120,
  height = 32,
  className = "",
}: SparklineProps) {
  if (!data || data.length < 2) return null;

  const prices = data.map((d) => d.price);
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  const range = max - min || 0.01;

  const padY = 3;
  const padX = 2;
  const innerW = width - padX * 2;
  const innerH = height - padY * 2;

  // Map to SVG coordinates
  const points = data.map((d, i) => ({
    x: padX + (i / (data.length - 1)) * innerW,
    y: padY + innerH - ((d.price - min) / range) * innerH,
  }));

  // Build smooth path using cardinal spline approximation
  let path = `M${points[0].x},${points[0].y}`;
  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1];
    const curr = points[i];
    const cpx = (prev.x + curr.x) / 2;
    path += ` C${cpx},${prev.y} ${cpx},${curr.y} ${curr.x},${curr.y}`;
  }

  // Determine color: compare last price to ~24h ago
  const last = prices[prices.length - 1];
  const compareIdx = Math.max(0, Math.floor(data.length * 0.7));
  const compare = prices[compareIdx];
  const diff = last - compare;
  const color =
    Math.abs(diff) < 0.005 ? "#94a3b8" : diff > 0 ? "#2d6a4f" : "#9b2226";

  const endPt = points[points.length - 1];

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className={className}
      style={{ display: "block" }}
    >
      <path
        d={path}
        fill="none"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx={endPt.x} cy={endPt.y} r={2} fill={color} />
    </svg>
  );
}

export function SparklinePlaceholder({
  width = 120,
  height = 32,
}: {
  width?: number;
  height?: number;
}) {
  return (
    <svg width={width} height={height} style={{ display: "block" }}>
      <line
        x1={4}
        y1={height / 2}
        x2={width - 4}
        y2={height / 2}
        stroke="#e8e2d9"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeDasharray="4 4"
      />
    </svg>
  );
}
