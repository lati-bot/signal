"""Kalshi API client.

API base: https://api.elections.kalshi.com/trade-api/v2
Some endpoints require authentication via API key.
"""

from dataclasses import dataclass
from datetime import datetime
from typing import Optional

import httpx

BASE_URL = "https://api.elections.kalshi.com/trade-api/v2"


@dataclass
class KalshiMarket:
    ticker: str
    title: str
    category: str
    yes_price: float
    no_price: float
    volume: int
    close_date: Optional[datetime]
    status: str
    url: str


class KalshiClient:
    def __init__(self, api_key: str = "", api_secret: str = ""):
        headers = {}
        if api_key:
            headers["Authorization"] = f"Bearer {api_key}"
        self.http = httpx.AsyncClient(base_url=BASE_URL, timeout=30, headers=headers)

    async def close(self):
        await self.http.aclose()

    async def fetch_markets(self, limit: int = 100, cursor: str = "") -> tuple[list[KalshiMarket], str]:
        """Fetch markets. Returns (markets, next_cursor)."""
        params = {"limit": limit}
        if cursor:
            params["cursor"] = cursor
        resp = await self.http.get("/markets", params=params)
        resp.raise_for_status()
        data = resp.json()
        markets = [self._parse(m) for m in data.get("markets", [])]
        next_cursor = data.get("cursor", "")
        return markets, next_cursor

    async def fetch_events(self, limit: int = 100) -> list[dict]:
        """Fetch events (groups of related markets)."""
        resp = await self.http.get("/events", params={"limit": limit})
        resp.raise_for_status()
        return resp.json().get("events", [])

    def _parse(self, data: dict) -> KalshiMarket:
        close_date = None
        if data.get("close_time"):
            try:
                close_date = datetime.fromisoformat(data["close_time"].replace("Z", "+00:00"))
            except (ValueError, TypeError):
                pass

        yes_price = float(data.get("yes_bid", 0) or data.get("last_price", 0) or 0) / 100
        no_price = 1 - yes_price if yes_price else 0

        return KalshiMarket(
            ticker=data.get("ticker", ""),
            title=data.get("title", ""),
            category=data.get("category", ""),
            yes_price=yes_price,
            no_price=no_price,
            volume=int(data.get("volume", 0) or 0),
            close_date=close_date,
            status=data.get("status", ""),
            url=f"https://kalshi.com/markets/{data.get('ticker', '')}",
        )
