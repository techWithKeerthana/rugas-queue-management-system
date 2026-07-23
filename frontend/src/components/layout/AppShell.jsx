import { useEffect, useRef, useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";

export default function AppShell({ children }) {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const onClick = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-page-pattern">
      <header className="border-b border-slate-200 bg-white/70 backdrop-blur dark:border-slate-800 dark:bg-slate-900/70">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <Link to="/queues" className="text-xl font-black tracking-tight text-slate-900 dark:text-slate-100">
            QueueFlow
          </Link>
          <nav className="flex items-center gap-3 text-sm font-medium">
            <NavLink to="/queues" className={({ isActive }) => (isActive ? "tab-link tab-link-active" : "tab-link")}>
              Queues
            </NavLink>
            <NavLink to="/analytics" className={({ isActive }) => (isActive ? "tab-link tab-link-active" : "tab-link")}>
              Analytics
            </NavLink>
            <NavLink to="/activity-logs" className={({ isActive }) => (isActive ? "tab-link tab-link-active" : "tab-link")}>
              Activity
            </NavLink>
            <div className="relative" ref={menuRef}>
              <button
                type="button"
                onClick={() => setMenuOpen((prev) => !prev)}
                className="rounded-lg border border-slate-300 px-3 py-1.5 text-slate-700 dark:border-slate-700 dark:text-slate-200"
              >
                {user?.name || "Profile"}
              </button>

              {menuOpen ? (
                <div className="absolute right-0 z-50 mt-2 w-64 rounded-xl border border-slate-200 bg-white p-3 shadow-lg dark:border-slate-700 dark:bg-slate-900">
                  <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{user?.name}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{user?.email}</p>

                  <button
                    type="button"
                    onClick={toggleTheme}
                    className="mt-3 w-full rounded-md border border-slate-300 px-3 py-2 text-left text-sm text-slate-700 dark:border-slate-700 dark:text-slate-200"
                  >
                    Theme: {theme === "dark" ? "Dark" : "Light"} (toggle)
                  </button>

                  <button
                    type="button"
                    onClick={handleLogout}
                    className="mt-2 w-full rounded-md bg-slate-900 px-3 py-2 text-left text-sm text-white dark:bg-slate-100 dark:text-slate-900"
                  >
                    Logout
                  </button>
                </div>
              ) : null}
            </div>
          </nav>
        </div>
      </header>
      <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">{children}</main>
    </div>
  );
}
