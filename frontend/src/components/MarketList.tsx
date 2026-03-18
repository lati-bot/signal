"use client";

import { useEffect, useState } from "react";
import { MarketCard } from "./MarketCard";

interface Market {
  id: string;
  question: string;
  platform: string;
  yesPrice: number;
  volume: number;
  category: string;
  slug: string;
}

function fmtVolume(v: number): string {
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `$${(v / 1_000).toFixed(0)}K`;
  return `$${v.toFixed(0)}`;
}

const FALLBACK: Market[] = [
  { id: "1", question: "Will the Fed cut rates before July 2026?", platform: "Polymarket", yesPrice: 0.72, volume: 4200000, category: "Economics", slug: "" },
  { id: "2", question: "Will Bitcoin reach $150k in 2026?", platform: "Polymarket", yesPrice: 0.18, volume: 890000, category: "Crypto", slug: "" },
  { id: "3", question: "Will California have a major earthquake in 2026?", platform: "Polymarket", yesPrice: 0.04, volume: 12000, category: "Science", slug: "" },
];

export function MarketList() {
  const [markets, setMarkets] = useState<Market[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/markets?limit=30")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setMarkets(data);
        } else {
          setMarkets(FALLBACK);
        }
      })
      .catch(() => setMarkets(FALLBACK))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="border border-sand rounded-lg p-5 animate-pulse">
            <div className="h-4 bg-sand rounded w-1/4 mb-3" />
            <div className="h-5 bg-sand rounded w-3/4 mb-2" />
            <div className="h-3 bg-sand rounded w-1/3" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {markets.map((m) => (
        <a key={m.id} href={`/market/${m.id}`} className="block">
          <MarketCard
            question={m.question}
            platform={m.platform}
            yesPrice={m.yesPrice}
            volume={fmtVolume(m.volume)}
          />
        </a>
      ))}
    </div>
  );
}
