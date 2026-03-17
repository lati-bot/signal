from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.db import get_db
from app.models import Market, Platform, Category

router = APIRouter(prefix="/api/markets", tags=["markets"])


class MarketOut(BaseModel):
    id: int
    platform: str
    external_id: str
    question: str
    description: Optional[str] = None
    category: Optional[str] = None
    image_url: Optional[str] = None
    url: Optional[str] = None
    yes_price: Optional[float] = None
    no_price: Optional[float] = None
    volume: Optional[float] = None
    end_date: Optional[str] = None
    status: str

    model_config = {"from_attributes": True}


def _to_out(m: Market) -> MarketOut:
    return MarketOut(
        id=m.id,
        platform=m.platform.slug if m.platform else "unknown",
        external_id=m.external_id,
        question=m.question,
        description=m.description,
        category=m.category.name if m.category else None,
        image_url=m.image_url,
        url=m.url,
        yes_price=float(m.outcome_yes_price) if m.outcome_yes_price else None,
        no_price=float(m.outcome_no_price) if m.outcome_no_price else None,
        volume=float(m.volume) if m.volume else None,
        end_date=m.end_date.isoformat() if m.end_date else None,
        status=m.status,
    )


@router.get("", response_model=list[MarketOut])
async def list_markets(
    limit: int = Query(50, le=200),
    offset: int = Query(0, ge=0),
    platform: Optional[str] = None,
    category: Optional[str] = None,
    status: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
):
    stmt = select(Market).options(selectinload(Market.platform), selectinload(Market.category))
    if platform:
        stmt = stmt.join(Platform).where(Platform.slug == platform)
    if category:
        stmt = stmt.join(Category).where(Category.slug == category)
    if status:
        stmt = stmt.where(Market.status == status)
    stmt = stmt.order_by(Market.volume.desc().nullslast()).offset(offset).limit(limit)
    result = await db.execute(stmt)
    return [_to_out(m) for m in result.scalars().all()]


@router.get("/search", response_model=list[MarketOut])
async def search_markets(
    q: str = Query(..., min_length=1),
    limit: int = Query(20, le=100),
    db: AsyncSession = Depends(get_db),
):
    stmt = (
        select(Market)
        .options(selectinload(Market.platform), selectinload(Market.category))
        .where(Market.question.ilike(f"%{q}%"))
        .order_by(Market.volume.desc().nullslast())
        .limit(limit)
    )
    result = await db.execute(stmt)
    return [_to_out(m) for m in result.scalars().all()]


@router.get("/{market_id}", response_model=MarketOut)
async def get_market(market_id: int, db: AsyncSession = Depends(get_db)):
    stmt = (
        select(Market)
        .options(selectinload(Market.platform), selectinload(Market.category))
        .where(Market.id == market_id)
    )
    result = await db.execute(stmt)
    market = result.scalar_one_or_none()
    if not market:
        raise HTTPException(status_code=404, detail="Market not found")
    return _to_out(market)
