'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Plus, Search, ListFilter, Pencil, Trash2 } from 'lucide-react';
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

export default function ProductsPage() {
  // Loading state for the user
  const { loading } = useAuth();

  // Name and surname from localStorage for the greeting
  const [userName, setUserName] = useState<string>('');

  const searchParams = useSearchParams();
  const pageParam = searchParams.get('page');
  const currentPage = Number(pageParam) || 1;

  const [products, setProducts] = useState<ProductModel[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<ProductModel | null>(null);
  
  const [isLoading, setIsLoading] = useState(true);

  const fetchProducts = async () => {
    setIsLoading(true);
    const params = new URLSearchParams({
      page: String(currentPage),
      limit: '10',
      ...(search ? { search } : {}),
      ...(typeFilter ? { type: typeFilter } : {}),
    });

    try {
      const res = await fetch(`http://localhost:5000/products?${params.toString()}`, {
        method: 'GET',
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
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
    if (!loading) {
      fetchProducts();
    }
  }, [currentPage, search, typeFilter, loading]);

  const handleSuccess = () => {
    setIsAddModalOpen(false);
    setProductToDelete(null);
    fetchProducts();
  };
  
  const clearFilters = () => {
    setSearch('');
    setTypeFilter('');
  }

  return (
    <RequirePermission permission="PAGE_VIEW_PRODUCT_LIST" >
    <div className="min-h-screen bg-gradient-to-b from-white to-blue-100">
      <Header onLogout={() => {}} />

      {isAddModalOpen && <AddProductModal onClose={() => setIsAddModalOpen(false)} onSuccess={handleSuccess} />}
      {productToDelete && <DeleteProductModal product={productToDelete} onClose={() => setProductToDelete(null)} onSuccess={handleSuccess} />}

      <div className="max-w-4xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between px-4 sm:px-5 lg:px-6 mt-10">
          <div className="flex-1 space-y-5">
            <div className="flex-1 space-y-3">
              <h1 className="text-3xl font-bold text-gray-900">
                Ürün Yönetimi Sayfasına Hoşgeldin
              </h1>
              <p className="text-md text-gray-500 md:w-[700px]">
                Bu panel üzerinden yeni ürün modelleri ekleyebilir, mevcutları düzenleyebilir veya silebilirsiniz.
              </p>
            </div>
          </div>
          <div className="hidden sm:flex-shrink-0 lg:flex">
            <button onClick={() => setIsAddModalOpen(true)} className="flex items-center gap-2 rounded-md border bg-blue-500 text-white hover:bg-blue-600 px-4 py-2">
              <Plus className="h-5 w-5" />
              <span>Yeni Model Ekle</span>
            </button>
          </div>
        </div>

        <div className="mt-8 bg-white p-6 rounded-lg shadow-sm">
            <div className="flex flex-col md:flex-row justify-between mb-6 gap-4">
                <div className="flex-col items-center gap-4">
                    <h2 className="text-2xl font-bold text-gray-800">
                        {(search || typeFilter) ? `Arama Sonuçları` : 'Tüm Ürün Modelleri'}
                    </h2>
                <div className="text-red-600"> {(search || typeFilter) ? 'Tüm ürün modelleri için filtreleri temizleyin.' : ''} </div>
            </div>
            <div className="flex items-center gap-2 w-full md:w-auto">
              <div className="relative w-full md:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input type="text" placeholder="Modele göre ara..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10 w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-2" />
              </div>
              <div className="relative">
                <ListFilter className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
                <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="pl-10 pr-4 appearance-none w-full border border-gray-300 rounded-md py-2 px-3 bg-white focus:outline-none focus:ring-2">
                  <option value="">Tipe Göre Filtrele</option>
                  <option value="overload">Tüm Ürünler</option>
                  <option value="door_detector">Kapı Dedektörü</option>
                  <option value="overload">Aşırı Yük Sensörü</option>
                  <option value="control_unit">Kontrol Ünitesi</option>
                </select>
              </div>
               {(search || typeFilter) && <button onClick={clearFilters} className="text-sm text-blue-600 hover:underline">Filtreyi Temizle</button>}
                <button 
                  onClick={() => setIsAddModalOpen(true)}
                  className=" flex lg:hidden items-center gap-2 px-4 py-2 text-black bg-primary rounded-md hover:bg-primary-light"
                >
                <Plus className="h-5 w-5" />
                <span>Model Ekle</span>
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
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
      </div>
    </div>
    </RequirePermission>
  );
}