// This directive marks the component as a "Client Component,"
// allowing it to be rendered in the browser and use interactive features like state and effects.
'use client';

// Import necessary hooks, components, and utilities from React and other libraries.
import { useState, useEffect, FormEvent } from 'react';
import { X } from 'lucide-react'; // 'X' icon for the close button.
import { FullReturnCase, FullReturnCaseItem, User } from '@/lib/types'; // Type definitions for data structures.
import DatePicker from 'react-datepicker'; // A component for selecting dates from a calendar.
import { format } from 'date-fns'; // A function for formatting dates.
import { tr } from 'date-fns/locale'; // Turkish locale for date formatting.
import 'react-datepicker/dist/react-datepicker.css'; // Styles for the DatePicker component.
import { API_ENDPOINTS, buildApiUrl } from '@/lib/api';
import { useAuth } from '@/app/contexts/AuthContext';

// Define the properties (props) that the EditReturnCaseModal component expects.
interface EditReturnCaseModalProps {
  returnCase: FullReturnCase; // The return case object to be edited.
  onClose: () => void; // A function to be called when the modal is closed.
  onSuccess: () => void; // A function to be called when the form is successfully submitted.
}

type StageName = 'Teslim Alındı' | 'Teknik İnceleme' | 'Ödeme Tahsilatı' | 'Kargoya Veriliyor' | 'Tamamlandı';

// Type for editable product items
type EditableProduct = {
  id: number;
  product_model: { name: string };
  product_count: number;
  production_date: string;
  warranty_status: string;
  fault_responsibility: string;
  resolution_method: string;
  service_type?: string;
  work_done?: string;
  includeAttachedUnit?: boolean;
  isNew?: boolean;
};

// Role-based field permissions based on CasesTable analysis
const ROLE_PERMISSIONS: Record<string, StageName[]> = {
  SUPPORT: ['Teslim Alındı'],
  TECHNICIAN: ['Teknik İnceleme'],
  SALES: ['Ödeme Tahsilatı'],
  LOGISTICS: ['Kargoya Veriliyor'],
  MANAGER: ['Tamamlandı'],
  ADMIN: ['Teslim Alındı', 'Teknik İnceleme', 'Ödeme Tahsilatı', 'Kargoya Veriliyor', 'Tamamlandı']
};

// Turkish role names mapping
const TURKISH_ROLE_NAMES: Record<string, string> = {
  SALES: 'Satış',
  LOGISTICS: 'Lojistik',
  SUPPORT: 'Destek',
  TECHNICIAN: 'Teknisyen',
  MANAGER: 'Yönetici',
  ADMIN: 'Yönetici'
};

