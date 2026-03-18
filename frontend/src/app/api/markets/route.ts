import { NextRequest, NextResponse } from "next/server";

const GAMMA_BASE = "https://gamma-api.polymarket.com";
const MANIFOLD_BASE = "https://api.manifold.markets/v0";
const KALSHI_BASE = "https://api.elections.kalshi.com/trade-api/v2";

interface NormalizedMarket {
  id: string;
  question: string;
  platform: string;
  yesPrice: number;
  volume: number;
  category: string;
  slug: string;
  endDate: string | null;
  image: string | null;
}

async function fetchPolymarket(limit: string, q: string): Promise<NormalizedMarket[]> {
  const params = new URLSearchParams({
    limit,
    active: "true",
    closed: "false",
    order: "volume",
    ascending: "false",
  });
  if (q) params.set("slug_contains", q);

  const resp = await fetch(`${GAMMA_BASE}/markets?${params}`, {
    next: { revalidate: 300 },
  });
  if (!resp.ok) throw new Error(`Polymarket ${resp.status}`);
  const raw = await resp.json();

  return raw
    .filter((m: any) => m.question)
    .map((m: any) => {
      let prices: number[] = [];
      try {
        prices = (
          typeof m.outcomePrices === "string"
            ? JSON.parse(m.outcomePrices)
            : m.outcomePrices || []
        ).map(Number);
      } catch {}

      return {
        id: m.conditionId || m.condition_id || m.id || "",
        question: m.question,
        platform: "Polymarket",
        yesPrice: prices[0] ?? 0,
        volume: Number(m.volume || m.volumeNum || 0),
        category: m.category || "",
        slug: m.slug || "",
        endDate: m.endDate || null,
        image: m.image || null,
      };
    });
}

async function fetchManifold(limit: string): Promise<NormalizedMarket[]> {
  const resp = await fetch(
    `${MANIFOLD_BASE}/markets?limit=${limit}&sort=most-traded`,
    { next: { revalidate: 300 } }
  );
  if (!resp.ok) throw new Error(`Manifold ${resp.status}`);
  const raw = await resp.json();

  return raw
    .filter((m: any) => m.question && m.outcomeType === "BINARY")
    .map((m: any) => ({
      id: m.id || "",
      question: m.question,
      platform: "Manifold",
      yesPrice: m.probability ?? 0,
      volume: Number(m.volume || 0),
      category: m.groupSlugs?.[0] || "",
      slug: m.slug || m.id || "",
      endDate: m.closeTime ? new Date(m.closeTime).toISOString() : null,
      image: null,
    }));
}

async function fetchKalshi(limit: string): Promise<NormalizedMarket[]> {
  const resp = await fetch(
    `${KALSHI_BASE}/markets?limit=${limit}&status=open`,
    { next: { revalidate: 300 } }
  );
  if (!resp.ok) throw new Error(`Kalshi ${resp.status}`);
  const raw = await resp.json();
  const markets = raw.markets || raw || [];

  return markets
    .filter((m: any) => m.title || m.ticker)
    .map((m: any) => ({
      id: m.ticker || m.id || "",
      question: m.title || m.ticker || "",
      platform: "Kalshi",
      yesPrice: m.yes_ask ?? m.last_price ?? m.yes_bid ?? 0,
      volume: Number(m.volume || 0),
      category: m.category || "",
      slug: m.ticker || m.id || "",
      endDate: m.close_time || m.expiration_time || null,
      image: m.image_url || null,
    }));
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const limit = searchParams.get("limit") || "100";
  const q = searchParams.get("q") || "";

  const results = await Promise.allSettled([
    fetchPolymarket(limit, q),
    fetchManifold(limit),
    fetchKalshi(limit),
  ]);

  const markets: NormalizedMarket[] = [];
  const errors: string[] = [];

  results.forEach((r, i) => {
    const name = ["Polymarket", "Manifold", "Kalshi"][i];
    if (r.status === "fulfilled") {
      markets.push(...r.value);
    } else {
      errors.push(`${name}: ${r.reason?.message || "unknown error"}`);
      console.error(`[markets] ${name} fetch failed:`, r.reason);
    }
  });

  if (markets.length === 0 && errors.length > 0) {
    return NextResponse.json(
      { error: "All platform APIs failed", details: errors },
      { status: 502 }
    );
  }

  // Sort by volume descending
  markets.sort((a, b) => b.volume - a.volume);

  return NextResponse.json(markets);
}
