'use client';

import { useState, useEffect, FormEvent } from 'react';
import { X, PlusCircle, Trash2 } from 'lucide-react';
import { FullReturnCase, FullReturnCaseItem, ProductModel } from '@/lib/types';
import { API_ENDPOINTS, buildApiUrl } from '@/lib/api';
import SearchableSelect from '../SearchableSelect';

interface TeknikIncelemeModalProps {
  returnCase: FullReturnCase;
  onClose: () => void;
  onSuccess: () => void;
}

type EditableProduct = {
  id: number;
  product_model: { id: number; name: string; product_type: string };
  product_count: number;
  production_date: string;
  warranty_status: string;
  fault_responsibility: string;
  resolution_method: string;
  has_control_unit: boolean;
  service_type: string;
  cable_check: boolean;
  profile_check: boolean;
  packaging: boolean;
  yapilan_islemler: string;
  isNew?: boolean;
};

export default function TeknikIncelemeModal({ returnCase, onClose, onSuccess }: TeknikIncelemeModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [productModels, setProductModels] = useState<ProductModel[]>([]);

  // Helper function to convert Turkish values to enum keys
  const convertToEnumKey = (turkishValue: string, enumMap: Record<string, string>): string => {
    for (const [key, value] of Object.entries(enumMap)) {
      if (value === turkishValue) {
        return key;
      }
    }
    return 'unknown';
  };

  const warrantyMap = {
    'in_warranty': 'Garanti Dahilinde',
    'out_of_warranty': 'Garanti Dışı',
    'unknown': 'Bilinmiyor'
  };

  const faultResponsibilityMap = {
    'user_error': 'Kullanıcı Hatası',
    'technical_issue': 'Teknik Sorun',
    'mixed': 'Karışık',
    'unknown': 'Bilinmiyor'
  };

  const resolutionMethodMap = {
    'repair': 'Tamir',
    'replacement': 'Değişim',
    'unknown': 'Bilinmiyor'
  };

  const serviceTypeMap = {
    'maintenance': 'Bakım',
    'repair': 'Onarım',
    'calibration': 'Kalibrasyon'
  };

  const [products, setProducts] = useState<EditableProduct[]>(
    (returnCase.items || []).map(item => ({
      id: item.id,
      product_model: { 
        id: item.product_model?.id || 0, 
        name: item.product_model?.name || '', 
        product_type: item.product_model?.product_type || '' 
      },
      product_count: item.product_count || 1,
      production_date: item.production_date || '',
      warranty_status: item.warranty_status ? convertToEnumKey(item.warranty_status, warrantyMap) : '',
      fault_responsibility: item.fault_responsibility ? convertToEnumKey(item.fault_responsibility, faultResponsibilityMap) : '',
      resolution_method: item.resolution_method ? convertToEnumKey(item.resolution_method, resolutionMethodMap) : '',
      has_control_unit: item.has_control_unit,
      service_type: item.service_type ? convertToEnumKey(item.service_type, serviceTypeMap) : '',
      cable_check: item.cable_check || false,
      profile_check: item.profile_check || false,
      packaging: item.packaging || false,
      yapilan_islemler: item.yapilan_islemler || '',
    }))
  );

  const [nextProductId, setNextProductId] = useState(1000);

  // Cost state management
  const [caseCosts, setCaseCosts] = useState({
    yedek_parca: returnCase.yedek_parca || 0,
    bakim: returnCase.bakim || 0,
    iscilik: returnCase.iscilik || 0
  });

  // Case level performed_services state
  const [performedServices, setPerformedServices] = useState(returnCase.performed_services || '');

  // Fetch product models for dropdown
  useEffect(() => {
    const fetchProductModels = async () => {
      try {
        const response = await fetch(buildApiUrl(API_ENDPOINTS.PRODUCTS) + '?limit=1000', {
          method: 'GET',
          credentials: 'include',
        });
        const data = await response.json();
        setProductModels(data.products || []);
      } catch (err) {
        console.error('Failed to fetch product models:', err);
      }
    };
    fetchProductModels();
  }, []);

  const handleAddProduct = () => {
    // Check if there are any incomplete products (missing required fields)
    const incompleteProducts = products.filter(p => 
      !p.product_model.name.trim() || 
      p.product_count <= 0 || 
      !p.production_date.trim() 
    
    );
    if (incompleteProducts.length > 0) {
      setError('Lütfen önce mevcut ürünlerin ürün modeli, adet ve üretim tarihi bilgilerini doldurun.');
      return;
    }

    const newProduct: EditableProduct = {
      id: nextProductId,
      product_model: { id: 0, name: '', product_type: '' },
      product_count: 1,
      production_date: '',
      warranty_status: '',
      fault_responsibility: '',
      resolution_method: '',
      has_control_unit: false,
      service_type: '',
      cable_check: false,
      profile_check: false,
      packaging: false,
      yapilan_islemler: '',
      isNew: true,
    };
    setProducts(prev => [...prev, newProduct]);
    setNextProductId(prev => prev + 1);
    setError(null); // Clear any previous errors
  };

  const handleRemoveProduct = (productId: number) => {
    setProducts(prev => prev.filter(p => p.id !== productId));
  };

  const handleProductChange = (productId: number, field: string, value: any) => {
    console.log(value);
    console.log(productId);
    console.log(field);
    setProducts(prev => prev.map(p => 
      p.id === productId ? { ...p, [field]: value } : p
    ));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    // Validate that all products have the required fields: product model, count, production date, and yapilan_islemler
    const productsWithMissingRequiredFields = products.filter(p => 
      !p.product_model.name.trim() || 
      p.product_count <= 0 || 
      !p.production_date.trim()
    );
    
    if (productsWithMissingRequiredFields.length > 0) {
      setError('Lütfen tüm ürünler için ürün modeli, adet ve üretim tarihi bilgilerini doldurun.');
      setIsLoading(false);
      return;
    }



    try {
      const requestBody = {
        yedek_parca: caseCosts.yedek_parca || 0,
        bakim: caseCosts.bakim || 0,
        iscilik: caseCosts.iscilik || 0,
        performed_services: performedServices,
        items: products.filter(p => p.product_model.name && p.product_count > 0).map(p => ({
          id: p.isNew ? undefined : p.id,
          product_model_id: p.product_model.id,
          product_count: p.product_count,
          production_date: p.production_date,
          warranty_status: p.warranty_status,
          fault_responsibility: p.fault_responsibility,
          resolution_method: p.resolution_method,
          has_control_unit: p.has_control_unit,

          service_type: p.service_type,
          cable_check: p.cable_check,
          profile_check: p.profile_check,
          packaging: p.packaging,
          yapilan_islemler: p.yapilan_islemler,
        }))
      };
      
      console.log('TeknikIncelemeModal: Sending data to backend:', requestBody);
      
        const response = await fetch(buildApiUrl(API_ENDPOINTS.RETURNS.BASE) + '/' + returnCase.id + '/teknik-inceleme', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(requestBody)
      });

      const data = await response.json();
      console.log('TeknikIncelemeModal: Backend response:', data);
      
      if (!response.ok) {
        throw new Error(data.error || 'Sunucu hatası');
      }

      setSuccess('Teknik İnceleme bilgileri başarıyla güncellendi!');
      console.log('TeknikIncelemeModal: Success, calling onSuccess callback');
      setTimeout(() => {
        console.log('TeknikIncelemeModal: Executing onSuccess and onClose');
        onSuccess();
        onClose();
      }, 2000); // Increased delay to ensure database transaction is committed

    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4">
      <div className="absolute inset-0 bg-gray-900/50" onClick={onClose} />
              <div className="relative w-full max-w-4xl max-h-[98vh] sm:max-h-[95vh] bg-white rounded-xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-3 sm:p-6 border-b border-gray-200 flex items-center justify-between bg-gradient-to-r from-blue-50 to-indigo-50">
          <div>
            <h2 className="text-lg sm:text-2xl font-bold text-blue-800">Teknik İnceleme Aşaması Düzenle</h2>
            <p className="text-xs sm:text-sm text-blue-600 mt-1">Vaka #{returnCase.id} - {returnCase.customer.name}</p>
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

            {/* Products Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-800">Ürün Bilgileri</h3>
                <button
                  type="button"
                  onClick={handleAddProduct}
                  disabled={products.some(p => !p.product_model.name.trim() || p.product_count <= 0 || !p.production_date.trim())}
                  className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-md hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed disabled:text-gray-400"
                >
                  <PlusCircle size={16} />
                  <span>Ürün Ekle</span>
                </button>
              </div>

              {products.map((product, index) => (
                <div key={product.id} className="border border-gray-200 rounded-lg p-6 space-y-6 bg-white shadow-sm">
                  <div className="flex items-center justify-between">
                    <h4 className="text-md font-medium text-gray-700">Ürün {index + 1}</h4>
                    <button
                      type="button"
                      onClick={() => handleRemoveProduct(product.id)}
                      className="text-red-500 hover:text-red-700 p-1"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>

                  <div className="space-y-6 pt-2">
                    {/* First row: Product Model, Product Count */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Product Model */}
                      <SearchableSelect
                        options={productModels.map(model => ({
                          ...model,
                          displayName: `${model.name} (${model.product_type})`
                        }))}
                        value={product.product_model.id}
                        onChange={(value) => {
                          const selectedModel = productModels.find(m => m.id === parseInt(value.toString()));
                          handleProductChange(product.id, 'product_model', {
                            id: parseInt(value.toString()),
                            name: selectedModel?.name || '',
                            product_type: selectedModel?.product_type || ''
                          });
                        }}
                        placeholder="Ürün seçiniz"
                        label="Ürün Modeli"
                        required
                        searchPlaceholder="Ürün adı ile ara..."
                        displayKey="displayName"
                        className="space-y-2"
                      />

                      {/* Product Count */}
                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">
                          Adet *
                        </label>
                        <input
                          type="number"
                          value={product.product_count}
                          onChange={(e) => handleProductChange(product.id, 'product_count', parseInt(e.target.value) || 1)}
                          min="1"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                          required
                        />
                      </div>
                    </div>


                      {/* Control Unit and Serial Number - Same Row */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
                        {/* Has Control Unit Checkbox - Only show for door detector or overload sensor */}
                        {(product.product_model.product_type === 'Kapı Dedektörü' || product.product_model.product_type === 'Aşırı Yük Sensörü') && (
                          <div className="space-y-2">
                            <div className="flex items-center space-x-2">
                              <input
                                type="checkbox"
                                id={`has-control-unit-${product.id}`}
                                checked={product.has_control_unit}
                                onChange={(e) => {
                                  handleProductChange(product.id, 'has_control_unit', e.target.checked);
                                }}
                                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                              />
                              <label htmlFor={`has-control-unit-${product.id}`} className="text-sm font-medium text-gray-700">
                                Kontrol Ünitesi Var
                              </label>
                            </div>
                            <p className="text-xs text-gray-500">
                              Bu ürünün ekli bir kontrol ünitesi varsa işaretleyin.
                            </p>
                          </div>
                        )}

                        {/* Production Date (Month Picker) */}
                        <div className="space-y-2">
                          <label className="block text-sm font-medium text-gray-700">
                            Üretim Tarihi *
                          </label>
                          <input
                            type="month"
                            value={product.production_date}
                            onChange={(e) => handleProductChange(product.id, 'production_date', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                            placeholder="YYYY-MM"
                            required
                          />
                        </div>
                      </div>

                                         {/* Third row: Two equal-height columns */}
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                       {/* Left Column: Status Fields */}
                       <div className="space-y-4">
                         {/* Warranty Status */}
                         <div className="space-y-2">
                           <label className="block text-sm font-medium text-gray-700">
                             Garanti Durumu
                           </label>
                           <select
                             value={product.warranty_status}
                             onChange={(e) => handleProductChange(product.id, 'warranty_status', e.target.value)}
                             className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                           >
                             <option value="">Seçiniz</option>
                             <option value="in_warranty">Garanti Dahilinde</option>
                             <option value="out_of_warranty">Garanti Dışı</option>
                           </select>
                         </div>

                         {/* Fault Responsibility */}
                         <div className="space-y-2">
                           <label className="block text-sm font-medium text-gray-700">
                             Hata Sorumluluğu
                           </label>
                           <select
                             value={product.fault_responsibility}
                             onChange={(e) => handleProductChange(product.id, 'fault_responsibility', e.target.value)}
                             className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                           >
                             <option value="">Seçiniz</option>
                             <option value="user_error">Kullanıcı Hatası</option>
                             <option value="technical_issue">Teknik Sorun</option>
                             <option value="mixed">Karışık</option>
                           </select>
                         </div>

                         {/* Resolution Method */}
                         <div className="space-y-2">
                           <label className="block text-sm font-medium text-gray-700">
                             Çözüm Yöntemi
                           </label>
                           <select
                             value={product.resolution_method}
                             onChange={(e) => handleProductChange(product.id, 'resolution_method', e.target.value)}
                             className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                           >
                             <option value="">Seçiniz</option> 
                             <option value="repair">Tamir</option>
                             <option value="replacement">Değişim</option>
                           </select>
                         </div>
                       </div>

                       {/* Right Column: Service and Actions */}
                       <div className="space-y-4">
                         {/* Service Type */}
                         <div className="space-y-2">
                           <label className="block text-sm font-medium text-gray-700">
                             Hizmet
                           </label>
                           <select
                             value={product.service_type}
                             onChange={(e) => handleProductChange(product.id, 'service_type', e.target.value)}
                             className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                           >
                             <option value="">Seçiniz</option>
                             <option value="maintenance">Bakım</option>
                             <option value="repair">Onarım</option>
                             <option value="calibration">Kalibrasyon</option>
                           </select>
                         </div>

                         {/* Yapılan İşlemler */}
                         <div className="space-y-2">
                           <label className="block text-sm font-medium text-gray-700">
                             Yapılan İşlemler
                           </label>
                           <textarea
                             value={product.yapilan_islemler}
                             onChange={(e) => handleProductChange(product.id, 'yapilan_islemler', e.target.value)}
                             className="w-full px-3 py-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                             placeholder="Yapılan işlemleri detaylı olarak açıklayın..."
                             rows={4}
                           />
                         </div>
                       </div>
                     </div>

                    
                    {/* Fifth row: Kontroller - Compact Horizontal Layout */}
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">
                        Kontroller
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                        <div className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id={`cable-check-${product.id}`}
                            checked={product.cable_check}
                            onChange={(e) => handleProductChange(product.id, 'cable_check', e.target.checked)}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                          <label htmlFor={`cable-check-${product.id}`} className="text-sm text-gray-700 font-medium">
                            Kablo Kontrol
                          </label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id={`profile-check-${product.id}`}
                            checked={product.profile_check}
                            onChange={(e) => handleProductChange(product.id, 'profile_check', e.target.checked)}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                          <label htmlFor={`profile-check-${product.id}`} className="text-sm text-gray-700 font-medium">
                            Profil Kontrol
                          </label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id={`packaging-${product.id}`}
                            checked={product.packaging}
                            onChange={(e) => handleProductChange(product.id, 'packaging', e.target.checked)}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                          <label htmlFor={`packaging-${product.id}`} className="text-sm text-gray-700 font-medium">
                            Paketleme
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Teknik Servis Notu - Case Level */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Teknik Servis Notu
              </label>
              <textarea
                value={performedServices}
                onChange={(e) => setPerformedServices(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Teknik servis notu..."
                rows={3}
              />
            </div>

            {/* Cost Fields */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Yedek Parça (₺)
                </label>
                <input
                  type="number"
                  step="1"
                  min="0"
                  value={caseCosts.yedek_parca || ''}
                  onChange={(e) => {
                    const yedek_parca = e.target.value ? parseFloat(e.target.value) : 0;
                    setCaseCosts(prev => ({
                      ...prev,
                      yedek_parca
                    }));
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="0"
                />
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Bakım (₺)
                </label>
                <input
                  type="number"
                  step="1"
                  min="0"
                  value={caseCosts.bakim || ''}
                  onChange={(e) => {
                    const bakim = e.target.value ? parseFloat(e.target.value) : 0;
                    setCaseCosts(prev => ({
                      ...prev,
                      bakim
                    }));
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="0"
                />
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  İşçilik (₺)
                </label>
                <input
                  type="number"
                  step="1"
                  min="0"
                  value={caseCosts.iscilik || ''}
                  onChange={(e) => {
                    const iscilik = e.target.value ? parseFloat(e.target.value) : 0;
                    setCaseCosts(prev => ({
                      ...prev,
                      iscilik
                    }));
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="0"
                />
              </div>
            </div>

            {/* Total Cost Display */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Toplam Tutar (₺)
              </label>
              <div className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-md text-gray-700 font-medium">
                {(caseCosts.yedek_parca || 0) + (caseCosts.bakim || 0) + (caseCosts.iscilik || 0)} ₺
              </div>
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
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
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


