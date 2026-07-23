import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import { joinPublicQueueRequest } from "../api/tokenApi";

export default function JoinPage() {
  const { queueId } = useParams();
  const navigate = useNavigate();
  const [personName, setPersonName] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    const trimmedName = personName.trim();
    if (!trimmedName) {
      toast.error("Enter your name to join the queue");
      return;
    }

    setLoading(true);
    try {
      const { data } = await joinPublicQueueRequest(queueId, { personName: trimmedName });
      toast.success(`You're in line as token #${data.tokenNumber}`);
      navigate(`/track/${queueId}/${data.tokenId}`);
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to join the queue");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen px-4 py-10 text-slate-900 dark:text-slate-100">
      <section className="surface-card mx-auto max-w-lg animate-fade-up p-6">
        <h1 className="heading-display text-3xl font-black">Join Queue</h1>
        <p className="mt-1 text-sm text-muted">Enter your name to get a token and track your place.</p>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <label className="block">
            <span className="mb-1 block text-sm font-semibold">Your name</span>
            <input
              value={personName}
              onChange={(event) => setPersonName(event.target.value)}
              className="soft-input"
              placeholder="Enter your full name"
              maxLength={120}
              autoComplete="name"
            />
          </label>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full disabled:opacity-60"
          >
            {loading ? "Joining..." : "Join Queue"}
          </button>
        </form>
      </section>
    </main>
  );
}