// The main component for the modal.
export default function EditReturnCaseModal({ returnCase, onClose, onSuccess }: EditReturnCaseModalProps) {
  // Get current user from auth context
  const { user } = useAuth();
  
  // State variables for managing loading, errors, and success messages.
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [productModels, setProductModels] = useState<any[]>([]);

  // State for storing the form data. It's initialized with the existing return case data.
  const [formData, setFormData] = useState({
    status: returnCase.status,
    notes: returnCase.notes || '',
    shippingInfo: returnCase.shipping_info || '',
    trackingNumber: returnCase.tracking_number || '',
    shippingDate: returnCase.shipping_date ? new Date(returnCase.shipping_date) : null,
    paymentStatus: returnCase.payment_status || '',
    arrivalDate: new Date(returnCase.arrival_date),
    receiptMethod: returnCase.receipt_method,
  });

  // State for managing products
  const [products, setProducts] = useState<EditableProduct[]>(
    (returnCase.items || []).map(item => ({
      id: item.id,
      product_model: { name: item.product_model?.name || '' },
      product_count: item.product_count || 1,
      production_date: item.production_date || '',
      warranty_status: item.warranty_status || 'unknown',
      fault_responsibility: item.fault_responsibility || 'unknown',
      resolution_method: item.resolution_method || 'unknown',
      service_type: item.service_type || 'unknown',
      work_done: item.yapilan_islemler || '',
      includeAttachedUnit: item.has_control_unit || false
    }))
  );
  const [nextProductId, setNextProductId] = useState(1000); // For new products

  // Check if user can edit a specific stage
  const canEditStage = (stageName: StageName): boolean => {
    if (!user?.role) return false;
    const userPermissions = ROLE_PERMISSIONS[user.role] || [];
    return userPermissions.includes(stageName);
  };

  // Check if user can edit the current case status
  const canEditCurrentStatus = (): boolean => {
    if (!user?.role) return false;
    
    const stageOrder = ['Teslim Alındı', 'Teknik İnceleme', 'Ödeme Tahsilatı', 'Kargoya Veriliyor', 'Tamamlandı'];
    const currentIndex = stageOrder.indexOf(returnCase.status);
    
    // Check if user has permission for current stage or any previous stage
    for (let i = 0; i <= currentIndex; i++) {
      if (canEditStage(stageOrder[i] as StageName)) {
        return true;
      }
    }
    return false;
  };

  // Product management functions
  const handleAddProduct = () => {
    const newProduct: EditableProduct = {
      id: nextProductId,
      product_model: { name: '' },
      product_count: 1,
      production_date: '',
      warranty_status: 'unknown',
      fault_responsibility: 'unknown',
      resolution_method: 'unknown',
      service_type: 'unknown',
      work_done: '',
      includeAttachedUnit: false,
      isNew: true // Flag to identify new products
    };
    setProducts([...products, newProduct]);
    setNextProductId(nextProductId + 1);
  };

  const handleRemoveProduct = (productId: number) => {
    setProducts(products.filter(p => p.id !== productId));
  };

  const handleProductChange = (productId: number, field: string, value: any) => {
    setProducts(products.map(p => 
      p.id === productId ? { ...p, [field]: value } : p
    ));
  };

  // Get field styling based on editability
  const getFieldClasses = (color: string, isEditable: boolean) => {
    const baseClasses = 'w-full border rounded-md p-3 transition-colors duration-200';
    
    if (isEditable) {
      const focusClasses = {
        orange: 'border-orange-300 focus:ring-2 focus:ring-orange-200',
        blue: 'border-blue-300 focus:ring-2 focus:ring-blue-200',
        yellow: 'border-yellow-300 focus:ring-2 focus:ring-yellow-200',
        purple: 'border-purple-300 focus:ring-2 focus:ring-purple-200',
        pink: 'border-pink-300 focus:ring-2 focus:ring-pink-200'
      };
      return `${baseClasses} ${focusClasses[color as keyof typeof focusClasses]} bg-white`;
    } else {
      return `${baseClasses} border-${color}-200 bg-${color}-50 text-${color}-600 opacity-50 cursor-not-allowed`;
    }
  };

  // --- Data Fetching and Submission ---

  // Fetch the list of users and product models when the component first renders.
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch users
        const usersResponse = await fetch(buildApiUrl(API_ENDPOINTS.ADMIN.USERS), { credentials: 'include' });
        const usersData = await usersResponse.json();
        setUsers(usersData.users || []);

        // Fetch product models
        const productsResponse = await fetch(buildApiUrl(API_ENDPOINTS.PRODUCTS), { credentials: 'include' });
        const productsData = await productsResponse.json();
        setProductModels(productsData.products || []);
      } catch (err) {
        setError("Veriler yüklenemedi.");
      }
    };
    fetchData();
  }, []);

  // Handle the form submission.
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault(); // Prevent the default form submission behavior.
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch(buildApiUrl(`${API_ENDPOINTS.RETURNS.BASE}/${returnCase.id}`), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          status: formData.status,
          notes: formData.notes,
          shippingInfo: formData.shippingInfo,
          trackingNumber: formData.trackingNumber,
          shippingDate: formData.shippingDate ? formData.shippingDate.toISOString().split('T')[0] : null,
          paymentStatus: formData.paymentStatus,
          arrivalDate: formData.arrivalDate.toISOString().split('T')[0],
          receiptMethod: formData.receiptMethod,
          items: products.filter(p => p.product_model.name && p.product_count > 0).map(p => ({
            product_model_name: p.product_model.name,
            product_count: p.product_count,
            production_date: p.production_date,
            warranty_status: p.warranty_status,
            fault_responsibility: p.fault_responsibility,
            resolution_method: p.resolution_method,
            service_type: p.service_type,
            yapilan_islemler: p.work_done,
            includeAttachedUnit: p.includeAttachedUnit || false
          }))
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
  
  // Determine which stages are editable.
  const currentStageIndex = ['Teslim Alındı', 'Teknik İnceleme', 'Ödeme Tahsilatı', 'Kargoya Veriliyor', 'Tamamlandı'].findIndex(name => name === returnCase.status);
  const isTeslimAlindiEditable = currentStageIndex >= 0;
  const isOdemeTahsilatiEditable = currentStageIndex >= 2;
  const isKargoyaVerildiEditable = currentStageIndex >= 3;
  const isTamamlandiEditable = currentStageIndex >= 4;

  // --- JSX Rendering ---

    return (
    // The main modal container with a semi-transparent background.
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-gray-900/50" onClick={onClose} />
      <div className="relative w-full max-w-5xl max-h-[95vh] bg-white rounded-xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 flex items-center justify-between bg-gradient-to-r from-blue-50 to-indigo-50">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Vaka Düzenle: #{returnCase.id}</h2>
            <p className="text-shadow-2xs text-gray-500 mt-1">
              Kullanıcı Rolü: {TURKISH_ROLE_NAMES[user?.role || ''] || user?.role}
            </p>
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

            {/* Case Info */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
              <h3 className="text-base font-semibold text-gray-800 mb-2 flex items-center">
                <div className="w-2 h-2 bg-gray-400 rounded-full mr-2" />
                Vaka Bilgileri
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Vaka No</label>
                  <input type="text" value={`#${returnCase.id}`} disabled className="w-full border border-gray-300 rounded p-2 bg-gray-50 text-gray-800 font-semibold cursor-not-allowed text-sm"/>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Durum</label>
                  <input type="text" value={formData.status} disabled className="w-full border border-gray-300 rounded p-2 bg-gray-50 text-gray-800 font-semibold cursor-not-allowed text-sm"/>
                </div>
              </div>
            </div>

            {/* Stage 1: Teslim Alındı */}
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 mt-4">
              <h3 className="text-base font-semibold text-orange-800 mb-2 flex items-center">
                <div className="w-2 h-2 bg-orange-400 rounded-full mr-2" />
                Teslim Alındı (Sadece {TURKISH_ROLE_NAMES.SUPPORT} Ekibi Düzenleyebilir)
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-orange-700 mb-1">Müşteri</label>
                  <input
                    type="text"
                    value={returnCase.customer?.name || 'Müşteri Yok'}
                    disabled
                    className="w-full border border-orange-300 rounded p-2 bg-orange-50 text-orange-800 font-semibold cursor-not-allowed text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-orange-700 mb-1">Geliş Tarihi</label>
                  <input
                    type="text"
                    value={format(formData.arrivalDate, 'dd.MM.yyyy', { locale: tr })}
                    disabled
                    className="w-full border border-orange-300 rounded p-2 bg-orange-50 text-orange-800 font-semibold cursor-not-allowed text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-orange-700 mb-1">Teslim Yöntemi</label>
                  {canEditStage('Teslim Alındı') ? (
                    <select
                      value={formData.receiptMethod}
                      onChange={(e) => setFormData(prev => ({ ...prev, receiptMethod: e.target.value }))}
                      className="w-full border border-orange-300 rounded p-2 bg-white text-orange-800 text-sm"
                    >
                      <option value="">Seçiniz</option>
                      <option value="shipment">Kargo</option>
                      <option value="in_person">Elden Teslim</option>
                    </select>
                  ) : (
                    <input
                      type="text"
                      value={
                        formData.receiptMethod === 'shipment'
                          ? 'Kargo'
                          : formData.receiptMethod === 'in_person'
                          ? 'Elden Teslim'
                          : formData.receiptMethod
                      }
                      disabled
                      className="w-full border border-orange-300 rounded p-2 bg-orange-100 text-orange-800 font-semibold cursor-not-allowed text-sm"
                    />
                  )}
                </div>
                <div className="md:col-span-3">
                  <label className="block text-xs font-medium text-orange-700 mb-1">Notlar</label>
                  {canEditStage('Teslim Alındı') ? (
                    <textarea
                      value={formData.notes}
                      onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                      className="w-full border border-orange-300 rounded p-2 bg-white text-orange-800 text-sm"
                      rows={2}
                      placeholder="Ek notlarınızı buraya yazın..."
                    />
                  ) : (
                    <textarea
                      value={formData.notes}
                      disabled
                      className="w-full border border-orange-300 rounded p-2 bg-orange-100 text-orange-800 text-sm cursor-not-allowed"
                      rows={2}
                    />
                  )}
                </div>
              </div>
            </div>

            {/* Stage 2: Teknik İnceleme */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-4">
              <h3 className="text-base font-semibold text-blue-800 mb-2 flex items-center">
                <div className="w-2 h-2 bg-blue-400 rounded-full mr-2" />
                Teknik İnceleme (Sadece {TURKISH_ROLE_NAMES.TECHNICIAN} Ekibi Düzenleyebilir)
              </h3>
              
              {/* Ürünler Section */}
              <div className="space-y-3">
                <h4 className="text-sm font-medium text-blue-700">Gelen Ürünler</h4>
                {products.length > 0 ? (
                  products.map((item) => (
                    <div key={item.id} className="p-3 bg-white rounded-lg space-y-3 border border-blue-200 relative">
                      {/* Delete button for new products or if user can edit */}
                      {item.isNew && (
                        <button
                          type="button"
                          onClick={() => handleRemoveProduct(item.id)}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                        >
                          <X size={12} />
                        </button>
                      )}
                      
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          <div>
                            <label className="block text-xs font-medium text-blue-700 mb-1">Ürün Modeli</label>
                            {canEditStage('Teknik İnceleme') && item.isNew ? (
                              <select
                                value={item.product_model.name}
                                onChange={(e) => handleProductChange(item.id, 'product_model', { name: e.target.value })}
                                className="w-full border border-blue-300 rounded p-2 bg-white text-blue-800 text-sm"
                              >
                                <option value="">Ürün Modeli Seçin...</option>
                                {productModels.map((model) => (
                                  <option key={model.id} value={model.name}>
                                    {model.name}
                                  </option>
                                ))}
                              </select>
                            ) : (
                              <input
                                type="text"
                                value={item.product_model?.name || 'Ürün Adı Yok'}
                                disabled
                                className="w-full border border-blue-300 rounded p-2 bg-blue-50 text-blue-800 font-semibold cursor-not-allowed text-sm"
                              />
                            )}
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-blue-700 mb-1">Adet</label>
                            {canEditStage('Teknik İnceleme') && item.isNew ? (
                              <input
                                type="number"
                                min="1"
                                value={item.product_count}
                                onChange={(e) => handleProductChange(item.id, 'product_count', parseInt(e.target.value))}
                                className="w-full border border-blue-300 rounded p-2 bg-white text-blue-800 text-sm"
                              />
                            ) : (
                              <input
                                type="number"
                                value={item.product_count || 1}
                                disabled
                                className="w-full border border-blue-300 rounded p-2 bg-blue-50 text-blue-800 font-semibold cursor-not-allowed text-sm"
                              />
                            )}
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-blue-700 mb-1">Üretim Tarihi</label>
                            {canEditStage('Teknik İnceleme') && item.isNew ? (
                              <input
                                type="text"
                                value={item.production_date}
                                onChange={(e) => handleProductChange(item.id, 'production_date', e.target.value)}
                                className="w-full border border-blue-300 rounded p-2 bg-white text-blue-800 text-sm"
                                placeholder="MM-YYYY (örn: 03-2024)"
                                required
                              />
                            ) : (
                              <input
                                type="text"
                                value={item.production_date || 'Yok'}
                                disabled
                                className="w-full border border-blue-300 rounded p-2 bg-blue-50 text-blue-800 font-semibold cursor-not-allowed text-sm"
                              />
                            )}
             </div>
        </div>

                        {/* Technical Analysis Fields */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-3">
                          <div>
                            <label className="block text-xs font-medium text-blue-700 mb-1">Garanti Durumu</label>
                            {canEditStage('Teknik İnceleme') && item.isNew ? (
                              <select
                                value={item.warranty_status}
                                onChange={(e) => handleProductChange(item.id, 'warranty_status', e.target.value)}
                                className="w-full border border-blue-300 rounded p-2 bg-white text-blue-800 text-sm"
                              >
                                <option value="unknown">Bilinmiyor</option>
                                <option value="in_warranty">Garanti Dahilinde</option>
                                <option value="out_of_warranty">Garanti Dışı</option>
                              </select>
                            ) : (
                              <input
                                type="text"
                                value={
                                  item.warranty_status === 'in_warranty' ? 'Garanti Dahilinde' :
                                  item.warranty_status === 'out_of_warranty' ? 'Garanti Dışı' : 'Bilinmiyor'
                                }
                                disabled
                                className="w-full border border-blue-300 rounded p-2 bg-blue-50 text-blue-800 font-semibold cursor-not-allowed text-sm"
                              />
                            )}
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-blue-700 mb-1">Hata Sorumluluğu</label>
                            {canEditStage('Teknik İnceleme') && item.isNew ? (
                              <select
                                value={item.fault_responsibility}
                                onChange={(e) => handleProductChange(item.id, 'fault_responsibility', e.target.value)}
                                className="w-full border border-blue-300 rounded p-2 bg-white text-blue-800 text-sm"
                              >
                                <option value="unknown">Bilinmiyor</option>
                                <option value="user_error">Kullanıcı Hatası</option>
                                <option value="technical_issue">Teknik Sorun</option>
                                <option value="mixed">Karışık</option>
                              </select>
                            ) : (
                              <input
                                type="text"
                                value={
                                  item.fault_responsibility === 'user_error' ? 'Kullanıcı Hatası' :
                                  item.fault_responsibility === 'technical_issue' ? 'Teknik Sorun' :
                                  item.fault_responsibility === 'mixed' ? 'Karışık' : 'Bilinmiyor'
                                }
                                disabled
                                className="w-full border border-blue-300 rounded p-2 bg-blue-50 text-blue-800 font-semibold cursor-not-allowed text-sm"
                              />
                            )}
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-blue-700 mb-1">Çözüm Yöntemi</label>
                            {canEditStage('Teknik İnceleme') && item.isNew ? (
                              <select
                                value={item.resolution_method}
                                onChange={(e) => handleProductChange(item.id, 'resolution_method', e.target.value)}
                                className="w-full border border-blue-300 rounded p-2 bg-white text-blue-800 text-sm"
                              >
                                <option value="unknown">Bilinmiyor</option>
                                <option value="repair">Tamir</option>
                                <option value="replacement">Değişim</option>
                              </select>
                            ) : (
                              <input
                                type="text"
                                value={
                                  item.resolution_method === 'repair' ? 'Tamir' :
                                  item.resolution_method === 'replacement' ? 'Değişim' : 'Bilinmiyor'
                                }
                                disabled
                                className="w-full border border-blue-300 rounded p-2 bg-blue-50 text-blue-800 font-semibold cursor-not-allowed text-sm"
                              />
                            )}
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-blue-700 mb-1">Hizmet Türü</label>
                            {canEditStage('Teknik İnceleme') && item.isNew ? (
                              <select
                                value={item.service_type}
                                onChange={(e) => handleProductChange(item.id, 'service_type', e.target.value)}
                                className="w-full border border-blue-300 rounded p-2 bg-white text-blue-800 text-sm"
                              >
                                <option value="unknown">Bilinmiyor</option>
                                <option value="warranty">Garanti</option>
                                <option value="paid">Ücretli</option>
                                <option value="free">Ücretsiz</option>
                              </select>
                            ) : (
                              <input
                                type="text"
                                value={
                                  item.service_type === 'warranty' ? 'Garanti' :
                                  item.service_type === 'paid' ? 'Ücretli' :
                                  item.service_type === 'free' ? 'Ücretsiz' : 'Bilinmiyor'
                                }
                                disabled
                                className="w-full border border-blue-300 rounded p-2 bg-blue-50 text-blue-800 font-semibold cursor-not-allowed text-sm"
                              />
                            )}
                          </div>
                        </div>
                        
                        {/* Work Done Field */}
                        <div className="mt-3">
                          <label className="block text-xs font-medium text-blue-700 mb-1">Yapılan İşlemler</label>
                          {canEditStage('Teknik İnceleme') && item.isNew ? (
                            <textarea
                              value={item.work_done}
                              onChange={(e) => handleProductChange(item.id, 'work_done', e.target.value)}
                              className="w-full border border-blue-300 rounded p-2 bg-white text-blue-800 text-sm"
                              rows={2}
                              placeholder="Yapılan işlemleri detaylı olarak açıklayın..."
                            />
                          ) : (
                            <textarea
                              value={item.work_done || ''}
                              disabled
                              className="w-full border border-blue-300 rounded p-2 bg-blue-50 text-blue-800 text-sm cursor-not-allowed"
                              rows={2}
                            />
                          )}
                        </div>
                        
                        {/* Control Unit Logic */}
                        {item.product_model.name && !item.product_model.name.toLowerCase().includes('kontrol') && (
                          <div className="border-t pt-3">
                            <div className="flex items-center">
                              {canEditStage('Teknik İnceleme') && item.isNew ? (
                                <input
                                  type="checkbox"
                                  id={`cb-${item.id}`}
                                  checked={item.includeAttachedUnit || false}
                                  onChange={(e) => handleProductChange(item.id, 'includeAttachedUnit', e.target.checked)}
                                  className="h-4 w-4 text-blue-600 border-blue-300 rounded"
                                />
                              ) : (
                                <input
                                  type="checkbox"
                                  id={`cb-${item.id}`}
                                  checked={item.includeAttachedUnit || false}
                                  disabled
                                  className="h-4 w-4 text-blue-600 border-blue-300 rounded bg-blue-50 cursor-not-allowed"
                                />
                              )}
                              <label htmlFor={`cb-${item.id}`} className="ml-2 block text-xs text-blue-700">
                                Kontrol Ünitesi Ekle
                              </label>
                            </div>
                          </div>
                        )}
                        

                    </div>
                  ))
                ) : (
                  <div className="text-center py-6 text-blue-600 bg-blue-100 rounded-lg">
                    <p className="text-sm">Bu vakaya ait ürün bulunmamaktadır.</p>
                  </div>
                )}
                
                {/* Add Product Button */}
                {canEditStage('Teknik İnceleme') && (
                  <button
                    type="button"
                    onClick={handleAddProduct}
                    disabled={!products.every(item => item.product_model.name && item.product_count > 0)}
                    className="flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-800 disabled:text-gray-400 mt-3"
                  >
                    <div className="w-4 h-4 bg-blue-600 rounded-full flex items-center justify-center text-white text-xs">+</div>
                    <span>Ürün Ekle</span>
                  </button>
                )}
              </div>
            </div>

            {/* Stage 3: Ödeme Tahsilatı */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mt-4">
              <h3 className="text-base font-semibold text-yellow-800 mb-2 flex items-center">
                <div className="w-2 h-2 bg-yellow-400 rounded-full mr-2" />
                Ödeme Tahsilatı (Sadece {TURKISH_ROLE_NAMES.SALES} Ekibi Düzenleyebilir)
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-yellow-700 mb-1">Ödeme Durumu</label>
                  {canEditStage('Ödeme Tahsilatı') ? (
                    <select
                      value={formData.paymentStatus}
                      onChange={(e) => setFormData(prev => ({ ...prev, paymentStatus: e.target.value }))}
                      className="w-full border border-yellow-300 rounded p-2 bg-white text-yellow-800 text-sm"
                    >
                      <option value="">Seçiniz</option>
                      <option value="pending">Beklemede</option>
                      <option value="paid">Ödendi</option>
                      <option value="unpaid">Ödenmedi</option>
                      <option value="waived">Ücretsiz</option>
                    </select>
                  ) : (
                    <input
                      type="text"
                      value={
                        formData.paymentStatus === 'pending' ? 'Beklemede' :
                        formData.paymentStatus === 'paid' ? 'Ödendi' :
                        formData.paymentStatus === 'unpaid' ? 'Ödenmedi' :
                        formData.paymentStatus === 'waived' ? 'Ücretsiz' : formData.paymentStatus
                      }
                      disabled
                      className="w-full border border-yellow-300 rounded p-2 bg-yellow-50 text-yellow-800 font-semibold cursor-not-allowed text-sm"
                    />
                  )}
                </div>
              </div>
            </div>

            {/* Stage 4: Kargoya Verildi */}
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 mt-4">
              <h3 className="text-base font-semibold text-purple-800 mb-2 flex items-center">
                <div className="w-2 h-2 bg-purple-400 rounded-full mr-2" />
                Kargoya Verildi (Sadece {TURKISH_ROLE_NAMES.LOGISTICS} Ekibi Düzenleyebilir)
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-purple-700 mb-1">Kargo Bilgisi</label>
                  {canEditStage('Kargoya Veriliyor') ? (
                    <input
                      type="text"
                      value={formData.shippingInfo}
                      onChange={(e) => setFormData(prev => ({ ...prev, shippingInfo: e.target.value }))}
                      className="w-full border border-purple-300 rounded p-2 bg-white text-purple-800 text-sm"
                      placeholder="Kargo firması veya ek bilgiler..."
                    />
                  ) : (
                    <input
                      type="text"
                      value={formData.shippingInfo || ''}
                      disabled
                      className="w-full border border-purple-300 rounded p-2 bg-purple-50 text-purple-800 font-semibold cursor-not-allowed text-sm"
                    />
                  )}
                </div>
                <div>
                  <label className="block text-xs font-medium text-purple-700 mb-1">Kargo Numarası</label>
                  {canEditStage('Kargoya Veriliyor') ? (
                    <input
                      type="text"
                      value={formData.trackingNumber}
                      onChange={(e) => setFormData(prev => ({ ...prev, trackingNumber: e.target.value }))}
                      className="w-full border border-purple-300 rounded p-2 bg-white text-purple-800 text-sm"
                      placeholder="Takip numarası..."
                    />
                  ) : (
                    <input
                      type="text"
                      value={formData.trackingNumber || ''}
                      disabled
                      className="w-full border border-purple-300 rounded p-2 bg-purple-50 text-purple-800 font-semibold cursor-not-allowed text-sm"
                    />
                  )}
                </div>
                <div>
                  <label className="block text-xs font-medium text-purple-700 mb-1">Kargoya Verilme Tarihi</label>
                  {canEditStage('Kargoya Veriliyor') ? (
                    <DatePicker
                      selected={formData.shippingDate}
                      onChange={(date) => setFormData(prev => ({ ...prev, shippingDate: date as Date }))}
                      className="w-full border border-purple-300 rounded p-2 bg-white text-purple-800 text-sm"
                      locale={tr}
                      dateFormat="dd.MM.yyyy"
                      placeholderText="Tarih seçin..."
                      isClearable
                    />
                  ) : (
                    <input
                      type="text"
                      value={formData.shippingDate ? format(formData.shippingDate, 'dd.MM.yyyy', { locale: tr }) : ''}
                      disabled
                      className="w-full border border-purple-300 rounded p-2 bg-purple-50 text-purple-800 font-semibold cursor-not-allowed text-sm"
                    />
                  )}
                </div>
              </div>
            </div>

            {/* Stage 5: Tamamlandı */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-3 mt-4">
              <h3 className="text-base font-semibold text-green-800 mb-2 flex items-center">
                <div className="w-2 h-2 bg-green-400 rounded-full mr-2" />
                Tamamlandı (Sadece {TURKISH_ROLE_NAMES.MANAGER} Ekibi Düzenleyebilir)
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-green-700 mb-1">Final Ödeme Durumu</label>
                  {canEditStage('Tamamlandı') ? (
                    <select
                      value={formData.paymentStatus}
                      onChange={(e) => setFormData(prev => ({ ...prev, paymentStatus: e.target.value }))}
                      className="w-full border border-green-300 rounded p-2 bg-white text-green-800 text-sm"
                    >
                      <option value="">Seçiniz</option>
                      <option value="paid">Ödendi</option>
                      <option value="unpaid">Ödenmedi</option>
                      <option value="waived">Ücretsiz</option>
                    </select>
                  ) : (
                    <input
                      type="text"
                      value={
                        formData.paymentStatus === 'paid' ? 'Ödendi' :
                        formData.paymentStatus === 'unpaid' ? 'Ödenmedi' :
                        formData.paymentStatus === 'waived' ? 'Ücretsiz' : formData.paymentStatus
                      }
                      disabled
                      className="w-full border border-green-300 rounded p-2 bg-green-50 text-green-800 font-semibold cursor-not-allowed text-sm"
                    />
                  )}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-4 pt-6 border-t border-gray-200 bg-gray-50 -mx-6 px-6 py-4">
              <button type="button" onClick={onClose} className="px-6 py-3 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors duration-200 shadow-sm">
                İptal
              </button>
              <button type="submit" disabled={isLoading} className="px-6 py-3 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg hover:from-blue-700 hover:to-blue-800 disabled:from-blue-300 disabled:to-blue-400 disabled:cursor-not-allowed transition-all duration-200 shadow-sm">
                {isLoading ? 'Güncelleniyor...' : 'Güncelle'}
              </button>
            </div>
        </form>
        </div>
      </div>
    </div>
  );
}