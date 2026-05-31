import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import AuthCallback from './pages/AuthCallback';
import Repositories from './pages/Repositories';
import Jobs from './pages/Jobs';
import NewJob from './pages/NewJob';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const token = localStorage.getItem('luwiai_token');
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
}

export default function App() {
  const auth = useAuth();

  return (
    <Routes>
      <Route path="/login" element={<Login loginUrl={auth.loginUrl} />} />
      <Route path="/auth/callback" element={<AuthCallback onLogin={auth.login} />} />
      <Route
        element={
          <ProtectedRoute>
            <Layout user={auth.user} onLogout={auth.logout} />
          </ProtectedRoute>
        }
      >
        <Route path="/" element={<Dashboard />} />
        <Route path="/repositories" element={<Repositories />} />
        <Route path="/jobs" element={<Jobs />} />
        <Route path="/jobs/new" element={<NewJob />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}