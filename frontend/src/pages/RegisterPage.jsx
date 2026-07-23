import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { useAuth } from "../context/AuthContext";

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    try {
      await register(form);
      toast.success("Account created");
      navigate("/queues", { replace: true });
    } catch (error) {
      toast.error(error.response?.data?.message || "Registration failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-page-pattern px-4">
      <form onSubmit={onSubmit} className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-xl">
        <h1 className="text-3xl font-black text-slate-900">Create Manager Account</h1>
        <div className="mt-6 space-y-4">
          <input
            required
            placeholder="Full name"
            value={form.name}
            onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
            className="w-full rounded-lg border border-slate-300 px-3 py-2"
          />
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
            minLength={6}
            placeholder="Password"
            value={form.password}
            onChange={(event) => setForm((prev) => ({ ...prev, password: event.target.value }))}
            className="w-full rounded-lg border border-slate-300 px-3 py-2"
          />
        </div>
        <button disabled={submitting} className="mt-6 w-full rounded-lg bg-teal-700 px-4 py-2 font-semibold text-white disabled:opacity-60">
          {submitting ? "Creating..." : "Create Account"}
        </button>
        <p className="mt-4 text-sm text-slate-600">
          Already registered? <Link to="/login" className="font-semibold text-slate-900">Sign in</Link>
        </p>
      </form>
    </div>
  );
}
