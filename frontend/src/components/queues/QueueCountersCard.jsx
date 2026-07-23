import { useMemo, useState } from "react";
import toast from "react-hot-toast";
import {
  addQueueCounterRequest,
  removeQueueCounterRequest,
  renameQueueCounterRequest,
} from "../../api/queueApi";

export default function QueueCountersCard({ queueId, queue, tokens, onQueueChange }) {
  const [newCounterName, setNewCounterName] = useState("");
  const [renameDrafts, setRenameDrafts] = useState({});
  const [isAdding, setIsAdding] = useState(false);
  const [busyCounterId, setBusyCounterId] = useState(null);

  const activeCounters = useMemo(
    () => (queue?.counters || []).filter((counter) => counter.isActive !== false),
    [queue?.counters]
  );

  const busyCounterNames = useMemo(
    () =>
      new Set(
        (tokens || [])
          .filter((token) => token.status === "serving" && token.assignedCounter)
          .map((token) => token.assignedCounter)
      ),
    [tokens]
  );

  const addCounter = async (event) => {
    event.preventDefault();
    const name = newCounterName.trim();
    if (!name) {
      toast.error("Counter name is required");
      return;
    }

    try {
      setIsAdding(true);
      const { data } = await addQueueCounterRequest(queueId, { name });
      onQueueChange(data.queue);
      setNewCounterName("");
      toast.success("Counter added");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to add counter");
    } finally {
      setIsAdding(false);
    }
  };

  const renameCounter = async (counter) => {
    const draft = renameDrafts[counter._id] ?? counter.name;
    const name = draft.trim();
    if (!name) {
      toast.error("Counter name is required");
      return;
    }

    try {
      setBusyCounterId(`rename-${counter._id}`);
      const { data } = await renameQueueCounterRequest(queueId, counter._id, { name });
      onQueueChange(data.queue);
      toast.success("Counter renamed");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to rename counter");
    } finally {
      setBusyCounterId(null);
    }
  };

  const removeCounter = async (counter) => {
    if (!window.confirm(`Remove ${counter.name}?`)) {
      return;
    }

    try {
      setBusyCounterId(`remove-${counter._id}`);
      const { data } = await removeQueueCounterRequest(queueId, counter._id);
      onQueueChange(data.queue);
      toast.success("Counter removed");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to remove counter");
    } finally {
      setBusyCounterId(null);
    }
  };

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">Counters</h3>
      <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
        Manage service counters. Busy counters cannot be renamed or removed while serving.
      </p>

      <form onSubmit={addCounter} className="mt-4 flex flex-col gap-2 sm:flex-row">
        <input
          value={newCounterName}
          onChange={(event) => setNewCounterName(event.target.value)}
          placeholder="Add a new counter name"
          className="w-full rounded-lg border border-slate-300 px-3 py-2 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
        />
        <button
          type="submit"
          disabled={isAdding}
          className="rounded-lg bg-teal-600 px-4 py-2 font-semibold text-white disabled:opacity-60"
        >
          Add Counter
        </button>
      </form>

      <div className="mt-4 space-y-3">
        {activeCounters.map((counter) => {
          const isServing = busyCounterNames.has(counter.name);
          const isOnlyCounter = activeCounters.length <= 1;
          const renameLoading = busyCounterId === `rename-${counter._id}`;
          const removeLoading = busyCounterId === `remove-${counter._id}`;

          return (
            <div
              key={counter._id}
              className="rounded-xl border border-slate-200 p-3 dark:border-slate-700"
            >
              <div className="grid gap-2 md:grid-cols-[1fr_auto_auto]">
                <input
                  value={renameDrafts[counter._id] ?? counter.name}
                  onChange={(event) =>
                    setRenameDrafts((previous) => ({
                      ...previous,
                      [counter._id]: event.target.value,
                    }))
                  }
                  disabled={isServing || renameLoading}
                  className="rounded-lg border border-slate-300 px-3 py-2 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                />
                <button
                  type="button"
                  onClick={() => renameCounter(counter)}
                  disabled={isServing || renameLoading}
                  className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700"
                >
                  Rename
                </button>
                <button
                  type="button"
                  onClick={() => removeCounter(counter)}
                  disabled={isServing || isOnlyCounter || removeLoading}
                  className="rounded-lg border border-rose-300 px-3 py-2 text-sm font-semibold text-rose-700 disabled:cursor-not-allowed disabled:opacity-60 dark:border-rose-800 dark:text-rose-300"
                >
                  Remove
                </button>
              </div>
              {isServing ? (
                <p className="mt-2 text-xs font-medium text-amber-700 dark:text-amber-300">
                  Serving now: rename/remove blocked until this counter is free.
                </p>
              ) : null}
              {!isServing && isOnlyCounter ? (
                <p className="mt-2 text-xs font-medium text-slate-500 dark:text-slate-400">
                  At least one active counter is required.
                </p>
              ) : null}
            </div>
          );
        })}
      </div>
    </section>
  );
}
