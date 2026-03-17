export function MarketCard({
  question,
  platform,
  yesPrice,
  volume,
}: {
  question: string;
  platform: string;
  yesPrice: number;
  volume: string;
}) {
  const pct = Math.round(yesPrice * 100);

  return (
    <article className="border border-sand rounded-lg p-5 hover:border-warm-400 transition-colors">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <p className="text-xs text-warm-500 mb-1.5">{platform}</p>
          <h3 className="font-serif text-lg leading-snug mb-2 line-clamp-2">
            {question}
          </h3>
          <p className="text-sm text-warm-500">{volume} volume</p>
        </div>
        <div className="text-right shrink-0">
          <p className="font-mono text-2xl">{pct}%</p>
          <p className="text-xs text-warm-500">Yes</p>
        </div>
      </div>
    </article>
  );
}
