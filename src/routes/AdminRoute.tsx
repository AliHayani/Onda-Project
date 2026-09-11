import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import useAuth from '../features/auth/useAuth';
import { isAdminUser } from '../features/procedures/rbac';

interface AdminRouteProps {
  children: React.ReactNode;
}

const AdminRoute: React.FC<AdminRouteProps> = ({ children }) => {
  const { isAuthenticated, user } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (!isAdminUser(user)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <>{children}</>;
};

export default AdminRoute;
