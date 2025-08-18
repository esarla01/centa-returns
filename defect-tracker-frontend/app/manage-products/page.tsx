'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Plus, Search, ListFilter, Trash2 } from 'lucide-react';
import { ProductModel, ProductType } from '@/lib/types';
import { cn } from '@/lib/utils';
import Header from '@/app/components/Header';
import Pagination from '@/app/components/Pagination';
import AddProductModal from '../components/products/AddProductModal';
import DeleteProductModal from '../components/products/DeleteProductModal';
import { RequirePermission } from '../components/RequirePermission';
import { useAuth } from '../contexts/AuthContext';

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

export default function ProductsPage() {
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

  const fetchProducts = async () => {
    setIsLoading(true);
    const params = new URLSearchParams({
      page: String(currentPage),
      limit: '10',
      ...(filters.search ? { search: filters.search } : {}),
      ...(filters.typeFilter ? { type: filters.typeFilter } : {}),
    });

    console.log('Fetching products with filters:', filters);
    console.log('API URL:', `http://localhost:5000/products?${params.toString()}`);

    try {
      const res = await fetch(`http://localhost:5000/products?${params.toString()}`, {
        method: 'GET',
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      console.log('Received products data:', data);
      setProducts(data.products);
      setTotalPages(data.totalPages);
    } catch (error) {
      console.error('Error fetching products:', error);
      setProducts([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    console.log('Filters changed:', filters);
  }, [filters]);

  useEffect(() => {
    if (!loading) {
      fetchProducts();
    }
  }, [currentPage, filters, loading]);

  const handleSuccess = () => {
    setIsAddModalOpen(false);
    setProductToDelete(null);
    fetchProducts();
  };

  return (
    <RequirePermission permission="PAGE_VIEW_PRODUCT_LIST">
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
        <Header onLogout={() => {}} />

        {isAddModalOpen && <AddProductModal onClose={() => setIsAddModalOpen(false)} onSuccess={handleSuccess} />}
        {productToDelete && <DeleteProductModal product={productToDelete} onClose={() => setProductToDelete(null)} onSuccess={handleSuccess} />}

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header Section */}
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mt-7">
            <div className="flex-1 space-y-3">
              <h1 className="text-3xl font-bold text-gray-900">
                Ürün Yönetimi
              </h1>
              <p className="text-md text-gray-500 max-w-2xl">
                Bu panel üzerinden yeni ürün modelleri ekleyebilir, mevcutları düzenleyebilir veya silebilirsiniz.
              </p>
            </div>
            <div className="flex-shrink-0">
              <button
                onClick={() => setIsAddModalOpen(true)}
                className="flex items-center gap-2 rounded-md border bg-blue-500 text-white hover:bg-blue-600 px-4 py-2"
              >
                <Plus className="h-5 w-5" />
                <span>Yeni Model Ekle</span>
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
                    {Object.values(filters).some(value => value) ? 'Arama Sonuçları' : 'Tüm Ürün Modelleri'}
                  </h2>
                  {Object.values(filters).some(value => value) && (
                    <div className="text-red-600 text-sm">
                      Tüm ürün modelleri için filtreleri temizleyin.
                    </div>
                  )}
                </div>
                
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                  {/* Search Input */}
                  <div className="relative flex-1 sm:flex-none sm:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Modele göre ara..."
                      className="pl-10 w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      value={filters.search}
                      onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                    />
                  </div>

                  {/* Type Filter */}
                  <div className="relative flex items-center bg-white border border-gray-300 rounded-md hover:bg-gray-50">
                    <label 
                      htmlFor="type-filter" 
                      className="flex items-center gap-2 w-full cursor-pointer px-4 py-2"
                    >
                      <ListFilter className="h-5 w-5 text-gray-500 flex-shrink-0" />
                      <select
                        id="type-filter"
                        value={filters.typeFilter} 
                        onChange={(e) => setFilters({ ...filters, typeFilter: e.target.value })}
                        className="appearance-none bg-transparent w-full text-sm text-gray-700 focus:outline-none"
                      >
                        <option value="">Tüm Tipler</option>
                        <option value="door_detector">Kapı Dedektörü</option>
                        <option value="overload">Aşırı Yük Sensörü</option>
                        <option value="control_unit">Kontrol Ünitesi</option>
                      </select>
                    </label>
                  </div>

                  {/* Clear Filters Button */}
                  {(filters.search || filters.typeFilter) && (
                    <button
                      onClick={() => setFilters({ search: '', typeFilter: '' })}
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
                              {Object.values(filters).some(value => value) ? 'Arama kriterlerinize uygun ürün modeli bulunamadı.' : 'Henüz ürün modeli bulunmuyor.'}
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