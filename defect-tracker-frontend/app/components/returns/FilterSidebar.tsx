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
}

export default function FilterSidebar({ filters, setFilters, users }: FilterSidebarProps) {
  
  const handleFilterChange = (field: keyof Filters, value: string) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  return (
    <aside className="w-full md:w-72 lg:w-80 flex-shrink-0 bg-white p-6 rounded-lg shadow-sm">
      <h3 className="text-xl font-bold text-gray-800 mb-6">Filtreler</h3>
      <div className="space-y-6">
        {/* Search Input */}
        <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Müşteri, ürün veya ID ile ara..."
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              className="pl-10 w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-2"
            />
        </div>

        {/* Status Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Durum</label>
          <select
            value={filters.status}
            onChange={(e) => handleFilterChange('status', e.target.value)}
            className="w-full border border-gray-300 rounded-md py-2 px-3 bg-white"
          >
            <option value="not_closed">Kapanmamış Vakalar</option>
            <option value="">Tümü</option>
            <option value="open">Açık</option>
            <option value="in_progress">İşlemde</option>
            <option value="awaiting_parts">Parça Bekliyor</option>
            <option value="repaired">Tamir Edildi</option>
            <option value="shipped">Gönderildi</option>
            <option value="closed">Kapalı</option>
          </select>
        </div>

        {/* Date Range Filter */}
        <div className="space-y-2">
            <div>
                <label className="block text-sm font-medium text-gray-700">Başlangıç Tarihi</label>
                <input type="date" value={filters.startDate} onChange={(e) => handleFilterChange('startDate', e.target.value)} className="mt-1 w-full border border-gray-300 rounded-md p-2"/>
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700">Bitiş Tarihi</label>
                <input type="date" value={filters.endDate} onChange={(e) => handleFilterChange('endDate', e.target.value)} className="mt-1 w-full border border-gray-300 rounded-md p-2"/>
            </div>
        </div>
        
        {/* Assigned User Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Atanan Kullanıcı</label>
          <select
            value={filters.userId}
            onChange={(e) => handleFilterChange('userId', e.target.value)}
            className="w-full border border-gray-300 rounded-md py-2 px-3 bg-white"
          >
            <option value="">Tüm Kullanıcılar</option>
            {users.map(user => (
              <option key={user.email} value={user.email}>{user.firstName} {user.lastName}</option>
            ))}
          </select>
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