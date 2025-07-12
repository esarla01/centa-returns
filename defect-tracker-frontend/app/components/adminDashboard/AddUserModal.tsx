// components/AddUserModal.tsx
'use client';

import { useState, FormEvent } from 'react';
import { X } from 'lucide-react';

interface AddUserModalProps {
  onClose: () => void;
  onUserAdded: () => void;
}

export default function AddUserModal({ onClose, onUserAdded }: AddUserModalProps) {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('user');

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('http://localhost:5000/auth/register', { 
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          first_name: firstName,
          last_name: lastName,
          email: email,
          password: password,
          role: role,
        }),
        credentials: 'include', 
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.msg || `An error occurred: ${response.statusText}`);
      }

      onUserAdded(); 
      onClose();     

    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
        <div className="absolute inset-0 bg-gray-900 opacity-50" onClick={onClose}></div> 
        <div className="relative w-full max-w-md p-8 bg-white rounded-lg shadow-xl">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Yeni Kullanıcı Ekle</h2>
            
            <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
            <X size={24} />
            </button>

            <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">İsim</label>
                <input type="text" id="firstName" value={firstName} onChange={(e) => setFirstName(e.target.value)} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"/>
                </div>
                <div>
                <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">Soyisim</label>
                <input type="text" id="lastName" value={lastName} onChange={(e) => setLastName(e.target.value)} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"/>
                </div>
            </div>
            <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email</label>
                <input type="email" id="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"/>
            </div>
            <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">Şifre</label>
                <input type="password" id="password" value={password} onChange={(e) => setPassword(e.target.value)} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"/>
                <p className="text-xs text-gray-500 mt-1">Min 8 characters, with uppercase, lowercase, number, and special character.</p>
            </div>
            <div>
                <label htmlFor="role" className="block text-sm font-medium text-gray-700">Rol</label>
                <select id="role" value={role} onChange={(e) => setRole(e.target.value)} required className="mt-1 block w-full px-3 py-2 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary">
                    <option value="user">User</option>
                    <option value="manager">Manager</option>
                    <option value="admin">Admin</option>
                </select>
            </div>

            {error && (
                <div className="p-3 text-sm text-red-700 bg-red-100 rounded-md">
                {error}
                </div>
            )}

            <div className="flex justify-end gap-4 pt-4">
                <button type="submit" disabled={isLoading} className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:bg-purple-300 disabled:cursor-not-allowed">
                {isLoading ? 'Oluşturuluyor...' : 'Kullanıcı Oluştur'}
                </button>
            </div>
            </form>
        </div>
    </div>
  );
}