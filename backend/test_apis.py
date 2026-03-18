"""Test all three API clients and save sample data."""
import asyncio
import json
import os
from datetime import datetime

# Add parent to path
import sys
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.services.polymarket import PolymarketClient
from app.services.kalshi import KalshiClient
from app.services.manifold import ManifoldClient

SAMPLE_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "sample-data")

class DateEncoder(json.JSONEncoder):
    def default(self, o):
        if isinstance(o, datetime):
            return o.isoformat()
        return super().default(o)

async def test_polymarket():
    print("\n=== POLYMARKET ===")
    client = PolymarketClient()
    try:
        markets = await client.fetch_markets(limit=10)
        for m in markets:
            yes = m.outcome_prices[0] if m.outcome_prices else "?"
            print(f"  {m.question[:80]}  —  Yes: {yes}  Vol: ${m.volume:,.0f}")
        return [vars(m) for m in markets]
    finally:
        await client.close()

async def test_kalshi():
    print("\n=== KALSHI ===")
    client = KalshiClient()
    try:
        markets, cursor = await client.fetch_markets(limit=10)
        for m in markets:
            print(f"  {m.title[:80]}  —  Yes: {m.yes_price:.2f}  Vol: {m.volume}")
        return [vars(m) for m in markets]
    except Exception as e:
        print(f"  ERROR: {e}")
        return {"error": str(e)}
    finally:
        await client.close()

async def test_manifold():
    print("\n=== MANIFOLD ===")
    client = ManifoldClient()
    try:
        markets = await client.fetch_markets(limit=10)
        for m in markets:
            print(f"  {m.question[:80]}  —  Prob: {m.probability:.2f}  Vol: ${m.volume:,.0f}")
        return [vars(m) for m in markets]
    finally:
        await client.close()

async def main():
    os.makedirs(SAMPLE_DIR, exist_ok=True)
    
    poly = await test_polymarket()
    kalshi = await test_kalshi()
    manifold = await test_manifold()
    
    for name, data in [("polymarket", poly), ("kalshi", kalshi), ("manifold", manifold)]:
        path = os.path.join(SAMPLE_DIR, f"{name}.json")
        with open(path, "w") as f:
            json.dump(data, f, indent=2, cls=DateEncoder)
        print(f"\nSaved {name} data to {path}")

if __name__ == "__main__":
    asyncio.run(main())
