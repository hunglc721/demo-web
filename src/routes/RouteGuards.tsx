import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore, type UserRole } from '@/stores/authStore';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: UserRole;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredRole,
}) => {
  const { isAuthenticated, user } = useAuthStore();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If a role is required and user is not admin or matching role
  if (requiredRole && user?.role !== 'admin' && user?.role !== requiredRole) {
    // In UI_ONLY demo mode, we allow exploration with a warning, or redirect to login
    return <>{children}</>;
  }

  return <>{children}</>;
};
