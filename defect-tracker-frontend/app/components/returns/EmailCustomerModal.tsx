'use client';

import { useState, FormEvent, useEffect } from 'react';
import { X, Mail, Send, AlertCircle, CheckCircle, User, Package, Calendar, MapPin, Phone } from 'lucide-react';
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
  const [recipientEmail, setRecipientEmail] = useState('');

  // Generate default email content based on return case
  const generateDefaultEmail = () => {
    const repairedItems = returnCase.items.filter(item => item.resolution_method === 'Tamir');
    const freeReplacementItems = returnCase.items.filter(item => item.resolution_method === 'Bedelsiz Değişim');
    const oldProductItems = returnCase.items.filter(item => item.resolution_method === 'Eski Ürün (Yok)');
    
    let content = `Merhaba ${returnCase.customer.name},\n\n`;
    content += `Arıza vakanız (#${returnCase.id}) ile ilgili bilgilendirme:\n\n`;
    
    if (repairedItems.length > 0) {
      content += `Tamir edilen ürünler:\n`;
      repairedItems.forEach(item => {
        content += `• ${item.product_model.name} (${item.product_count} adet)\n`;
      });
      content += '\n';
    }
    
    if (freeReplacementItems.length > 0) {
      content += `Bedelsiz olarak değiştirilen ürünler:\n`;
      freeReplacementItems.forEach(item => {
        content += `• ${item.product_model.name} (${item.product_count} adet)\n`;
      });
      content += '\n';
    }
    
    if (oldProductItems.length > 0) {
      content += `Eski ürün teslim alınmayan ürünler:\n`;
      oldProductItems.forEach(item => {
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

  // Set default email content and recipient when component mounts
  useEffect(() => {
    setEmailContent(generateDefaultEmail());
    // Set default recipient email if available in customer data
    if (returnCase.customer.contact_info && returnCase.customer.contact_info.includes('@')) {
      // If contact_info contains an email address, use it
      setRecipientEmail(returnCase.customer.contact_info);
    }
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
          emailContent: emailContent,
          recipientEmail: recipientEmail
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4">
      <div className="absolute inset-0 bg-gray-900/50" onClick={onClose} />
              <div className="relative w-full max-w-4xl max-h-[98vh] sm:max-h-[90vh] bg-white rounded-xl shadow-2xl flex flex-col overflow-hidden">
                  {/* Header */}
          <div className="p-3 sm:p-4 border-b border-gray-200 flex items-center justify-between bg-gradient-to-r from-blue-50 to-indigo-50">
          <div className="flex items-center space-x-2">
            <Mail className="h-6 w-6 text-blue-600" />
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-blue-800">Müşteriye E-posta Gönder</h2>
              <p className="text-xs text-blue-600 mt-1">
                Vaka #{returnCase.id} - {returnCase.customer.name}
              </p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="text-gray-400 hover:text-gray-600 transition-colors duration-200 p-1 rounded-full hover:bg-gray-100"
          >
            <X size={20} />
          </button>
        </div>
        
        {/* Content */}
        <div className="flex-grow overflow-y-auto">
          <div className="p-4 space-y-4">
            
            {/* SECTION 1: Customer Information (Top Section) */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-200">
              <h3 className="text-lg font-bold text-blue-800 mb-3 flex items-center">
                <User className="h-5 w-5 text-blue-600 mr-2" />
                Müşteri Bilgileri
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="bg-white rounded-lg p-3 border border-blue-100">
                  <div className="flex items-center space-x-2 mb-1">
                    <User className="h-3 w-3 text-blue-600" />
                    <span className="text-xs font-medium text-gray-600">Müşteri Adı</span>
                  </div>
                  <p className="text-sm font-semibold text-gray-900">{returnCase.customer.name}</p>
                </div>
                
                <div className="bg-white rounded-lg p-3 border border-blue-100">
                  <div className="flex items-center space-x-2 mb-1">
                    <Phone className="h-3 w-3 text-blue-600" />
                    <span className="text-xs font-medium text-gray-600">İletişim Bilgileri</span>
                  </div>
                  <p className="text-sm font-semibold text-gray-900">{returnCase.customer.contact_info || "—"}</p>
                </div>
                
                <div className="bg-white rounded-lg p-3 border border-blue-100">
                  <div className="flex items-center space-x-2 mb-1">
                    <MapPin className="h-3 w-3 text-blue-600" />
                    <span className="text-xs font-medium text-gray-600">Adres</span>
                  </div>
                  <p className="text-sm font-semibold text-gray-900">{returnCase.customer.address || "—"}</p>
                </div>
              </div>
            </div>

            {/* SECTION 2: Return Case Summary (Middle Section) */}
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-4 border border-green-200">
              <h3 className="text-lg font-bold text-green-800 mb-3 flex items-center">
                <Package className="h-5 w-5 text-green-600 mr-2" />
                Arıza Vakası Özeti
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
                <div className="bg-white rounded-lg p-3 border border-green-100">
                  <div className="flex items-center space-x-2 mb-1">
                    <Calendar className="h-3 w-3 text-green-600" />
                    <span className="text-xs font-medium text-gray-600">Geliş Tarihi</span>
                  </div>
                  <p className="text-sm font-semibold text-gray-900">{formatTurkishDate(returnCase.arrival_date)}</p>
                </div>
                
                <div className="bg-white rounded-lg p-3 border border-green-100">
                  <div className="flex items-center space-x-2 mb-1">
                    <Package className="h-3 w-3 text-green-600" />
                    <span className="text-xs font-medium text-gray-600">Ürün Sayısı</span>
                  </div>
                  <p className="text-sm font-semibold text-gray-900">{returnCase.items.length} ürün</p>
                </div>
                
                <div className="bg-white rounded-lg p-3 border border-green-100">
                  <div className="flex items-center space-x-2 mb-1">
                    <AlertCircle className="h-3 w-3 text-green-600" />
                    <span className="text-xs font-medium text-gray-600">Toplam Maliyet</span>
                  </div>
                  <p className="text-sm font-semibold text-green-600">{formatCurrency(returnCase.cost)}</p>
                </div>
              </div>

              {/* Products List */}
              <div className="bg-white rounded-lg p-3 border border-green-100 mb-3">
                <h4 className="font-semibold text-gray-800 mb-2 flex items-center text-sm">
                  <Package className="h-3 w-3 text-green-600 mr-1" />
                  Ürünler
                </h4>
                <div className="space-y-1">
                  {returnCase.items.map((item, index) => {
                    // Define resolution method icon and label
                    const getResolutionIcon = (method: string) => {
                      switch(method) {
                        case 'Tamir': return '🔨';
                        case 'Bedelsiz Değişim': return '🎁';
                        case 'Eski Ürün (Yok)': return '❌';
                        case 'Bilinmiyor': return '❓';
                        default: return '❓';
                      }
                    };
                    
                    const getBadgeColor = (method: string) => {
                      switch(method) {
                        case 'Tamir': return 'bg-green-100 text-green-800';
                        case 'Bedelsiz Değişim': return 'bg-purple-100 text-purple-800';
                        case 'Eski Ürün (Yok)': return 'bg-gray-100 text-gray-800';
                        case 'Bilinmiyor': return 'bg-yellow-100 text-yellow-800';
                        default: return 'bg-gray-100 text-gray-800';
                      }
                    };
                    
                    return (
                      <div key={item.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                        <div className="flex-1">
                          <p className="font-medium text-gray-900 text-sm">{item.product_model.name}</p>
                          <p className="text-xs text-gray-600">
                            {item.product_count} adet • {getResolutionIcon(item.resolution_method)} {item.resolution_method}
                          </p>
                        </div>
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getBadgeColor(item.resolution_method)}`}>
                          {item.resolution_method}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Shipping Information */}
              {(returnCase.shipping_info || returnCase.tracking_number || returnCase.shipping_date) && (
                <div className="bg-white rounded-lg p-3 border border-green-100">
                  <h4 className="font-semibold text-gray-800 mb-2 flex items-center text-sm">
                    <Package className="h-3 w-3 text-green-600 mr-1" />
                    Kargo Bilgileri
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {returnCase.shipping_info && (
                      <div>
                        <span className="text-xs font-medium text-gray-600">Kargo Firması:</span>
                        <p className="font-semibold text-gray-900 text-sm">{returnCase.shipping_info}</p>
                      </div>
                    )}
                    {returnCase.tracking_number && (
                      <div>
                        <span className="text-xs font-medium text-gray-600">Kargo Numarası:</span>
                        <p className="font-semibold text-gray-900 text-sm">{returnCase.tracking_number}</p>
                      </div>
                    )}
                    {returnCase.shipping_date && (
                      <div>
                        <span className="text-xs font-medium text-gray-600">Kargoya Verilme Tarihi:</span>
                        <p className="font-semibold text-gray-900 text-sm">{formatTurkishDate(returnCase.shipping_date)}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* SECTION 3: Email Composition (Bottom Section) */}
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-4 border border-purple-200">
              <h3 className="text-lg font-bold text-purple-800 mb-3 flex items-center">
                <Mail className="h-5 w-5 text-purple-600 mr-2" />
                E-posta Oluşturma
              </h3>
              
              <form onSubmit={handleSubmit} className="space-y-3">
                {/* Recipient Email Field */}
                <div>
                  <label htmlFor="recipientEmail" className="block text-xs font-medium text-gray-700 mb-1">
                    Alıcı E-posta Adresi *
                  </label>
                  <input
                    type="email"
                    id="recipientEmail"
                    value={recipientEmail}
                    onChange={(e) => setRecipientEmail(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-sm"
                    placeholder="ornek@email.com"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Müşterinin e-posta adresini girin.
                  </p>
                </div>

                {/* Email Content */}
                <div>
                  <label htmlFor="emailContent" className="block text-xs font-medium text-gray-700 mb-1">
                    E-posta İçeriği *
                  </label>
                  <div className="border border-gray-300 rounded-lg shadow-sm focus-within:ring-2 focus-within:ring-purple-500 focus-within:border-purple-500">
                    <textarea
                      id="emailContent"
                      value={emailContent}
                      onChange={(e) => setEmailContent(e.target.value)}
                      rows={8}
                      className="w-full px-3 py-2 border-0 rounded-lg resize-none text-sm focus:outline-none focus:ring-0"
                      placeholder="E-posta içeriğini buraya yazın..."
                      required
                      style={{ maxHeight: '200px', overflowY: 'auto' }}
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    E-posta içeriğini müşteriye uygun şekilde özelleştirebilirsiniz.
                  </p>
                </div>

                {/* Error/Success Messages */}
                {error && (
                  <div className="flex items-center space-x-2 p-3 text-xs text-red-700 bg-red-100 rounded-lg border border-red-200">
                    <AlertCircle className="h-3 w-3" />
                    <span>{error}</span>
                  </div>
                )}

                {success && (
                  <div className="flex items-center space-x-2 p-3 text-xs text-green-700 bg-green-100 rounded-lg border border-green-200">
                    <CheckCircle className="h-3 w-3" />
                    <span>{success}</span>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex items-center justify-end space-x-2 pt-3 border-t border-purple-200">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-colors"
                  >
                    İptal
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading || !emailContent.trim() || !recipientEmail.trim()}
                    className="inline-flex items-center px-4 py-2 text-xs font-medium text-white bg-purple-600 border border-transparent rounded-lg hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                  >
                    {isLoading ? (
                      <>
                        <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-1"></div>
                        Gönderiliyor...
                      </>
                    ) : (
                      <>
                        <Send className="h-3 w-3 mr-1" />
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
    </div>
  );
}
