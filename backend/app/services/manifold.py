"""Manifold Markets API client.

API base: https://api.manifold.markets/v0
Public, no auth required (optional key for higher rate limits).
"""

from dataclasses import dataclass
from datetime import datetime
from typing import Optional

import httpx

BASE_URL = "https://api.manifold.markets/v0"


@dataclass
class ManifoldMarket:
    id: str
    question: str
    description: str
    probability: float
    volume: float
    category: str
    close_time: Optional[datetime]
    creator_name: str
    url: str


class ManifoldClient:
    def __init__(self, api_key: str = ""):
        headers = {}
        if api_key:
            headers["Authorization"] = f"Key {api_key}"
        self.http = httpx.AsyncClient(base_url=BASE_URL, timeout=30, headers=headers)

    async def close(self):
        await self.http.aclose()

    async def fetch_markets(self, limit: int = 100, before: str = "") -> list[ManifoldMarket]:
        params = {"limit": limit}
        if before:
            params["before"] = before
        resp = await self.http.get("/markets", params=params)
        resp.raise_for_status()
        return [self._parse(m) for m in resp.json() if m.get("question")]

    async def fetch_market(self, market_id: str) -> Optional[ManifoldMarket]:
        resp = await self.http.get(f"/market/{market_id}")
        if resp.status_code == 404:
            return None
        resp.raise_for_status()
        return self._parse(resp.json())

    async def fetch_by_slug(self, slug: str) -> Optional[ManifoldMarket]:
        resp = await self.http.get(f"/slug/{slug}")
        if resp.status_code == 404:
            return None
        resp.raise_for_status()
        return self._parse(resp.json())

    def _parse(self, data: dict) -> ManifoldMarket:
        close_time = None
        if data.get("closeTime"):
            try:
                close_time = datetime.fromtimestamp(data["closeTime"] / 1000)
            except (ValueError, TypeError, OSError):
                pass

        return ManifoldMarket(
            id=data.get("id", ""),
            question=data.get("question", ""),
            description=data.get("textDescription", ""),
            probability=float(data.get("probability", 0) or 0),
            volume=float(data.get("volume", 0) or 0),
            category=data.get("groupSlugs", [""])[0] if data.get("groupSlugs") else "",
            close_time=close_time,
            creator_name=data.get("creatorName", ""),
            url=f"https://manifold.markets/{data.get('creatorUsername', '_')}/{data.get('slug', '')}",
        )
