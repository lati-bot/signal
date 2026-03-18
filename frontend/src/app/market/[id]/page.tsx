"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { ProbabilitySlider } from "@/components/ProbabilitySlider";
import { FactorSliders } from "@/components/FactorSliders";
import { PriceChart } from "@/components/PriceChart";

interface Outcome {
  name: string;
  price: number;
}

interface CrossPlatform {
  platform: string;
  question: string;
  yesPrice: number;
  volume: number;
  url: string;
}

interface MarketDetail {
  id: string;
  question: string;
  description: string;
  platform: string;
  yesPrice: number;
  volume: number;
  category: string;
  slug: string;
  endDate: string | null;
  image: string | null;
  outcomes: Outcome[];
  crossPlatform: CrossPlatform[];
}

function fmtVolume(v: number): string {
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `$${(v / 1_000).toFixed(0)}K`;
  return `$${v.toFixed(0)}`;
}

function fmtDate(iso: string | null): string {
  if (!iso) return "No end date";
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function MarketDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [market, setMarket] = useState<MarketDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [priceHistory, setPriceHistory] = useState<
    { timestamp: number; price: number }[]
  >([]);
  const [historyInterval, setHistoryInterval] = useState("1w");
  const [historyLoading, setHistoryLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/markets/${encodeURIComponent(id)}`)
      .then((r) => {
        if (!r.ok) throw new Error("Failed to load market");
        return r.json();
      })
      .then(setMarket)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  // Fetch price history
  useEffect(() => {
    setHistoryLoading(true);
    fetch(
      `/api/markets/${encodeURIComponent(id)}/history?interval=${historyInterval}`
    )
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => {
        if (Array.isArray(data)) setPriceHistory(data);
      })
      .catch(() => {})
      .finally(() => setHistoryLoading(false));
  }, [id, historyInterval]);

  function shareMarket() {
    const url = window.location.href;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-5 py-10">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-sand rounded w-24" />
          <div className="h-8 bg-sand rounded w-3/4" />
          <div className="h-40 bg-sand rounded" />
        </div>
      </div>
    );
  }

  if (error || !market) {
    return (
      <div className="max-w-3xl mx-auto px-5 py-10">
        <Link
          href="/markets"
          className="text-sm text-warm-500 hover:text-ink transition-colors"
        >
          &larr; Back to markets
        </Link>
        <p className="mt-6 text-warm-600">
          {error || "Market not found."}
        </p>
      </div>
    );
  }

  const pct = Math.round(market.yesPrice * 100);

  return (
    <div className="max-w-3xl mx-auto px-5 py-8">
      <div className="flex items-center justify-between mb-6">
        <Link
          href="/markets"
          className="text-sm text-warm-500 hover:text-ink transition-colors"
        >
          &larr; Markets
        </Link>
        <button
          onClick={shareMarket}
          className="text-sm text-warm-500 hover:text-ink transition-colors"
        >
          {copied ? "Copied!" : "Share"}
        </button>
      </div>

      <div className="mb-8">
        <div className="flex items-center gap-2 mb-2 flex-wrap">
          <span className="text-[11px] text-warm-500 bg-warm-100 px-1.5 py-0.5 rounded">
            {market.category || market.platform}
          </span>
          <span className="text-[11px] text-warm-400">
            Closes {fmtDate(market.endDate)}
          </span>
        </div>
        <h1 className="font-serif text-2xl sm:text-3xl leading-snug mb-4">
          {market.question}
        </h1>
      </div>

      {/* Main probability */}
      <div className="border border-sand rounded-lg p-5 sm:p-6 mb-4">
        <ProbabilitySlider value={market.yesPrice} label="Yes" />

        {market.outcomes.length > 2 && (
          <div className="mt-3 space-y-2">
            {market.outcomes.slice(1).map((o) => (
              <ProbabilitySlider key={o.name} value={o.price} label={o.name} />
            ))}
          </div>
        )}

        <div className="mt-5 flex flex-wrap gap-x-8 gap-y-2 text-sm">
          <div>
            <span className="text-warm-500">Volume</span>
            <p className="font-mono">{fmtVolume(market.volume)}</p>
          </div>
          <div>
            <span className="text-warm-500">Source</span>
            <p>{market.platform}</p>
          </div>
        </div>
      </div>

      {/* Price history chart */}
      {market.platform === "Polymarket" && (
        <div className="mb-4">
          <PriceChart
            data={priceHistory}
            interval={historyInterval}
            onIntervalChange={setHistoryInterval}
            loading={historyLoading}
          />
        </div>
      )}

      {/* Factor Sliders — THE feature, prominent placement */}
      <div className="mb-4">
        <FactorSliders
          marketPrice={market.yesPrice}
          category={market.category}
          question={market.question}
        />
      </div>

      {/* Cross-platform comparison */}
      {market.crossPlatform.length > 0 && (
        <div className="border border-sand rounded-lg p-5 sm:p-6 mb-4">
          <h2 className="font-serif text-lg mb-4">
            Same event, other platforms
          </h2>
          <div className="space-y-4">
            {market.crossPlatform.map((cp, i) => (
              <div key={i} className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-warm-500 mb-0.5">{cp.platform}</p>
                  <p className="text-sm leading-snug line-clamp-2">{cp.question}</p>
                  {cp.volume > 0 && (
                    <p className="text-xs text-warm-500 mt-1">
                      {fmtVolume(cp.volume)} volume
                    </p>
                  )}
                </div>
                <div className="text-right shrink-0">
                  <p className="font-mono text-xl">{Math.round(cp.yesPrice * 100)}%</p>
                  <a
                    href={cp.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-accent hover:text-accent-dark transition-colors"
                  >
                    Trade &rarr;
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Description */}
      {market.description && (
        <div className="mt-8 border-t border-sand pt-6">
          <h2 className="font-serif text-lg mb-3">Resolution criteria</h2>
          <p className="text-sm text-warm-600 leading-relaxed whitespace-pre-line">
            {market.description.slice(0, 1500)}
            {market.description.length > 1500 && "..."}
          </p>
        </div>
      )}
    </div>
  );
}
