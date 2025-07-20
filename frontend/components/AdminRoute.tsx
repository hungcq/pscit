import React, { useEffect } from 'react';
import { useRouter } from 'next/router';
import {useAuth} from '../contexts/AuthContext';

interface AdminRouteProps {
  children: React.ReactNode;
}

const AdminRoute: React.FC<AdminRouteProps> = ({ children }) => {
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!user || user.role !== 'admin') {
      router.replace('/');
    }
  }, [user, router]);

  if (!user || user.role !== 'admin') {
    return null; // Or a loading spinner
  }

  return <>{children}</>;
};

export default AdminRoute; 