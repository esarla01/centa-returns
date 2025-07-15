'use client';
import { useAuth } from '../contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function RequireRole({ role, onAuthorized, children }: { role: string, onAuthorized?: (authorized: boolean) => void, children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      const isAuthorized = !!user && user.role === role;

      console.log('User:', user);
      console.log('Role:', role);
      console.log('User role:', user?.role);
      console.log('isAuthorized:', isAuthorized);

      // Notify the parent component about the authorization state
      if (onAuthorized) {
        onAuthorized(isAuthorized);
      }

      // Redirect if the user is not authorized
      if (!isAuthorized) {
        router.push('/main-page');
      }
    }
  }, [user, loading, role, router, onAuthorized]);

  if (loading || !user || user.role !== role) return null;

  return <>{children}</>;
}