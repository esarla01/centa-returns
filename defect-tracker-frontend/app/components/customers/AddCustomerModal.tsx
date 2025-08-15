'use client';

import { useState, FormEvent } from 'react';
import { X } from 'lucide-react';

interface AddCustomerModalProps {
  onClose: () => void;
  onCustomerAdded: () => void;
}

export default function AddCustomerModal({ onClose, onCustomerAdded }: AddCustomerModalProps) {
  const [name, setName] = useState('');
  const [representative, setRepresentative] = useState('');
  const [contactInfo, setContactInfo] = useState('');
  const [address, setAddress] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      // ASSUMPTION: The API endpoint to add a customer is POST /api/customers
      const response = await fetch('http://localhost:5000/customers/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: name,
          representative: representative,
          contact_info: contactInfo,
          address: address,
        }),
        credentials: 'include',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.msg || 'Müşteri eklenirken bir hata oluştu.');
      }

      onCustomerAdded();
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
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Yeni Müşteri Ekle</h2>

        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
          <X size={24} />
        </button>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700">Şirket Adı</label>
            <input type="text" id="name" value={name} onChange={(e) => setName(e.target.value)} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary" />
          </div>
          <div>
            <label htmlFor="representative" className="block text-sm font-medium text-gray-700">Yetkili Kişi</label>
            <input type="text" id="representative" value={representative} onChange={(e) => setRepresentative(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary" />
          </div>
          <div>
            <label htmlFor="contactInfo" className="block text-sm font-medium text-gray-700">İletişim Bilgisi (Email/Telefon)</label>
            <input type="text" id="contactInfo" value={contactInfo} onChange={(e) => setContactInfo(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary" />
          </div>
          <div>
            <label htmlFor="address" className="block text-sm font-medium text-gray-700">Adres</label>
            <textarea id="address" value={address} onChange={(e) => setAddress(e.target.value)} rows={3} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary" />
          </div>

          {error && (
            <div className="p-3 text-sm text-red-700 bg-red-100 rounded-md">
              {error}
            </div>
          )}

          <div className="flex justify-end gap-4 pt-4">
            <button type="submit" disabled={isLoading} className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed">
              {isLoading ? 'Ekleniyor...' : 'Müşteri Ekle'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}