import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './stores/authStore';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { Terminals } from './pages/Terminals';
import { TerminalView } from './pages/TerminalView';
import { Snapshots } from './pages/Snapshots';
import { Users } from './pages/Users';
import { Layout } from './components/Layout';

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const token = useAuthStore((state) => state.token);
  return token ? <>{children}</> : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/"
        element={
          <PrivateRoute>
            <Layout />
          </PrivateRoute>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="terminals" element={<Terminals />} />
        <Route path="terminals/:id" element={<TerminalView />} />
        <Route path="snapshots" element={<Snapshots />} />
        <Route path="users" element={<Users />} />
      </Route>
    </Routes>
  );
}
