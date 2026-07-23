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
        <article key={label} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-slate-500">{label}</p>
          <p className="mt-2 text-xl font-bold text-slate-900">{value}</p>
        </article>
      ))}
    </section>
  );
}
