import { SearchBar } from "@/components/SearchBar";
import { MarketList } from "@/components/MarketList";

export default function MarketsPage() {
  return (
    <div className="max-w-5xl mx-auto px-6 py-10">
      <h1 className="font-serif text-3xl mb-2">Markets</h1>
      <p className="text-warm-600 mb-8">
        Browse prediction markets across platforms.
      </p>
      <SearchBar />
      <div className="mt-8">
        <MarketList />
      </div>
    </div>
  );
}
