import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import toast from "react-hot-toast";
import { getQueueRequest } from "../api/queueApi";
import {
  addTokenRequest,
  cancelTokenRequest,
  completeTokenRequest,
  listTokensRequest,
  reorderTokensRequest,
  serveTopRequest,
  undoTokenRequest,
} from "../api/tokenApi";
import { useAuth } from "../context/AuthContext";
import { useSocket } from "../hooks/useSocket";
import AddTokenForm from "../components/tokens/AddTokenForm";
import TokenDndList from "../components/tokens/TokenDndList";
import EmptyState from "../components/common/EmptyState";
import Skeleton from "../components/common/Skeleton";

export default function QueueDetailPage() {
  const { queueId } = useParams();
  const { token } = useAuth();
  const [queue, setQueue] = useState(null);
  const [tokens, setTokens] = useState([]);
  const [avgServiceSeconds, setAvgServiceSeconds] = useState(0);
  const [pagination, setPagination] = useState(null);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    try {
      const [{ data: queueData }, { data: tokenData }] = await Promise.all([
        getQueueRequest(queueId),
        listTokensRequest(queueId, {
          search: search || undefined,
          page,
          pageSize,
        }),
      ]);
      setQueue(queueData.queue);
      setTokens(tokenData.tokens);
      setAvgServiceSeconds(tokenData.avgServiceSeconds);
      setPagination(tokenData.pagination);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to load queue data");
    } finally {
      setLoading(false);
    }
  }, [queueId, search, page, pageSize]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  useSocket({
    token,
    queueId,
    onEvent: (eventName, payload) => {
      if (payload?.queueId === queueId) {
        fetchAll();
      }
      if (["token:added", "token:reordered", "token:served", "token:cancelled"].includes(eventName)) {
        // These are the required real-time sync actions.
      }
    },
  });

  const waitingCount = useMemo(() => tokens.filter((item) => item.status === "waiting").length, [tokens]);

  const addToken = async (payload) => {
    try {
      const { data } = await addTokenRequest(queueId, payload);
      setTokens(data.tokens);
      setAvgServiceSeconds(data.avgServiceSeconds);
      toast.success("Token added");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to add token");
    }
  };

  const serveTop = async () => {
    try {
      const { data } = await serveTopRequest(queueId);
      setTokens(data.tokens);
      setAvgServiceSeconds(data.avgServiceSeconds);
      toast.success("Top token is now serving");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to serve token");
    }
  };

  const reorder = async (orderedTokenIds) => {
    try {
      const { data } = await reorderTokensRequest(queueId, { orderedTokenIds });
      setTokens(data.tokens);
      setAvgServiceSeconds(data.avgServiceSeconds);
      toast.success("Queue order updated");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to reorder queue");
    }
  };

  const cancel = async (item) => {
    if (!window.confirm(`Cancel token #${item.tokenNumber}?`)) {
      return;
    }

    try {
      const { data } = await cancelTokenRequest(queueId, item._id);
      setTokens(data.tokens);
      setAvgServiceSeconds(data.avgServiceSeconds);
      toast.success("Token cancelled");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to cancel token");
    }
  };

  const undo = async (item) => {
    try {
      const { data } = await undoTokenRequest(queueId, item._id);
      setTokens(data.tokens);
      setAvgServiceSeconds(data.avgServiceSeconds);
      toast.success("Action undone");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to undo action");
    }
  };

  const complete = async (item) => {
    try {
      const { data } = await completeTokenRequest(queueId, item._id);
      setTokens(data.tokens);
      setAvgServiceSeconds(data.avgServiceSeconds);
      toast.success("Token completed");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to complete token");
    }
  };

  if (loading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-24" />
        <Skeleton className="h-14" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <h2 className="text-2xl font-black text-slate-900 dark:text-slate-100">{queue?.name}</h2>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
          Waiting: {waitingCount} • Average service time: {avgServiceSeconds || 0} seconds
        </p>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Capacity: {queue?.capacity || "Unlimited"}</p>
        <div className="mt-4">
          <button type="button" onClick={serveTop} className="rounded-lg bg-slate-900 px-4 py-2 font-semibold text-white">
            Serve Top Token
          </button>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="grid gap-3 md:grid-cols-[1fr_120px_auto]">
          <input
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder="Search by token number, ID, or person name"
            className="rounded-lg border border-slate-300 px-3 py-2 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
          />
          <select
            value={pageSize}
            onChange={(event) => {
              setPageSize(Number(event.target.value));
              setPage(1);
            }}
            className="rounded-lg border border-slate-300 px-3 py-2 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
          >
            <option value={10}>10 / page</option>
            <option value={20}>20 / page</option>
            <option value={50}>50 / page</option>
            <option value={100}>100 / page</option>
          </select>
          <button
            type="button"
            onClick={() => {
              setPage(1);
              setSearch(searchInput.trim());
            }}
            className="rounded-lg bg-teal-600 px-4 py-2 font-semibold text-white"
          >
            Search
          </button>
        </div>
        {search ? (
          <button
            type="button"
            onClick={() => {
              setSearch("");
              setSearchInput("");
              setPage(1);
            }}
            className="mt-2 text-sm text-teal-700 underline dark:text-teal-300"
          >
            Clear search
          </button>
        ) : null}
      </section>

      <AddTokenForm onSubmit={addToken} />

      {tokens.length === 0 ? (
        <EmptyState title="No tokens yet" description="Add the first token to start queue operations." />
      ) : (
        <>
          {search || (pagination && pagination.total > pagination.pageSize) ? (
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Drag reorder is disabled while search or pagination is active. Clear filters to reorder the full waiting list.
            </p>
          ) : null}
          <TokenDndList
            tokens={tokens}
            onReorder={reorder}
            onCancel={cancel}
            onUndo={undo}
            onComplete={complete}
            disableReorder={Boolean(search) || Boolean(pagination && pagination.total > pagination.pageSize)}
          />
        </>
      )}

      {pagination ? (
        <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3 dark:border-slate-800 dark:bg-slate-900">
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Page {pagination.page} of {pagination.totalPages} • Total results: {pagination.total}
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
