import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { Result, Button } from 'antd';
import { useAuthStore } from '@modules/auth/store/authStore';
import { tokenStorage } from '@core/auth/tokenStorage';

interface ProtectedRouteProps {
  requiredRoles?: string[];
}

export function ProtectedRoute({ requiredRoles }: ProtectedRouteProps) {
  const location = useLocation();
  const { isAuthenticated, hasRole } = useAuthStore();

  // Check token validity (handles page refresh scenario)
  if (!isAuthenticated || !tokenStorage.isTokenValid()) {
    return (
      <Navigate
        to={`/login?reason=unauthorized`}
        state={{ from: location }}
        replace
      />
    );
  }

  // Role guard — if no requiredRoles specified, any authenticated user passes
  if (requiredRoles && requiredRoles.length > 0 && !hasRole(requiredRoles)) {
    return (
      <Result
        status="403"
        title="403 — Access Denied"
        subTitle="You do not have the required role to view this page."
        extra={
          <Button type="primary" onClick={() => window.history.back()}>
            Go Back
          </Button>
        }
      />
    );
  }

  return <Outlet />;
}
