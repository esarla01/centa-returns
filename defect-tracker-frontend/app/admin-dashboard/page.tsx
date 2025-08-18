'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { Plus, Search, ListFilter, Pencil, Trash2 } from 'lucide-react';
import { User } from '@/lib/types';
import { cn } from '@/lib/utils';
import Header from '@/app/components/Header';
import Pagination from '@/app/components/Pagination';
import { RequirePermission } from '../components/RequirePermission';
import AddUserModal from '../components/adminDashboard/AddUserModal';
import DeleteConfirmationModal from '../components/adminDashboard/ConfirmationModel';
import { useAuth } from '../contexts/AuthContext';

const getRoleClass = (role: string) => {
  switch (role) {
    case 'ADMIN': return 'bg-purple-100 text-purple-800';
    case 'MANAGER': return 'bg-blue-100 text-blue-800';
    case 'TECHNICIAN': return 'bg-green-100 text-green-800';
    case 'SUPPORT': return 'bg-yellow-100 text-yellow-800';
    case 'SALES': return 'bg-indigo-100 text-indigo-800';
    case 'LOGISTICS': return 'bg-gray-100 text-gray-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};

const getTurkishRoleName = (role: string) => {
  switch (role) {
    case 'ADMIN': return 'Yönetici';
    case 'MANAGER': return 'Yönetici Yardımcısı';
    case 'TECHNICIAN': return 'Teknisyen';
    case 'SUPPORT': return 'Destek';
    case 'SALES': return 'Satış';
    case 'LOGISTICS': return 'Lojistik';
    default: return role;
  }
};


export default function AdminDashboard() {
  // Loading state for the user
  const { loading } = useAuth();

  // Using useSearchParams to handle pagination
  const searchParams = useSearchParams();
  const pageParam = searchParams.get('page');
  const currentPage = Number(pageParam) || 1;

  // State for users, total pages, search term, and role filter
  const [users, setUsers] = useState<User[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [role, setRole] = useState('');

  // State for modal open and user to delete
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);

  // Loading state for the users
  const [isLoading, setIsLoading] = useState(true);

  // Get the current user from context
  const fetchUsers = useCallback(async () => {
    // console.log('Fetching users...');
    // console.log('Role:', role);
    setIsLoading(true);
    const params = new URLSearchParams({
      page: String(currentPage),
      limit: '5',
      ...(search ? { search } : {}),
      ...(role ? { role } : {}),
    });

    try {
      const res = await fetch(`http://localhost:5000/admin?${params.toString()}`, {
        method: 'GET',
        credentials: 'include', 
      }
      
      );
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      setUsers(data.users);
      setTotalPages(data.totalPages);
      setIsLoading(false);
    } catch (error) {
      console.error('Error fetching users:', error);
      setUsers([]);
    }
  }, [currentPage, search, role]);

  // Fetch users when the component mounts or when dependencies change
  useEffect(() => {
    if (!loading) {
      // Check if the user is authorized before fetching users
      fetchUsers();
    }
  }, [currentPage, search, role, loading]);

  // Handler for when a new user is added
  const handleUserAdded = () => {
    setIsModalOpen(false);
    fetchUsers(); 
  }
  // Handler for when a user deletion is successful
  const handleDeletionSuccess = () => {
    setUserToDelete(null); 
    fetchUsers();  
  };

  return (
    <RequirePermission permission="PAGE_VIEW_ADMIN" >
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <Header onLogout={() => {}} />
      
      {isModalOpen && (
        <AddUserModal   
          onClose={() => setIsModalOpen(false)} 
          onUserInvited={handleUserAdded}
        />
      )}

      {userToDelete && (
        <DeleteConfirmationModal
          user={userToDelete}
          onClose={() => setUserToDelete(null)}
          onSuccess={handleDeletionSuccess}
        />
      )}


      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header Section */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mt-7">
          <div className="flex-1 space-y-3">
            <h1 className="text-3xl font-bold text-gray-900">
              Yönetici Paneli
            </h1>
            <p className="text-md text-gray-500 max-w-2xl">
              Bu panel üzerinden tüm kullanıcıları görüntüleyebilir, isim, e-posta veya role göre filtreleme yapabilir, yeni kullanıcılar ekleyebilir ya da mevcut kullanıcıları düzenleyip silebilirsiniz.
            </p>
          </div>
          <div className="flex-shrink-0">
            <button 
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-2 rounded-md border bg-blue-500 text-white hover:bg-blue-600 px-4 py-2"
            >
              <Plus className="h-5 w-5" />
              <span>Kullanıcı Ekle</span>
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
                  {(search || role) ? 'Arama Sonuçları' : 'Tüm Kullanıcılar'}
                </h2>
                {(search || role) && (
                  <div className="text-red-600 text-sm">
                    Tüm kullanıcılar için filtreleri temizleyin.
                  </div>
                )}
              </div>
              
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                {/* Search Input */}
                <div className="relative flex-1 sm:flex-none sm:w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="İsme veya emaile göre arama..."
                    className="pl-10 w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>

                {/* Role Filter */}
                <div className="relative flex items-center bg-white border border-gray-300 rounded-md hover:bg-gray-50">
                  <label 
                    htmlFor="role-filter" 
                    className="flex items-center gap-2 w-full cursor-pointer px-4 py-2"
                  >
                    <ListFilter className="h-5 w-5 text-gray-500 flex-shrink-0" />
                    <select
                      id="role-filter"
                      value={role} 
                      onChange={(e) => setRole(e.target.value)}
                      className="appearance-none bg-transparent w-full text-sm text-gray-700 focus:outline-none"
                    >
                      <option value="">Tüm Roller</option>
                      <option value="ADMIN">Yönetici</option>
                      <option value="MANAGER">Yönetici Yardımcısı</option>
                      <option value="TECHNICIAN">Teknisyen</option>
                      <option value="SUPPORT">Destek</option>
                      <option value="SALES">Satış</option>
                      <option value="LOGISTICS">Lojistik</option>
                    </select>
                  </label>
                </div>

                {/* Clear Filters Button */}
                {(search || role) && (
                  <button
                    onClick={() => {
                      setSearch('');
                      setRole('');
                    }}
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
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">KULLANICI</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ROL</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">DAVET TARİHİ</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">DAVET KABUL TARİHİ</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">SON GİRİŞ</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">EYLEMLER</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {isLoading ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                        <div className="flex items-center justify-center">
                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mr-2"></div>
                          Yükleniyor...
                        </div>
                      </td>
                    </tr>
                  ) : users.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                        {search || role ? 'Arama kriterlerinize uygun kullanıcı bulunamadı.' : 'Henüz kullanıcı bulunmuyor.'}
                      </td>
                    </tr>
                  ) : (
                    users.map((user, idx) => (
                      <tr key={user.email} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {((currentPage - 1) * 5) + idx + 1}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10">
                              <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                                <span className="text-sm font-medium text-blue-600">
                                  {user.firstName ? user.firstName.charAt(0) : ''}{user.lastName ? user.lastName.charAt(0) : ''}
                                </span>
                              </div>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">
                                {user.firstName} {user.lastName}
                              </div>
                              <div className="text-sm text-gray-500">{user.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={cn('px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full', getRoleClass(user.role))}>
                            {getTurkishRoleName(user.role)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {user.invitedAt ?? '—'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {user.createdAt ?? '—'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {user.lastLogin ?? '—'}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-center text-sm font-medium">
                        <button 
                            onClick={() => setUserToDelete(user)}
                            className="text-red-500 hover:text-red-700 transition-colors p-1 rounded hover:bg-red-50" 
                            title="Kullanıcıyı Sil"
                          >
                            <Trash2 className="h-5 w-5" />
                          </button>
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
