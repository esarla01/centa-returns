'use client';

import { useState, useEffect, FormEvent } from 'react';
import { X } from 'lucide-react';
import { FullReturnCase, User, Customer, ProductModel } from '@/lib/types';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { tr } from 'date-fns/locale';

interface EditReturnCaseModalProps {
  returnCase: FullReturnCase;
  onClose: () => void;
  onSuccess: () => void;
}

export default function EditReturnCaseModal({ returnCase, onClose, onSuccess }: EditReturnCaseModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form data state
  const [formData, setFormData] = useState({
    status: returnCase.status,
    assignedUserId: returnCase.assigned_user?.id || '',
    notes: returnCase.notes || '',
    performedServices: returnCase.performed_services || '',
    cost: returnCase.cost?.toString() || '',
    shippingInfo: returnCase.shipping_info || '',
    paymentStatus: returnCase.payment_status || '',
    arrivalDate: new Date(returnCase.arrival_date),
    receiptMethod: returnCase.receipt_method,
  });

  // Dropdown data states
  const [users, setUsers] = useState<User[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<ProductModel[]>([]);

  // Fetch dropdown data
  useEffect(() => {
    const fetchDropdownData = async () => {
      try {
        const [usersRes, customersRes, productsRes] = await Promise.all([
          fetch('http://localhost:5000/admin/', { credentials: 'include' }),
          fetch('http://localhost:5000/customers?limit=1000', { credentials: 'include' }),
          fetch('http://localhost:5000/products?limit=1000', { credentials: 'include' })
        ]);

        const usersData = await usersRes.json();
        const customersData = await customersRes.json();
        const productsData = await productsRes.json();

        setUsers(usersData.users || []);
        setCustomers(customersData.customers || []);
        setProducts(productsData.products || []);
      } catch (err) {
        setError("Dropdown verileri yüklenemedi.");
      }
    };

    fetchDropdownData();
  }, []);

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch(`http://localhost:5000/returns/${returnCase.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          status: formData.status,
          assignedUserId: formData.assignedUserId || null,
          notes: formData.notes,
          performedServices: formData.performedServices,
          cost: formData.cost ? parseFloat(formData.cost) : null,
          shippingInfo: formData.shippingInfo,
          paymentStatus: formData.paymentStatus,
          arrivalDate: formData.arrivalDate.toISOString().split('T')[0],
          receiptMethod: formData.receiptMethod,
        })
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Sunucu hatası');
      }

      setSuccess('Vaka başarıyla güncellendi!');
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
      <div className="absolute inset-0 bg-gray-900 opacity-50" onClick={onClose}></div>
      <div className="relative w-full max-w-4xl max-h-[90vh] bg-white rounded-xl shadow-2xl flex flex-col overflow-hidden">
        <div className="p-6 border-b flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-800">Vaka Düzenle: #{returnCase.id}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-grow overflow-y-auto p-6 space-y-6">
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

          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Durum</label>
              <select
                value={formData.status}
                onChange={(e) => handleInputChange('status', e.target.value)}
                className="w-full border border-gray-300 rounded-md p-3 focus:ring-2 focus:ring-blue-200"
              >
                <option value="Teknik İnceleme">Teknik İnceleme</option>
                <option value="Dokümantasyon">Dokümantasyon</option>
                <option value="Kargoya Verildi">Kargoya Verildi</option>
                <option value="Tamamlandı">Tamamlandı</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Atanan Kullanıcı</label>
              <select
                value={formData.assignedUserId}
                onChange={(e) => handleInputChange('assignedUserId', e.target.value)}
                className="w-full border border-gray-300 rounded-md p-3 focus:ring-2 focus:ring-blue-200"
              >
                <option value="">Atanan Yok</option>
                {users.map(user => (
                  <option key={user.email} value={user.email}>
                    {user.firstName} {user.lastName} ({user.role})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Geliş Tarihi</label>
              <DatePicker
                selected={formData.arrivalDate}
                onChange={(date) => handleInputChange('arrivalDate', date)}
                className="w-full border border-gray-300 rounded-md p-3 focus:ring-2 focus:ring-blue-200"
                locale={tr}
                dateFormat="dd.MM.yyyy"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Teslim Yöntemi</label>
              <select
                value={formData.receiptMethod}
                onChange={(e) => handleInputChange('receiptMethod', e.target.value)}
                className="w-full border border-gray-300 rounded-md p-3 focus:ring-2 focus:ring-blue-200"
              >
                <option value="shipment">Kargo</option>
                <option value="in_person">Elden Teslim</option>
              </select>
            </div>
          </div>

          {/* Cost and Payment */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Tutar (₺)</label>
              <input
                type="number"
                step="0.01"
                value={formData.cost}
                onChange={(e) => handleInputChange('cost', e.target.value)}
                className="w-full border border-gray-300 rounded-md p-3 focus:ring-2 focus:ring-blue-200"
                placeholder="0.00"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Ödeme Durumu</label>
              <select
                value={formData.paymentStatus}
                onChange={(e) => handleInputChange('paymentStatus', e.target.value)}
                className="w-full border border-gray-300 rounded-md p-3 focus:ring-2 focus:ring-blue-200"
              >
                <option value="">Seçiniz</option>
                <option value="paid">Ödendi</option>
                <option value="unpaid">Ödenmedi</option>
                <option value="waived">Ücretsiz</option>
              </select>
            </div>
          </div>

          {/* Services and Shipping */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Yapılan Servisler</label>
              <textarea
                value={formData.performedServices}
                onChange={(e) => handleInputChange('performedServices', e.target.value)}
                className="w-full border border-gray-300 rounded-md p-3 focus:ring-2 focus:ring-blue-200"
                rows={3}
                placeholder="Yapılan servisleri buraya yazın..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Kargo Bilgisi</label>
              <input
                type="text"
                value={formData.shippingInfo}
                onChange={(e) => handleInputChange('shippingInfo', e.target.value)}
                className="w-full border border-gray-300 rounded-md p-3 focus:ring-2 focus:ring-blue-200"
                placeholder="Kargo takip numarası veya bilgisi..."
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Notlar</label>
            <textarea
              value={formData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              className="w-full border border-gray-300 rounded-md p-3 focus:ring-2 focus:ring-blue-200"
              rows={4}
              placeholder="Ek notlarınızı buraya yazın..."
            />
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-4 pt-6 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              İptal
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-6 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Güncelleniyor...' : 'Güncelle'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}