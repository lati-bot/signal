import { NextRequest, NextResponse } from "next/server";

const GAMMA_BASE = "https://gamma-api.polymarket.com";
const CLOB_BASE = "https://clob.polymarket.com";

async function getClobTokenId(marketId: string): Promise<string | null> {
  // Try numeric ID first (direct lookup)
  if (/^\d+$/.test(marketId)) {
    const resp = await fetch(`${GAMMA_BASE}/markets/${marketId}`, {
      next: { revalidate: 300 },
    });
    if (resp.ok) {
      const m = await resp.json();
      if (m) {
        let ids: string[] = [];
        try {
          ids = typeof m.clobTokenIds === "string" ? JSON.parse(m.clobTokenIds) : m.clobTokenIds || [];
        } catch {}
        if (ids.length > 0) return ids[0];
      }
    }
  }

  // Fallback: try conditionId, slug
  for (const param of ["condition_id", "slug"]) {
    const resp = await fetch(
      `${GAMMA_BASE}/markets?${param}=${encodeURIComponent(marketId)}&limit=1`,
      { next: { revalidate: 300 } }
    );
    if (resp.ok) {
      const data = await resp.json();
      if (Array.isArray(data) && data.length > 0) {
        const m = data[0];
        let ids: string[] = [];
        try {
          ids =
            typeof m.clobTokenIds === "string"
              ? JSON.parse(m.clobTokenIds)
              : m.clobTokenIds || [];
        } catch {}
        if (ids.length > 0) return ids[0];
      }
    }
  }
  return null;
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(req.url);
    const interval = searchParams.get("interval") || "1w";

    const tokenId = await getClobTokenId(id);
    if (!tokenId) {
      return NextResponse.json(
        { error: "No price history available" },
        { status: 404 }
      );
    }

    const fidelity = interval === "1d" ? "30" : interval === "1w" ? "60" : "120";
    const resp = await fetch(
      `${CLOB_BASE}/prices-history?market=${encodeURIComponent(tokenId)}&interval=${interval}&fidelity=${fidelity}`,
      { next: { revalidate: 900 } } // 15 min cache
    );

    if (!resp.ok) {
      return NextResponse.json(
        { error: "Failed to fetch price history" },
        { status: 502 }
      );
    }

    const raw = await resp.json();
    const history = (raw.history || raw || []).map((p: any) => ({
      timestamp: p.t,
      price: Number(p.p),
    }));

    return NextResponse.json(history);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
