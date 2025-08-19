'use client';

import { useState, FormEvent } from 'react';
import { X } from 'lucide-react';
import { FullReturnCase } from '@/lib/types';
import { API_ENDPOINTS, buildApiUrl } from '@/lib/api';

interface TamamlandiModalProps {
  returnCase: FullReturnCase;
  onClose: () => void;
  onSuccess: () => void;
}

export default function TamamlandiModal({ returnCase, onClose, onSuccess }: TamamlandiModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Helper function to convert Turkish values to enum keys
  const convertToEnumKey = (turkishValue: string, enumMap: Record<string, string>): string => {
    for (const [key, value] of Object.entries(enumMap)) {
      if (value === turkishValue) {
        return key;
      }
    }
    return '';
  };

  const paymentStatusMap = {
    'paid': 'Ödendi',
    'unpaid': 'Ödenmedi',
    'waived': 'Ücretsiz'
  };

  const [formData, setFormData] = useState({
    paymentStatus: convertToEnumKey(returnCase.payment_status || '', paymentStatusMap),
  });

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch(buildApiUrl(API_ENDPOINTS.RETURNS.TAMAMLANDI(returnCase.id.toString())), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          paymentStatus: formData.paymentStatus,
        })
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Sunucu hatası');
      }

      setSuccess('Tamamlandı bilgileri başarıyla güncellendi!');
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
      <div className="relative w-full max-w-md bg-white rounded-xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 flex items-center justify-between bg-gradient-to-r from-green-50 to-emerald-50">
          <div>
            <h2 className="text-2xl font-bold text-green-800">Tamamlandı Aşaması Düzenle</h2>
            <p className="text-sm text-green-600 mt-1">Vaka #{returnCase.id} - {returnCase.customer.name}</p>
          </div>
          <button 
            onClick={onClose} 
            className="text-gray-400 hover:text-gray-600 transition-colors duration-200 p-2 rounded-full hover:bg-gray-100"
          >
            <X size={24} />
          </button>
        </div>
        
        {/* Content */}
        <div className="flex-grow overflow-y-auto">
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Status Messages */}
            {error && (
              <div className="p-4 text-sm text-red-700 bg-red-100 rounded-md border border-red-300">
                {error}
              </div>
            )}
            {success && (
              <div className="p-4 text-sm text-green-700 bg-green-100 rounded-md border border-green-300">
                {success}
              </div>
            )}

            {/* Payment Status */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Ödeme Durumu *
              </label>
              <select
                value={formData.paymentStatus}
                onChange={(e) => setFormData(prev => ({ ...prev, paymentStatus: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                required
              >
                <option value="">Durum seçiniz</option>
                <option value="paid">Ödendi</option>
                <option value="unpaid">Ödenmedi</option>
                <option value="waived">Ücretsiz</option>
              </select>
            </div>

            {/* Case Summary */}
            <div className="bg-gray-50 rounded-lg p-4 space-y-3">
              <h3 className="text-lg font-semibold text-gray-800">Vaka Özeti</h3>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">Müşteri:</span>
                  <p className="font-medium">{returnCase.customer.name}</p>
                </div>
                <div>
                  <span className="text-gray-500">Tutar:</span>
                  <p className="font-medium">{returnCase.cost ? `${returnCase.cost} TL` : 'Belirtilmemiş'}</p>
                </div>
                <div>
                  <span className="text-gray-500">Ürün Sayısı:</span>
                  <p className="font-medium">{returnCase.items.length} adet</p>
                </div>
                <div>
                  <span className="text-gray-500">Durum:</span>
                  <p className="font-medium text-green-600">{returnCase.status}</p>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
              >
                İptal
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Güncelleniyor...' : 'Güncelle'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
} 