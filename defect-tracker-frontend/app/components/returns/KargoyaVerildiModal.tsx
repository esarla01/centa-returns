'use client';

import { useState, FormEvent } from 'react';
import { X } from 'lucide-react';
import { FullReturnCase } from '@/lib/types';
import DatePicker from 'react-datepicker';
import { tr } from 'date-fns/locale';
import { fromDay, toDay } from '@/lib/dates';
import 'react-datepicker/dist/react-datepicker.css';
import { useStageSave } from './useStageSave';

interface KargoyaVerildiModalProps {
  returnCase: FullReturnCase;
  onClose: () => void;
  onSuccess: () => void;
}

export default function KargoyaVerildiModal({ returnCase, onClose, onSuccess }: KargoyaVerildiModalProps) {
  const { isLoading, error, success, save } = useStageSave(
    returnCase.id, 'kargoya-verildi', 'Kargo bilgileri başarıyla güncellendi!', onSuccess, onClose);

  const [formData, setFormData] = useState({
    shippingInfo: returnCase.shipping_info || '',
    trackingNumber: returnCase.tracking_number || '',
    shippingDate: returnCase.shipping_date ? fromDay(returnCase.shipping_date) : null,
  });

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();

    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);
    const inFuture = !!formData.shippingDate && formData.shippingDate > endOfToday;

    save({
      shippingInfo: formData.shippingInfo,
      trackingNumber: formData.trackingNumber,
      shippingDate: formData.shippingDate ? toDay(formData.shippingDate) : null,
    }, inFuture ? 'Kargoya verilme tarihi gelecekte olamaz. Lütfen bugün veya geçmiş bir tarih seçin.' : null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4">
      <div className="absolute inset-0 bg-gray-900/50" onClick={onClose} />
              <div className="relative w-full max-w-2xl max-h-[98vh] sm:max-h-[95vh] bg-white rounded-xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-3 sm:p-6 border-b border-gray-200 flex items-center justify-between bg-purple-50">
          <div>
            <h2 className="font-display text-lg sm:text-2xl text-purple-800">Kargo Bilgileri Düzenle</h2>
            <p className="text-xs sm:text-sm text-purple-600 mt-1">Vaka #{returnCase.id} - {returnCase.customer.name}</p>
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

            {/* Shipping Info */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Kargo Bilgisi
              </label>
              <textarea
                value={formData.shippingInfo}
                onChange={(e) => setFormData(prev => ({ ...prev, shippingInfo: e.target.value }))}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500"
                placeholder="Kargo firması ve diğer bilgiler..."
              />
            </div>

            {/* Tracking Number */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Kargo Numarası
              </label>
              <input
                type="text"
                value={formData.trackingNumber}
                onChange={(e) => setFormData(prev => ({ ...prev, trackingNumber: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500"
                placeholder="Kargo takip numarası..."
              />
            </div>

            {/* Shipping Date */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Kargoya Verilme Tarihi
              </label>
              <DatePicker
                selected={formData.shippingDate}
                onChange={(date) => setFormData(prev => ({ ...prev, shippingDate: date }))}
                dateFormat="dd/MM/yyyy"
                locale={tr}
                maxDate={new Date()} // Prevent selecting future dates
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500"
                placeholderText="Tarih seçiniz"
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
                className="px-4 py-2 text-sm font-medium text-white bg-purple-600 border border-transparent rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed"
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