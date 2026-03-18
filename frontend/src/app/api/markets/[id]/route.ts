import { NextRequest, NextResponse } from "next/server";

const GAMMA_BASE = "https://gamma-api.polymarket.com";
const MANIFOLD_BASE = "https://api.manifold.markets/v0";

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
  outcomes: { name: string; price: number }[];
  crossPlatform: {
    platform: string;
    question: string;
    yesPrice: number;
    volume: number;
    url: string;
  }[];
}

async function fetchPolymarket(id: string): Promise<MarketDetail | null> {
  let market: any = null;

  // Try slug first (most common from our UI)
  const resp = await fetch(
    `${GAMMA_BASE}/markets?slug=${encodeURIComponent(id)}&limit=1`,
    { next: { revalidate: 120 } }
  );
  if (resp.ok) {
    const data = await resp.json();
    if (Array.isArray(data) && data.length > 0 && data[0].slug === id) {
      market = data[0];
    }
  }

  // Try conditionId if slug didn't match exactly
  if (!market && id.startsWith("0x")) {
    const resp2 = await fetch(
      `${GAMMA_BASE}/markets?condition_id=${encodeURIComponent(id)}&limit=1`,
      { next: { revalidate: 120 } }
    );
    if (resp2.ok) {
      const data2 = await resp2.json();
      if (Array.isArray(data2) && data2.length > 0) market = data2[0];
    }
  }

  // Try numeric ID
  if (!market && /^\d+$/.test(id)) {
    const resp3 = await fetch(`${GAMMA_BASE}/markets/${encodeURIComponent(id)}`, {
      next: { revalidate: 120 },
    });
    if (resp3.ok) {
      const data3 = await resp3.json();
      if (data3 && data3.question) market = data3;
    }
  }

  if (!market) return null;

  let outcomes: string[] = [];
  let prices: number[] = [];
  try {
    outcomes =
      typeof market.outcomes === "string"
        ? JSON.parse(market.outcomes)
        : market.outcomes || [];
    prices = (
      typeof market.outcomePrices === "string"
        ? JSON.parse(market.outcomePrices)
        : market.outcomePrices || []
    ).map(Number);
  } catch {}

  return {
    id: market.conditionId || market.condition_id || market.id || "",
    question: market.question,
    description: market.description || "",
    platform: "Polymarket",
    yesPrice: prices[0] ?? 0,
    volume: Number(market.volume || 0),
    category: market.category || guessCategory(market.question),
    slug: market.slug || "",
    endDate: market.endDate || null,
    image: market.image || null,
    outcomes: outcomes.map((name, i) => ({ name, price: prices[i] ?? 0 })),
    crossPlatform: [],
  };
}

async function searchManifold(query: string): Promise<MarketDetail["crossPlatform"]> {
  try {
    const terms = query.split(/\s+/).slice(0, 6).join(" ");
    const resp = await fetch(
      `${MANIFOLD_BASE}/search-markets?term=${encodeURIComponent(terms)}&limit=3`,
      { next: { revalidate: 300 } }
    );
    if (!resp.ok) return [];
    const data = await resp.json();
    if (!Array.isArray(data)) return [];

    return data
      .filter((m: any) => m.probability != null)
      .slice(0, 2)
      .map((m: any) => ({
        platform: "Manifold",
        question: m.question,
        yesPrice: m.probability ?? 0,
        volume: m.totalLiquidity || m.volume || 0,
        url: `https://manifold.markets/${m.creatorUsername}/${m.slug}`,
      }));
  } catch {
    return [];
  }
}

function guessCategory(question: string): string {
  const q = question.toLowerCase();
  if (/president|election|trump|biden|democrat|republican|vote|governor|senate|congress/.test(q))
    return "Politics";
  if (/bitcoin|ethereum|crypto|btc|eth|token|defi/.test(q)) return "Crypto";
  if (/stock|s&p|nasdaq|dow|market|fed|rate|gdp|inflation/.test(q)) return "Economics";
  if (/war|ukraine|russia|china|nato|military|invasion/.test(q)) return "Geopolitics";
  if (/ai|artificial intelligence|gpt|openai|anthropic|model/.test(q)) return "AI";
  if (/sport|nba|nfl|mlb|soccer|football|championship|super bowl/.test(q)) return "Sports";
  return "General";
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const market = await fetchPolymarket(id);
    if (!market) {
      return NextResponse.json({ error: "Market not found" }, { status: 404 });
    }

    // Search Manifold for cross-platform comparison
    const manifoldResults = await searchManifold(market.question);
    market.crossPlatform = manifoldResults;

    return NextResponse.json(market);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
