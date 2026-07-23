import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { useAuth } from "../context/AuthContext";

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: "", password: "" });
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    try {
      await login(form);
      toast.success("Welcome back");
      navigate(location.state?.from?.pathname || "/queues", { replace: true });
    } catch (error) {
      toast.error(error.response?.data?.message || "Login failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-10">
      <form onSubmit={onSubmit} className="surface-card w-full max-w-md animate-fade-up p-8">
        <h1 className="heading-display text-3xl font-black">QueueFlow Login</h1>
        <p className="mt-2 text-sm text-muted">Manage tokens and serve faster.</p>
        <div className="mt-6 space-y-4">
          <input
            type="email"
            required
            placeholder="Email"
            value={form.email}
            onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
            className="soft-input"
          />
          <input
            type="password"
            required
            placeholder="Password"
            value={form.password}
            onChange={(event) => setForm((prev) => ({ ...prev, password: event.target.value }))}
            className="soft-input"
          />
        </div>
        <button disabled={submitting} className="btn-primary mt-6 w-full disabled:opacity-60">
          {submitting ? "Signing in..." : "Sign In"}
        </button>
        <p className="mt-4 text-sm text-muted">
          New manager? <Link to="/register" className="font-semibold text-brand-700 dark:text-brand-300">Create account</Link>
        </p>
      </form>
    </div>
  );
}
