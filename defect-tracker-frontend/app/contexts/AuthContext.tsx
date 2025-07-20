// app/context/AuthContext.tsx
'use client';
import { createContext, useContext, useEffect, useState } from 'react';

type User = {
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  permissions: string[];
};

type AuthContextType = {
  user: User | null;
  loading: boolean;
  refreshUser: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  refreshUser: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = async () => {
    setLoading(true);
    try {
      // Get user from backend
      const response = await fetch('http://localhost:5000/auth/whoami', {
        method: 'GET',
        credentials: 'include',
      });

      // Set user if response is ok
      if (response.ok) {
        const data = await response.json();
        setUser(data);
      } else {
        console.log('Fetch error:', response.status, response.statusText);
        setUser(null);
      }
    } catch {
      setUser(null);
    }
    setLoading(false);
  };

  useEffect(() => {
    refreshUser();
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);