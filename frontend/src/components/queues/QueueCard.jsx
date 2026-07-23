import { Link } from "react-router-dom";

export default function QueueCard({ queue, waitingCount = 0, onDelete }) {
  return (
    <article className="surface-card surface-card-hover">
      <h3 className="heading-display text-lg font-bold">{queue.name}</h3>
      <p className="mt-1 text-sm text-muted">Waiting tokens: {waitingCount}</p>
      <p className="mt-1 text-xs text-soft">Capacity: {queue.capacity || "Unlimited"}</p>
      <div className="mt-5 flex items-center gap-3">
        <Link to={`/queues/${queue._id}`} className="btn-primary">
          Open Queue
        </Link>
        <button
          type="button"
          onClick={() => onDelete(queue)}
          className="btn-secondary border-rose-200 text-rose-700 dark:border-rose-800 dark:text-rose-300"
        >
          Delete
        </button>
      </div>
    </article>
  );
}
