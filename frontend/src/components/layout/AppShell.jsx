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
    <div className="min-h-screen">
      <header className="glass-nav sticky top-0 z-40 border-b">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <Link to="/queues" className="heading-display text-xl font-extrabold">
            QueueFlow <span className="text-brand-500">Suite</span>
          </Link>
          <nav className="flex items-center gap-2 text-sm font-medium">
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
                className="btn-secondary min-w-[112px]"
              >
                {user?.name || "Profile"}
              </button>

              {menuOpen ? (
                <div className="surface-panel absolute right-0 z-50 mt-2 w-72 p-3">
                  <p className="heading-display text-sm font-bold">{user?.name}</p>
                  <p className="text-xs text-soft">{user?.email}</p>

                  <button
                    type="button"
                    onClick={toggleTheme}
                    className="btn-secondary mt-3 w-full text-left"
                  >
                    Theme: {theme === "dark" ? "Dark" : "Light"} (toggle)
                  </button>

                  <button
                    type="button"
                    onClick={handleLogout}
                    className="btn-primary mt-2 w-full text-left"
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
