import { useCallback, useEffect, useRef, useState } from "react";
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
  const previousTrackingRef = useRef(null);
  const hasHydratedRef = useRef(false);

  useEffect(() => {
    if (typeof window === "undefined" || !("Notification" in window)) {
      return undefined;
    }

    if (Notification.permission === "default") {
      Notification.requestPermission().catch(() => {});
    }

    return undefined;
  }, []);

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


  useEffect(() => {
    if (!tracking) {
      return;
    }

    if (!hasHydratedRef.current) {
      hasHydratedRef.current = true;
      previousTrackingRef.current = tracking;
      return;
    }

    const previousTracking = previousTrackingRef.current;
    const isNextNow = tracking.status === "waiting" && tracking.positionInQueue === 1;
    const wasNextNow = previousTracking?.status === "waiting" && previousTracking?.positionInQueue === 1;
    const becameServing = tracking.status === "serving" && previousTracking?.status !== "serving";
    const shouldNotify =
      (isNextNow && !wasNextNow && previousTracking?.status !== "serving") || becameServing;

    if (shouldNotify && typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted") {
      const title = tracking.status === "serving" ? "Now serving" : "You're next";
      const body =
        tracking.status === "serving"
          ? `Token #${tracking.tokenNumber} is now being served.`
          : `Token #${tracking.tokenNumber} is next in line.`;

      new Notification(title, { body });
    }

    previousTrackingRef.current = tracking;
  }, [tracking]);
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
