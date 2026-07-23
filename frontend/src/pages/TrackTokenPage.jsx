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
    return <div className="mx-auto max-w-xl p-6 text-muted">Loading token status...</div>;
  }

  return (
    <main className="min-h-screen px-4 py-10 text-slate-900 dark:text-slate-100">
      <section className="surface-card mx-auto max-w-xl animate-fade-up p-6">
        <h1 className="heading-display text-3xl font-black">Queue Status</h1>

        {errorMessage ? (
          <p className="mt-4 rounded-xl bg-rose-100/80 p-3 text-sm text-rose-700 dark:bg-rose-900/30 dark:text-rose-300">{errorMessage}</p>
        ) : (
          <div className="mt-4 space-y-3">
            <p className="text-sm text-muted">Token #{tracking?.tokenNumber}</p>
            <p className="heading-display text-xl font-semibold">{statusLabel[tracking?.status] || tracking?.status}</p>
            {tracking?.status === "serving" && tracking?.assignedCounter ? (
              <p className="rounded-xl bg-emerald-100/80 px-3 py-2 font-medium text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300">
                Go to {tracking.assignedCounter}
              </p>
            ) : null}
            <p>
              Position: {tracking?.positionInQueue === null ? "N/A" : tracking?.positionInQueue}
            </p>
            <p className="text-muted">Estimated wait: {tracking?.estimatedWaitSeconds || 0} seconds</p>
          </div>
        )}
      </section>
    </main>
  );
}
