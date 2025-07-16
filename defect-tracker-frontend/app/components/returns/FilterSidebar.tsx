'use client';

import { User } from '@/lib/types';
import { Search } from 'lucide-react';

// Define the shape of the filters state object
export interface Filters {
  search: string;
  status: string;
  startDate: string;
  endDate: string;
  userId: string;
  receiptMethod: string;
  productType: string;
}

interface FilterSidebarProps {
  filters: Filters;
  setFilters: React.Dispatch<React.SetStateAction<Filters>>;
  users: User[]; // For the 'Assigned To' dropdown
}

const initialFilters: Filters = {
    search: '',
    status: 'not_closed',
    startDate: '',
    endDate: '',
    userId: '',
    receiptMethod: '',
    productType: '',
}

export default function FilterSidebar({ filters, setFilters, users }: FilterSidebarProps) {
  
  const handleFilterChange = (field: keyof Filters, value: string) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  // Helper function to check if a filter is active (has a value)
  const isFilterActive = (value: string) => {
    return value && value !== 'not_closed';
  };

  return (
    <aside className="w-full md:w-72 lg:w-80 flex-shrink-0 bg-white p-6 rounded-lg shadow-sm">
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

        {/* Product Type and Receipt Method Filters */}
        <div>
          <div className="flex gap-2 mb-1">
            <div className="flex-1">
              <label className={`block text-sm font-medium ${isFilterActive(filters.productType) ? 'text-blue-700' : 'text-gray-700'}`}>
                Ürün Tipi {isFilterActive(filters.productType) && <span className="text-blue-500">●</span>}
              </label>
            </div>
            <div className="flex-1">
              <label className={`block text-sm font-medium ${isFilterActive(filters.receiptMethod) ? 'text-blue-700' : 'text-gray-700'}`}>
                Teslim Yöntemi {isFilterActive(filters.receiptMethod) && <span className="text-blue-500">●</span>}
              </label>
            </div>
          </div>
          <div className="flex gap-2">
            <div className={`flex-1 ${isFilterActive(filters.productType) ? 'ring-2 ring-blue-500 ring-opacity-50 bg-blue-50 rounded-md' : ''}`}>
              <select
                value={filters.productType || ''}
                onChange={(e) => handleFilterChange('productType', e.target.value)}
                className="w-full border border-gray-300 rounded-md py-1.5 px-3 bg-transparent text-sm"
              >
                <option value="">Tüm Ürün Tipleri</option>
                <option value="overload">Aşırı Yük Sensörü</option>
                <option value="door_detector">Kapı Dedektörü</option>
                <option value="control_unit">Kontrol Ünitesi</option>
              </select>
            </div>
            <div className={`flex-1 ${isFilterActive(filters.receiptMethod) ? 'ring-2 ring-blue-500 ring-opacity-50 bg-blue-50 rounded-md' : ''}`}>
              <select
                value={filters.receiptMethod}
                onChange={(e) => handleFilterChange('receiptMethod', e.target.value)}
                className="w-full border border-gray-300 rounded-md py-1.5 px-3 bg-transparent text-sm"
              >
                <option value="">Tüm Yöntemler</option>
                <option value="shipment">Kargo</option>
                <option value="in_person">Elden Teslim</option>
              </select>
            </div>
          </div>
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
              <option value="not_closed">Kapanmamış Vakalar</option>
              <option value="">Tümü</option>
              <option value="open">Açık</option>
              <option value="in_progress">Devam Ediyor</option>
              <option value="awaiting_parts">Parça Bekleniyor</option>
              <option value="repaired">Tamir Edildi</option>
              <option value="shipped">Gönderildi</option>
              <option value="closed">Kapalı</option>
            </select>
          </div>
        </div>

        {/* Date Range Filter - At the bottom */}
        <div>
            <label className={`block text-sm font-medium mb-1 ${(isFilterActive(filters.startDate) || isFilterActive(filters.endDate)) ? 'text-blue-700' : 'text-gray-700'}`}>
              Tarih Aralığı {(isFilterActive(filters.startDate) || isFilterActive(filters.endDate)) && <span className="text-blue-500">●</span>}
            </label>
            <div className={`flex gap-2 ${(isFilterActive(filters.startDate) || isFilterActive(filters.endDate)) ? 'ring-2 ring-blue-500 ring-opacity-50 bg-blue-50 rounded-md p-1' : ''}`}>
                <div className="flex-1">
                    <input 
                        type="date" 
                        value={filters.startDate} 
                        onChange={(e) => handleFilterChange('startDate', e.target.value)} 
                        className="w-full border border-gray-300 rounded-md p-1.5 text-sm bg-transparent"
                        placeholder="Başlangıç"
                    />
                </div>
                <div className="flex-1">
                    <input 
                        type="date" 
                        value={filters.endDate} 
                        onChange={(e) => handleFilterChange('endDate', e.target.value)} 
                        className="w-full border border-gray-300 rounded-md p-1.5 text-sm bg-transparent"
                        placeholder="Bitiş"
                    />
                </div>
            </div>
        </div>

        {/* Assigned User Filter */}
        <div>
          <label className={`block text-sm font-medium mb-1 ${isFilterActive(filters.userId) ? 'text-blue-700' : 'text-gray-700'}`}>
            Atanan Kullanıcı {isFilterActive(filters.userId) && <span className="text-blue-500">●</span>}
          </label>
          <div className={isFilterActive(filters.userId) ? 'ring-2 ring-blue-500 ring-opacity-50 bg-blue-50 rounded-md' : ''}>
            <select
              value={filters.userId}
              onChange={(e) => handleFilterChange('userId', e.target.value)}
              className="w-full border border-gray-300 rounded-md py-1.5 px-3 bg-transparent"
            >
              <option value="">Tüm Kullanıcılar</option>
              {users.map(user => (
                <option key={user.email} value={user.email}>{user.firstName} {user.lastName}</option>
              ))}
            </select>
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