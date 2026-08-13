import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Layout from './Layout';

interface ProtectedRouteProps {
  /** When true, members are redirected to their self-service account page instead of rendering this route. */
  staffOnly?: boolean;
}

export default function ProtectedRoute({ staffOnly }: ProtectedRouteProps) {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (staffOnly && user.role === 'member') {
    return <Navigate to="/my-account" replace />;
  }

  return <Layout />;
}
