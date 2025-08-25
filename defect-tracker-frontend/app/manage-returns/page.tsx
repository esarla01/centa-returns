'use client';

import { useEffect, useState, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Plus, ChevronDown, ChevronUp, Filter, Package, Calendar, User, Building2 } from 'lucide-react';
import { FullReturnCase } from '@/lib/types';
import { cn, truncateTextWithEllipsis } from '@/lib/utils';
import Header from '@/app/components/Header';
import Pagination from '@/app/components/Pagination';
import FilterSidebar, { Filters } from '../components/returns/FilterSidebar';
import CasesTable from '../components/returns/CasesTable';
import AddReturnCaseModal from '../components/returns/AddReturnCaseModal';
import EditReturnCaseModal from '../components/returns/EditReturnCaseModal';
import DeleteReturnCaseModal from '../components/returns/DeleteReturnCaseModal';
import { RequirePermission } from '../components/RequirePermission';
import { PermissionGate } from '../components/PermissionGate';
import { useAuth } from '../contexts/AuthContext';
import { API_ENDPOINTS, buildApiUrl } from '@/lib/api';
import TeslimAlindiModal from '../components/returns/TeslimAlindiModal';
import TeknikIncelemeModal from '../components/returns/TeknikIncelemeModal';
import OdemeTahsilatiModal from '../components/returns/OdemeTahsilatiModal';
import KargoyaVerildiModal from '../components/returns/KargoyaVerildiModal';
import TamamlandiModal from '../components/returns/TamamlandiModal';

const initialFilters: Filters = {
  search: '',
  status: '',
  startDate: '',
  endDate: '',
  receiptMethod: '',
  productType: '',
  productModel: '',
};

