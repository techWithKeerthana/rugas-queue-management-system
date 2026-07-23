import { Navigate, Route, Routes } from "react-router-dom";
import ProtectedRoute from "./components/common/ProtectedRoute";
import AppShell from "./components/layout/AppShell";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import QueuesPage from "./pages/QueuesPage";
import QueueDetailPage from "./pages/QueueDetailPage";
import AnalyticsPage from "./pages/AnalyticsPage";

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      <Route
        path="/queues"
        element={
          <ProtectedRoute>
            <AppShell>
              <QueuesPage />
            </AppShell>
          </ProtectedRoute>
        }
      />

      <Route
        path="/queues/:queueId"
        element={
          <ProtectedRoute>
            <AppShell>
              <QueueDetailPage />
            </AppShell>
          </ProtectedRoute>
        }
      />

      <Route
        path="/analytics"
        element={
          <ProtectedRoute>
            <AppShell>
              <AnalyticsPage />
            </AppShell>
          </ProtectedRoute>
        }
      />

      <Route path="*" element={<Navigate to="/queues" replace />} />
    </Routes>
  );
}

export default App;
