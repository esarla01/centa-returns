'use client';

import { useState, useEffect, FormEvent } from 'react';
import { X } from 'lucide-react';
import { FullReturnCase, Customer } from '@/lib/types';
import DatePicker from 'react-datepicker';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { fromDay, toDay } from '@/lib/dates';
import 'react-datepicker/dist/react-datepicker.css';
import { API_ENDPOINTS, api } from '@/lib/api';
import { useStageSave } from './useStageSave';
import SimpleSelect from '../SimpleSelect';

interface TeslimAlindiModalProps {
  returnCase: FullReturnCase;
  onClose: () => void;
  onSuccess: () => void;
}

export default function TeslimAlindiModal({ returnCase, onClose, onSuccess }: TeslimAlindiModalProps) {
  const { isLoading, error, success, save } = useStageSave(
    returnCase.id, 'teslim-alindi', 'Teslim Alındı bilgileri başarıyla güncellendi!', onSuccess, onClose);
  const [customers, setCustomers] = useState<Customer[]>([]);

  const [formData, setFormData] = useState({
    customerId: returnCase.customer.id,
    arrivalDate: fromDay(returnCase.arrival_date),
    receiptMethod: returnCase.receipt_method === 'Kargo' ? 'shipment' : 'in_person',
    notes: returnCase.notes || '',
  });

  // Fetch customers for dropdown
  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const data = await api.get<{ customers?: Customer[] }>(API_ENDPOINTS.CUSTOMERS, { limit: 1000 });
        setCustomers(data.customers || []);
      } catch {
        // The customer list simply stays empty if it cannot be loaded.
      }
    };
    fetchCustomers();
  }, []);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    save({
      customerId: formData.customerId,
      arrivalDate: toDay(formData.arrivalDate),
      receiptMethod: formData.receiptMethod,
      notes: formData.notes,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4">
      <div className="absolute inset-0 bg-gray-900/50" onClick={onClose} />
      <div className="relative w-full max-w-2xl max-h-[98vh] sm:max-h-[95vh] bg-white rounded-xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-3 sm:p-6 border-b border-gray-200 flex items-center justify-between bg-gradient-to-r from-orange-50 to-red-50">
          <div>
            <h2 className="text-lg sm:text-2xl font-bold text-orange-800">Teslim Alındı Aşaması Düzenle</h2>
            <p className="text-xs sm:text-sm text-orange-600 mt-1">Vaka #{returnCase.id} - {returnCase.customer.name}</p>
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
            <SimpleSelect
              options={customers}
              value={formData.customerId}
              onChange={(value) => setFormData(prev => ({ ...prev, customerId: Number(value) }))} 
              placeholder="Müşteri Seçin..."
              label="Müşteri"
            />
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