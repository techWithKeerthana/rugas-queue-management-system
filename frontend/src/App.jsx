import { Suspense, lazy } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import ProtectedRoute from "./components/common/ProtectedRoute";
import AppShell from "./components/layout/AppShell";

const LoginPage = lazy(() => import("./pages/LoginPage"));
const RegisterPage = lazy(() => import("./pages/RegisterPage"));
const QueuesPage = lazy(() => import("./pages/QueuesPage"));
const QueueDetailPage = lazy(() => import("./pages/QueueDetailPage"));
const AnalyticsPage = lazy(() => import("./pages/AnalyticsPage"));
const ActivityLogsPage = lazy(() => import("./pages/ActivityLogsPage"));
const TrackTokenPage = lazy(() => import("./pages/TrackTokenPage"));
const JoinPage = lazy(() => import("./pages/JoinPage"));

function RouteFallback() {
  return (
    <div className="premium-page">
      <section className="surface-card">
        <p className="text-sm text-muted">Loading page...</p>
      </section>
    </div>
  );
}

function LazyPage({ children }) {
  return <Suspense fallback={<RouteFallback />}>{children}</Suspense>;
}

function App() {
  return (
    <Routes>
      <Route
        path="/login"
        element={
          <LazyPage>
            <LoginPage />
          </LazyPage>
        }
      />
      <Route
        path="/register"
        element={
          <LazyPage>
            <RegisterPage />
          </LazyPage>
        }
      />
      <Route
        path="/join/:queueId"
        element={
          <LazyPage>
            <JoinPage />
          </LazyPage>
        }
      />
      <Route
        path="/track/:queueId/:tokenId"
        element={
          <LazyPage>
            <TrackTokenPage />
          </LazyPage>
        }
      />

      <Route
        path="/queues"
        element={
          <ProtectedRoute>
            <AppShell>
              <LazyPage>
                <QueuesPage />
              </LazyPage>
            </AppShell>
          </ProtectedRoute>
        }
      />

      <Route
        path="/queues/:queueId"
        element={
          <ProtectedRoute>
            <AppShell>
              <LazyPage>
                <QueueDetailPage />
              </LazyPage>
            </AppShell>
          </ProtectedRoute>
        }
      />

      <Route
        path="/analytics"
        element={
          <ProtectedRoute>
            <AppShell>
              <LazyPage>
                <AnalyticsPage />
              </LazyPage>
            </AppShell>
          </ProtectedRoute>
        }
      />

      <Route
        path="/activity-logs"
        element={
          <ProtectedRoute>
            <AppShell>
              <LazyPage>
                <ActivityLogsPage />
              </LazyPage>
            </AppShell>
          </ProtectedRoute>
        }
      />

      <Route path="*" element={<Navigate to="/queues" replace />} />
    </Routes>
  );
}

export default App;
