'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Plus } from 'lucide-react';
import { FullReturnCase, User } from '@/lib/types';
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

const initialFilters: Filters = {
  search: '',
  status: '',
  startDate: '',
  endDate: '',
  receiptMethod: '',
  productType: '',
  productModel: '',
};

export default function ReturnsDashboardPage() {
  // Loading state for the user
  const { loading } = useAuth();

  // Pagination
  const searchParams = useSearchParams();
  const pageParam = searchParams.get('page');
  const currentPage = Number(pageParam) || 1;

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

  // Fetch return cases
  const fetchData = async () => {
    console.log('manage-returns: fetchData called');
    setIsLoading(true);

    const params = new URLSearchParams({
      page: String(currentPage),
      limit: '5',
    });

    (Object.keys(filters) as Array<keyof Filters>).forEach((key) => {
      const val = filters[key];
      if (val) {
        params.append(key, val);
      }
    });

    console.log('Filters being sent:', filters);
    console.log('API URL:', `http://localhost:5000/returns?${params.toString()}`);

    try {
      const res = await fetch(`http://localhost:5000/returns?${params.toString()}`, {
        method: 'GET',
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed to fetch return cases');
      const data = await res.json();
      console.log('manage-returns: Received data from API:', data.cases?.length, 'cases');
      setCases(data.cases);
      setTotalPages(data.totalPages || 1);
    } catch (err) {
      console.error('Error fetching return cases:', err);
      setCases([]);
    } finally {
      setIsLoading(false);
    }
  };



  useEffect(() => {
    if (!loading) {
      fetchData();
    }
  }, [filters, currentPage, loading]);

  const handleSuccess = () => {
    setIsAddModalOpen(false);
    setCaseToEdit(null);
    setCaseToDelete(null);
    fetchData();
  };

  return (
    <RequirePermission permission="PAGE_VIEW_CASE_TRACKING" >
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <Header onLogout={() => {}} />

      {isAddModalOpen && (
        <AddReturnCaseModal
          onClose={() => setIsAddModalOpen(false)}
          onSuccess={handleSuccess}
        />
      )}

      {caseToEdit && (
        <EditReturnCaseModal
          returnCase={caseToEdit}
          onClose={() => setCaseToEdit(null)}
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
        {/* Header Section */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mt-7">
          <div className="flex-1 space-y-5">
            <div className="flex-1 space-y-3">
              <h1 className="text-3xl font-bold text-gray-900">
                İade Vakaları Yönetimi Sayfasına Hoşgeldin
              </h1>
              <p className="text-md text-gray-500">
                Bu panel üzerinden tüm iade vakalarını görüntüleyebilir, müşteri adı, ürün tipi, durum veya tarih aralığına göre filtreleme yapabilir, yeni iade vakası oluşturabilir ya da mevcut vakaları düzenleyip silebilirsiniz.
              </p>
            </div>
          </div>
          <PermissionGate permission="CASE_CREATE">
          <div className="hidden sm:flex-shrink-0 lg:flex">
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="flex items-center gap-2 rounded-md border bg-blue-500 text-white hover:bg-blue-600 px-4 py-2"
            >
              <Plus className="h-5 w-5" />
              <span>Yeni Vaka Oluştur</span>
            </button>
          </div>
          </PermissionGate>
        </div>

        <div className="flex flex-col lg:flex-row gap-6 mt-8">
          {/* Left Sidebar Filters */}
          <div className="lg:w-80 flex-shrink-0">
          <FilterSidebar filters={filters} setFilters={setFilters} />
          </div>

          {/* Main content */}
          <main className="flex-1 min-w-0">
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
                <div className="flex-1">
                  <div className="flex flex-col lg:flex-row lg:items-center gap-4 lg:gap-6">
                    <h2 className="text-xl lg:text-2xl font-bold text-gray-800">
                    {Object.values(filters).some(value => value) ? 'Arama Sonuçları' : 'Gelen Ürün Vakaları'}
                  </h2>
                    {!Object.values(filters).some(value => value) && (
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
                  </div>
                  <div className="text-red-600 mt-2">
                    {Object.values(filters).some(value => value) ? 'Tüm vakalar için filtreleri temizleyin.' : ''}
                  </div>
                </div>
                  <PermissionGate permission="CASE_CREATE">
                    <div>
                <button
                  onClick={() => setIsAddModalOpen(true)}
                  className="flex lg:hidden items-center gap-2 rounded-md border bg-blue-500 text-white hover:bg-blue-600 px-4 py-2"
                >
                  <Plus className="h-5 w-5" />
                  <span>Yeni Vaka Oluştur</span>
                </button>
                    </div>
                  </PermissionGate>
              </div>

              <div className="overflow-hidden">
              <CasesTable
                cases={cases}
                isLoading={isLoading}
                onEdit={setCaseToEdit}
                onDelete={setCaseToDelete}
                onRefresh={fetchData}
              />
              </div>

              <Pagination currentPage={currentPage} totalPages={totalPages} />
            </div>
          </main>
        </div>
      </div>
    </div>
    </RequirePermission>
  );
}


