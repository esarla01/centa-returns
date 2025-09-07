'use client';

import { useEffect, useState, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Search, ChevronDown, ChevronUp, Filter, User, Calendar, FileText, Eye } from 'lucide-react';
import { UserActionLog } from '@/lib/types';
import { cn, truncateTextWithEllipsis } from '@/lib/utils';
import Header from '@/app/components/Header';
import Pagination from '@/app/components/Pagination';
import { RequirePermission } from '../components/RequirePermission';
import { useAuth } from '../contexts/AuthContext';
import { API_ENDPOINTS, buildApiUrl } from '@/lib/api';

function UserActionLogsContent() {
  // Loading state for the user
  const { loading } = useAuth();

  // Pagination state
  const searchParams = useSearchParams();
  const pageParam = searchParams.get('page');
  const currentPage = Number(pageParam) || 1;
  const limitParam = searchParams.get('limit');
  const limit = limitParam ? Number(limitParam) : 5;

  // State for logs, total pages, and search term
  const [logs, setLogs] = useState<UserActionLog[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');

  // Loading state
  const [isLoading, setIsLoading] = useState(true);

  // Mobile filter state
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // Fetch logs from the API
  const fetchLogs = useCallback(async () => {
    setIsLoading(true);
    const params = new URLSearchParams({
      page: String(currentPage),
      limit: limit.toString(),
      ...(search ? { search } : {}),
    });

    try {
      const res = await fetch(buildApiUrl('/user-action-logs') + '?' + params.toString(), {
        method: 'GET',
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed to fetch action logs');
      const data = await res.json();
      setLogs(data.logs);
      setTotalPages(data.totalPages);
      setIsLoading(false);
    } catch (error) {
      console.error('Error fetching action logs:', error);
      setLogs([]);
    }
  }, [currentPage, search, limit]);

  // Fetch logs when page or search term changes
  useEffect(() => {
    if (!loading) {
      fetchLogs();
    }
  }, [currentPage, search, loading, fetchLogs]);

  // Clear all filters
  const clearFilters = () => {
    setSearch('');
    setIsFilterOpen(false);
  };

  // Check if any filters are active
  const hasActiveFilters = search;

  // Format action type for display
  const formatActionType = (actionType: string) => {
    const actionTypeMap: Record<string, string> = {
      'CASE_CREATED': 'Vaka Oluşturuldu',
      'CUSTOMER_CREATED': 'Müşteri Oluşturuldu',
      'PRODUCT_CREATED': 'Ürün Modeli Oluşturuldu',
      'STAGE_DELIVERED_COMPLETED': 'Teslim Alındı Tamamlandı',
      'STAGE_TECHNICAL_REVIEW_COMPLETED': 'Teknik İnceleme Tamamlandı',
      'STAGE_PAYMENT_COLLECTION_COMPLETED': 'Ödeme Tahsilatı Tamamlandı',
      'STAGE_SHIPPING_COMPLETED': 'Kargoya Veriliyor Tamamlandı',
      'CASE_COMPLETED': 'Vaka Tamamlandı',
      'EMAIL_SENT': 'E-posta Gönderildi',
      'SERVICE_CREATED': 'Arıza Tipi Oluşturuldu',
      'SERVICE_DELETED': 'Arıza Tipi Silindi',
      'PRODUCT_DELETED': 'Ürün Modeli Silindi',
      'CUSTOMER_DELETED': 'Müşteri Silindi'
    };
    return actionTypeMap[actionType] || actionType;
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    try {
      // Ensure the date string is properly formatted for parsing
      let dateStr = dateString;
      if (!dateStr.endsWith('Z') && !dateStr.includes('+') && !dateStr.includes('-', 10)) {
        // If no timezone info, assume it's UTC
        dateStr = dateStr + 'Z';
      }
      
      const date = new Date(dateStr);
      
      // Check if the date is valid
      if (isNaN(date.getTime())) {
        return dateString;
      }
      
      return date.toLocaleString('tr-TR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'Europe/Istanbul'
      });
    } catch {
      return dateString;
    }
  };

  return (
    <RequirePermission permission="PAGE_VIEW_CASE_TRACKING">
      <div className="bg-gradient-to-b from-blue-50 to-white pb-20 md:pb-0">
        <Header onLogout={() => {}} />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Simplified Header Section */}
          <div className="flex items-center justify-between mt-6 mb-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                Kullanıcı İşlem Geçmişi
              </h1>
              <p className="text-sm text-gray-500 mt-1 hidden md:block">
                Sistemdeki tüm kullanıcı işlemlerini görüntüleme ve takip
              </p>
            </div>
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
                  placeholder="Kullanıcı veya işlem türüne göre ara..."
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
                  {search ? 'Arama Sonuçları' : 'Tüm İşlem Geçmişi'}
                </h2>
                {search && (
                  <div className="text-red-600 text-sm">
                    Tüm işlemler için filtreleri temizleyin.
                  </div>
                )}
              </div>
              
              <div className="flex items-center gap-3">
                {/* Search Input */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Kullanıcı veya işlem türüne göre ara..."
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
          <div className="md:hidden space-y-3 pb-6">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mr-3"></div>
                <span className="text-gray-500">Yükleniyor...</span>
              </div>
            ) : logs.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-gray-400 mb-2">
                  <FileText className="h-12 w-12 mx-auto" />
                </div>
                <p className="text-gray-500">
                  {search ? 'Arama kriterlerinize uygun işlem bulunamadı.' : 'Henüz işlem geçmişi bulunmuyor.'}
                </p>
              </div>
            ) : (
              logs.map((log, idx) => (
                <div key={log.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                  <div className="space-y-3">
                    {/* User Info */}
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-blue-500 flex-shrink-0" />
                      <span className="text-sm font-semibold text-gray-900">
                        {log.user_name}
                      </span>
                    </div>
                    
                    {/* Action Type */}
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-gray-400 flex-shrink-0" />
                      <span className="text-sm text-gray-700">
                        {formatActionType(log.action_type)}
                      </span>
                    </div>
                    
                    {/* Case ID */}
                    {log.return_case_id > 0 && (
                      <div className="flex items-center gap-2">
                        <Eye className="h-4 w-4 text-gray-400 flex-shrink-0" />
                        <span className="text-sm text-gray-600">
                          Vaka #{log.return_case_id}
                        </span>
                      </div>
                    )}
                    
                    {/* Additional Info */}
                    {log.additional_info && (
                      <div className="text-sm text-gray-600 bg-gray-50 p-2 rounded">
                        {log.additional_info}
                      </div>
                    )}
                    
                    {/* Date */}
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-gray-400 flex-shrink-0" />
                      <span className="text-xs text-gray-400">
                        {formatDate(log.created_at)}
                      </span>
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
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">KULLANICI</th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">İŞLEM TÜRÜ</th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">VAKA NO</th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">EK BİLGİ</th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">TARİH</th>
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
                    ) : logs.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                          {search ? 'Arama kriterlerinize uygun işlem bulunamadı.' : 'Henüz işlem geçmişi bulunmuyor.'}
                        </td>
                      </tr>
                    ) : (
                      logs.map((log, idx) => (
                        <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {((currentPage - 1) * limit) + idx + 1}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="text-sm font-medium text-gray-900">{log.user_name}</div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                            {formatActionType(log.action_type)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {log.return_case_id > 0 ? `#${log.return_case_id}` : '—'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {truncateTextWithEllipsis(log.additional_info, 30) || '—'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatDate(log.created_at)}
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
          <div className="mt-6 pb-6 md:pb-0">
            <Pagination currentPage={currentPage} totalPages={totalPages} />
          </div>
        </div>
      </div>
    </RequirePermission>
  );
}

export default function UserActionLogsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Yükleniyor...</p>
        </div>
      </div>
    }>
      <UserActionLogsContent />
    </Suspense>
  );
}
