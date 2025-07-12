// app/context/AuthContext.tsx
'use client';
import { createContext, useContext, useEffect, useState } from 'react';

type User = {
  email: string;
  firstName: string;
  lastName: string;
  role: 'Admin' | 'Manager' | 'User';
};

const AuthContext = createContext<{ user: User | null, loading: boolean }>({
  user: null,
  loading: true,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

useEffect(() => {
    fetch('http://localhost:5000/auth/whoami', 
    { 
        method: 'GET',
        credentials: 'include' 
    })
        .then(async res => {
            if (res.ok) {
                const data = await res.json();
                console.log('Fetch result:', data); 
                localStorage.setItem('name', data.firstName || '');
                localStorage.setItem('surname', data.lastName || '');
                setUser(data);
            } else {
                console.log('Fetch error:', res.status, res.statusText); // Log error status
            }
        })
        .finally(() => setLoading(false));
}, []);
  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);