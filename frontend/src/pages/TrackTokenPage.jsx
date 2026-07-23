import { useCallback, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getPublicTrackRequest } from "../api/tokenApi";
import { usePublicTrackSocket } from "../hooks/usePublicTrackSocket";

const statusLabel = {
  waiting: "Waiting",
  serving: "Now Serving",
  completed: "Completed",
  cancelled: "Cancelled",
};

export default function TrackTokenPage() {
  const { queueId, tokenId } = useParams();
  const [tracking, setTracking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  const fetchTracking = useCallback(async () => {
    try {
      const { data } = await getPublicTrackRequest(queueId, tokenId);
      setTracking(data.tracking);
      setErrorMessage("");
    } catch (error) {
      setTracking(null);
      setErrorMessage(error.response?.data?.message || "Unable to load tracking status");
    } finally {
      setLoading(false);
    }
  }, [queueId, tokenId]);

  useEffect(() => {
    fetchTracking();
  }, [fetchTracking]);

  usePublicTrackSocket({
    queueId,
    tokenId,
    onInvalidate: fetchTracking,
  });

  if (loading) {
    return <div className="mx-auto max-w-xl p-6 text-slate-700">Loading token status...</div>;
  }

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-10 text-slate-900">
      <section className="mx-auto max-w-xl rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-black">Queue Status</h1>

        {errorMessage ? (
          <p className="mt-4 rounded-lg bg-rose-50 p-3 text-sm text-rose-700">{errorMessage}</p>
        ) : (
          <div className="mt-4 space-y-3">
            <p className="text-sm text-slate-600">Token #{tracking?.tokenNumber}</p>
            <p className="text-lg font-semibold">{statusLabel[tracking?.status] || tracking?.status}</p>
            <p>
              Position: {tracking?.positionInQueue === null ? "N/A" : tracking?.positionInQueue}
            </p>
            <p>Estimated wait: {tracking?.estimatedWaitSeconds || 0} seconds</p>
          </div>
        )}
      </section>
    </main>
  );
}
