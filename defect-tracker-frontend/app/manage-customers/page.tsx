'use client';

import { useEffect, useState, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Pencil, Plus, Search, Trash2, ChevronDown, ChevronUp, Filter, Building2, User, MapPin, Phone, Calendar } from 'lucide-react';
import { Customer } from '@/lib/types';
import { cn, truncateTextWithEllipsis } from '@/lib/utils';
import Header from '@/app/components/Header';
import Pagination from '@/app/components/Pagination';
import AddCustomerModal from '../components/customers/AddCustomerModal';
import DeleteCustomerModal from '../components/customers/DeleteCustomerModal';
import EditCustomerModal from '../components/customers/EditCustomerModal';
import { RequirePermission } from '../components/RequirePermission';
import { useAuth } from '../contexts/AuthContext';
import { API_ENDPOINTS, buildApiUrl } from '@/lib/api';

function CustomersContent() {
  // Loading state for the user
  const { loading } = useAuth();

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

  // Mobile filter state
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // Fetch customers from the API
  const fetchCustomers = useCallback(async () => {
    setIsLoading(true);
    const params = new URLSearchParams({
      page: String(currentPage),
      limit: '4',
      ...(search ? { search } : {}),
    });

    try {
      const res = await fetch(buildApiUrl(API_ENDPOINTS.CUSTOMERS) + '?' + params.toString(), {
        method: 'GET',
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed to fetch customers');
      const data = await res.json();
      setCustomers(data.customers);
      setTotalPages(data.totalPages);
      setIsLoading(false);
    } catch (error) {
      console.error('Error fetching customers:', error);
      setCustomers([]);
    }
  }, [currentPage, search]);

  // Fetch customers when page, or search term changes
  useEffect(() => {
    if (!loading) {
      fetchCustomers();
    }
  }, [currentPage, search, loading, fetchCustomers]);

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

  // Clear all filters
  const clearFilters = () => {
    setSearch('');
    setIsFilterOpen(false);
  };

  // Check if any filters are active
  const hasActiveFilters = search;

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
        {/* Simplified Header Section */}
        <div className="flex items-center justify-between mt-6 mb-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
              Müşteri Yönetimi
            </h1>
            <p className="text-sm text-gray-500 mt-1 hidden md:block">
              Müşteri bilgilerini görüntüleme, arama ve yönetim
            </p>
          </div>
          
          {/* Floating Action Button for Mobile */}
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="md:hidden fixed bottom-6 right-6 z-50 flex items-center justify-center w-14 h-14 bg-blue-500 text-white rounded-full shadow-lg hover:bg-blue-600 transition-colors"
          >
            <Plus className="h-6 w-6" />
          </button>

          {/* Desktop Add Customer Button */}
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="hidden md:flex items-center gap-2 rounded-md border bg-blue-500 text-white hover:bg-blue-600 px-4 py-2"
          >
            <Plus className="h-5 w-5" />
            <span>Müşteri Ekle</span>
          </button>
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
          <div className="md:hidden mb-4 p-4 bg-white rounded-lg border border-gray-200 shadow-sm space-y-3">
            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Şirket veya yetkiliye göre ara..."
                className="pl-10 w-full border border-gray-300 rounded-md py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            {/* Clear Filters Button */}
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="w-full px-3 py-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-md transition-colors text-sm font-medium"
              >
                Filtreleri Temizle
              </button>
            )}
          </div>
        )}

        {/* Desktop Filters */}
        <div className="hidden md:block mb-6 bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1">
              <h2 className="text-xl font-bold text-gray-800 mb-2">
                {search ? 'Arama Sonuçları' : 'Tüm Müşteriler'}
              </h2>
              {search && (
                <div className="text-red-600 text-sm">
                  Tüm müşteriler için filtreleri temizleyin.
                </div>
              )}
            </div>
            
            <div className="flex items-center gap-3">
              {/* Search Input */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Şirket veya yetkiliye göre ara..."
                  className="pl-10 w-64 border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>

              {/* Clear Filters Button */}
              {search && (
                <button
                  onClick={clearFilters}
                  className="px-3 py-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-md transition-colors"
                >
                  Filtreleri Temizle
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Mobile Card Layout */}
        <div className="md:hidden space-y-3">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mr-3"></div>
              <span className="text-gray-500">Yükleniyor...</span>
            </div>
          ) : customers.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-400 mb-2">
                <Building2 className="h-12 w-12 mx-auto" />
              </div>
              <p className="text-gray-500">
                {search ? 'Arama kriterlerinize uygun müşteri bulunamadı.' : 'Henüz müşteri bulunmuyor.'}
              </p>
            </div>
          ) : (
            customers.map((customer, idx) => (
              <div key={customer.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    {/* Company Name */}
                    <div className="flex items-center gap-2 mb-2">
                      <Building2 className="h-4 w-4 text-blue-500 flex-shrink-0" />
                      <h3 className="text-sm font-semibold text-gray-900 truncate">
                        {customer.name}
                      </h3>
                    </div>
                    
                    {/* Representative */}
                    <div className="flex items-center gap-2 mb-2">
                      <User className="h-4 w-4 text-gray-400 flex-shrink-0" />
                      <p className="text-sm text-gray-600">
                        {customer.representative || 'Yetkili belirtilmemiş'}
                      </p>
                    </div>
                    
                    {/* Contact Info */}
                    {customer.contact_info && (
                      <div className="flex items-center gap-2 mb-2">
                        <Phone className="h-4 w-4 text-gray-400 flex-shrink-0" />
                        <p className="text-sm text-gray-600 truncate">
                          {customer.contact_info}
                        </p>
                      </div>
                    )}
                    
                    {/* Address */}
                    {customer.address && (
                      <div className="flex items-start gap-2 mb-2">
                        <MapPin className="h-4 w-4 text-gray-400 flex-shrink-0 mt-0.5" />
                        <p className="text-sm text-gray-600 line-clamp-2">
                          {customer.address}
                        </p>
                      </div>
                    )}
                    
                    {/* Created Date */}
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-gray-400 flex-shrink-0" />
                      <p className="text-xs text-gray-400">
                        Oluşturulma: {customer.created_at || '—'}
                      </p>
                    </div>
                  </div>
                  
                  {/* Action Buttons */}
                  <div className="flex flex-col gap-2 ml-3">
                    <button 
                      onClick={() => setCustomerToEdit(customer)}
                      className="p-2 text-blue-500 hover:text-blue-700 hover:bg-blue-50 rounded-full transition-colors" 
                      title="Müşteriyi Düzenle"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => setCustomerToDelete(customer)}
                      className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-full transition-colors"
                      title="Müşteriyi Sil"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Desktop Table Layout */}
        <div className="hidden md:block bg-white rounded-lg shadow-sm">
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
                          {truncateTextWithEllipsis(customer.address, 20) || 'Belirtilmemiş'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {customer.created_at || '—'}
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
        </div>

        {/* Pagination */}
        <div className="mt-6">
          <Pagination currentPage={currentPage} totalPages={totalPages} />
        </div>
      </div>
    </div>
    </RequirePermission>
  );
}

export default function CustomersPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Yükleniyor...</p>
        </div>
      </div>
    }>
      <CustomersContent />
    </Suspense>
  );
}