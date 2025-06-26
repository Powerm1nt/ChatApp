import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { useEffect } from "react";
import LoginPage from "./pages/LoginPage";
import SettingsPage from "./pages/SettingsPage";
import ChatView from "./components/chat/ChatView";
import DMView from "./components/chat/DMView";
import { AppLayout } from "./components/layout/AppLayout";
import { useAuthStore } from "./stores/authStore";
import { useSocketStore } from "./stores/socketStore";

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuthStore();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

function App() {
  const { disconnectSocket } = useSocketStore();

  // Cleanup socket on app unmount
  useEffect(() => {
    return () => {
      disconnectSocket();
    };
  }, [disconnectSocket]);

  return (
    <Router>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/me"
          element={
            <ProtectedRoute>
              <AppLayout>
                <DMView />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/guild/:guild_id/:channel_id"
          element={
            <ProtectedRoute>
              <AppLayout>
                <ChatView
                  showUserList={true}
                  showMessagePanel={true}
                  showChannelList={true}
                />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/guild/:guild_id"
          element={
            <ProtectedRoute>
              <AppLayout>
                <ChatView
                  showUserList={false}
                  showMessagePanel={false}
                  showChannelList={true}
                />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/direct/:user_id"
          element={
            <ProtectedRoute>
              <AppLayout>
                <ChatView showUserList={true} showMessagePanel={true} />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/group/:group_id"
          element={
            <ProtectedRoute>
              <AppLayout>
                <ChatView showUserList={true} showMessagePanel={true} />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <AppLayout>
                <SettingsPage />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route path="/" element={<Navigate to="/me" replace />} />
        <Route path="*" element={<Navigate to="/me" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
