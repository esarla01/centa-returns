'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Plus, Search, ListFilter, Trash2, X } from 'lucide-react';
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

// Filter Sidebar Component
interface ProductFilters {
  search: string;
  typeFilter: string;
}

interface FilterSidebarProps {
  filters: ProductFilters;
  setFilters: (filters: ProductFilters) => void;
}

function FilterSidebar({ filters, setFilters }: FilterSidebarProps) {
  const clearFilters = () => {
    console.log('Clearing filters');
    setFilters({ search: '', typeFilter: '' });
  };

  const handleSearchChange = (value: string) => {
    console.log('Search filter changed to:', value);
    setFilters({ ...filters, search: value });
  };

  const handleTypeChange = (value: string) => {
    console.log('Type filter changed to:', value);
    setFilters({ ...filters, typeFilter: value });
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Filtreler</h3>
        {(filters.search || filters.typeFilter) && (
          <button
            onClick={clearFilters}
            className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
          >
            <X className="h-4 w-4" />
            Temizle
          </button>
        )}
      </div>

      <div className="space-y-4">
        {/* Search Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Model Adı
          </label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Modele göre ara..."
              value={filters.search}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="pl-10 w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        {/* Type Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Ürün Tipi
          </label>
          <div className="relative">
            <ListFilter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
            <select
              value={filters.typeFilter}
              onChange={(e) => handleTypeChange(e.target.value)}
              className="pl-10 pr-4 appearance-none w-full border border-gray-300 rounded-md py-2 px-3 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Tüm Tipler</option>
              <option value="door_detector">Kapı Dedektörü</option>
              <option value="overload">Aşırı Yük Sensörü</option>
              <option value="control_unit">Kontrol Ünitesi</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
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
      <div className="min-h-screen bg-gradient-to-b from-white to-blue-100">
        <Header onLogout={() => {}} />

        {isAddModalOpen && <AddProductModal onClose={() => setIsAddModalOpen(false)} onSuccess={handleSuccess} />}
        {productToDelete && <DeleteProductModal product={productToDelete} onClose={() => setProductToDelete(null)} onSuccess={handleSuccess} />}

        <div className="w-full max-w-9xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header Section */}
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mt-7">
            <div className="flex-1 space-y-5">
              <div className="flex-1 space-y-3">
                <h1 className="text-3xl font-bold text-gray-900">
                  Ürün Yönetimi Sayfasına Hoşgeldin
                </h1>
                <p className="text-md text-gray-500">
                  Bu panel üzerinden yeni ürün modelleri ekleyebilir, mevcutları düzenleyebilir veya silebilirsiniz.
                </p>
              </div>
            </div>
            <div className="hidden sm:flex-shrink-0 lg:flex">
              <button
                onClick={() => setIsAddModalOpen(true)}
                className="flex items-center gap-2 rounded-md border bg-blue-500 text-white hover:bg-blue-600 px-4 py-2"
              >
                <Plus className="h-5 w-5" />
                <span>Yeni Model Ekle</span>
              </button>
            </div>
          </div>

          <div className="flex flex-col lg:flex-row gap-6 mt-8">
            {/* Left Sidebar Filters */}
            <div className="lg:w-80 flex-shrink-0">
              <FilterSidebar filters={filters} setFilters={setFilters} />
            </div>

            {/* Main content */}
            <main className="flex-1 min-w-0">
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
                  <div className="flex-1">
                    <h2 className="text-xl lg:text-2xl font-bold text-gray-800">
                      {Object.values(filters).some(value => value) ? 'Arama Sonuçları' : 'Tüm Ürün Modelleri'}
                    </h2>
                    <div className="text-red-600 mt-2">
                      {Object.values(filters).some(value => value) ? 'Tüm ürün modelleri için filtreleri temizleyin.' : ''}
                    </div>
                  </div>
                  <div>
                    <button
                      onClick={() => setIsAddModalOpen(true)}
                      className="flex lg:hidden items-center gap-2 rounded-md border bg-blue-500 text-white hover:bg-blue-600 px-4 py-2"
                    >
                      <Plus className="h-5 w-5" />
                      <span>Yeni Model Ekle</span>
                    </button>
                  </div>
                </div>

                <div className="overflow-hidden">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="p-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">MODEL ADI</th>
                        <th className="p-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">TİP</th>
                        <th className="p-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">EYLEMLER</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {isLoading ? (
                        <tr><td colSpan={3} className="p-4 text-center text-gray-500">Yükleniyor...</td></tr>
                      ) : products.length === 0 ? (
                        <tr><td colSpan={3} className="p-4 text-center text-gray-500">Ürün modeli bulunamadı.</td></tr>
                      ) : (
                        products.map((product) => (
                          <tr key={product.id} className="hover:bg-gray-50">
                            <td className="p-4 whitespace-nowrap text-sm font-medium text-gray-900">{product.name}</td>
                            <td className="p-4 whitespace-nowrap">
                              <span className={cn('px-2 inline-flex text-xs leading-5 font-semibold rounded-full', getTypeClass(product.product_type))}>
                                {product.product_type}
                              </span>
                            </td>
                            <td className="p-4 whitespace-nowrap text-right text-sm font-medium">
                              <div className="flex items-center justify-end space-x-4">
                                <button onClick={() => setProductToDelete(product)} className="text-red-500 hover:text-red-700" title="Delete Model"><Trash2 className="h-5 w-5" /></button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                <Pagination currentPage={currentPage} totalPages={totalPages} />
              </div>
            </main>
          </div>
        </div>
      </div>
    </RequirePermission>
  );
}