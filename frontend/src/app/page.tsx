"use client";

import { useState, useMemo } from "react";
import Link from "next/link";

const DEMO_FACTORS = [
  "Fed Signaling",
  "Inflation Data",
  "Market Sentiment",
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

export default function Home() {
  const marketPrice = 0.72;
  const [values, setValues] = useState<number[]>([0, 0, 0]);

  const { estimate, edge } = useMemo(() => {
    const weight = 1 / DEMO_FACTORS.length;
    const totalAdj = values.reduce((sum, v) => sum + v * weight * MAX_SHIFT, 0);
    const est = clamp(marketPrice + totalAdj, 0.01, 0.99);
    return { estimate: est, edge: est - marketPrice };
  }, [values]);

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

  const anyChanged = values.some((v) => v !== 0);

  return (
    <div className="max-w-5xl mx-auto px-5">
      {/* Hero */}
      <section className="pt-12 pb-8 sm:pt-20 sm:pb-12">
        <h1 className="font-serif text-3xl sm:text-5xl leading-[1.15] mb-4 max-w-lg">
          Model any event.<br />
          Find your edge.
        </h1>
        <p className="text-warm-600 text-base sm:text-lg leading-relaxed max-w-md mb-6">
          Signal pulls live odds from prediction markets and lets you build your
          own probability model. Adjust the factors, see where you disagree with
          the market, and spot opportunities others miss.
        </p>
        <Link
          href="/markets"
          className="inline-block bg-ink text-cream px-5 py-3 text-sm rounded hover:bg-warm-800 transition-colors"
        >
          Explore markets
        </Link>
      </section>

      {/* Live demo */}
      <section className="pb-10 sm:pb-16">
        <div className="border border-sand rounded-lg overflow-hidden">
          <div className="px-5 py-4 border-b border-sand bg-warm-50">
            <p className="text-xs text-warm-500 uppercase tracking-wide mb-1">Try it now</p>
            <p className="font-serif text-lg sm:text-xl leading-snug">
              Will the Fed cut rates before July 2026?
            </p>
          </div>

          <div className="p-5">
            {/* Comparison bar */}
            <div className="mb-6">
              <div className="flex items-baseline justify-between mb-2">
                <div className="text-sm">
                  <span className="text-warm-500">Market says </span>
                  <span className="font-mono font-medium">{marketPct}%</span>
                </div>
                <div className="text-sm">
                  <span className="text-warm-500">You say </span>
                  <span
                    className="font-mono font-medium"
                    style={{ color: anyChanged ? (edgePositive ? "#5a8a5e" : "#b85c4a") : "#1a1a1a" }}
                  >
                    {estimatePct}%
                  </span>
                </div>
              </div>
              <div className="relative h-3 bg-sand rounded-full overflow-hidden">
                <div
                  className="absolute top-0 h-full w-0.5 bg-warm-400 z-10"
                  style={{ left: `${marketPct}%` }}
                />
                <div
                  className="h-full rounded-full transition-all duration-200"
                  style={{
                    width: `${estimatePct}%`,
                    backgroundColor: anyChanged
                      ? edgePositive ? "#5a8a5e" : "#b85c4a"
                      : "#1a1a1a",
                  }}
                />
              </div>
              {anyChanged && (
                <p
                  className="text-right mt-1.5 text-sm font-mono font-medium"
                  style={{ color: edgePositive ? "#5a8a5e" : "#b85c4a" }}
                >
                  {edgePositive ? "+" : ""}{edgePct}% edge
                </p>
              )}
            </div>

            {/* Sliders */}
            <div className="space-y-4">
              {DEMO_FACTORS.map((name, i) => (
                <div key={name}>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-sm text-warm-700">{name}</label>
                    <span className="text-xs text-warm-500 tabular-nums">
                      {sliderLabel(values[i])}
                    </span>
                  </div>
                  <input
                    type="range"
                    min={-2}
                    max={2}
                    step={0.1}
                    value={values[i]}
                    onChange={(e) => updateFactor(i, parseFloat(e.target.value))}
                    className="factor-slider w-full"
                  />
                </div>
              ))}
            </div>

            {anyChanged && (
              <button
                onClick={() => setValues([0, 0, 0])}
                className="mt-3 text-xs text-warm-500 hover:text-ink transition-colors"
              >
                Reset
              </button>
            )}
          </div>
        </div>

        <p className="text-center text-xs text-warm-400 mt-3">
          Drag the sliders. Your probability updates in real time.
        </p>
      </section>

      {/* How it works */}
      <section className="border-t border-sand py-10 sm:py-14">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-10 text-sm">
          <div>
            <p className="font-serif text-lg mb-2">1. Browse</p>
            <p className="text-warm-600 leading-relaxed">
              Live markets from Polymarket and Manifold, updated every 15 minutes.
              Search by topic or filter by category.
            </p>
          </div>
          <div>
            <p className="font-serif text-lg mb-2">2. Model</p>
            <p className="text-warm-600 leading-relaxed">
              Adjust factor sliders to build your own probability estimate.
              Each market has factors tuned to its category.
            </p>
          </div>
          <div>
            <p className="font-serif text-lg mb-2">3. Find edge</p>
            <p className="text-warm-600 leading-relaxed">
              See exactly where your view differs from the market.
              Compare prices across platforms to find the best opportunity.
            </p>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="border-t border-sand py-8 mb-8">
        <div className="flex flex-wrap gap-8 text-sm text-warm-500">
          <span>Polymarket + Manifold markets</span>
          <span>Updated every 15 min</span>
          <span>Cross-platform price comparison</span>
        </div>
      </section>
    </div>
  );
}
