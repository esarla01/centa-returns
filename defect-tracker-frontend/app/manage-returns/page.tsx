'use client';

import { useEffect, useState, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Plus, ChevronDown, ChevronUp, Filter } from 'lucide-react';
import { FullReturnCase } from '@/lib/types';
import { truncateTextWithEllipsis } from '@/lib/utils';
import Header from '@/app/components/Header';
import Pagination from '@/app/components/Pagination';
import FilterSidebar, { Filters } from '../components/returns/FilterSidebar';
import CasesTable from '../components/returns/CasesTable';
import AddReturnCaseModal from '../components/returns/AddReturnCaseModal';
import DeleteReturnCaseModal from '../components/returns/DeleteReturnCaseModal';
import { RequirePermission } from '../components/RequirePermission';
import { PermissionGate } from '../components/PermissionGate';
import { useAuth } from '../contexts/AuthContext';
import { API_ENDPOINTS, buildApiUrl } from '@/lib/api';
import { CasesCards } from '../components/returns/CasesCards';

const initialFilters: Filters = {
  search: '',
  status: '',
  startDate: '',
  endDate: '',
  receiptMethod: '',
  productType: '',
  productModel: '',
};



function ReturnsDashboardContent() {
  // Loading state for the ]=
  const { loading, user } = useAuth();

  // Pagination
  const searchParams = useSearchParams();
  const pageParam = searchParams.get('page');
  const currentPage = Number(pageParam) || 1;
  const limitParam = searchParams.get('limit');
  // Limit coming from middleware, fallback to 5 if missing
  const limit = limitParam ? Number(limitParam) : 5;

  // Data
  const [cases, setCases] = useState<FullReturnCase[]>([]);

  // Control
  const [filters, setFilters] = useState<Filters>(initialFilters);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);

  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [caseToEdit, setCaseToEdit] = useState<FullReturnCase | null>(null);
  const [caseToDelete, setCaseToDelete] = useState<FullReturnCase | null>(null);

  // Mobile filter state
  const [isFilterOpen, setIsFilterOpen] = useState(false);



  // Fetch return cases
  const fetchData = useCallback(async () => {
    setIsLoading(true);

    const params = new URLSearchParams({
      page: String(currentPage),
      limit: limit.toString(),
    });

    (Object.keys(filters) as Array<keyof Filters>).forEach((key) => {
      const val = filters[key];
      if (val) {
        params.append(key, val);
      }
    });

    try {
      const res = await fetch(buildApiUrl(API_ENDPOINTS.RETURNS.BASE) + '?' + params.toString(), {
        method: 'GET',
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed to fetch return cases');
      const data = await res.json();
      setCases(data.cases);
      setTotalPages(data.totalPages || 1);
      setIsLoading(false);
    } catch (err) {
      console.error('Error fetching return cases:', err);
      setCases([]);
    }
  }, [currentPage, filters]);

  useEffect(() => {
    if (!loading) {
      fetchData();
    }
  }, [filters, currentPage, loading, fetchData]);

  const handleSuccess = () => {
    setIsAddModalOpen(false);
    setCaseToEdit(null);
    setCaseToDelete(null);
    fetchData();
  };

  // Clear all filters
  const clearFilters = () => {
    setFilters(initialFilters);
    setIsFilterOpen(false);
  };

  // Check if any filters are active
  const hasActiveFilters = Object.values(filters).some(value => value);



  return (
    <RequirePermission permission="PAGE_VIEW_CASE_TRACKING" >
    <div className="bg-gradient-to-b from-blue-50 to-white pb-20 md:pb-0">
      <Header onLogout={() => {}} />

      {isAddModalOpen && (
        <AddReturnCaseModal
          onClose={() => setIsAddModalOpen(false)}
          onSuccess={handleSuccess}
        />
      )}

      {caseToDelete && (
        <DeleteReturnCaseModal
          returnCase={caseToDelete}
          onClose={() => setCaseToDelete(null)}
          onSuccess={handleSuccess}
        />
      )}

      <div className="w-full max-w-9xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Simplified Header Section */}
        <div className="flex items-center justify-between mt-6 mb-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
              İade Vakaları Yönetimi
            </h1>
            <p className="text-sm text-gray-500 mt-1 hidden md:block">
              İade vakalarını görüntüleme, arama ve yönetim
            </p>
          </div>
          
          {/* Add Case Button - Show on both mobile and desktop */}
          <PermissionGate permission="CASE_CREATE">
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="flex items-center gap-2 rounded-md border bg-blue-500 text-white hover:bg-blue-600 px-3 py-2 text-sm md:px-4 md:text-base"
            >
              <Plus className="h-4 w-4 md:h-5 md:w-5" />
              <span className="hidden sm:inline">Yeni Vaka Oluştur</span>
              <span className="sm:hidden">Ekle</span>
            </button>
          </PermissionGate>
        </div>

        {/* Mobile Filter Toggle */}
        <div className="md:hidden mb-4">
          <button
            onClick={() => setIsFilterOpen(!isFilterOpen)}
            className="w-full flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200 shadow-sm"
          >
            <div className="flex items-center gap-2">
              <Filter className="h-5 w-5 text-gray-500" />
              <span className="font-medium text-gray-700">Filtreler</span>
              {hasActiveFilters && (
                <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                  Aktif
                </span>
              )}
            </div>
            {isFilterOpen ? (
              <ChevronUp className="h-5 w-5 text-gray-500" />
            ) : (
              <ChevronDown className="h-5 w-5 text-gray-500" />
            )}
          </button>
        </div>

        {/* Mobile Collapsible Filters */}
        {isFilterOpen && (
          <div className="md:hidden mb-4 bg-white rounded-lg border border-gray-200 shadow-sm">
            <FilterSidebar filters={filters} setFilters={setFilters} />
            {hasActiveFilters && (
              <div className="p-4 border-t border-gray-200">
                <button
                  onClick={clearFilters}
                  className="w-full px-3 py-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-md transition-colors text-sm font-medium"
                >
                  Filtreleri Temizle
                </button>
              </div>
            )}
          </div>
        )}

        {/* Desktop Layout */}
        <div className="hidden md:flex flex-col lg:flex-row gap-6">
          {/* Left Sidebar Filters */}
          <div className="lg:w-80 flex-shrink-0">
            <div className="bg-white rounded-lg shadow-sm h-full">
              <FilterSidebar filters={filters} setFilters={setFilters} />
            </div>
          </div>

          {/* Main content */}
          <main className="flex-1 min-w-0">
            <div className="bg-white rounded-lg shadow-sm h-full flex flex-col">
              {/* Header Section */}
              <div className="p-6 border-b border-gray-200">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                  <div className="flex-1">
                    <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                      <h2 className="text-xl lg:text-2xl font-bold text-gray-800">
                        {hasActiveFilters ? 'Arama Sonuçları' : 'Gelen Ürün Vakaları'}
                      </h2>
                      {!hasActiveFilters && (
                        <div className="flex flex-wrap items-center gap-2 lg:gap-4 text-xs lg:text-sm">
                          <span className="text-gray-600 font-medium">İş Akışı:</span>
                          <div className="flex items-center gap-1 lg:gap-2">
                            <div className="w-2 h-2 lg:w-3 lg:h-3 bg-orange-100 border border-orange-300 rounded-full"></div>
                            <span className="text-orange-700">Teslim Alındı</span>
                            <span className="text-gray-400 hidden sm:inline">→</span>
                          </div>
                          <div className="flex items-center gap-1 lg:gap-2">
                            <div className="w-2 h-2 lg:w-3 lg:h-3 bg-blue-50 border border-blue-200 rounded-full"></div>
                            <span className="text-blue-800">Teknik İnceleme</span>
                            <span className="text-gray-400 hidden sm:inline">→</span>
                          </div>
                          <div className="flex items-center gap-1 lg:gap-2">
                            <div className="w-2 h-2 lg:w-3 lg:h-3 bg-yellow-50 border border-yellow-200 rounded-full"></div>
                            <span className="text-yellow-800">Ödeme Tahsilatı</span>
                            <span className="text-gray-400 hidden sm:inline">→</span>
                          </div>
                          <div className="flex items-center gap-1 lg:gap-2">
                            <div className="w-2 h-2 lg:w-3 lg:h-3 bg-purple-50 border border-purple-200 rounded-full"></div>
                            <span className="text-purple-800">Kargoya Veriliyor</span>
                            <span className="text-gray-400 hidden sm:inline">→</span>
                          </div>
                          <div className="flex items-center gap-1 lg:gap-2">
                            <div className="w-2 h-2 lg:w-3 lg:h-3 bg-green-50 border border-green-200 rounded-full"></div>
                            <span className="text-green-800">Tamamlandı</span>
                          </div>
                        </div>
                      )}
                      <div className="text-red-600 mt-2">
                        {hasActiveFilters ? 'Tüm vakalar için filtreleri temizleyin.' : ''}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Table Section */}
              <div className="flex-1 overflow-hidden">
                <CasesTable
                  cases={cases}
                  isLoading={isLoading}
                  onEdit={setCaseToEdit}
                  onDelete={setCaseToDelete}
                  onRefresh={fetchData}
                />
              </div>

              {/* Pagination */}
              <div className="border-t border-gray-200">
                <Pagination currentPage={currentPage} totalPages={totalPages} />
              </div>
            </div>
          </main>
        </div>

        {/* Mobile Card Layout */}
        <CasesCards
          cases={cases}
          isLoading={isLoading}
          hasActiveFilters={hasActiveFilters}
          user={user}
          onDelete={setCaseToDelete}
          onRefresh={fetchData}
        />

        {/* Mobile Pagination */}
        <div className="md:hidden mt-6">
          <Pagination currentPage={currentPage} totalPages={totalPages} />
        </div>
      </div>
    </div>
    </RequirePermission>
  );
}

export default function ReturnsDashboardPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Yükleniyor...</p>
        </div>
      </div>
    }>
      <ReturnsDashboardContent />
    </Suspense>
  );
}