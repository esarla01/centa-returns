'use client';

import { useState, FormEvent } from 'react';
import { X } from 'lucide-react';
import { API_ENDPOINTS, buildApiUrl } from '@/lib/api';

interface AddProductModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export default function AddProductModal({ onClose, onSuccess }: AddProductModalProps) {
  const [name, setName] = useState('');
  const [productType, setProductType] = useState('overload'); // Default value
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(buildApiUrl(API_ENDPOINTS.PRODUCTS), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, product_type: productType }),
        credentials: 'include',
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.msg || 'Failed to create model.');
      }
      onSuccess();
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
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Yeni Ürün Modeli Ekle</h2>
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"><X size={24} /></button>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700">Model Adı</label>
            <input type="text" id="name" value={name} onChange={(e) => setName(e.target.value)} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary" />
          </div>
          <div>
            <label htmlFor="productType" className="block text-sm font-medium text-gray-700">Ürün Tipi</label>
            <select id="productType" value={productType} onChange={(e) => setProductType(e.target.value)} required className="mt-1 block w-full px-3 py-2 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary">
              <option value="overload">Aşırı Yük Sensörü</option>
              <option value="door_detector">Fotosel</option>
              <option value="control_unit">Kontrol Ünitesi</option>
            </select>
          </div>
          {error && <div className="p-3 text-sm text-red-700 bg-red-100 rounded-md">{error}</div>}
          <div className="flex justify-end gap-4 pt-4">
            <button type="submit" disabled={isLoading} className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed">
              {isLoading ? 'Ekleniyor...' : 'Model Ekle'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}