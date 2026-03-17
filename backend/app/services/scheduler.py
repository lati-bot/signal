"""APScheduler job to refresh market data every 15 minutes."""

import logging

from apscheduler.schedulers.asyncio import AsyncIOScheduler

from app.services.polymarket import PolymarketClient
from app.services.kalshi import KalshiClient
from app.services.manifold import ManifoldClient

logger = logging.getLogger(__name__)

scheduler = AsyncIOScheduler()


async def refresh_markets():
    """Pull latest data from all platforms and upsert into the database."""
    logger.info("Starting market refresh...")

    # Polymarket
    try:
        poly = PolymarketClient()
        markets = await poly.fetch_markets(limit=200)
        logger.info(f"Polymarket: fetched {len(markets)} markets")
        # TODO: upsert into database
        await poly.close()
    except Exception as e:
        logger.error(f"Polymarket refresh failed: {e}")

    # Kalshi
    try:
        kalshi = KalshiClient()
        markets, _ = await kalshi.fetch_markets(limit=200)
        logger.info(f"Kalshi: fetched {len(markets)} markets")
        await kalshi.close()
    except Exception as e:
        logger.error(f"Kalshi refresh failed: {e}")

    # Manifold
    try:
        manifold = ManifoldClient()
        markets = await manifold.fetch_markets(limit=200)
        logger.info(f"Manifold: fetched {len(markets)} markets")
        await manifold.close()
    except Exception as e:
        logger.error(f"Manifold refresh failed: {e}")

    logger.info("Market refresh complete.")


def start_scheduler():
    scheduler.add_job(refresh_markets, "interval", minutes=15, id="refresh_markets", replace_existing=True)
    scheduler.start()
    logger.info("Scheduler started: refreshing every 15 minutes")
