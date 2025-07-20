import React, { useEffect } from 'react';
import { useRouter } from 'next/router';
import {useAuth} from '../contexts/AuthContext';

interface PrivateRouteProps {
  children: React.ReactNode;
}

const PrivateRoute: React.FC<PrivateRouteProps> = ({ children }) => {
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!user) {
      router.replace('/login/');
    }
  }, [user, router]);

  if (!user) {
    return null; // Or a loading spinner
  }

  return <>{children}</>;
};

export default PrivateRoute; 