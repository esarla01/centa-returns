// pages/login.tsx
'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include', // for cookies; remove if using JWT in localStorage
        body: JSON.stringify({ email, password }),
      });

      if (res.ok) {
        // TODO: if using JWT, grab it and store it:
        // const { token } = await res.json();
        // localStorage.setItem('token', token);

        router.push('/');
      } else if (res.status === 401) {
        setError('The password or email is incorrect! Please try again.');
      } else {
        setError('Unexpected error. Please try again later.');
      }
    } catch (err) {
      console.error(err);
      setError('Network error. Please check your connection.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <div className="max-w-md w-full bg-white p-8 rounded-lg shadow">
        <h1 className="text-2xl font-bold mb-6 text-center">Giriş Yap</h1>
        {error && (
          <div className="mb-4 text-red-700 bg-red-100 p-2 rounded">
            {error}
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              className="mt-1 w-full border rounded px-3 py-2 focus:outline-none focus:ring"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium">
              Şifre
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              className="mt-1 w-full border rounded px-3 py-2 focus:outline-none focus:ring"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className={`
              w-full py-2 rounded text-white font-semibold
              ${isSubmitting ? 'bg-gray-400' : 'bg-green-600 hover:bg-green-700'}
            `}
          >
            {isSubmitting ? 'Giriş yapılıyor...' : 'Giriş Yap'}
          </button>
        </form>

        {/* Future hooks: */}
        {/* <div className="mt-4 text-center">
            <button className="text-sm text-blue-600 hover:underline">
              Şifremi unuttum
            </button>
          </div> */}
      </div>
    </div>
  );
}
