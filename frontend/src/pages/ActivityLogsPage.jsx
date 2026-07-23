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
      <div className="space-y-3">
        <Skeleton className="h-16" />
        <Skeleton className="h-16" />
        <Skeleton className="h-16" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <section className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
        <h2 className="text-2xl font-black text-slate-900 dark:text-slate-100">Activity Logs</h2>
        <p className="text-sm text-slate-600 dark:text-slate-400">Recent manager actions across queues and tokens.</p>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
        {logs.length === 0 ? (
          <p className="text-sm text-slate-600 dark:text-slate-400">No activity recorded yet.</p>
        ) : (
          <div className="space-y-3">
            {logs.map((log) => (
              <article key={log._id} className="rounded-lg border border-slate-200 px-3 py-2 dark:border-slate-700">
                <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{log.message}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {log.action} • {new Date(log.createdAt).toLocaleString()}
                </p>
              </article>
            ))}
          </div>
        )}
      </section>

      {pagination ? (
        <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3 dark:border-slate-800 dark:bg-slate-900">
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Page {pagination.page} of {pagination.totalPages}
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={!pagination.hasPreviousPage}
              onClick={() => setPage((prev) => Math.max(1, prev - 1))}
              className="rounded-md border border-slate-300 px-3 py-1 text-sm disabled:opacity-50 dark:border-slate-700"
            >
              Previous
            </button>
            <button
              type="button"
              disabled={!pagination.hasNextPage}
              onClick={() => setPage((prev) => prev + 1)}
              className="rounded-md border border-slate-300 px-3 py-1 text-sm disabled:opacity-50 dark:border-slate-700"
            >
              Next
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
