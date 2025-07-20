// app/components/RequirePermission.tsx
import { ReactNode, useEffect, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useRouter } from "next/navigation";

interface RequirePermissionProps {
  permission: string;
  component?: boolean;
  children: ReactNode;
}

export function RequirePermission({ component=false, permission, children }: RequirePermissionProps) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    console.log('user', user);
    console.log('permission', permission);
    console.log('user.permissions', user?.permissions);
    if (!user || !user.permissions.includes(permission)) {
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            router.push('/login');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [user, permission, router]);

  if (loading) return null; // or a spinner

  if (!user || !user.permissions.includes(permission)) {
    if (component) {
      return null;
    }
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-gray-100 to-blue-100">
        <div className="bg-white p-8 rounded-lg shadow-lg flex flex-col items-center max-w-md">
          <svg
            className="w-16 h-16 text-red-400 mb-4"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.5}
            viewBox="0 0 24 24"
          >
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="none" />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5"
            />
          </svg>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Erişim Reddedildi</h2>
          <p className="text-gray-600 mb-4 text-center">
            Üzgünüz, bu sayfaya erişim izniniz yok.<br />
            Giriş sayfasına yönlendiriliyorsunuz...
          </p>
          <div className="text-blue-600 font-semibold text-lg text-center">
            {countdown} saniye sonra giriş sayfasına yönlendirileceksiniz
          </div>
        </div>
      </div>
    );
  }
  return <>{children}</>;
}






