import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

export default function AppShell({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-page-pattern">
      <header className="border-b border-slate-200 bg-white/70 backdrop-blur">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <Link to="/queues" className="text-xl font-black tracking-tight text-slate-900">
            QueueFlow
          </Link>
          <nav className="flex items-center gap-3 text-sm font-medium">
            <NavLink to="/queues" className={({ isActive }) => (isActive ? "tab-link tab-link-active" : "tab-link")}>
              Queues
            </NavLink>
            <NavLink to="/analytics" className={({ isActive }) => (isActive ? "tab-link tab-link-active" : "tab-link")}>
              Analytics
            </NavLink>
            <span className="hidden text-slate-500 sm:inline">{user?.name}</span>
            <button type="button" onClick={handleLogout} className="rounded-lg bg-slate-900 px-3 py-1.5 text-white">
              Logout
            </button>
          </nav>
        </div>
      </header>
      <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">{children}</main>
    </div>
  );
}
