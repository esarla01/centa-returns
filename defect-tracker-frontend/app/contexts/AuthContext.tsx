// app/context/AuthContext.tsx
'use client';
import { createContext, useContext, useEffect, useState } from 'react';
import { API_ENDPOINTS, api } from '@/lib/api';

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
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  refreshUser: async () => {},
  logout: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = async () => {
    setLoading(true);
    try {
      setUser(await api.get<User>(API_ENDPOINTS.AUTH.WHOAMI));
    } catch {
      // Not logged in (the normal case after logout) or the server is unreachable.
      setUser(null);
    }
    setLoading(false);
  };

  const logout = async () => {
    try {
      await api.post(API_ENDPOINTS.AUTH.LOGOUT);
    } catch {
      // The local session is cleared even if the server could not be told.
    }
    setUser(null);
  };

  useEffect(() => {
    // Only refresh user on initial load
    refreshUser();
  }, []); // Empty dependency array ensures this only runs once on mount

  return (
    <AuthContext.Provider value={{ user, loading, refreshUser, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);