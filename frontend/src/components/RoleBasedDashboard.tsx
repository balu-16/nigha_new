import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { RefreshTimerProvider } from '@/contexts/RefreshTimerContext';
import Dashboard from '@/pages/Dashboard';
import AdminDashboard from '@/pages/AdminDashboard';
import SuperAdminDashboard from '@/pages/SuperAdminDashboard';

const RoleBasedDashboard: React.FC = () => {
  const { user } = useAuth();

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  switch (user.role) {
    case 'superadmin':
      return <SuperAdminDashboard />;
    case 'admin':
      return <AdminDashboard />;
    case 'customer':
    default:
      return (
        <RefreshTimerProvider>
          <Dashboard />
        </RefreshTimerProvider>
      );
  }
};

export default RoleBasedDashboard;