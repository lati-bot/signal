export function ProbabilitySlider({
  value,
  label = "Yes",
}: {
  value: number;
  label?: string;
}) {
  const pct = Math.round(value * 100);

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-warm-600">{label}</span>
        <span className="font-mono text-lg">{pct}%</span>
      </div>
      <div className="h-2 bg-sand rounded-full overflow-hidden">
        <div
          className="h-full bg-ink rounded-full transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
