import { ProbabilitySlider } from "@/components/ProbabilitySlider";

export default function MarketDetailPage({
  params,
}: {
  params: { id: string };
}) {
  // In production, fetch from API. Placeholder for now.
  return (
    <div className="max-w-3xl mx-auto px-6 py-10">
      <p className="text-sm text-warm-500 mb-2">Polymarket</p>
      <h1 className="font-serif text-3xl mb-4">
        Will [event] happen by [date]?
      </h1>
      <div className="border border-sand rounded-lg p-6 mb-6">
        <ProbabilitySlider value={0.65} label="Yes" />
        <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-warm-500">Volume</span>
            <p className="font-mono">$1,234,567</p>
          </div>
          <div>
            <span className="text-warm-500">Closes</span>
            <p>Mar 30, 2026</p>
          </div>
        </div>
      </div>
      <div className="prose prose-warm">
        <p className="text-warm-700 leading-relaxed">
          Market description and resolution criteria would appear here,
          pulled from the platform API.
        </p>
      </div>
    </div>
  );
}
