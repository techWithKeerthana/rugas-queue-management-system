import { formatSeconds } from "../../utils/format";

export default function KpiCards({ summary }) {
  const cards = [
    ["Total", summary.total],
    ["Waiting", summary.waiting],
    ["Serving", summary.serving],
    ["Completed", summary.completed],
    ["Cancelled", summary.cancelled],
    ["Avg Wait", formatSeconds(summary.avgWaitTimeSec)],
    ["Avg Service", formatSeconds(summary.avgServiceTimeSec)],
    ["Longest Waiting", summary.longestWaitingToken ? `${summary.longestWaitingToken.personName} (${formatSeconds(summary.longestWaitingToken.waitingSeconds)})` : "-"],
  ];

  return (
    <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map(([label, value]) => (
        <article key={label} className="surface-card surface-card-hover rounded-2xl p-4">
          <p className="text-xs uppercase tracking-widest text-soft">{label}</p>
          <p className="mt-2 font-display text-xl font-bold text-slate-900 dark:text-slate-100">{value}</p>
        </article>
      ))}
    </section>
  );
}
