'use client';

import { useState, FormEvent } from 'react';
import { X } from 'lucide-react';
import { FullReturnCase } from '@/lib/types';
import { API_ENDPOINTS, buildApiUrl } from '@/lib/api';

interface OdemeTahsilatiModalProps {
  returnCase: FullReturnCase;
  onClose: () => void;
  onSuccess: () => void;
}

export default function OdemeTahsilatiModal({ returnCase, onClose, onSuccess }: OdemeTahsilatiModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    payment_status: returnCase.payment_status || '',
  });

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch(buildApiUrl(API_ENDPOINTS.RETURNS.BASE) + '/' + returnCase.id + '/odeme-tahsilati', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          payment_status: formData.payment_status,
        })
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Sunucu hatası');
      }

      setSuccess('Ödeme tahsilatı bilgileri başarıyla güncellendi!');
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1500);

    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-gray-900/50" onClick={onClose} />
      <div className="relative w-full max-w-2xl max-h-[95vh] bg-white rounded-xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 flex items-center justify-between bg-gradient-to-r from-yellow-50 to-orange-50">
          <div>
            <h2 className="text-2xl font-bold text-yellow-800">Ödeme Tahsilatı Aşaması Düzenle</h2>
            <p className="text-yellow-700 mt-1">Vaka #{returnCase.id} - {returnCase.customer.name}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-yellow-100 rounded-lg transition-colors"
          >
            <X className="h-6 w-6 text-yellow-800" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Payment Status */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ödeme Durumu *
              </label>
              <select
                value={formData.payment_status}
                onChange={(e) => setFormData({ ...formData, payment_status: e.target.value })}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                required
              >
                <option value="">Ödeme durumu seçin</option>
                <option value="paid">Ödendi</option>
                <option value="unpaid">Ödenmedi</option>
                <option value="waived">Ücretsiz</option>
              </select>
            </div>



            {/* Error/Success Messages */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-md p-4">
                <p className="text-red-800">{error}</p>
              </div>
            )}

            {success && (
              <div className="bg-green-50 border border-green-200 rounded-md p-4">
                <p className="text-green-800">{success}</p>
              </div>
            )}

            {/* Submit Button */}
            <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
              >
                İptal
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="px-4 py-2 bg-yellow-600 text-white hover:bg-yellow-700 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Kaydediliyor...' : 'Kaydet'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
