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
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    try {
      const [{ data: queueData }, { data: tokenData }] = await Promise.all([
        getQueueRequest(queueId),
        listTokensRequest(queueId),
      ]);
      setQueue(queueData.queue);
      setTokens(tokenData.tokens);
      setAvgServiceSeconds(tokenData.avgServiceSeconds);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to load queue data");
    } finally {
      setLoading(false);
    }
  }, [queueId]);

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
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-2xl font-black text-slate-900">{queue?.name}</h2>
        <p className="mt-2 text-sm text-slate-600">
          Waiting: {waitingCount} • Average service time: {avgServiceSeconds || 0} seconds
        </p>
        <div className="mt-4">
          <button type="button" onClick={serveTop} className="rounded-lg bg-slate-900 px-4 py-2 font-semibold text-white">
            Serve Top Token
          </button>
        </div>
      </section>

      <AddTokenForm onSubmit={addToken} />

      {tokens.length === 0 ? (
        <EmptyState title="No tokens yet" description="Add the first token to start queue operations." />
      ) : (
        <TokenDndList tokens={tokens} onReorder={reorder} onCancel={cancel} onUndo={undo} onComplete={complete} />
      )}
    </div>
  );
}
