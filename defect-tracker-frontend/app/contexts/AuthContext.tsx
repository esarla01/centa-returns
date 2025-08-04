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
    console.log('Refreshing user data...');

    try {
      // Get user from backend
      const response = await fetch('http://localhost:5000/auth/whoami', {
        method: 'GET',
        credentials: 'include',
      });

      // Set user if response is ok
      if (response.ok) {
        const data = await response.json();
        console.log('User data refreshed successfully:', data.email);
        setUser(data);
      } else if (response.status === 401) {
        // User is not authenticated, this is normal after logout
        console.log('User not authenticated (401)');
        setUser(null);
      } else {
        console.log('Fetch error:', response.status, response.statusText);
        setUser(null);
      }
    } catch (error) {
      console.log('Network error during user refresh:', error);
      setUser(null);
    }
    setLoading(false);
  };

  const logout = async () => {
    try {
      const response = await fetch('http://localhost:5000/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });

      if (response.ok) {
        // Clear user state immediately
        setUser(null);
        console.log('Logout successful');
      } else {
        console.error('Logout failed:', response.status, response.statusText);
        // Still clear user state even if logout fails
        setUser(null);
      }
    } catch (error) {
      console.error('Error during logout:', error);
      // Still clear user state even if logout fails
      setUser(null);
    }
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