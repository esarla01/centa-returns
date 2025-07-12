// app/components/RequireRole.tsx
'use client';
import { useAuth } from '../context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function RequireRole({ role, children }: { role: string, children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && (!user || user.role !== role)) {
        // Redirect to home if user is not logged in or does not have the required role
        router.push('/main-page');
    }
  }, [user, loading]);

  if (loading || !user || user.role !== role) return null;

  return <>{children}</>;
}
