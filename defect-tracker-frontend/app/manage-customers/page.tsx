'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Pencil, Plus, Search, Trash2 } from 'lucide-react';
import { Customer } from '@/lib/types';
import Header from '@/app/components/Header';
import Pagination from '@/app/components/Pagination';
import AddCustomerModal from '../components/customers/AddCustomerModal';
import DeleteCustomerModal from '../components/customers/DeleteCustomerModal';
import EditCustomerModal from '../components/customers/EditCustomerModal';
import { RequirePermission } from '../components/RequirePermission';
import { useAuth } from '../contexts/AuthContext';


export default function CustomersPage() {
  // Loading state for the user
  const { loading } = useAuth();

  // Name and surname from localStorage for the greeting
  const [userName, setUserName] = useState<string>('');

  // Pagination state
  const searchParams = useSearchParams();
  const pageParam = searchParams.get('page');
  const currentPage = Number(pageParam) || 1;

  // State for customers, total pages, and search term
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');

  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [customerToDelete, setCustomerToDelete] = useState<Customer | null>(null);
  const [customerToEdit, setCustomerToEdit] = useState<Customer | null>(null);

  // Loading state
  const [isLoading, setIsLoading] = useState(true);

  // Fetch customers from the API
  const fetchCustomers = async () => {
    setIsLoading(true);
    const params = new URLSearchParams({
      page: String(currentPage),
      limit: '5',
      ...(search ? { search } : {}),
    });

    try {
      const res = await fetch(`http://localhost:5000/customers?${params.toString()}`, {
        method: 'GET',
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed to fetch customers');
      const data = await res.json();
      setCustomers(data.customers);
      setTotalPages(data.totalPages);
    } catch (error) {
      console.error('Error fetching customers:', error);
      setCustomers([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch customers when page, or search term changes
  useEffect(() => {
    if (!loading) {
      fetchCustomers();
    }
  }, [currentPage, search, loading]);

  // Handlers for modal actions
  const handleCustomerAdded = () => {
    setIsAddModalOpen(false);
    fetchCustomers(); // Refetch to show the new customer
  };

  const handleDeletionSuccess = () => {
    setCustomerToDelete(null);
    fetchCustomers(); // Refetch to update the list
  };

  const handleEditCustomer = () => {
    setCustomerToEdit(null);
    fetchCustomers(); // Refetch to show the updated customer
  }

  return (
    <RequirePermission permission="PAGE_VIEW_CUSTOMER_LIST" >
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <Header onLogout={() => {}} />

      {isAddModalOpen && (
        <AddCustomerModal
          onClose={() => setIsAddModalOpen(false)}
          onCustomerAdded={handleCustomerAdded}
        />
      )}

      {customerToDelete && (
        <DeleteCustomerModal
          customer={customerToDelete}
          onClose={() => setCustomerToDelete(null)}
          onSuccess={handleDeletionSuccess}
        />
      )}

      {customerToEdit && (
        <EditCustomerModal
          customer={customerToEdit}
          onClose={() => setCustomerToEdit(null)}
          onSuccess={handleEditCustomer}
        />
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header Section */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mt-7">
          <div className="flex-1 space-y-3">
            <h1 className="text-3xl font-bold text-gray-900">
              Müşteri Yönetimi
            </h1>
            <p className="text-md text-gray-500 max-w-2xl">
              Bu panel üzerinden tüm müşterileri görüntüleyebilir, şirket veya yetkili ismine göre arama yapabilir, yeni müşteri ekleyebilir ya da mevcut müşterileri düzenleyip silebilirsiniz.
            </p>
          </div>
          <div className="flex-shrink-0">
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="flex items-center gap-2 rounded-md border bg-blue-500 text-white hover:bg-blue-600 px-4 py-2"
            >
              <Plus className="h-5 w-5" />
              <span>Müşteri Ekle</span>
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="mt-8 bg-white rounded-lg shadow-sm">
          {/* Filters and Actions Bar */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div className="flex-1">
                <h2 className="text-xl lg:text-2xl font-bold text-gray-800 mb-2">
                  {search ? 'Arama Sonuçları' : 'Tüm Müşteriler'}
                </h2>
                {search && (
                  <div className="text-red-600 text-sm">
                    Tüm müşteriler için filtreleri temizleyin.
                  </div>
                )}
              </div>
              
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                {/* Search Input */}
                <div className="relative flex-1 sm:flex-none sm:w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Şirket veya yetkiliye göre ara..."
                    className="pl-10 w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>

                {/* Clear Filters Button */}
                {search && (
                  <button
                    onClick={() => setSearch('')}
                    className="px-3 py-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-md transition-colors"
                  >
                    Filtreleri Temizle
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Table Section */}
          <div className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">#</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ŞİRKET ADI</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">YETKİLİ KİŞİ</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">İLETİŞİM BİLGİSİ</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ADRES</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">OLUŞTURULMA TARİHİ</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">EYLEMLER</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {isLoading ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                        <div className="flex items-center justify-center">
                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mr-2"></div>
                          Yükleniyor...
                        </div>
                      </td>
                    </tr>
                  ) : customers.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                        {search ? 'Arama kriterlerinize uygun müşteri bulunamadı.' : 'Henüz müşteri bulunmuyor.'}
                      </td>
                    </tr>
                  ) : (
                    customers.map((customer, idx) => (
                      <tr key={customer.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {((currentPage - 1) * 5) + idx + 1}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="text-sm font-medium text-gray-900">{customer.name}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {customer.representative || 'Belirtilmemiş'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {customer.contact_info || 'Belirtilmemiş'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {customer.address || 'Belirtilmemiş'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(customer.created_at).toLocaleDateString('tr-TR')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex items-center space-x-3">
                            <button 
                              onClick={() => setCustomerToEdit(customer)}
                              className="text-blue-500 hover:text-blue-700 transition-colors p-1 rounded hover:bg-blue-50" 
                              title="Müşteriyi Düzenle"
                            >
                              <Pencil className="h-5 w-5" />
                            </button>
                            <button
                              onClick={() => setCustomerToDelete(customer)}
                              className="text-red-500 hover:text-red-700 transition-colors p-1 rounded hover:bg-red-50"
                              title="Müşteriyi Sil"
                            >
                              <Trash2 className="h-5 w-5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          <div className="px-6 py-4 border-t border-gray-200">
            <Pagination currentPage={currentPage} totalPages={totalPages} />
          </div>
        </div>
      </div>
    </div>
    </RequirePermission>
  );
}