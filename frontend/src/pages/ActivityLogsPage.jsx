import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { getActivityLogsRequest } from "../api/activityLogApi";
import Skeleton from "../components/common/Skeleton";

export default function ActivityLogsPage() {
  const [logs, setLogs] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLogs = async () => {
      setLoading(true);
      try {
        const { data } = await getActivityLogsRequest({ page, pageSize: 20 });
        setLogs(data.logs);
        setPagination(data.pagination);
      } catch (error) {
        toast.error(error.response?.data?.message || "Failed to load activity logs");
      } finally {
        setLoading(false);
      }
    };

    fetchLogs();
  }, [page]);

  if (loading) {
    return (
      <div className="premium-page">
        <Skeleton className="h-16" />
        <Skeleton className="h-16" />
        <Skeleton className="h-16" />
      </div>
    );
  }

  return (
    <div className="premium-page">
      <section className="surface-card surface-card-hover">
        <h2 className="heading-display text-3xl font-black">Activity Logs</h2>
        <p className="text-sm text-muted">Recent manager actions across queues and tokens.</p>
      </section>

      <section className="surface-card">
        {logs.length === 0 ? (
          <p className="text-sm text-muted">No activity recorded yet.</p>
        ) : (
          <div className="space-y-3">
            {logs.map((log) => (
              <article key={log._id} className="surface-panel">
                <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{log.message}</p>
                <p className="text-xs text-soft">
                  {log.action} • {new Date(log.createdAt).toLocaleString()}
                </p>
              </article>
            ))}
          </div>
        )}
      </section>

      {pagination ? (
        <div className="surface-card flex items-center justify-between px-4 py-3">
          <p className="text-sm text-muted">
            Page {pagination.page} of {pagination.totalPages}
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={!pagination.hasPreviousPage}
              onClick={() => setPage((prev) => Math.max(1, prev - 1))}
              className="btn-secondary disabled:opacity-50"
            >
              Previous
            </button>
            <button
              type="button"
              disabled={!pagination.hasNextPage}
              onClick={() => setPage((prev) => prev + 1)}
              className="btn-secondary disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
