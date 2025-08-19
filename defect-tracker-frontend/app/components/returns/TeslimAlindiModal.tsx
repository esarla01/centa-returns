'use client';

import { useState, useEffect, FormEvent } from 'react';
import { X } from 'lucide-react';
import { FullReturnCase, Customer } from '@/lib/types';
import DatePicker from 'react-datepicker';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import 'react-datepicker/dist/react-datepicker.css';
import { API_ENDPOINTS, buildApiUrl } from '@/lib/api';

interface TeslimAlindiModalProps {
  returnCase: FullReturnCase;
  onClose: () => void;
  onSuccess: () => void;
}

export default function TeslimAlindiModal({ returnCase, onClose, onSuccess }: TeslimAlindiModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [customers, setCustomers] = useState<Customer[]>([]);

  const [formData, setFormData] = useState({
    customerId: returnCase.customer.id,
    arrivalDate: new Date(returnCase.arrival_date),
    receiptMethod: returnCase.receipt_method === 'Kargo' ? 'shipment' : 'in_person',
    notes: returnCase.notes || '',
  });

  // Fetch customers for dropdown
  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const response = await fetch(buildApiUrl(API_ENDPOINTS.CUSTOMERS) + '?limit=1000', {
          method: 'GET',
          credentials: 'include',
        });
        const data = await response.json();
        setCustomers(data.customers || []);
      } catch (err) {
        console.error('Failed to fetch customers:', err);
      }
    };
    fetchCustomers();
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch(buildApiUrl(API_ENDPOINTS.RETURNS.BASE) + '/' + returnCase.id + '/teslim-alindi', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          customerId: formData.customerId,
          arrivalDate: formData.arrivalDate.toISOString().split('T')[0],
          receiptMethod: formData.receiptMethod,
          notes: formData.notes,
        })
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Sunucu hatası');
      }

      setSuccess('Teslim Alındı bilgileri başarıyla güncellendi!');
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
      <div className="relative w-full max-w-2xl bg-white rounded-xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 flex items-center justify-between bg-gradient-to-r from-orange-50 to-red-50">
          <div>
            <h2 className="text-2xl font-bold text-orange-800">Teslim Alındı Aşaması Düzenle</h2>
            <p className="text-sm text-orange-600 mt-1">Vaka #{returnCase.id} - {returnCase.customer.name}</p>
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

            {/* Customer Selection */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Müşteri *
              </label>
              <select
                value={formData.customerId}
                onChange={(e) => setFormData(prev => ({ ...prev, customerId: parseInt(e.target.value) }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500"
                required
              >
                <option value="">Müşteri seçiniz</option>
                {customers.map((customer) => (
                  <option key={customer.id} value={customer.id}>
                    {customer.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Arrival Date */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Geliş Tarihi *
              </label>
              <DatePicker
                selected={formData.arrivalDate}
                onChange={(date) => setFormData(prev => ({ ...prev, arrivalDate: date || new Date() }))}
                dateFormat="dd/MM/yyyy"
                locale={tr}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500"
                required
              />
            </div>

            {/* Receipt Method */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Teslim Alma Yöntemi *
              </label>
                <select
                  value={formData.receiptMethod}
                  onChange={(e) => setFormData(prev => ({ ...prev, receiptMethod: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500"
                  required
                >
                  <option value="">Yöntem seçiniz</option>
                  <option value="shipment">Kargo</option>
                  <option value="in_person">Elden Teslim</option>
                </select>
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Notlar
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500"
                placeholder="Teslim alma ile ilgili notlar..."
              />
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
                className="px-4 py-2 text-sm font-medium text-white bg-orange-600 border border-transparent rounded-md hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-50 disabled:cursor-not-allowed"
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