'use client';
import { useState } from 'react';
import Image from 'next/image';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('http://localhost:5000/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include', 
        body: JSON.stringify({ email }),
      });
      if (response.ok) {
        setSent(true);
      } else {
        setError('Failed to send reset link. Please try again.');
        setTimeout(() => setError(null), 2000);
      }
    } catch (error) {
      console.error('Error sending email:', error);
      setError('Network error. Please check your connection.');
      setTimeout(() => setError(null), 2000);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-100 to-white flex flex-col items-center justify-center px-4 space-y-10">
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
        <h2 className="text-2xl font-bold mb-4">Forgot Password</h2>
        {sent ? (
          <p className="text-green-600">Check your email for a reset link. 
          The link is valid for only 15 minutes. </p>

        ) : (
          <form onSubmit={handleSubmit}>
            <input
              type="email"
              className="border p-2 w-full mb-4"
              placeholder="Enter your email"
              value={email}
              onChange={e => setEmail(e.target.value)}
            />
             {error && (
              <div className="mb-4 p-2 bg-red-100 text-red-700 border border-red-300 rounded">
                {error}
              </div>
            )}
            <button className="bg-blue-600 text-white py-2 px-4 rounded">
              Send Reset Link
            </button>
          </form>
        )}
        
      </div>
    </div>
  );
}
