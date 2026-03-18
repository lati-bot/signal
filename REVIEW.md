# Signal Frontend Review

**Date:** March 17, 2026  
**Reviewer:** Lati (subagent)  
**Overall Grade: C+**

The bones are solid — clean architecture, good taste in color/typography, and the factor sliders are a genuinely differentiating feature. But the app is incomplete in several meaningful ways, has real bugs, and the UX still reads as a prototype rather than a product.

---

## What's Working Well

- **Color palette is actually good.** The warm cream (`#faf8f5`) with ink text and sand borders reads as intentional and editorial. It does NOT look washed out — it looks like a financial publication. Nice work avoiding the purple gradient trap.
- **Typography choices are smart.** Georgia serif for headings + system sans for body avoids Inter (the #1 AI tell) and creates real hierarchy. The monospace for numbers (`SF Mono`) is appropriate for a financial tool.
- **Factor sliders are the killer feature.** The "Model Your View" concept is genuinely novel for prediction market UIs. None of the competitors do this. The edge calculation is simple and compelling.
- **API route architecture is clean.** Fallback lookup strategy in `[id]/route.ts` (conditionId → slug → direct ID) is thorough. Manifold cross-platform search works.
- **Loading skeletons exist.** Both market list and detail page have proper skeleton states.
- **No AI design tells in layout.** No three-boxes-with-icons, no card grids, no emoji headings, no gradient text. The landing page is refreshingly minimal.

---

## Critical Issues (Bugs / Broken Features)

### 1. SearchBar does literally nothing
**File:** `src/components/SearchBar.tsx`  
The search input captures `query` state but never uses it. No filtering, no API call, no URL param update. It's a decorative text field.

### 2. `params` needs `await` in Next.js 14+ (or `use()`)
**File:** `src/app/market/[id]/page.tsx`, line ~47  
`params.id` is accessed directly, but in Next.js 14+ with the app router, `params` is a Promise. This will throw a runtime error or produce undefined behavior. Should be:
```tsx
export default function MarketDetailPage({ params }: { params: Promise<{ id: string }> }) {
  // use React.use(params) or make the component async
}
```
Same issue applies to `src/app/api/markets/[id]/route.ts` line ~76.

### 3. Markets link to wrong IDs
**File:** `src/components/MarketList.tsx`, line ~60  
Links use `m.id` which maps to `conditionId` from the API. But the Gamma API's `condition_id` query param works — verified via curl. However, many Polymarket markets return the same `conditionId` for grouped markets (spreads, etc.), so clicking a sports spread market could load the wrong one. The `slug` field would be more reliable for linking.

### 4. No pagination
**File:** `src/components/MarketList.tsx`  
Fetches 30 markets and stops. No "load more", no infinite scroll, no page navigation. On Polymarket there are thousands of active markets.

### 5. Fallback data is misleading
**File:** `src/components/MarketList.tsx`, lines 24-27  
The `FALLBACK` array shows fake markets with fabricated prices/volumes when the API fails. These render identically to real data — no indication they're fake. A user could act on these numbers. Either label them clearly or show an error state instead.

### 6. Cross-platform search is fuzzy and unreliable
**File:** `src/app/api/markets/[id]/route.ts`, `searchManifold()`  
Takes the first 6 words of the question and searches Manifold. For specific questions like "Spread: Georgia Bulldogs (-1.5)" this will return irrelevant results. No relevance threshold, no keyword matching, no deduplication.

---

## Design/UX Improvements (Prioritized)

### P0 — Must Fix

1. **Make search actually work.** Wire it to the API's `tag` param, or better yet, do client-side fuzzy filtering on the loaded markets. Add debouncing.

2. **Add category filtering.** The data has categories — expose them as clickable filters above the market list. Polymarket, Kalshi, and Manifold all have prominent category tabs. This is table stakes.

3. **Market cards need more info at a glance.** Currently: question, platform, volume, yes%. Missing: end date (critical for urgency), category tag, price change indicator (trending up/down). Polymarket shows all of these.

### P1 — Should Fix

4. **Landing page undersells the product.** "See what the world thinks is going to happen" is fine but generic. The real pitch is the factor sliders / edge calculation — that's what makes Signal different from just browsing Polymarket directly. The landing page doesn't mention this feature AT ALL. The "3 platforms" and "Every 15 min" stats are weak — they don't convey value.

5. **Factor slider model needs explanation.** The math (`MAX_SHIFT = 0.15`, linear weighted sum) is arbitrary and unexplained. A user adjusting all sliders to "Very bullish" can only shift the probability by ±15%. Why 15%? Is this calibrated? Add a small "How this works" expandable section.

6. **Edge display needs a CTA.** You see "Edge: +8%" but then what? No link to trade on Polymarket/Kalshi/Manifold. The whole point of finding edge is to act on it.

7. **No favicon, no OG image, no meta tags beyond basic title/description.** Social sharing will look broken.

### P2 — Nice to Have

8. **Mobile: mostly fine but slider UX is tough on touch.** The `factor-slider` thumb is 18px — workable but small on mobile. Consider 24px on touch devices. The market detail page at 3xl max-width is good for mobile readability.

9. **No dark mode.** Not critical, but the warm cream palette would translate well to a warm dark theme (dark brown/charcoal instead of pure black).

10. **Footer is completely absent.** No about, no links, no legal, nothing. Feels unfinished.

---

## Does It Still Look AI-Generated?

**Honest answer: mostly no, but with caveats.**

The color palette, typography, and layout restraint all read as human-designed. The asymmetric landing page (left-aligned hero, no centered CTA block) is good. Georgia serif is an actual choice, not a default.

**What still triggers AI radar:**
- The market list is a uniform stack of identical cards with identical spacing — the "listy" tell from the design doc. Consider varying card density or adding visual breaks (featured market, category headers).
- The "Model Your View" section follows the exact same border/padding/heading pattern as every other section. It's the most important feature — it should look different (background color, more visual weight).
- The landing page stats section (3 platforms / Every 15 min) reads like a template — two boxes, same structure, same size. Either make these more interesting or remove them.
- Every hover state is a color transition. No variety.

---

## Competitive Comparison

| Feature | Signal | Polymarket | Kalshi | Manifold |
|---------|--------|------------|--------|----------|
| Market browser | Basic list | Rich cards + images + trending | Category-focused | Community-driven |
| Search | Broken | Full-text + filters | Full-text + filters | Full-text |
| Categories | Data exists, not exposed | Prominent tabs | Prominent tabs | Tags |
| Market images | Not shown | Prominent | Prominent | User-uploaded |
| Price history chart | Missing | Yes (key feature) | Yes | Yes |
| Cross-platform | Manifold search | N/A | N/A | N/A |
| Factor modeling | Yes (unique!) | No | No | No |
| Edge calculation | Yes (unique!) | No | No | No |
| User accounts | No | Yes | Yes | Yes |
| Kalshi integration | Claimed, not implemented | N/A | N/A | N/A |

**What competitors do better:** Price history charts, market images, robust search/filtering, trending/hot markets, social features, order books.

**What Signal does that they don't:** Factor-based probability modeling with edge calculation, cross-platform price comparison. These are genuinely valuable — lean into them harder.

---

## Feature Gaps

1. **Price history / charts** — the single biggest missing feature. Users need to see how probability has moved over time. This is core to any prediction market tool.
2. **Kalshi integration** — mentioned on landing page ("3 platforms") but no Kalshi API calls exist anywhere in the code. This is false advertising.
3. **Market images** — the data includes `image` URLs from Polymarket but they're never rendered. Easy win for scannability.
4. **Trending / hot markets** — no way to see what's moving. Could use `oneDayPriceChange` from the Gamma API.
5. **Sorting options** — volume only. Should offer: newest, closing soon, biggest movers.
6. **URL-based state** — search query and filters should be in URL params for shareability.

---

## Specific Code Fixes Needed

| # | File | Issue | Fix |
|---|------|-------|-----|
| 1 | `src/components/SearchBar.tsx` | Search does nothing | Wire to parent via callback, filter markets or call API with `q` param |
| 2 | `src/app/market/[id]/page.tsx:47` | `params` not awaited (Next 14+) | Use `React.use(params)` or make component async |
| 3 | `src/app/api/markets/[id]/route.ts:76` | Same `params` issue | Await params in route handler |
| 4 | `src/components/MarketList.tsx:60` | Links use `m.id` (conditionId) | Use `m.slug` for more reliable routing |
| 5 | `src/components/MarketList.tsx:24-27` | Fake fallback data shown as real | Show error state instead, or label clearly |
| 6 | `src/app/api/markets/route.ts:11` | `tag` param for search is wrong | Gamma API doesn't support `tag` for free-text search; need `slug_contains` or client-side filter |
| 7 | `src/components/FactorSliders.tsx` | `factors.length` not in useMemo deps | Add `factors` to dependency array (line ~50) |
| 8 | `src/app/layout.tsx` | No `<Link>` components | Replace `<a>` tags with Next.js `<Link>` for client-side navigation |
| 9 | `src/app/page.tsx` | Same — uses `<a>` not `<Link>` | Replace with `<Link>` |
| 10 | `src/app/market/[id]/page.tsx` | Market detail uses `<a>` for back link | Replace with `<Link>` |

---

## Top 10 Punch List (Prioritized)

1. **Fix the `params` Promise bug** — app may crash on market detail pages in production
2. **Make search functional** — it's the most prominent interactive element after sliders and it does nothing
3. **Add category filters** — table stakes for browsing markets
4. **Replace `<a>` with Next.js `<Link>`** — currently every navigation is a full page reload
5. **Add price history charts** — biggest feature gap vs competitors
6. **Show market images** — data exists, not rendered; massive scannability improvement
7. **Add "Trade on [platform]" CTA** after edge calculation — complete the user journey
8. **Remove or fix Kalshi claim** — landing page claims 3 platforms but only Polymarket is implemented
9. **Add sorting options** (volume, closing soon, trending) to market browser
10. **Rewrite landing page** to lead with the factor modeling / edge feature — that's the actual product differentiation

---

## Summary

Signal has a genuinely good idea (factor-based probability modeling + cross-platform comparison) wrapped in a genuinely tasteful visual design, but the implementation is at maybe 40% complete. The search doesn't work, there's a likely crash bug with params, navigation causes full reloads, and major features (charts, Kalshi, sorting, filtering) are missing. The design successfully avoids AI tells but falls into "prototype sameness" — every section looks the same. The landing page buries the lede by not mentioning the product's actual differentiator.

Fix the bugs, ship search + filters, add charts, and restructure the landing page around the factor modeling pitch. Then this becomes a B+.
