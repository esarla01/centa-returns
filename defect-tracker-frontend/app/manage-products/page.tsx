'use client';

import { useEffect, useState, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Plus, Search, ListFilter, Trash2, ChevronDown, ChevronUp, Filter, Package } from 'lucide-react';
import { ProductModel, ProductType } from '@/lib/types';
import { cn } from '@/lib/utils';
import Header from '@/app/components/Header';
import Pagination from '@/app/components/Pagination';
import AddProductModal from '../components/products/AddProductModal';
import DeleteProductModal from '../components/products/DeleteProductModal';
import { RequirePermission } from '../components/RequirePermission';
import { useAuth } from '../contexts/AuthContext';
import { API_ENDPOINTS, buildApiUrl } from '@/lib/api';

// Helper to get a color style based on product type
const getTypeClass = (type: ProductType) => {
  switch (type) {
    case 'Aşırı Yük Sensörü': return 'bg-red-100 text-red-800';
    case 'Kapı Dedektörü': return 'bg-green-100 text-green-800';
    case 'Kontrol Ünitesi': return 'bg-indigo-100 text-indigo-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};

// Product Filters Interface
interface ProductFilters {
  search: string;
  typeFilter: string;
}

function ProductsContent() {
  // Loading state for the user
  const { loading } = useAuth();

  const searchParams = useSearchParams();
  const pageParam = searchParams.get('page');
  const currentPage = Number(pageParam) || 1;

  const [products, setProducts] = useState<ProductModel[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFilters] = useState<ProductFilters>({
    search: '',
    typeFilter: '',
  });

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<ProductModel | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Mobile filter state
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const fetchProducts = useCallback(async () => {
    setIsLoading(true);
    const params = new URLSearchParams({
      page: String(currentPage),
      limit: '4',
      ...(filters.search ? { search: filters.search } : {}),
      ...(filters.typeFilter ? { type: filters.typeFilter } : {}),
    });

    try {
      const res = await fetch(buildApiUrl(API_ENDPOINTS.PRODUCTS) + '?' + params.toString(), {
        method: 'GET',
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      setProducts(data.products);
      setTotalPages(data.totalPages);
      setIsLoading(false);
    } catch (error) {
      console.error('Error fetching products:', error);
      setProducts([]);
    }
  }, [currentPage, filters]);

  useEffect(() => {
    if (!loading) {
      fetchProducts();
    }
  }, [currentPage, filters, loading, fetchProducts]);

  const handleSuccess = () => {
    setIsAddModalOpen(false);
    setProductToDelete(null);
    fetchProducts();
  };

  // Clear all filters
  const clearFilters = () => {
    setFilters({ search: '', typeFilter: '' });
    setIsFilterOpen(false);
  };

  // Check if any filters are active
  const hasActiveFilters = filters.search || filters.typeFilter;

  return (
    <RequirePermission permission="PAGE_VIEW_PRODUCT_LIST">
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
        <Header onLogout={() => {}} />

        {isAddModalOpen && <AddProductModal onClose={() => setIsAddModalOpen(false)} onSuccess={handleSuccess} />}
        {productToDelete && <DeleteProductModal product={productToDelete} onClose={() => setProductToDelete(null)} onSuccess={handleSuccess} />}

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Simplified Header Section */}
          <div className="flex items-center justify-between mt-6 mb-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                Ürün Yönetimi
              </h1>
              <p className="text-sm text-gray-500 mt-1 hidden md:block">
                Ürün modellerini görüntüleme, arama ve yönetim
              </p>
            </div>
            
            {/* Floating Action Button for Mobile */}
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="md:hidden fixed bottom-6 right-6 z-50 flex items-center justify-center w-14 h-14 bg-blue-500 text-white rounded-full shadow-lg hover:bg-blue-600 transition-colors"
            >
              <Plus className="h-6 w-6" />
            </button>

            {/* Desktop Add Product Button */}
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="hidden md:flex items-center gap-2 rounded-md border bg-blue-500 text-white hover:bg-blue-600 px-4 py-2"
            >
              <Plus className="h-5 w-5" />
              <span>Yeni Model Ekle</span>
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
                  placeholder="Modele göre ara..."
                  className="pl-10 w-full border border-gray-300 rounded-md py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={filters.search}
                  onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                />
              </div>

              {/* Type Filter */}
              <div className="relative">
                <ListFilter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <select
                  value={filters.typeFilter} 
                  onChange={(e) => setFilters({ ...filters, typeFilter: e.target.value })}
                  className="pl-10 w-full border border-gray-300 rounded-md py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Tüm Tipler</option>
                  <option value="door_detector">Kapı Dedektörü</option>
                  <option value="overload">Aşırı Yük Sensörü</option>
                  <option value="control_unit">Kontrol Ünitesi</option>
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
                  {hasActiveFilters ? 'Arama Sonuçları' : 'Tüm Ürün Modelleri'}
                </h2>
                {hasActiveFilters && (
                  <div className="text-red-600 text-sm">
                    Tüm ürün modelleri için filtreleri temizleyin.
                  </div>
                )}
              </div>
              
              <div className="flex items-center gap-3">
                {/* Search Input */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Modele göre ara..."
                    className="pl-10 w-64 border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    value={filters.search}
                    onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                  />
                </div>

                {/* Type Filter */}
                <div className="relative">
                  <ListFilter className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <select
                    value={filters.typeFilter} 
                    onChange={(e) => setFilters({ ...filters, typeFilter: e.target.value })}
                    className="pl-10 border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Tüm Tipler</option>
                    <option value="door_detector">Kapı Dedektörü</option>
                    <option value="overload">Aşırı Yük Sensörü</option>
                    <option value="control_unit">Kontrol Ünitesi</option>
                  </select>
                </div>

                {/* Clear Filters Button */}
                {hasActiveFilters && (
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
            ) : products.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-gray-400 mb-2">
                  <Package className="h-12 w-12 mx-auto" />
                </div>
                <p className="text-gray-500">
                  {hasActiveFilters ? 'Arama kriterlerinize uygun ürün modeli bulunamadı.' : 'Henüz ürün modeli bulunmuyor.'}
                </p>
              </div>
            ) : (
              products.map((product, idx) => (
                <div key={product.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3 flex-1">
                      {/* Product Icon */}
                      <div className="flex-shrink-0">
                        <div className="h-12 w-12 rounded-lg bg-blue-100 flex items-center justify-center">
                          <Package className="h-6 w-6 text-blue-600" />
                        </div>
                      </div>
                      
                      {/* Product Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-sm font-semibold text-gray-900 truncate">
                            {product.name}
                          </h3>
                          <span className={cn('px-2 py-1 text-xs font-medium rounded-full', getTypeClass(product.product_type))}>
                            {product.product_type}
                          </span>
                        </div>
                        <p className="text-xs text-gray-400">
                          Model ID: {product.id}
                        </p>
                      </div>
                    </div>
                    
                    {/* Action Button */}
                    <button 
                      onClick={() => setProductToDelete(product)}
                      className="flex-shrink-0 ml-2 p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-full transition-colors" 
                      title="Modeli Sil"
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
                      <th className="px-4 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">MODEL ADI</th>
                      <th className="px-4 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">TİP</th>
                      <th className="px-4 py-4 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">EYLEMLER</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {isLoading ? (
                      <tr>
                        <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                          <div className="flex items-center justify-center">
                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mr-2"></div>
                            Yükleniyor...
                          </div>
                        </td>
                      </tr>
                    ) : products.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                          {hasActiveFilters ? 'Arama kriterlerinize uygun ürün modeli bulunamadı.' : 'Henüz ürün modeli bulunmuyor.'}
                        </td>
                      </tr>
                    ) : (
                      products.map((product, idx) => (
                        <tr key={product.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {((currentPage - 1) * 10) + idx + 1}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="text-sm font-medium text-gray-900">{product.name}</div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={cn('px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full', getTypeClass(product.product_type))}>
                              {product.product_type}
                            </span>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-center text-sm font-medium">
                            <button 
                              onClick={() => setProductToDelete(product)} 
                              className="text-red-500 hover:text-red-700 transition-colors p-1 rounded hover:bg-red-50" 
                              title="Modeli Sil"
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

export default function ProductsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Yükleniyor...</p>
        </div>
      </div>
    }>
      <ProductsContent />
    </Suspense>
  );
}