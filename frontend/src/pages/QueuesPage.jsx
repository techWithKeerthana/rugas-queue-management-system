import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import {
  archiveQueueRequest,
  createQueueRequest,
  deleteQueueRequest,
  getQueuesRequest,
  unarchiveQueueRequest,
} from "../api/queueApi";
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
  const [statusFilter, setStatusFilter] = useState("active");

  const fetchQueues = async () => {
    try {
      const { data } = await getQueuesRequest({ status: statusFilter });
      setQueues(data.queues);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to load queues");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQueues();
  }, [statusFilter]);

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

  const toggleArchive = async (queue) => {
    try {
      if (queue.isArchived) {
        await unarchiveQueueRequest(queue._id);
        toast.success("Queue moved to active");
      } else {
        await archiveQueueRequest(queue._id);
        toast.success("Queue archived");
      }
      fetchQueues();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update archive status");
    }
  };

  return (
    <div className="premium-page">
      <section className="surface-card surface-card-hover">
        <h2 className="heading-display text-3xl font-black">Your Queues</h2>
        <p className="mt-2 max-w-2xl text-sm text-muted">
          Configure and operate each queue from a clean central dashboard built for high-throughput counter workflows.
        </p>
        <div className="mt-3 flex gap-2">
          <button
            type="button"
            onClick={() => setStatusFilter("active")}
            className={statusFilter === "active" ? "tab-link tab-link-active" : "tab-link"}
          >
            Active
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter("archived")}
            className={statusFilter === "archived" ? "tab-link tab-link-active" : "tab-link"}
          >
            Archived
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter("all")}
            className={statusFilter === "all" ? "tab-link tab-link-active" : "tab-link"}
          >
            All
          </button>
        </div>
        <form onSubmit={createQueue} className="mt-4 grid gap-3 sm:grid-cols-[1fr_160px_auto]">
          <input
            value={queueName}
            onChange={(event) => setQueueName(event.target.value)}
            placeholder="Create a queue name"
            className="soft-input"
          />
          <input
            type="number"
            min="1"
            value={capacity}
            onChange={(event) => setCapacity(event.target.value)}
            placeholder="Capacity"
            className="soft-input"
          />
          <button className="btn-primary">Create Queue</button>
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
            <div key={queue._id} className="space-y-2">
              <QueueCard queue={queue} onDelete={setConfirmDelete} />
              <button
                type="button"
                onClick={() => toggleArchive(queue)}
                className="btn-secondary w-full"
              >
                {queue.isArchived ? "Unarchive" : "Archive"}
              </button>
            </div>
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
