'use client';

import { useEffect, useState, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Plus, Search, ListFilter, Trash2, ChevronDown, ChevronUp, X, Filter, User } from 'lucide-react';
import { User as UserType } from '@/lib/types';
import { cn, truncateTextWithEllipsis } from '@/lib/utils';
import Header from '@/app/components/Header';
import Pagination from '@/app/components/Pagination';
import { RequirePermission } from '../components/RequirePermission';
import AddUserModal from '../components/adminDashboard/AddUserModal';
import DeleteConfirmationModal from '../components/adminDashboard/ConfirmationModel';
import { useAuth } from '../contexts/AuthContext';
import { API_ENDPOINTS, buildApiUrl } from '@/lib/api';

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

function AdminDashboardContent() {
  // Loading state for the user
  const { loading } = useAuth();

  // Using useSearchParams to handle pagination
  const searchParams = useSearchParams();
  const pageParam = searchParams.get('page');
  const currentPage = Number(pageParam) || 1;

  // State for users, total pages, search term, and role filter
  const [users, setUsers] = useState<UserType[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [role, setRole] = useState('');

  // State for modal open and user to delete
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<UserType | null>(null);

  // Loading state for the users
  const [isLoading, setIsLoading] = useState(true);

  // Mobile filter state
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // Get the current user from context
  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    const params = new URLSearchParams({
      page: String(currentPage),
      limit: '4',
      ...(search ? { search } : {}),
      ...(role ? { role } : {}),
    });

    try {
      const res = await fetch(buildApiUrl(API_ENDPOINTS.ADMIN.USERS) + '?' + params.toString(), {
        method: 'GET',
        credentials: 'include', 
      });
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

  // Clear all filters
  const clearFilters = () => {
    setSearch('');
    setRole('');
    setIsFilterOpen(false);
  };

  // Check if any filters are active
  const hasActiveFilters = search || role;

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
        {/* Simplified Header Section */}
        <div className="flex items-center justify-between mt-6 mb-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
              Yönetici Paneli
            </h1>
            <p className="text-sm text-gray-500 mt-1 hidden md:block">
              Kullanıcı yönetimi ve sistem ayarları
            </p>
          </div>
          
          {/* Floating Action Button for Mobile */}
          <button 
            onClick={() => setIsModalOpen(true)}
            className="md:hidden fixed bottom-6 right-6 z-50 flex items-center justify-center w-14 h-14 bg-blue-500 text-white rounded-full shadow-lg hover:bg-blue-600 transition-colors"
          >
            <Plus className="h-6 w-6" />
          </button>

          {/* Desktop Add User Button */}
          <button 
            onClick={() => setIsModalOpen(true)}
            className="hidden md:flex items-center gap-2 rounded-md border bg-blue-500 text-white hover:bg-blue-600 px-4 py-2"
          >
            <Plus className="h-5 w-5" />
            <span>Kullanıcı Ekle</span>
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
                placeholder="İsme veya emaile göre arama..."
                className="pl-10 w-full border border-gray-300 rounded-md py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            {/* Role Filter */}
            <div className="relative">
              <ListFilter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <select
                value={role} 
                onChange={(e) => setRole(e.target.value)}
                className="pl-10 w-full border border-gray-300 rounded-md py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Tüm Roller</option>
                <option value="ADMIN">Yönetici</option>
                <option value="MANAGER">Yönetici Yardımcısı</option>
                <option value="TECHNICIAN">Teknisyen</option>
                <option value="SUPPORT">Destek</option>
                <option value="SALES">Satış</option>
                <option value="LOGISTICS">Lojistik</option>
              </select>
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
                {(search || role) ? 'Arama Sonuçları' : 'Tüm Kullanıcılar'}
              </h2>
              {(search || role) && (
                <div className="text-red-600 text-sm">
                  Tüm kullanıcılar için filtreleri temizleyin.
                </div>
              )}
            </div>
            
            <div className="flex items-center gap-3">
              {/* Search Input */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="İsme veya emaile göre arama..."
                  className="pl-10 w-64 border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>

              {/* Role Filter */}
              <div className="relative">
                <ListFilter className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <select
                  value={role} 
                  onChange={(e) => setRole(e.target.value)}
                  className="pl-10 border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Tüm Roller</option>
                  <option value="ADMIN">Yönetici</option>
                  <option value="MANAGER">Yönetici Yardımcısı</option>
                  <option value="TECHNICIAN">Teknisyen</option>
                  <option value="SUPPORT">Destek</option>
                  <option value="SALES">Satış</option>
                  <option value="LOGISTICS">Lojistik</option>
                </select>
              </div>

              {/* Clear Filters Button */}
              {(search || role) && (
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
          ) : users.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-400 mb-2">
                <User className="h-12 w-12 mx-auto" />
              </div>
              <p className="text-gray-500">
                {search || role ? 'Arama kriterlerinize uygun kullanıcı bulunamadı.' : 'Henüz kullanıcı bulunmuyor.'}
              </p>
            </div>
          ) : (
            users.map((user, idx) => (
              <div key={user.email} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3 flex-1">
                    {/* Avatar */}
                    <div className="flex-shrink-0">
                      <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                        <span className="text-sm font-medium text-blue-600">
                          {user.firstName ? user.firstName.charAt(0) : ''}{user.lastName ? user.lastName.charAt(0) : ''}
                        </span>
                      </div>
                    </div>
                    
                    {/* User Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-sm font-semibold text-gray-900 truncate">
                          {user.firstName} {user.lastName}
                        </h3>
                        <span className={cn('px-2 py-1 text-xs font-medium rounded-full', getRoleClass(user.role))}>
                          {getTurkishRoleName(user.role)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500 truncate">{user.email}</p>
                      <p className="text-xs text-gray-400 mt-1">
                        Son giriş: {user.lastLogin || '—'}
                      </p>
                    </div>
                  </div>
                  
                  {/* Action Button */}
                  <button 
                    onClick={() => setUserToDelete(user)}
                    className="flex-shrink-0 ml-2 p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-full transition-colors" 
                    title="Kullanıcıyı Sil"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
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
                      <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                        <div className="flex items-center justify-center">
                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mr-2"></div>
                          Yükleniyor...
                        </div>
                      </td>
                    </tr>
                  ) : users.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
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
                                {truncateTextWithEllipsis(user.firstName + ' ' + user.lastName, 30)}
                              </div>
                              <div className="text-sm text-gray-500">{truncateTextWithEllipsis(user.email, 30)}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={cn('px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full', getRoleClass(user.role))}>
                            {getTurkishRoleName(user.role)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {user.invitedAt || '—'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {user.createdAt || '—'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {user.lastLogin || '—'}
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

export default function AdminDashboard() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Yükleniyor...</p>
        </div>
      </div>
    }>
      <AdminDashboardContent />
    </Suspense>
  );
}
