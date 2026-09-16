import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import type { UserRole } from '../types';

interface ProtectedRouteProps {
  allowedRoles?: UserRole[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ allowedRoles }) => {
  const { user, profile, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // Not logged in
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Logged in but profile fetch failed or no role assigned
  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 flex-col gap-4 p-4 text-center">
        <p className="text-error font-medium">Data profil tidak ditemukan.</p>
        <p className="text-sm text-gray-500">Silakan hubungi admin untuk verifikasi akun Anda.</p>
      </div>
    );
  }

  // Role validation
  if (allowedRoles && !allowedRoles.includes(profile.role)) {
    // Redirect to their respective default dashboard based on their actual role
    if (profile.role === 'examiner') {
      return <Navigate to="/examiner" replace />;
    }
    if (['super_admin', 'admin'].includes(profile.role)) {
      return <Navigate to="/admin" replace />;
    }
    // Fallback if role is leader or something else not yet mapped
    return <Navigate to="/login" replace />;
  }

  // All checks passed
  return <Outlet />;
};
