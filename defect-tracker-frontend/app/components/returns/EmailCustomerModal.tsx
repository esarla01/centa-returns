'use client';

import { useState, FormEvent, useEffect } from 'react';
import { X, Mail, Send, AlertCircle, CheckCircle } from 'lucide-react';
import { FullReturnCase } from '@/lib/types';
import { API_ENDPOINTS, buildApiUrl } from '@/lib/api';

interface EmailCustomerModalProps {
  returnCase: FullReturnCase;
  onClose: () => void;
  onSuccess: () => void;
}

export default function EmailCustomerModal({ returnCase, onClose, onSuccess }: EmailCustomerModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [emailContent, setEmailContent] = useState('');

  // Generate default email content based on return case
  const generateDefaultEmail = () => {
    const repairedItems = returnCase.items.filter(item => item.resolution_method === 'Tamir');
    const replacedItems = returnCase.items.filter(item => item.resolution_method === 'Değişim');
    
    let content = `Merhaba ${returnCase.customer.name},\n\n`;
    content += `İade vakanız (#${returnCase.id}) ile ilgili bilgilendirme:\n\n`;
    
    if (repairedItems.length > 0) {
      content += `Tamir edilen ürünler:\n`;
      repairedItems.forEach(item => {
        content += `• ${item.product_model.name} (${item.product_count} adet)\n`;
      });
      content += '\n';
    }
    
    if (replacedItems.length > 0) {
      content += `Değiştirilen ürünler:\n`;
      replacedItems.forEach(item => {
        content += `• ${item.product_model.name} (${item.product_count} adet)\n`;
      });
      content += '\n';
    }
    
    if (returnCase.shipping_info) {
      content += `Kargo bilgisi: ${returnCase.shipping_info}\n`;
    }
    
    if (returnCase.tracking_number) {
      content += `Takip numarası: ${returnCase.tracking_number}\n`;
    }
    
    if (returnCase.shipping_date) {
      content += `Kargoya verilme tarihi: ${new Date(returnCase.shipping_date).toLocaleDateString('tr-TR')}\n`;
    }
    
    content += `\nToplam maliyet: ${new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY'
    }).format(returnCase.cost)}\n\n`;
    
    content += `Saygılarımızla,\nCenta Teknik Servis`;
    
    return content;
  };

  // Set default email content when component mounts
  useEffect(() => {
    setEmailContent(generateDefaultEmail());
  }, [returnCase]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch(buildApiUrl(API_ENDPOINTS.RETURNS.BASE) + '/' + returnCase.id + '/send-customer-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          emailContent: emailContent
        })
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Sunucu hatası');
      }

      setSuccess('E-posta başarıyla gönderildi!');
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

  const formatCurrency = (amount: number | null | undefined): string => {
    if (amount === null || amount === undefined) return "—";
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  const formatTurkishDate = (dateString: string): string => {
    const date = new Date(dateString);
    const months = [
      'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
      'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'
    ];
    const day = date.getDate();
    const month = months[date.getMonth()];
    const year = date.getFullYear();
    return `${day} ${month} ${year}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-gray-900/50" onClick={onClose} />
      <div className="relative w-full max-w-4xl max-h-[95vh] bg-white rounded-xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 flex items-center justify-between bg-gradient-to-r from-blue-50 to-indigo-50">
          <div className="flex items-center space-x-3">
            <Mail className="h-8 w-8 text-blue-600" />
            <div>
              <h2 className="text-2xl font-bold text-blue-800">Müşteriye E-posta Gönder</h2>
              <p className="text-sm text-blue-600 mt-1">
                Vaka #{returnCase.id} - {returnCase.customer.name}
              </p>
            </div>
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
          <div className="p-6 space-y-6">
            {/* Return Case Summary */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
                <AlertCircle className="h-5 w-5 text-blue-600 mr-2" />
                Vaka Özeti
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Müşteri:</span>
                  <p className="font-medium text-gray-900">{returnCase.customer.name}</p>
                </div>
                <div>
                  <span className="text-gray-600">Geliş Tarihi:</span>
                  <p className="font-medium text-gray-900">{formatTurkishDate(returnCase.arrival_date)}</p>
                </div>
                <div>
                  <span className="text-gray-600">Toplam Maliyet:</span>
                  <p className="font-semibold text-blue-600">{formatCurrency(returnCase.cost)}</p>
                </div>
                <div>
                  <span className="text-gray-600">Durum:</span>
                  <p className="font-medium text-gray-900">{returnCase.status}</p>
                </div>
              </div>

              {/* Items Summary */}
              <div className="mt-4">
                <h4 className="font-medium text-gray-800 mb-2">Ürün Detayları:</h4>
                <div className="space-y-2">
                  {returnCase.items.map((item, index) => (
                    <div key={item.id} className="bg-white rounded p-3 border border-gray-200">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">{item.product_model.name}</p>
                          <p className="text-sm text-gray-600">
                            {item.product_count} adet • {item.resolution_method === 'Tamir' ? '🔨 Tamir Edildi' : '🔄 Değiştirildi'}
                          </p>
                        </div>
                        <div className="text-right">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            item.resolution_method === 'Tamir' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-blue-100 text-blue-800'
                          }`}>
                            {item.resolution_method}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Shipping Information */}
              {(returnCase.shipping_info || returnCase.tracking_number || returnCase.shipping_date) && (
                <div className="mt-4">
                  <h4 className="font-medium text-gray-800 mb-2">Kargo Bilgileri:</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                    {returnCase.shipping_info && (
                      <div>
                        <span className="text-gray-600">Kargo Firması:</span>
                        <p className="font-medium text-gray-900">{returnCase.shipping_info}</p>
                      </div>
                    )}
                    {returnCase.tracking_number && (
                      <div>
                        <span className="text-gray-600">Takip No:</span>
                        <p className="font-medium text-gray-900">{returnCase.tracking_number}</p>
                      </div>
                    )}
                    {returnCase.shipping_date && (
                      <div>
                        <span className="text-gray-600">Kargo Tarihi:</span>
                        <p className="font-medium text-gray-900">{formatTurkishDate(returnCase.shipping_date)}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Email Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="emailContent" className="block text-sm font-medium text-gray-700 mb-2">
                  E-posta İçeriği *
                </label>
                <textarea
                  id="emailContent"
                  value={emailContent}
                  onChange={(e) => setEmailContent(e.target.value)}
                  rows={12}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 resize-none"
                  placeholder="E-posta içeriğini buraya yazın..."
                  required
                />
                <p className="text-sm text-gray-500 mt-1">
                  E-posta içeriğini müşteriye uygun şekilde özelleştirebilirsiniz.
                </p>
              </div>

              {/* Error/Success Messages */}
              {error && (
                <div className="flex items-center space-x-2 p-3 text-sm text-red-700 bg-red-100 rounded-md">
                  <AlertCircle className="h-4 w-4" />
                  <span>{error}</span>
                </div>
              )}

              {success && (
                <div className="flex items-center space-x-2 p-3 text-sm text-green-700 bg-green-100 rounded-md">
                  <CheckCircle className="h-4 w-4" />
                  <span>{success}</span>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  disabled={isLoading || !emailContent.trim()}
                  className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Gönderiliyor...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      E-posta Gönder
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
