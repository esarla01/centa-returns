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

const initialFilters: Filters = {
  search: '',
  status: 'not_closed', // Sensible default
  startDate: '',
  endDate: '',
  userId: '',
  receiptMethod: '',
};

export default function ReturnsDashboardPage() {
  // Pagination
  const searchParams = useSearchParams();
  const pageParam = searchParams.get('page');
  const currentPage = Number(pageParam) || 1;

  // Data State
  const [cases, setCases] = useState<ReturnCase[]>([]);
  const [users, setUsers] = useState<User[]>([]); // For filter dropdown
  
  // Control State
  const [filters, setFilters] = useState<Filters>(initialFilters);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);

  // Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [caseToEdit, setCaseToEdit] = useState<ReturnCase | null>(null);
  const [caseToDelete, setCaseToDelete] = useState<ReturnCase | null>(null);

  // Fetch all necessary data
  const fetchData = async () => {
    setIsLoading(true);
    // Build query params from filters
    const params = new URLSearchParams({
      page: String(currentPage),
      limit: '10',
    });
    // Add filters to params only if they have a value
    (Object.keys(filters) as Array<keyof Filters>).forEach(key => {
        if(filters[key]) {
            params.append(key, filters[key]);
        }
    });

    try {
      const res = await fetch(`http://localhost:5000/api/return-cases?${params.toString()}`, {
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed to fetch return cases');
      const data = await res.json();
      setCases(data.cases);
      setTotalPages(data.totalPages);
    } catch (error) {
      console.error(error);
      setCases([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch auxiliary data like users for filters on mount
  const fetchAuxData = async () => {
    try {
        const userRes = await fetch('http://localhost:5000/auth/retrieve-users?limit=100', { credentials: 'include' });
        const userData = await userRes.json();
        setUsers(userData.users || []);
    } catch (error) {
        console.error("Failed to fetch auxiliary data", error);
    }
  }

  useEffect(() => {
    fetchAuxData();
  }, []);
  
  // Refetch data when filters or page change
  useEffect(() => {
    fetchData();
  }, [filters, currentPage]);

  const handleSuccess = () => {
    setIsAddModalOpen(false);
    setCaseToEdit(null);
    setCaseToDelete(null);
    fetchData(); // Refetch data on any successful action
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-blue-100">
      <Header onLogout={() => {}} />
      
      {/* MODALS WILL GO HERE */}
      {isAddModalOpen && <AddReturnCaseModal onClose={() => setIsAddModalOpen(false)} onSuccess={handleSuccess} />}
      {caseToEdit && <EditReturnCaseModal returnCase={caseToEdit} onClose={() => setCaseToEdit(null)} onSuccess={handleSuccess} />}
      {caseToDelete && <DeleteReturnCaseModal returnCase={caseToDelete} onClose={() => setCaseToDelete(null)} onSuccess={handleSuccess} />}

      <div className="max-w-screen-2xl mx-auto p-4 sm:p-6 lg:p-8">
        <div className="flex flex-col md:flex-row gap-8">
          {/* Left Sidebar for Filters */}
          <FilterSidebar filters={filters} setFilters={setFilters} users={users} />

          {/* Main Content Area */}
          <main className="flex-1">
            <div className="bg-white p-6 rounded-lg shadow-sm">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-3xl font-bold text-gray-900">Gelen Ürün Vakaları</h1>
                    <button
                        onClick={() => setIsAddModalOpen(true)}
                        className="flex items-center gap-2 rounded-md border bg-blue-500 text-white hover:bg-blue-600 px-4 py-2"
                    >
                        <Plus className="h-5 w-5" />
                        <span>Yeni Vaka Oluştur</span>
                    </button>
                </div>
                
                {/* Cases Table */}
                <CasesTable 
                    cases={cases} 
                    isLoading={isLoading}
                    onEdit={setCaseToEdit}
                    onDelete={setCaseToDelete}
                />

                {/* Pagination */}
                <Pagination currentPage={currentPage} totalPages={totalPages} />
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}