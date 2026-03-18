import { NextRequest, NextResponse } from "next/server";

const GAMMA_BASE = "https://gamma-api.polymarket.com";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const limit = searchParams.get("limit") || "20";
  const offset = searchParams.get("offset") || "0";
  const q = searchParams.get("q") || "";

  try {
    const params = new URLSearchParams({
      limit,
      offset,
      active: "true",
      closed: "false",
      order: "volume",
      ascending: "false",
    });
    if (q) params.set("tag", q);

    const resp = await fetch(`${GAMMA_BASE}/markets?${params}`, {
      next: { revalidate: 300 },
    });

    if (!resp.ok) {
      return NextResponse.json(
        { error: "Upstream API error" },
        { status: resp.status }
      );
    }

    const raw = await resp.json();

    const markets = raw
      .filter((m: any) => m.question)
      .map((m: any) => {
        let outcomes: string[] = [];
        let prices: number[] = [];
        try {
          outcomes =
            typeof m.outcomes === "string"
              ? JSON.parse(m.outcomes)
              : m.outcomes || [];
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
          volume: Number(m.volume || 0),
          category: m.category || "",
          slug: m.slug || "",
          endDate: m.endDate || null,
          image: m.image || null,
        };
      });

    return NextResponse.json(markets);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