const getStatusClass = (status: string) => {
  switch (status) {
    case 'Teslim Alındı': return 'bg-orange-100 text-orange-800';
    case 'Teknik İnceleme': return 'bg-blue-100 text-blue-800';
    case 'Ödeme Tahsilatı': return 'bg-yellow-100 text-yellow-800';
    case 'Kargoya Veriliyor': return 'bg-purple-100 text-purple-800';
    case 'Tamamlandı': return 'bg-green-100 text-green-800';
    default: return 'bg-gray-100 text-gray-800';
  }
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
  const [teslimAlindiModal, setTeslimAlindiModal] = useState<{ isOpen: boolean; case: FullReturnCase | null }>({ isOpen: false, case: null });
  const [teknikIncelemeModal, setTeknikIncelemeModal] = useState<{ isOpen: boolean; case: FullReturnCase | null }>({ isOpen: false, case: null });
  const [odemeTahsilatiModal, setOdemeTahsilatiModal] = useState<{ isOpen: boolean; case: FullReturnCase | null }>({ isOpen: false, case: null });
  const [kargoyaVerildiModal, setKargoyaVerildiModal] = useState<{ isOpen: boolean; case: FullReturnCase | null }>({ isOpen: false, case: null });
  const [tamamlandiModal, setTamamlandiModal] = useState<{ isOpen: boolean; case: FullReturnCase | null }>({ isOpen: false, case: null });

  // Mobile filter state
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // Helper function: a stage is editable only if the user has permission to edit the return case at that stage.
  const canEditStage = (currentStatus: string, stage: string): boolean => {

    const editableStages = ['teslim_alindi', 'teknik_inceleme', 'odeme_tahsilati', 'kargoya_verildi'];
    if (!editableStages.includes(stage)) return false;

    // Map stage to status and required role
    const stageRoleMap: { [key: string]: { status: string, role: string } } = {
      'teslim_alindi': { status: 'Teslim Alındı', role: 'SUPPORT' },
      'teknik_inceleme': { status: 'Teknik İnceleme', role: 'TECHNICIAN' },
      'odeme_tahsilati': { status: 'Ödeme Tahsilatı', role: 'SALES' },
      'kargoya_verildi': { status: 'Kargoya Veriliyor', role: 'LOGISTICS' }
    };

    const mapping = stageRoleMap[stage];
    if (!mapping) return false;

    // User must have the required role and the case must be at the exact stage
    if (!user?.role) return false;
    if (user.role !== mapping.role) return false;
    if (currentStatus !== mapping.status) return false;

    return true;
  };

  // Check if user can edit the current stage of a case
  const canEditCase = (returnCase: FullReturnCase): boolean => {
    const stageMapping = {
      'Teslim Alındı': 'teslim_alindi',
      'Teknik İnceleme': 'teknik_inceleme',
      'Ödeme Tahsilatı': 'odeme_tahsilati',
      'Kargoya Veriliyor': 'kargoya_verildi',
      'Tamamlandı': 'tamamlandi'
    };

    const currentStage = stageMapping[returnCase.status as keyof typeof stageMapping];
    if (!currentStage) return false;

    // Check if user can edit this specific current stage
    return canEditStage(returnCase.status, currentStage);
  };

  // Update the canDeleteCase function to be more explicit
  const canDeleteCase = (returnCase: FullReturnCase): boolean => {
    // Only SUPPORT users can delete cases
    if (user?.role !== 'SUPPORT') return false;
    
    // Only cases at "Teslim Alındı" stage can be deleted
    if (returnCase.status !== 'Teslim Alındı') return false;
    
    return true;
  };

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

  const openStageSpecificModal = (returnCase: FullReturnCase) => {
    const stageMapping = {
      'Teslim Alındı': 'teslim_alindi',
      'Teknik İnceleme': 'teknik_inceleme',
      'Ödeme Tahsilatı': 'odeme_tahsilati',
      'Kargoya Veriliyor': 'kargoya_verildi',
      'Tamamlandı': 'tamamlandi'
    };

    const currentStage = stageMapping[returnCase.status as keyof typeof stageMapping];
    if (!currentStage) return;

    // Check if user can edit this specific stage
    if (!canEditStage(returnCase.status, currentStage)) return;

    // Open the appropriate modal based on the current stage
    switch (currentStage) {
      case 'teslim_alindi':
        setTeslimAlindiModal({ isOpen: true, case: returnCase });
        break;
      case 'teknik_inceleme':
        setTeknikIncelemeModal({ isOpen: true, case: returnCase });
        break;
      case 'odeme_tahsilati':
        setOdemeTahsilatiModal({ isOpen: true, case: returnCase });
        break;
      case 'kargoya_verildi':
        setKargoyaVerildiModal({ isOpen: true, case: returnCase });
        break;
      case 'tamamlandi':
        setTamamlandiModal({ isOpen: true, case: returnCase });
        break;
      default:
        // Fallback to the general edit modal
        setCaseToEdit(returnCase);
    }
  };

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
          
          {/* Floating Action Button for Mobile */}
          <PermissionGate permission="CASE_CREATE">
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="md:hidden fixed bottom-6 right-6 z-50 flex items-center justify-center w-14 h-14 bg-blue-500 text-white rounded-full shadow-lg hover:bg-blue-600 transition-colors"
            >
              <Plus className="h-6 w-6" />
            </button>

            {/* Desktop Add Case Button */}
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="hidden md:flex items-center gap-2 rounded-md border bg-blue-500 text-white hover:bg-blue-600 px-4 py-2"
            >
              <Plus className="h-5 w-5" />
              <span>Yeni Vaka Oluştur</span>
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
        <div className="md:hidden space-y-3 pb-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mr-3"></div>
              <span className="text-gray-500">Yükleniyor...</span>
            </div>
          ) : cases.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-400 mb-2">
                <Package className="h-12 w-12 mx-auto" />
              </div>
              <p className="text-gray-500">
                {hasActiveFilters ? 'Arama kriterlerinize uygun vaka bulunamadı.' : 'Henüz vaka bulunmuyor.'}
              </p>
            </div>
          ) : (
            cases.map((returnCase, idx) => (
              <div key={returnCase.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    {/* Case Header */}
                    <div className="flex items-center gap-2 mb-2">
                      <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                        <span className="text-sm font-medium text-blue-600">
                          #{returnCase.id}
                        </span>
                      </div>
                      <span className={cn('px-2 py-1 text-xs font-medium rounded-full', getStatusClass(returnCase.status))}>
                        {returnCase.status}
                      </span>
                    </div>
                    
                    {/* Customer Info */}
                    <div className="flex items-center gap-2 mb-2">
                      <User className="h-4 w-4 text-gray-400 flex-shrink-0" />
                      <p className="text-sm text-gray-600 truncate">
                        {returnCase.customer.name}
                      </p>
                    </div>
                    
                    {/* Arrival Date */}
                    <div className="flex items-center gap-2 mb-2">
                      <Calendar className="h-4 w-4 text-gray-400 flex-shrink-0" />
                      <p className="text-sm text-gray-600">
                        Geliş: {returnCase.arrival_date}
                      </p>
                    </div>
                    
                    {/* Products */}
                    {returnCase.items && returnCase.items.length > 0 && (
                      <div className="flex items-start gap-2 mb-2">
                        <Package className="h-4 w-4 text-gray-400 flex-shrink-0 mt-0.5" />
                        <div className="text-sm text-gray-600">
                          <p className="font-medium">Ürünler:</p>
                          {returnCase.items.map((item, itemIdx) => (
                            <p key={itemIdx} className="text-xs text-gray-500 ml-2">
                              • {item.product_model.name} ({item.product_count} adet)
                            </p>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {/* Receipt Method */}
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-gray-400 flex-shrink-0" />
                      <p className="text-xs text-gray-400">
                        Teslim: {returnCase.receipt_method}
                      </p>
                    </div>
                  </div>
                  
                  {/* Action Buttons */}
                  <div className="flex flex-col gap-2 ml-3">
                    {/* Edit Button - Only show if user has permission */}
                    {canEditCase(returnCase) && (
                      <button 
                        onClick={() => openStageSpecificModal(returnCase)}
                        className="p-2 text-blue-500 hover:text-blue-700 hover:bg-blue-50 rounded-full transition-colors"
                        title="Vakayı Düzenle"
                      >
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                    )}
                    
                    {/* Delete Button - Only show if user is SUPPORT and case is at Teslim Alındı stage */}
                    {canDeleteCase(returnCase) && (
                      <button
                        onClick={() => setCaseToDelete(returnCase)}
                        className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-full transition-colors"
                        title="Vakayı Sil"
                      >
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    )}
                    
                    {/* Optional: Show message when no actions are available */}
                    {!canEditCase(returnCase) && !canDeleteCase(returnCase) && (
                      <div className="text-xs text-gray-400 text-center px-2 py-1">
                        Eylem yok
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Mobile Pagination */}
        <div className="md:hidden mt-6">
          <Pagination currentPage={currentPage} totalPages={totalPages} />
        </div>
      </div>

      {teslimAlindiModal.isOpen && teslimAlindiModal.case && (
        <TeslimAlindiModal
          returnCase={teslimAlindiModal.case}
          onClose={() => setTeslimAlindiModal({ isOpen: false, case: null })}
          onSuccess={() => {
            setTeslimAlindiModal({ isOpen: false, case: null });
            fetchData();
          }}
        />
      )}

      {teknikIncelemeModal.isOpen && teknikIncelemeModal.case && (
        <TeknikIncelemeModal
          returnCase={teknikIncelemeModal.case}
          onClose={() => setTeknikIncelemeModal({ isOpen: false, case: null })}
          onSuccess={() => {
            setTeknikIncelemeModal({ isOpen: false, case: null });
            fetchData();
          }}
        />
      )}

      {odemeTahsilatiModal.isOpen && odemeTahsilatiModal.case && (
        <OdemeTahsilatiModal
          returnCase={odemeTahsilatiModal.case}
          onClose={() => setOdemeTahsilatiModal({ isOpen: false, case: null })}
          onSuccess={() => {
            setOdemeTahsilatiModal({ isOpen: false, case: null });
            fetchData();
          }}
        />
      )}

      {kargoyaVerildiModal.isOpen && kargoyaVerildiModal.case && (
        <KargoyaVerildiModal
          returnCase={kargoyaVerildiModal.case}
          onClose={() => setKargoyaVerildiModal({ isOpen: false, case: null })}
          onSuccess={() => {
            setKargoyaVerildiModal({ isOpen: false, case: null });
            fetchData();
          }}
        />
      )}

      {tamamlandiModal.isOpen && tamamlandiModal.case && (
        <TamamlandiModal
          returnCase={tamamlandiModal.case}
          onClose={() => setTamamlandiModal({ isOpen: false, case: null })}
          onSuccess={() => {
            setTamamlandiModal({ isOpen: false, case: null });
            fetchData();
          }}
        />
      )}
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