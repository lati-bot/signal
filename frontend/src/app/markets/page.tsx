"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";

interface Market {
  id: string;
  question: string;
  platform: string;
  yesPrice: number;
  volume: number;
  category: string;
  slug: string;
  endDate: string | null;
  image: string | null;
}

const CATEGORIES = ["All", "Politics", "Crypto", "Economics", "Sports", "AI", "General"];
const SORT_OPTIONS = [
  { label: "Volume", value: "volume" },
  { label: "Newest", value: "newest" },
  { label: "Closing soon", value: "closing" },
] as const;

const PAGE_SIZE = 20;

function fmtVolume(v: number): string {
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `$${(v / 1_000).toFixed(0)}K`;
  return `$${v.toFixed(0)}`;
}

function probColor(p: number): string {
  if (p >= 0.7) return "#5a8a5e";
  if (p >= 0.35) return "#b8860b";
  return "#b85c4a";
}

function timeLeft(endDate: string | null): string | null {
  if (!endDate) return null;
  const diff = new Date(endDate).getTime() - Date.now();
  if (diff <= 0) return "Ended";
  const days = Math.floor(diff / 86400000);
  if (days > 30) return `${Math.floor(days / 30)}mo left`;
  if (days > 0) return `${days}d left`;
  const hours = Math.floor(diff / 3600000);
  return `${hours}h left`;
}

export default function MarketsPage() {
  const [allMarkets, setAllMarkets] = useState<Market[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const [sort, setSort] = useState<string>("volume");
  const [page, setPage] = useState(1);

  useEffect(() => {
    fetch("/api/markets?limit=100")
      .then((r) => {
        if (!r.ok) throw new Error("Failed to load markets");
        return r.json();
      })
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setAllMarkets(data);
        } else {
          setError("No markets available right now.");
        }
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    let list = allMarkets;

    // Search filter
    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter((m) => m.question.toLowerCase().includes(q));
    }

    // Category filter
    if (category !== "All") {
      list = list.filter((m) => m.category === category);
    }

    // Sort
    if (sort === "volume") {
      list = [...list].sort((a, b) => b.volume - a.volume);
    } else if (sort === "closing") {
      list = [...list].sort((a, b) => {
        if (!a.endDate) return 1;
        if (!b.endDate) return -1;
        return new Date(a.endDate).getTime() - new Date(b.endDate).getTime();
      });
    }

    return list;
  }, [allMarkets, query, category, sort]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const pageMarkets = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // Reset page when filters change
  useEffect(() => { setPage(1); }, [query, category, sort]);

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-5 py-10">
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="border border-sand rounded-lg p-5 animate-pulse">
              <div className="h-4 bg-sand rounded w-1/4 mb-3" />
              <div className="h-5 bg-sand rounded w-3/4 mb-2" />
              <div className="h-3 bg-sand rounded w-1/3" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-5xl mx-auto px-5 py-10">
        <h1 className="font-serif text-3xl mb-4">Markets</h1>
        <div className="border border-sand rounded-lg p-8 text-center">
          <p className="text-warm-600 mb-2">Could not load markets</p>
          <p className="text-sm text-warm-400">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 text-sm text-ink underline hover:no-underline"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-5 py-8">
      <h1 className="font-serif text-2xl sm:text-3xl mb-6">Markets</h1>

      {/* Search */}
      <div className="mb-4">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search markets..."
          className="w-full max-w-md px-4 py-2.5 bg-white border border-sand rounded-lg text-sm placeholder:text-warm-400 focus:outline-none focus:border-warm-400 transition-colors"
        />
      </div>

      {/* Category tabs */}
      <div className="flex gap-1 overflow-x-auto pb-1 mb-3 -mx-1 px-1 scrollbar-hide">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setCategory(cat)}
            className={`px-3 py-1.5 text-sm rounded whitespace-nowrap transition-colors ${
              category === cat
                ? "bg-ink text-cream"
                : "text-warm-500 hover:text-ink hover:bg-warm-100"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Sort + count */}
      <div className="flex items-center justify-between mb-5">
        <p className="text-xs text-warm-400">{filtered.length} markets</p>
        <div className="flex gap-2">
          {SORT_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setSort(opt.value)}
              className={`text-xs px-2 py-1 rounded transition-colors ${
                sort === opt.value
                  ? "bg-warm-200 text-ink"
                  : "text-warm-400 hover:text-warm-600"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Market list */}
      {pageMarkets.length === 0 ? (
        <div className="border border-sand rounded-lg p-8 text-center">
          <p className="text-warm-500">No markets match your filters.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {pageMarkets.map((m) => {
            const pct = Math.round(m.yesPrice * 100);
            const remaining = timeLeft(m.endDate);
            return (
              <Link
                key={m.slug || m.id}
                href={`/market/${m.slug || m.id}`}
                className="block border border-sand rounded-lg p-4 sm:p-5 hover:border-warm-400 active:bg-warm-50 transition-colors"
              >
                <div className="flex items-start gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                      {m.category && (
                        <span className="text-[11px] text-warm-500 bg-warm-100 px-1.5 py-0.5 rounded">
                          {m.category}
                        </span>
                      )}
                      {remaining && (
                        <span className="text-[11px] text-warm-400">
                          {remaining}
                        </span>
                      )}
                    </div>
                    <h3 className="font-serif text-base sm:text-lg leading-snug mb-2 line-clamp-2">
                      {m.question}
                    </h3>
                    <p className="text-xs text-warm-400">
                      {m.platform} · {fmtVolume(m.volume)} vol
                    </p>
                  </div>
                  <div className="text-right shrink-0 pt-1">
                    <p
                      className="font-mono text-2xl sm:text-3xl font-medium"
                      style={{ color: probColor(m.yesPrice) }}
                    >
                      {pct}%
                    </p>
                    <p className="text-[11px] text-warm-400 mt-0.5">Yes</p>
                    {/* Mini probability bar */}
                    <div className="w-12 h-1 bg-sand rounded-full mt-1.5 ml-auto overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${pct}%`,
                          backgroundColor: probColor(m.yesPrice),
                        }}
                      />
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-8">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-3 py-1.5 text-sm rounded border border-sand disabled:opacity-30 hover:bg-warm-50 transition-colors"
          >
            Prev
          </button>
          <span className="text-sm text-warm-500 px-2">
            {page} / {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="px-3 py-1.5 text-sm rounded border border-sand disabled:opacity-30 hover:bg-warm-50 transition-colors"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
