// pages/login.tsx
'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const res = await fetch('http://127.0.0.1:5000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (res.ok) {
          const data = await res.json();
          localStorage.setItem('token', data.token);
          localStorage.setItem('user', JSON.stringify(data.user));
          localStorage.setItem('permissions', JSON.stringify(data.permissions));
          router.push('/main-page');
        
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
    <div className="min-h-screen bg-gradient-to-b from-blue-100 to-white flex flex-col items-center justify-center px-4 space-y-6">
       {/* Logo */}
        <div className="flex justify-center">
            <Image
              src="/logo.png"
              alt="Centa Logo"
              width={200}
              height={80}
              className="object-contain bg-transparent"
            />
        </div>
      <div className="max-w-md w-full bg-white p-10 rounded-lg shadow">
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
          <div className="relative">
            <label htmlFor="password" className="block text-sm font-medium">
              Şifre
            </label>
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              className="mt-1 w-full border rounded px-3 py-2 pr-10 focus:outline-none focus:ring"
            />
            <button
              type="button"
              onClick={() => {
                setShowPassword(true);
                setTimeout(() => setShowPassword(false), 500);
              }}
              className="absolute top-[38px] right-2 text-sm text-gray-500 hover:text-black"
              aria-label="Şifreyi göster"
            >
              Göster
            </button>
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
        <div className="mt-4 text-center">
            <button 
            className="text-xl text-blue-600 hover:underline"
            onClick={() => router.push('http://localhost:3000/forgot-password')}
            >
              Şifremi unuttum
            </button>
          </div>
      </div>
    </div>
  );
}
