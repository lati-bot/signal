export default function Home() {
  return (
    <div className="max-w-5xl mx-auto px-6">
      <section className="py-20 max-w-2xl">
        <h1 className="font-serif text-4xl leading-tight mb-6">
          See what the world thinks is going to happen.
        </h1>
        <p className="text-warm-600 text-lg leading-relaxed mb-8">
          Signal aggregates prediction markets from Polymarket, Kalshi, and
          Manifold into one place. Track probabilities, spot trends, and
          understand how real money prices events.
        </p>
        <a
          href="/markets"
          className="inline-block bg-ink text-cream px-5 py-2.5 text-sm rounded hover:bg-warm-800 transition-colors"
        >
          Browse markets
        </a>
      </section>

      <section className="border-t border-sand py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 max-w-lg">
          <div>
            <p className="text-sm text-warm-500 mb-1">Markets tracked</p>
            <p className="font-serif text-2xl">3 platforms</p>
          </div>
          <div>
            <p className="text-sm text-warm-500 mb-1">Updated</p>
            <p className="font-serif text-2xl">Every 15 min</p>
          </div>
        </div>
      </section>
    </div>
  );
}
