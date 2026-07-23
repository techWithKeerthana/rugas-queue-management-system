import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { createQueueRequest, deleteQueueRequest, getQueuesRequest } from "../api/queueApi";
import QueueCard from "../components/queues/QueueCard";
import Skeleton from "../components/common/Skeleton";
import EmptyState from "../components/common/EmptyState";
import ConfirmDialog from "../components/common/ConfirmDialog";

export default function QueuesPage() {
  const [queues, setQueues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [queueName, setQueueName] = useState("");
  const [capacity, setCapacity] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(null);

  const fetchQueues = async () => {
    try {
      const { data } = await getQueuesRequest();
      setQueues(data.queues);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to load queues");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQueues();
  }, []);

  const createQueue = async (event) => {
    event.preventDefault();
    if (!queueName.trim()) {
      return;
    }

    try {
      await createQueueRequest({
        name: queueName.trim(),
        capacity: capacity ? Number(capacity) : null,
      });
      toast.success("Queue created");
      setQueueName("");
      setCapacity("");
      fetchQueues();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to create queue");
    }
  };

  const deleteQueue = async () => {
    if (!confirmDelete) {
      return;
    }

    try {
      await deleteQueueRequest(confirmDelete._id);
      toast.success("Queue deleted");
      setConfirmDelete(null);
      fetchQueues();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to delete queue");
    }
  };

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <h2 className="text-2xl font-black text-slate-900 dark:text-slate-100">Your Queues</h2>
        <form onSubmit={createQueue} className="mt-4 grid gap-3 sm:grid-cols-[1fr_160px_auto]">
          <input
            value={queueName}
            onChange={(event) => setQueueName(event.target.value)}
            placeholder="Create a queue name"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
          />
          <input
            type="number"
            min="1"
            value={capacity}
            onChange={(event) => setCapacity(event.target.value)}
            placeholder="Capacity"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
          />
          <button className="rounded-lg bg-amber-500 px-4 py-2 font-semibold text-slate-900">Create Queue</button>
        </form>
      </section>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Skeleton className="h-40" />
          <Skeleton className="h-40" />
          <Skeleton className="h-40" />
        </div>
      ) : null}

      {!loading && queues.length === 0 ? (
        <EmptyState title="No queues created yet" description="Create your first queue to start issuing tokens." />
      ) : null}

      {!loading && queues.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {queues.map((queue) => (
            <QueueCard key={queue._id} queue={queue} onDelete={setConfirmDelete} />
          ))}
        </div>
      ) : null}

      <ConfirmDialog
        open={Boolean(confirmDelete)}
        title="Delete this queue?"
        description="This removes the queue and all its tokens. This action cannot be reversed."
        onCancel={() => setConfirmDelete(null)}
        onConfirm={deleteQueue}
      />
    </div>
  );
}
