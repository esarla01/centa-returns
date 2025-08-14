'use client';

import { User } from '@/lib/types';
import { Search } from 'lucide-react';
import { useState, useEffect } from 'react';

// Define the shape of the filters state object
export interface Filters {
  search: string;
  status: string;
  startDate: string;
  endDate: string;
  receiptMethod: string;
  productType: string;
  productModel: string;
}

interface FilterSidebarProps {
  filters: Filters;
  setFilters: React.Dispatch<React.SetStateAction<Filters>>;
}

interface ProductModel {
  id: number;
  name: string;
  product_type: string;
}

const initialFilters: Filters = {
    search: '',
    status: '',
    startDate: '',
    endDate: '',
    receiptMethod: '',
    productType: '',
    productModel: '',
}

export default function FilterSidebar({ filters, setFilters }: FilterSidebarProps) {
  const [productModels, setProductModels] = useState<ProductModel[]>([]);
  
  // Fetch product models for the filter
  useEffect(() => {
    const fetchProductModels = async () => {
      try {
        const response = await fetch('http://localhost:5000/products?limit=1000', {
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
  
  const handleFilterChange = (field: keyof Filters, value: string) => {
    console.log(`Filter changed: ${field} = ${value}`);
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  // Helper function to check if a filter is active (has a value)
  const isFilterActive = (value: string) => {
    return value && value !== '';
  };

  // Filter product models based on selected product type
  const filteredProductModels = filters.productType 
    ? productModels.filter(model => {
        const productTypeMap = {
          'overload': 'Aşırı Yük Sensörü',
          'door_detector': 'Kapı Dedektörü',
          'control_unit': 'Kontrol Ünitesi'
        };
        return model.product_type === productTypeMap[filters.productType as keyof typeof productTypeMap];
      })
    : productModels;

  return (
      <aside className="w-full h-full p-6">
      <h3 className="text-xl font-bold text-gray-800 mb-6">Filtreler</h3>
      <div className="space-y-6">
        {/* Customer Search Input */}
        <div className={`relative ${isFilterActive(filters.search) ? 'ring-2 ring-blue-500 ring-opacity-50 bg-blue-50 rounded-md' : ''}`}>
            <Search className={`absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 ${isFilterActive(filters.search) ? 'text-blue-500' : 'text-gray-400'}`} />
            <input
              type="text"
              placeholder="Müşteri adı ile ara..."
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              className="pl-10 w-full border border-gray-300 rounded-md py-1 px-3 focus:outline-none focus:ring-2 bg-transparent"
            />
        </div>

        {/* Status Filter */}
        <div>
          <label className={`block text-sm font-medium mb-1 ${isFilterActive(filters.status) ? 'text-blue-700' : 'text-gray-700'}`}>
            Durum {isFilterActive(filters.status) && <span className="text-blue-500">●</span>}
          </label>
          <div className={isFilterActive(filters.status) ? 'ring-2 ring-blue-500 ring-opacity-50 bg-blue-50 rounded-md' : ''}>
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="w-full border border-gray-300 rounded-md py-1.5 px-3 bg-transparent"
            >
              <option value="">Tümü</option>
              <option value="not_completed">Tamamlanmamış Vakalar</option>
              <option value="Teslim Alındı">Teslim Alındı</option>
              <option value="Teknik İnceleme">Teknik İnceleme</option>
              <option value="Ödeme Tahsilatı">Ödeme Tahsilatı</option>
              <option value="Kargoya Veriliyor">Kargoya Veriliyor</option>
              <option value="Tamamlandı">Tamamlandı</option>
            </select>
          </div>
        </div>

        {/* Product Type Filter */}
        <div>
          <label className={`block text-sm font-medium mb-1 ${isFilterActive(filters.productType) ? 'text-blue-700' : 'text-gray-700'}`}>
            Ürün Tipi {isFilterActive(filters.productType) && <span className="text-blue-500">●</span>}
          </label>
          <div className={isFilterActive(filters.productType) ? 'ring-2 ring-blue-500 ring-opacity-50 bg-blue-50 rounded-md' : ''}>
            <select
              value={filters.productType || ''}
              onChange={(e) => {
                handleFilterChange('productType', e.target.value);
                // Clear product model when product type changes
                handleFilterChange('productModel', '');
              }}
              className="w-full border border-gray-300 rounded-md py-1.5 px-3 bg-transparent"
            >
              <option value="">Tüm Ürün Tipleri</option>
              <option value="overload">Aşırı Yük Sensörü</option>
              <option value="door_detector">Kapı Dedektörü</option>
              <option value="control_unit">Kontrol Ünitesi</option>
            </select>
          </div>
        </div>

        {/* Receipt Method Filter */}
        <div>
          <label className={`block text-sm font-medium mb-1 ${isFilterActive(filters.receiptMethod) ? 'text-blue-700' : 'text-gray-700'}`}>
            Teslim Yöntemi {isFilterActive(filters.receiptMethod) && <span className="text-blue-500">●</span>}
          </label>
          <div className={isFilterActive(filters.receiptMethod) ? 'ring-2 ring-blue-500 ring-opacity-50 bg-blue-50 rounded-md' : ''}>
            <select
              value={filters.receiptMethod}
              onChange={(e) => handleFilterChange('receiptMethod', e.target.value)}
              className="w-full border border-gray-300 rounded-md py-1.5 px-3 bg-transparent"
            >
              <option value="">Tüm Yöntemler</option>
              <option value="shipment">Kargo</option>
              <option value="in_person">Elden Teslim</option>
            </select>
          </div>
        </div>

        {/* Product Model Filter */}
        <div>
          <label className={`block text-sm font-medium mb-1 ${isFilterActive(filters.productModel) ? 'text-blue-700' : 'text-gray-700'}`}>
            Ürün Modeli {isFilterActive(filters.productModel) && <span className="text-blue-500">●</span>}
            {filters.productType && !isFilterActive(filters.productModel) && (
              <span className="text-xs text-gray-500 ml-1">({filteredProductModels.length} model)</span>
            )}
          </label>
          <div className={isFilterActive(filters.productModel) ? 'ring-2 ring-blue-500 ring-opacity-50 bg-blue-50 rounded-md' : ''}>
            <select
              value={filters.productModel}
              onChange={(e) => handleFilterChange('productModel', e.target.value)}
              className="w-full border border-gray-300 rounded-md py-1.5 px-3 bg-transparent"
            >
              <option value="">Tüm Modeller</option>
              {(filters.productType ? filteredProductModels : productModels).map((model) => (
                <option key={model.id} value={model.id}>
                  {model.name}
                </option>
              ))}
            </select>
          </div>        
        </div>

        {/* Date Range Filter */}
        <div>
            <label className={`block text-sm font-medium mb-1 ${(isFilterActive(filters.startDate) || isFilterActive(filters.endDate)) ? 'text-blue-700' : 'text-gray-700'}`}>
              Tarih Aralığı {(isFilterActive(filters.startDate) || isFilterActive(filters.endDate)) && <span className="text-blue-500">●</span>}
            </label>
            <div className={`flex gap-2 ${(isFilterActive(filters.startDate) || isFilterActive(filters.endDate)) ? 'ring-2 ring-blue-500 ring-opacity-50 bg-blue-50 rounded-md' : ''}`}>
                <div className="w-1/2">
                    <input 
                        type="date" 
                        value={filters.startDate} 
                        onChange={(e) => handleFilterChange('startDate', e.target.value)} 
                        className="w-full border border-gray-300 rounded-md px-3 py-1.5 text-sm bg-transparent"
                        placeholder="Başlangıç"
                    />
                </div>
                <div className="w-1/2">
                    <input 
                        type="date" 
                        value={filters.endDate} 
                        onChange={(e) => handleFilterChange('endDate', e.target.value)} 
                        className="w-full border border-gray-300 rounded-md px-3 py-1.5 text-sm bg-transparent"
                        placeholder="Bitiş"
                    />
                </div>
            </div>
        </div>

        {/* Clear Filters Button */}
        <button 
            onClick={() => setFilters(initialFilters)}
            className="w-full py-2 px-4 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 border border-gray-300"
        >
            Filtreleri Temizle
        </button>
      </div>
    </aside>
  );
}