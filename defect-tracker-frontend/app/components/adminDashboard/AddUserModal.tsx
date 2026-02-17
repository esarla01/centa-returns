// components/admin/AddUserModal.tsx
'use client';
import { useState } from 'react';
import { API_ENDPOINTS, buildApiUrl } from '@/lib/api';

interface AddUserModalProps {
  onClose: () => void;
  onUserInvited: () => void;
}

export default function AddUserModal({ onClose, onUserInvited }: AddUserModalProps) {
  const [formData, setFormData] = useState({
    email: '',
    role: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage('');

    try {
      const response = await fetch(buildApiUrl(API_ENDPOINTS.ADMIN.INVITE_USER), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        setIsSuccess(true);
        setMessage(data.msg);
        setFormData({ email: '', role: '' });
        setTimeout(() => {
          onClose();
          onUserInvited();
          setIsSuccess(false);
          setMessage('');
        }, 2000);
      } else {
        setMessage(data.msg);
      }
    } catch (error) {
      console.error('Error inviting user:', error);
      setMessage('Ağ hatası. Lütfen bağlantınızı kontrol edin.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-gray-900 opacity-50" onClick={onClose}></div> 
      <div className="relative w-full max-w-md p-6 bg-white rounded-lg shadow-xl">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Kullanıcı Davet Et</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {message && (
          <div className={`mb-6 p-4 rounded-xl border ${
            isSuccess ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
          }`}>
            <div className="flex items-center">
              {isSuccess ? (
                <svg className="w-5 h-5 text-green-400 mr-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg className="w-5 h-5 text-red-400 mr-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              )}
              <span className={`font-medium ${
                isSuccess ? 'text-green-800' : 'text-red-800'
              }`}>
                {message}
              </span>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
              E-posta Adresi *
            </label>
            <input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              placeholder="ornek@email.com"
            />
          </div>

          <div>
            <label htmlFor="role" className="block text-sm font-semibold text-gray-700 mb-2">
              Rol *
            </label>
            <select
              id="role"
              value={formData.role}
              onChange={(e) => setFormData({...formData, role: e.target.value})}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
            >
              <option value="">Rol seçin</option>
              <option value="ADMIN">Yönetici</option>
              <option value="MANAGER">Müdür</option>
              <option value="TECHNICIAN">Teknisyen</option>
              <option value="SUPPORT">Destek</option>
              <option value="SALES">Satış</option>
              <option value="LOGISTICS">Lojistik</option>
            </select>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <div className="flex items-start">
              <svg className="w-5 h-5 text-blue-500 mr-3 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              <div className="text-sm text-blue-800">
                <p className="font-medium mb-1">Davet Sistemi</p>
                <p>Kullanıcıya davet e-postası gönderilecek. Kullanıcı e-postadaki bağlantıya tıklayarak hesabını aktifleştirebilir.</p>
              </div>
            </div>
          </div>

          <div className="flex space-x-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 px-4 border border-gray-300 rounded-xl font-semibold text-gray-700 hover:bg-gray-50 transition-all duration-200"
            >
              İptal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className={`flex-1 py-3 px-4 rounded-xl font-semibold text-white transition-all duration-200 ${
                isSubmitting 
                  ? 'bg-gray-400 cursor-not-allowed' 
                  : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700'
              }`}
            >
              {isSubmitting ? 'Davet Gönderiliyor...' : 'Davet Gönder'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
