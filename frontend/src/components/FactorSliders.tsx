"use client";

import { useState, useMemo } from "react";

const FACTOR_MAP: Record<string, string[]> = {
  Politics: [
    "Polling Momentum",
    "Economic Sentiment",
    "Incumbent Advantage",
    "Media Coverage",
    "Legal / Regulatory Risk",
  ],
  Crypto: [
    "Price Trend",
    "Regulatory News",
    "Institutional Adoption",
    "Market Sentiment",
    "Technical Indicators",
  ],
  Economics: [
    "Historical Precedent",
    "Fed Signaling",
    "Market Sentiment",
    "Data Trend",
    "Expert Consensus",
  ],
  AI: [
    "Technical Progress",
    "Regulatory Landscape",
    "Corporate Investment",
    "Public Sentiment",
    "Expert Consensus",
  ],
};

const DEFAULT_FACTORS = [
  "Historical Precedent",
  "Expert Consensus",
  "Public Sentiment",
  "Time Remaining",
  "Momentum",
];

const MAX_SHIFT = 0.15;

function clamp(v: number, min: number, max: number) {
  return Math.min(max, Math.max(min, v));
}

function sliderLabel(val: number): string {
  if (val <= -1.5) return "Very bearish";
  if (val <= -0.5) return "Bearish";
  if (val < 0.5) return "Neutral";
  if (val < 1.5) return "Bullish";
  return "Very bullish";
}

export function FactorSliders({
  marketPrice,
  category,
}: {
  marketPrice: number;
  category: string;
}) {
  const factors = FACTOR_MAP[category] || DEFAULT_FACTORS;
  const [values, setValues] = useState<number[]>(factors.map(() => 0));

  const { estimate, edge } = useMemo(() => {
    const weight = 1 / factors.length;
    const totalAdj = values.reduce(
      (sum, v) => sum + v * weight * MAX_SHIFT,
      0
    );
    const est = clamp(marketPrice + totalAdj, 0.01, 0.99);
    return { estimate: est, edge: est - marketPrice };
  }, [values, marketPrice, factors.length]);

  const marketPct = Math.round(marketPrice * 100);
  const estimatePct = Math.round(estimate * 100);
  const edgePct = Math.round(edge * 100);
  const edgePositive = edge >= 0;

  function updateFactor(index: number, val: number) {
    setValues((prev) => {
      const next = [...prev];
      next[index] = val;
      return next;
    });
  }

  function resetAll() {
    setValues(factors.map(() => 0));
  }

  const anyChanged = values.some((v) => v !== 0);

  return (
    <div className="border border-sand rounded-lg p-6">
      <div className="flex items-baseline justify-between mb-1">
        <h2 className="font-serif text-lg">Model Your View</h2>
        {anyChanged && (
          <button
            onClick={resetAll}
            className="text-xs text-warm-500 hover:text-ink transition-colors"
          >
            Reset
          </button>
        )}
      </div>
      <p className="text-sm text-warm-500 mb-6">
        Adjust factors to estimate your own probability.
      </p>

      {/* Result bar */}
      <div className="mb-8">
        <div className="relative h-3 bg-sand rounded-full overflow-hidden">
          {/* Market price marker */}
          <div
            className="absolute top-0 h-full w-0.5 bg-warm-400 z-10"
            style={{ left: `${marketPct}%` }}
          />
          {/* Your estimate fill */}
          <div
            className="h-full rounded-full transition-all duration-150"
            style={{
              width: `${estimatePct}%`,
              backgroundColor: edgePositive ? "#5a8a5e" : "#b85c4a",
            }}
          />
        </div>
        <div className="flex justify-between mt-2 text-xs text-warm-500">
          <span>0%</span>
          <span>100%</span>
        </div>
      </div>

      {/* Summary line */}
      <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1 mb-6 text-sm">
        <span className="text-warm-500">Market:</span>
        <span className="font-mono">{marketPct}%</span>
        <span className="text-warm-400 mx-1">&rarr;</span>
        <span className="text-warm-500">You:</span>
        <span className="font-mono">{estimatePct}%</span>
        <span className="text-warm-400 mx-1">&rarr;</span>
        <span className="text-warm-500">Edge:</span>
        <span
          className="font-mono font-medium"
          style={{ color: edgePositive ? "#5a8a5e" : "#b85c4a" }}
        >
          {edgePositive ? "+" : ""}
          {edgePct}%
        </span>
      </div>

      {/* Factor sliders */}
      <div className="space-y-5">
        {factors.map((name, i) => (
          <div key={name}>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-sm text-warm-700">{name}</label>
              <span className="text-xs text-warm-500 tabular-nums w-20 text-right">
                {sliderLabel(values[i])}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-[10px] text-warm-400 shrink-0 w-8 text-right">
                −2
              </span>
              <input
                type="range"
                min={-2}
                max={2}
                step={0.1}
                value={values[i]}
                onChange={(e) =>
                  updateFactor(i, parseFloat(e.target.value))
                }
                className="factor-slider flex-1"
              />
              <span className="text-[10px] text-warm-400 shrink-0 w-6">
                +2
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
