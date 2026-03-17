from datetime import datetime
from decimal import Decimal
from typing import Optional

from sqlalchemy import ForeignKey, Numeric, Text, UniqueConstraint
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship


class Base(DeclarativeBase):
    pass


class Category(Base):
    __tablename__ = "categories"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(Text, unique=True)
    slug: Mapped[str] = mapped_column(Text, unique=True)

    markets: Mapped[list["Market"]] = relationship(back_populates="category")


class Platform(Base):
    __tablename__ = "platforms"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(Text, unique=True)
    slug: Mapped[str] = mapped_column(Text, unique=True)
    base_url: Mapped[str] = mapped_column(Text)

    markets: Mapped[list["Market"]] = relationship(back_populates="platform")


class Market(Base):
    __tablename__ = "markets"
    __table_args__ = (UniqueConstraint("platform_id", "external_id"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    platform_id: Mapped[int] = mapped_column(ForeignKey("platforms.id"))
    external_id: Mapped[str] = mapped_column(Text)
    question: Mapped[str] = mapped_column(Text)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    category_id: Mapped[Optional[int]] = mapped_column(ForeignKey("categories.id"), nullable=True)
    image_url: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    url: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    outcome_yes_price: Mapped[Optional[Decimal]] = mapped_column(Numeric(10, 4), nullable=True)
    outcome_no_price: Mapped[Optional[Decimal]] = mapped_column(Numeric(10, 4), nullable=True)
    volume: Mapped[Optional[Decimal]] = mapped_column(Numeric(20, 2), nullable=True)
    end_date: Mapped[Optional[datetime]] = mapped_column(nullable=True)
    status: Mapped[str] = mapped_column(Text, default="open")
    created_at: Mapped[datetime] = mapped_column(default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(default=datetime.utcnow, onupdate=datetime.utcnow)

    platform: Mapped["Platform"] = relationship(back_populates="markets")
    category: Mapped[Optional["Category"]] = relationship(back_populates="markets")
    snapshots: Mapped[list["PriceSnapshot"]] = relationship(back_populates="market", cascade="all, delete-orphan")


class PriceSnapshot(Base):
    __tablename__ = "price_snapshots"

    id: Mapped[int] = mapped_column(primary_key=True)
    market_id: Mapped[int] = mapped_column(ForeignKey("markets.id", ondelete="CASCADE"))
    yes_price: Mapped[Decimal] = mapped_column(Numeric(10, 4))
    no_price: Mapped[Decimal] = mapped_column(Numeric(10, 4))
    volume: Mapped[Optional[Decimal]] = mapped_column(Numeric(20, 2), nullable=True)
    recorded_at: Mapped[datetime] = mapped_column(default=datetime.utcnow)

    market: Mapped["Market"] = relationship(back_populates="snapshots")
