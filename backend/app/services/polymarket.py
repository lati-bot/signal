"""Polymarket API client.

Uses the Gamma API for market metadata (question, description, outcomes, etc.)
and the CLOB API for order book / pricing data.
"""

from dataclasses import dataclass
from datetime import datetime
from typing import Optional

import httpx

GAMMA_BASE = "https://gamma-api.polymarket.com"
CLOB_BASE = "https://clob.polymarket.com"


@dataclass
class PolymarketMarket:
    condition_id: str
    question: str
    description: str
    category: str
    image_url: Optional[str]
    url: str
    outcomes: list[str]
    outcome_prices: list[float]
    volume: float
    end_date: Optional[datetime]
    active: bool


class PolymarketClient:
    def __init__(self):
        self.http = httpx.AsyncClient(timeout=30)

    async def close(self):
        await self.http.aclose()

    async def fetch_markets(self, limit: int = 100, offset: int = 0, active: bool = True) -> list[PolymarketMarket]:
        """Fetch markets from the Gamma API."""
        params = {
            "limit": limit,
            "offset": offset,
            "active": str(active).lower(),
            "closed": "false",
            "order": "volume",
            "ascending": "false",
        }
        resp = await self.http.get(f"{GAMMA_BASE}/markets", params=params)
        resp.raise_for_status()
        raw = resp.json()
        return [self._parse_gamma(m) for m in raw if m.get("question")]

    async def fetch_market(self, condition_id: str) -> Optional[PolymarketMarket]:
        """Fetch a single market by condition_id from Gamma API."""
        resp = await self.http.get(f"{GAMMA_BASE}/markets/{condition_id}")
        if resp.status_code == 404:
            return None
        resp.raise_for_status()
        return self._parse_gamma(resp.json())

    def _parse_gamma(self, data: dict) -> PolymarketMarket:
        outcomes = []
        prices = []
        if data.get("outcomes"):
            # outcomes is a JSON string like '["Yes","No"]'
            import json
            if isinstance(data["outcomes"], str):
                outcomes = json.loads(data["outcomes"])
            else:
                outcomes = data["outcomes"]
        if data.get("outcomePrices"):
            import json
            if isinstance(data["outcomePrices"], str):
                prices = [float(p) for p in json.loads(data["outcomePrices"])]
            else:
                prices = [float(p) for p in data["outcomePrices"]]

        end_date = None
        if data.get("endDate"):
            try:
                end_date = datetime.fromisoformat(data["endDate"].replace("Z", "+00:00"))
            except (ValueError, TypeError):
                pass

        slug = data.get("slug", data.get("conditionId", ""))
        condition_id = data.get("conditionId") or data.get("condition_id") or str(data.get("id", ""))

        return PolymarketMarket(
            condition_id=condition_id,
            question=data.get("question", ""),
            description=data.get("description", ""),
            category=data.get("category", ""),
            image_url=data.get("image"),
            url=f"https://polymarket.com/event/{slug}" if slug else "",
            outcomes=outcomes,
            outcome_prices=prices,
            volume=float(data.get("volume", 0) or 0),
            end_date=end_date,
            active=data.get("active", True),
        )


async def test():
    """Quick smoke test: fetch a few markets and print titles."""
    client = PolymarketClient()
    try:
        markets = await client.fetch_markets(limit=5)
        for m in markets:
            yes = m.outcome_prices[0] if m.outcome_prices else "?"
            print(f"  {m.question}  —  Yes: {yes}  Vol: ${m.volume:,.0f}")
        return markets
    finally:
        await client.close()


if __name__ == "__main__":
    import asyncio
    asyncio.run(test())
