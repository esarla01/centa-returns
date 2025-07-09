'use client';
import { useSearchParams, useRouter } from 'next/navigation';
import { useState } from 'react';

export default function ResetPasswordPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token');

  const [new_password, setNewPassword] = useState('');
  const [confirm_password, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('http://localhost:5000/api/auth/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, new_password }),
    });

    if (res.ok) {
      setMessage('Şifre sıfırlama başarılı! Yönlendiriliyorsunuz...');
      setTimeout(() => router.push('/login'), 2000);
    } else {
      const data = await res.json();
      setMessage(data.msg || 'Bir hata oluştu.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-100 to-white flex flex-col items-center justify-center px-4 space-y-6">
        <div className="max-w-md w-full bg-white p-10 rounded-lg shadow">
              <h2 className="text-2xl font-bold mb-4">Şifre Sıfırlama</h2>
              <form onSubmit={handleReset}>
                <input
                type="password"
                className="border p-2 w-full mb-4"
                placeholder="Yeni şifrenizi girin"
                value={new_password}
                onChange={e => setNewPassword(e.target.value)}
                />
                <div className="relative mb-4">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    className="border p-2 w-full pr-10"
                    placeholder="Şifrenizi tekrar girin"
                    value={confirm_password}
                    onChange={e => setConfirmPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setShowConfirmPassword(true);
                      setTimeout(() => setShowConfirmPassword(false), 500);
                    }}
                    className="absolute top-1/2 right-3 -translate-y-1/2 text-sm text-gray-500 hover:text-black"
                    aria-label="Şifreyi göster"
                  >
                    Göster
                  </button>
                </div>
                <button 
                className={`py-2 px-4 rounded ${!new_password || !confirm_password || new_password !== confirm_password ? 'bg-gray-300' : 'bg-green-600'} text-white`}
                disabled={!new_password || !confirm_password || new_password !== confirm_password}
                >
                  Şifremi Sıfırla
                </button>
                {new_password && confirm_password && new_password !== confirm_password && (
                    <p className="mt-4 text-red-700">Şifreler eşleşmelidir!</p>
                )}
              </form>
            {message && <p className="mt-4 text-red-700">{message}!</p>}
        </div>
    </div>
  );
}
