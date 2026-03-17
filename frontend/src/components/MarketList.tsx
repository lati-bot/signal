import { MarketCard } from "./MarketCard";

// Placeholder data until API is connected
const SAMPLE_MARKETS = [
  {
    id: 1,
    question: "Will the Fed cut rates before July 2026?",
    platform: "Polymarket",
    yesPrice: 0.72,
    volume: "$4.2M",
  },
  {
    id: 2,
    question: "Will Bitcoin reach $150k in 2026?",
    platform: "Kalshi",
    yesPrice: 0.18,
    volume: "$890K",
  },
  {
    id: 3,
    question: "Will California have a major earthquake in 2026?",
    platform: "Manifold",
    yesPrice: 0.04,
    volume: "$12K",
  },
];

export function MarketList() {
  return (
    <div className="space-y-3">
      {SAMPLE_MARKETS.map((m) => (
        <a key={m.id} href={`/market/${m.id}`} className="block">
          <MarketCard
            question={m.question}
            platform={m.platform}
            yesPrice={m.yesPrice}
            volume={m.volume}
          />
        </a>
      ))}
    </div>
  );
}
