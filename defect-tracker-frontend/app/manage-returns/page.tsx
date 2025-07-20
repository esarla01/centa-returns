'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Plus } from 'lucide-react';
import { ReturnCase, User } from '@/lib/types';
import Header from '@/app/components/Header';
import Pagination from '@/app/components/Pagination';
import FilterSidebar, { Filters } from '../components/returns/FilterSidebar';
import CasesTable from '../components/returns/CasesTable';
import AddReturnCaseModal from '../components/returns/AddReturnCaseModal';
import EditReturnCaseModal from '../components/returns/EditReturnCaseModal';
import DeleteReturnCaseModal from '../components/returns/DeleteReturnCaseModal';
import { RequirePermission } from '../components/RequirePermission';
import { useAuth } from '../contexts/AuthContext';

const initialFilters: Filters = {
  search: '',
  status: 'not_closed',
  startDate: '',
  endDate: '',
  userId: '',
  receiptMethod: '',
  productType: '',
};

export default function ReturnsDashboardPage() {
  // Loading state for the user
  const { loading } = useAuth();

  // Pagination
  const searchParams = useSearchParams();
  const pageParam = searchParams.get('page');
  const currentPage = Number(pageParam) || 1;

  // Data
  const [cases, setCases] = useState<ReturnCase[]>([]);
  const [users, setUsers] = useState<User[]>([]);

  // Control
  const [filters, setFilters] = useState<Filters>(initialFilters);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);

  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [caseToEdit, setCaseToEdit] = useState<ReturnCase | null>(null);
  const [caseToDelete, setCaseToDelete] = useState<ReturnCase | null>(null);

  // Fetch return cases
  const fetchData = async () => {
    setIsLoading(true);

    const params = new URLSearchParams({
      page: String(currentPage),
      limit: '10',
    });

    (Object.keys(filters) as Array<keyof Filters>).forEach((key) => {
      const val = filters[key];
      if (val) {
        params.append(key, val);
      }
    });

    try {
      const res = await fetch(`http://localhost:5000/returns?${params.toString()}`, {
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed to fetch return cases');
      const data = await res.json();
      setCases(data.cases);
      setTotalPages(data.totalPages || 1);
    } catch (err) {
      console.error('Error fetching return cases:', err);
      setCases([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch users for filters
  const fetchAuxData = async () => {
    try {
      const res = await fetch('http://localhost:5000/auth/retrieve-users?limit=100', {
        credentials: 'include',
      });
      const data = await res.json();
      setUsers(data.users || []);
    } catch (err) {
      console.error('Failed to fetch auxiliary data', err);
    }
  };

  useEffect(() => {
    if (!loading) {
      fetchAuxData();
    }
  }, [loading]);

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
    <div className="min-h-screen bg-gradient-to-b from-white to-blue-100">
      <Header onLogout={() => {}} />

      {/* Modals */}
      {isAddModalOpen && (
        <AddReturnCaseModal
          onClose={() => setIsAddModalOpen(false)}
          onSuccess={handleSuccess}
        />
      )}
      {/* {caseToEdit && (
        <EditReturnCaseModal
          returnCase={caseToEdit}
          onClose={() => setCaseToEdit(null)}
          onSuccess={handleSuccess}
        />
      )} */}
      {caseToDelete && (
        <DeleteReturnCaseModal
          returnCase={caseToDelete}
          onClose={() => setCaseToDelete(null)}
          onSuccess={handleSuccess}
        />
      )}

      <div className="max-w-screen-2xl mx-auto p-4 sm:p-6 lg:p-8">
        {/* Header Section */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between px-4 sm:px-5 lg:px-6 mt-10">
          <div className="flex-1 space-y-5">
            <div className="flex-1 space-y-3 mt-[-32px]">
              <h1 className="text-3xl font-bold text-gray-900">
                İade Vakaları Yönetimi Sayfasına Hoşgeldin
              </h1>
              <p className="text-md text-gray-500 md:w-[700px]">
                Bu panel üzerinden tüm iade vakalarını görüntüleyebilir, müşteri adı, ürün tipi, durum veya tarih aralığına göre filtreleme yapabilir, yeni iade vakası oluşturabilir ya da mevcut vakaları düzenleyip silebilirsiniz.
              </p>
            </div>
          </div>
          <div className="hidden sm:flex-shrink-0 lg:flex">
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="flex items-center gap-2 rounded-md border bg-blue-500 text-white hover:bg-blue-600 px-4 py-2"
            >
              <Plus className="h-5 w-5" />
              <span>Yeni Vaka Oluştur</span>
            </button>
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-8 mt-8">
          {/* Left Sidebar Filters */}
          <FilterSidebar filters={filters} setFilters={setFilters} users={users} />

          {/* Main content */}
          <main className="flex-1">
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <div className="flex justify-between items-center mb-6">
                <div className="flex-col items-center gap-4">
                  <h2 className="text-2xl font-bold text-gray-800">
                    {Object.values(filters).some(value => value && value !== 'not_closed') ? 'Arama Sonuçları' : 'Gelen Ürün Vakaları'}
                  </h2>
                  <div className="text-red-600">
                    {Object.values(filters).some(value => value && value !== 'not_closed') ? 'Tüm vakalar için filtreleri temizleyin.' : ''}
                  </div>
                </div>
                <button
                  onClick={() => setIsAddModalOpen(true)}
                  className="flex lg:hidden items-center gap-2 rounded-md border bg-blue-500 text-white hover:bg-blue-600 px-4 py-2"
                >
                  <Plus className="h-5 w-5" />
                  <span>Yeni Vaka Oluştur</span>
                </button>
              </div>

              <CasesTable
                cases={cases}
                isLoading={isLoading}
                onEdit={setCaseToEdit}
                onDelete={setCaseToDelete}
              />

              <Pagination currentPage={currentPage} totalPages={totalPages} />
            </div>
          </main>
        </div>
      </div>
    </div>
    </RequirePermission>
  );
}
