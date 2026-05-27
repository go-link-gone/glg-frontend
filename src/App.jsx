import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import AuthPage from './pages/AuthPage';
import HomePage from './pages/HomePage';
import MyLinksPage from './pages/MyLinksPage';
import NotFoundPage from './pages/NotFoundPage';
import ComingSoonPage from './pages/ComingSoonPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import Spinner from './components/Spinner';

// Recharts is heavy; only pay for it when the user opens an analytics page.
const AnalyticsPage = lazy(() => import('./pages/AnalyticsPage'));

function FullScreenLoader() {
  return (
    <div className="grid min-h-screen place-items-center bg-background">
      <Spinner size={28} color="#2a4cff" label="Loading…" />
    </div>
  );
}

function Protected({ children }) {
  const { session, loading } = useAuth();
  if (loading) return <FullScreenLoader />;
  if (!session) return <Navigate to="/auth" replace />;
  return children;
}

function PublicOnly({ children }) {
  const { session, loading } = useAuth();
  if (loading) return <FullScreenLoader />;
  if (session) return <Navigate to="/" replace />;
  return children;
}

export default function App() {
  return (
    <Suspense fallback={<FullScreenLoader />}>
      <Routes>
        <Route
          path="/auth"
          element={
            <PublicOnly>
              <AuthPage />
            </PublicOnly>
          }
        />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/" element={<HomePage />} />
        <Route
          path="/links"
          element={
            <Protected>
              <MyLinksPage />
            </Protected>
          }
        />
        <Route
          path="/links/:shortKey/analytics"
          element={
            <Protected>
              <AnalyticsPage />
            </Protected>
          }
        />

        {/* Public stub pages — surface real-looking destinations for footer links
            until production copy is ready. */}
        <Route path="/privacy" element={<ComingSoonPage />} />
        <Route path="/terms" element={<ComingSoonPage />} />
        <Route path="/docs" element={<ComingSoonPage />} />

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Suspense>
  );
}
