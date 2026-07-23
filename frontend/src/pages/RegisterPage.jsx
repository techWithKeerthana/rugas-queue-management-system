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
    <div className="flex min-h-screen items-center justify-center px-4 py-10">
      <form onSubmit={onSubmit} className="surface-card w-full max-w-md animate-fade-up p-8">
        <h1 className="heading-display text-3xl font-black">Create Manager Account</h1>
        <div className="mt-6 space-y-4">
          <input
            required
            placeholder="Full name"
            value={form.name}
            onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
            className="soft-input"
          />
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
            minLength={6}
            placeholder="Password"
            value={form.password}
            onChange={(event) => setForm((prev) => ({ ...prev, password: event.target.value }))}
            className="soft-input"
          />
        </div>
        <button disabled={submitting} className="btn-primary mt-6 w-full disabled:opacity-60">
          {submitting ? "Creating..." : "Create Account"}
        </button>
        <p className="mt-4 text-sm text-muted">
          Already registered? <Link to="/login" className="font-semibold text-brand-700 dark:text-brand-300">Sign in</Link>
        </p>
      </form>
    </div>
  );
}
