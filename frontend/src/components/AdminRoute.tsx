import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const AdminRoute: React.FC = () => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <div>Loading...</div>; // Or a spinner component
  }

  const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPERADMIN';

  return isAdmin ? <Outlet /> : <Navigate to="/" />;
};

export default AdminRoute;