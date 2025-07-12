'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Plus, Search, ListFilter, Pencil, Trash2 } from 'lucide-react';
import { User, UserRole } from '@/lib/types';
import { cn } from '@/lib/utils';
import Header from '@/app/components/Header';
import Pagination from '@/app/components/Pagination';
import RequireRole from '../components/RequireRole';
import AddUserModal from '../components/adminDashboard/AddUserModal';
import DeleteConfirmationModal from '../components/adminDashboard/ConfirmationModel';
import { useAuth } from '../context/AuthContext';

const getRoleClass = (role: string) => {
  switch (role) {
    case 'admin': return 'bg-purple-100 text-purple-800';
    case 'manager': return 'bg-blue-100 text-blue-800';
    case 'user': return 'bg-gray-100 text-gray-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};

export default function AdminDashboard() {
  // State for authentication
  // const { user, loading } = useAuth();

  // Name and surname from localStorage
  const [user, setUser] = useState<string | ''>('');

  // Using useSearchParams to handle pagination
  const searchParams = useSearchParams();
  const pageParam = searchParams.get('page');
  const currentPage = Number(pageParam) || 1;

  // State for users, total pages, search term, and role filter
  const [users, setUsers] = useState<User[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [role, setRole] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);

  const fetchUsers = async () => {
    const params = new URLSearchParams({
      page: String(currentPage),
      limit: '5',
      ...(search ? { search } : {}),
      ...(role ? { role } : {}),
    });

    try {
      const res = await fetch(`http://localhost:5000/auth/retrieve-users?${params.toString()}`, {
        method: 'GET',
        credentials: 'include', 
      }
      
      );
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      setUsers(data.users);
      setTotalPages(data.totalPages);
    } catch (error) {
      console.error('Error fetching users:', error);
      setUsers([]);
    }
  };

  useEffect(() => {
    const name = localStorage.getItem('name') || '';
    const surname = localStorage.getItem('surname') || '';
    setUser(`${name} ${surname}`);
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [currentPage, search, role]);


  const handleUserAdded = () => {
    setIsModalOpen(false);
    fetchUsers(); 
  }
  const handleDeletionSuccess = () => {
    setUserToDelete(null); 
    fetchUsers();  
  };

  return (
    <RequireRole role="admin">
    <div className="min-h-screen bg-gradient-to-b from-white to-blue-100">
      <Header onLogout={() => alert('Logging out...')} />
      
      {isModalOpen && (
        <AddUserModal 
          onClose={() => setIsModalOpen(false)} 
          onUserAdded={handleUserAdded}
        />
      )}

      {userToDelete && (
        <DeleteConfirmationModal
          user={userToDelete}
          onClose={() => setUserToDelete(null)}
          onSuccess={handleDeletionSuccess}
        />
      )}


      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between px- sm:px-5 lg:px-6 mt-10">
          
          {/* Left Side: Greeting and Description */}
          <div className="flex-1 space-y-2">
            <h1 className="text-3xl font-bold text-gray-900">
              Merhaba, {user}
            </h1>
            <p className="text-md text-gray-500 md:w-[700px]">
              Bu panel üzerinden tüm kullanıcıları görüntüleyebilir, isim, e-posta veya role göre filtreleme yapabilir, yeni kullanıcılar ekleyebilir ya da mevcut kullanıcıları düzenleyip silebilirsiniz.
            </p>
          </div>
          
          {/* Right Side: Action Button */}
          <div className="hidden sm:flex-shrink-0 lg:flex">
            <button 
              onClick={() => setIsModalOpen(true)}
              className="flex w-full items-center justify-center sm:justify-end sm:w-5 gap-2 rounded-md border bg-blue-500 text-white hover:bg-blue-600 px-4 py-2 md:w-auto"
            >
              <Plus className="h-5 w-5" />
              <span>Kullanıcı Ekle</span>
            </button>
          </div>

        </div>

        <div className="mt-8 bg-white p-6 rounded-lg shadow-sm">
          <div className="flex flex-col md:flex-row justify-between mb-6 gap-6">
            <div className="flex items-center gap-4">
            <h2 className="text-2xl font-bold text-gray-800">{(search || role) ? `Sonuç: ${users.length}` : 'Tüm Kullanıcılar'}</h2>
            <div className="text-red-600"> {(search || role) ? 'Tüm kullanıcılar için filtreleri temizleyin.' : ''} </div>
            </div>
            <div className="flex items-center gap-2 w-full md:w-auto">
              <div className="relative w-full md:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="İsme veya emaile göre arama yapın..."
                  className="pl-10 w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-primary-light"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              

             {/* The container div */}
              <div className="relative flex items-center bg-white border border-gray-300 rounded-md hover:bg-gray-50">
                {/* The clickable label that covers the whole area */}
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
                    <option value="">Filter by Role</option>
                    <option value="Admin">Admin</option>
                    <option value="Manager">Manager</option>
                    <option value="User">User</option>
                  </select>
                </label>
              </div>
              {(search || role) && (
                <button
                  onClick={() => {
                    setSearch('');
                    setRole('');
                  }}
                  className="ml-2 text-blue-600 hover:underline"
                >
                  Filtreleri temizle
                </button>
              )}
              {/* Right Side: Action Button */}
              <button 
                onClick={() => setIsModalOpen(true)}
                className=" flex lg:hidden items-center gap-2 px-4 py-2 text-black bg-primary rounded-md hover:bg-primary-light"
              >
                <Plus className="h-5 w-5" />
                <span>Kullanıcı Ekle</span>
              </button>
              </div>
            </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="p-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"></th>
                  <th className="p-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">KULLANICI</th>
                  <th className="p-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ROL</th>
                  <th className="p-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">EKLENME</th>
                  <th className="p-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Son GİRİŞLER</th>
                  <th className="p-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">İZİNLER</th>
                  <th className="p-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">EYLEMLER</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {users.map((user, idx) => (
                  <tr key={user.email} className="hover:bg-gray-50">
                    <td className="p-4">
                      {/* <input type="checkbox" className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded" /> */}
                      <span className="text-gray-400"> {idx + 1}</span>
                    </td>
                    <td className="p-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{user.firstName} {user.lastName}</div>
                          <div className="text-sm text-gray-500">{user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 whitespace-nowrap">
                      <span className={cn('px-2 inline-flex text-xs leading-5 font-semibold rounded-full', getRoleClass(user.role))}>
                        {user.role}
                      </span>
                    </td>              
                    <td className="p-4 whitespace-nowrap text-sm text-gray-500">{user.createdAt}</td>
                    <td className="p-4 whitespace-nowrap text-sm text-gray-500">{user.lastLogin ?? 'Never'}</td>
                    <td className="p-4 whitespace-nowrap text-sm text-gray-500"> TO DO </td>
                    <td className="p-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-3">
                        {/* <button className="text-primary-light hover:text-primary" title="Edit User"><Pencil className="h-5 w-5" /></button> */}
                        <button 
                          onClick={() => setUserToDelete(user)}
                          className="text-red-500 hover:text-red-700" title="Delete User"><Trash2 className="h-5 w-5" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <Pagination currentPage={currentPage} totalPages={totalPages} />
        </div>
      </div>
    </div>
    </RequireRole>
  );
}
