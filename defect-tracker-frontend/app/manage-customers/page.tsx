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


export default function CustomersPage() {
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

  // Fetch user name from localStorage on initial render
  useEffect(() => {
    const name = localStorage.getItem('name') || '';
    const surname = localStorage.getItem('surname') || '';
    setUserName(`${name} ${surname}`);
  }, []);

  // Fetch customers when page, or search term changes
  useEffect(() => {
    fetchCustomers();
  }, [currentPage, search]);

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
    <div className="min-h-screen bg-gradient-to-b from-white to-blue-100">
      <Header onLogout={() => alert('Logging out...')} />

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

      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between px-4 sm:px-5 lg:px-6 mt-10">       
        <div className="flex-1 space-y-5">
            <div className="flex-1 space-y-3">
              <h1 className="text-3xl font-bold text-gray-900">
                Müşteri Yönetimi Sayfasına Hoşgeldin
              </h1>
              <p className="text-md text-gray-500 md:w-[700px]">
                Bu panel üzerinden tüm müşterileri görüntüleyebilir, şirket veya yetkili ismine göre arama yapabilir, yeni müşteri ekleyebilir ya da mevcut müşterileri silebilirsiniz.
              </p>
            </div>
          </div>
          <div className="hidden sm:flex-shrink-0 lg:flex">
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="flex w-full items-center justify-center sm:justify-end sm:w-5 gap-2 rounded-md border bg-blue-500 text-white hover:bg-blue-600 px-4 py-2 md:w-auto"
            >
              <Plus className="h-5 w-5" />
              <span>Müşteri Ekle</span>
            </button>
          </div>
        </div>

        <div className="mt-8 bg-white p-6 rounded-lg shadow-sm">
          <div className="flex flex-col md:flex-row justify-between mb-6 gap-6">
            <div className="flex-col items-center gap-4">
              <h2 className="text-2xl font-bold text-gray-800">
                {search ? `Arama Sonuçları` : 'Tüm Müşteriler'}
              </h2>
              <div className="text-red-600"> {(search) ? 'Tüm kullanıcılar için filtreleri temizleyin.' : ''} </div>
            </div>
            <div className="flex items-center gap-2 w-full md:w-auto">
              <div className="relative w-full md:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Şirket veya yetkiliye göre ara..."
                  className="pl-10 w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-primary-light"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              {search && (
                <button
                  onClick={() => setSearch('')}
                  className="ml-2 text-sm text-blue-600 hover:underline"
                >
                  Filtreyi Temizle
                </button>
              )}
              <button 
                onClick={() => setIsAddModalOpen(true)}
                className=" flex lg:hidden items-center gap-2 px-4 py-2 text-black bg-primary rounded-md hover:bg-primary-light"
              >
                <Plus className="h-5 w-5" />
                <span>Müşteri Ekle</span>
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="p-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ŞİRKET ADI</th>
                  <th className="p-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">YETKİLİ KİŞİ</th>
                  <th className="p-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">İLETİŞİM BİLGİSİ</th>
                  <th className="p-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ADRES</th>
                  <th className="p-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">OLUŞTURULMA</th>
                  <th className="p-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">EYLEMLER</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="p-4 text-center text-gray-500">Yükleniyor...</td>
                  </tr>
                ) : customers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-4 text-center text-gray-500">Müşteri bulunamadı.</td>
                  </tr>
                ) : (
                  customers.map((customer) => {
                    return (
                      <tr key={customer.id} className="hover:bg-gray-50">
                        <td className="p-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{customer.name}</div>
                        </td>
                        <td className="p-4 whitespace-nowrap text-sm text-gray-500">{customer.representative || 'N/A'}</td>
                        <td className="p-4 whitespace-nowrap text-sm text-gray-500">{customer.contact_info || 'N/A'}</td>
                        <td className="p-4 whitespace-nowrap text-sm text-gray-500">{customer.address || 'N/A'}</td>
                        <td className="p-4 whitespace-nowrap text-sm text-gray-500">{new Date(customer.created_at).toLocaleDateString()}</td>
                        <td className="p-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex items-center space-x-3">
                            <button 
                              onClick={() =>  setCustomerToEdit(customer)}
                              className="text-primary-light hover:text-primary" 
                              title="Edit User"
                              >
                                <Pencil className="h-5 w-5" />
                              </button>
                            <button
                              onClick={() => setCustomerToDelete(customer)}
                              className="text-red-500 hover:text-red-700"
                              title="Delete Customer"
                            >
                              <Trash2 className="h-5 w-5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          <Pagination currentPage={currentPage} totalPages={totalPages} />
        </div>
      </div>
    </div>
  );
}