import React from 'react';
import {Navigate, useLocation} from 'react-router-dom';
import {useAuth} from '../contexts/AuthContext';

interface AdminRouteProps {
  children: React.ReactNode;
}

const AdminRoute: React.FC<AdminRouteProps> = ({ children }) => {
  const { user } = useAuth();
  const location = useLocation();

  if (!user || user.role !== 'admin') {
    return <Navigate to="/home" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

export default AdminRoute; 