import { Link } from "react-router-dom";

export default function QueueCard({ queue, waitingCount = 0, onDelete }) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md">
      <h3 className="text-lg font-bold text-slate-900">{queue.name}</h3>
      <p className="mt-1 text-sm text-slate-500">Waiting tokens: {waitingCount}</p>
      <div className="mt-5 flex items-center gap-3">
        <Link to={`/queues/${queue._id}`} className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-slate-900">
          Open Queue
        </Link>
        <button
          type="button"
          onClick={() => onDelete(queue)}
          className="rounded-lg border border-rose-200 px-4 py-2 text-sm font-semibold text-rose-700"
        >
          Delete
        </button>
      </div>
    </article>
  );
}
