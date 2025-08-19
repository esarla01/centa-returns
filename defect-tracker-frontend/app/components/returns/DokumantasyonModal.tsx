'use client';

import { useState, FormEvent } from 'react';
import { X } from 'lucide-react';
import { FullReturnCase, FullReturnCaseItem } from '@/lib/types';
import { API_ENDPOINTS, buildApiUrl } from '@/lib/api';

interface DokumantasyonModalProps {
  returnCase: FullReturnCase;
  onClose: () => void;
  onSuccess: () => void;
}

export default function DokumantasyonModal({ returnCase, onClose, onSuccess }: DokumantasyonModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    performedServices: returnCase.performed_services || '',
    cost: returnCase.cost?.toString() || '',
  });

  // Helper function to convert Turkish values to enum keys
  const convertToEnumKey = (turkishValue: string, enumMap: Record<string, string>): string => {
    for (const [key, value] of Object.entries(enumMap)) {
      if (value === turkishValue) {
        return key;
      }
    }
    return 'unknown';
  };

  const faultResponsibilityMap = {
    'user_error': 'Kullanıcı Hatası',
    'technical_issue': 'Teknik Sorun',
    'mixed': 'Karışık',
    'unknown': 'Bilinmiyor'
  };

  const [products, setProducts] = useState(
    (returnCase.items || []).map(item => ({
      id: item.id,
      product_model: item.product_model,
      fault_responsibility: convertToEnumKey(item.fault_responsibility || 'Bilinmiyor', faultResponsibilityMap),
    }))
  );

  const handleProductChange = (productId: number, field: string, value: string) => {
    setProducts(prev => prev.map(p => 
      p.id === productId ? { ...p, [field]: value } : p
    ));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch(buildApiUrl(API_ENDPOINTS.RETURNS.DOKUMANTASYON(returnCase.id.toString())), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          performedServices: formData.performedServices,
          cost: formData.cost ? parseFloat(formData.cost) : null,
          items: products.map(p => ({
            id: p.id,
            fault_responsibility: p.fault_responsibility,
          }))
        })
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Sunucu hatası');
      }

      setSuccess('Dokümantasyon bilgileri başarıyla güncellendi!');
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
      <div className="relative w-full max-w-3xl max-h-[95vh] bg-white rounded-xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 flex items-center justify-between bg-gradient-to-r from-yellow-50 to-orange-50">
          <div>
            <h2 className="text-2xl font-bold text-yellow-800">Dokümantasyon Aşaması Düzenle</h2>
            <p className="text-sm text-yellow-600 mt-1">Vaka #{returnCase.id} - {returnCase.customer.name}</p>
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

            {/* Performed Services */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Yapılan Servisler
              </label>
              <textarea
                value={formData.performedServices}
                onChange={(e) => setFormData(prev => ({ ...prev, performedServices: e.target.value }))}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-yellow-500 focus:border-yellow-500"
                placeholder="Yapılan servislerin detayları..."
              />
            </div>

            {/* Cost */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Tutar (TL)
              </label>
              <input
                type="number"
                value={formData.cost}
                onChange={(e) => setFormData(prev => ({ ...prev, cost: e.target.value }))}
                step="0.01"
                min="0"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-yellow-500 focus:border-yellow-500"
                placeholder="0"
              />
            </div>

            {/* Products Fault Responsibility */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-800">Ürün Hata Sorumluluğu</h3>
              
              {products.map((product, index) => (
                <div key={product.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-md font-medium text-gray-700">
                      {product.product_model?.name || `Ürün ${index + 1}`}
                    </h4>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Hata Sorumluluğu *
                    </label>
                    <select
                      value={product.fault_responsibility}
                      onChange={(e) => handleProductChange(product.id, 'fault_responsibility', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-yellow-500 focus:border-yellow-500"
                      required
                    >
                      <option value="unknown">Bilinmiyor</option>
                      <option value="user_error">Kullanıcı Hatası</option>
                      <option value="technical_issue">Teknik Sorun</option>
                      <option value="mixed">Karışık</option>
                    </select>
                  </div>
                </div>
              ))}
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
                className="px-4 py-2 text-sm font-medium text-white bg-yellow-600 border border-transparent rounded-md hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 disabled:opacity-50 disabled:cursor-not-allowed"
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