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
    <div className="flex min-h-screen items-center justify-center bg-page-pattern px-4">
      <form onSubmit={onSubmit} className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-xl">
        <h1 className="text-3xl font-black text-slate-900">QueueFlow Login</h1>
        <p className="mt-2 text-slate-600">Manage tokens and serve faster.</p>
        <div className="mt-6 space-y-4">
          <input
            type="email"
            required
            placeholder="Email"
            value={form.email}
            onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
            className="w-full rounded-lg border border-slate-300 px-3 py-2"
          />
          <input
            type="password"
            required
            placeholder="Password"
            value={form.password}
            onChange={(event) => setForm((prev) => ({ ...prev, password: event.target.value }))}
            className="w-full rounded-lg border border-slate-300 px-3 py-2"
          />
        </div>
        <button disabled={submitting} className="mt-6 w-full rounded-lg bg-slate-900 px-4 py-2 font-semibold text-white disabled:opacity-60">
          {submitting ? "Signing in..." : "Sign In"}
        </button>
        <p className="mt-4 text-sm text-slate-600">
          New manager? <Link to="/register" className="font-semibold text-teal-700">Create account</Link>
        </p>
      </form>
    </div>
  );
}
