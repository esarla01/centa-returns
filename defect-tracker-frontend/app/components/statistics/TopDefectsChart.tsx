'use client';

import { API_ENDPOINTS, buildApiUrl } from '@/lib/api';
import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import { ChevronDown } from 'lucide-react';

interface TopDefectData {
  service_name: string;
  product_type: string;
  occurrence_count: number;
  percentage: number;
}

interface TopDefectsResponse {
  total_items: number;
  total_service_occurrences: number;
  data: TopDefectData[];
}

interface TopDefectsChartProps {
  startDate: Date | null;
  endDate: Date | null;
  refreshKey: number;
}

interface ServiceDefinition {
  id: number;
  service_name: string;
  product_type: string;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

const PRODUCT_TYPE_ENUM: { [key: string]: string } = {
  'overload': 'Aşırı Yük Sensörü',
  'door_detector': 'Fotosel',
  'control_unit': 'Kontrol Ünitesi'
};

export default function TopDefectsChart({
  startDate,
  endDate,
  refreshKey,
}: TopDefectsChartProps) {
  const [data, setData] = useState<TopDefectData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalItems, setTotalItems] = useState(0);
  const [totalServiceOccurrences, setTotalServiceOccurrences] = useState(0);

  // Filter states
  const [productType, setProductType] = useState<string>('');
  const [serviceId, setServiceId] = useState<string>('');
  const [availableServices, setAvailableServices] = useState<ServiceDefinition[]>([]);
  const [loadingServices, setLoadingServices] = useState(false);

  // Fetch available services when product type changes
  useEffect(() => {
    if (!productType) {
      setAvailableServices([]);
      setServiceId('');
      return;
    }

    const fetchServices = async () => {
      setLoadingServices(true);
      try {
        const response = await fetch(
          buildApiUrl(API_ENDPOINTS.SERVICES) + `?type=${productType}&limit=1000`,
          {
            credentials: 'include',
          }
        );

        if (!response.ok) {
          throw new Error('Servisler yüklenirken hata oluştu');
        }

        const result = await response.json();
        setAvailableServices(result.services || []);
      } catch (err) {
        console.error('Error fetching services:', err);
        setAvailableServices([]);
      } finally {
        setLoadingServices(false);
      }
    };

    fetchServices();
  }, [productType]);

  // Fetch chart data
  useEffect(() => {
    if (!startDate || !endDate) return;

    const fetchData = async () => {
      setLoading(true);
      setError(null);

      try {
        const startDateStr = startDate.toISOString().split('T')[0];
        const endDateStr = endDate.toISOString().split('T')[0];

        const params = new URLSearchParams({
          start_date: startDateStr,
          end_date: endDateStr,
        });

        if (productType) {
          params.append('product_type', productType);
        }

        if (serviceId) {
          params.append('service_id', serviceId);
        }

        const response = await fetch(
          buildApiUrl(API_ENDPOINTS.REPORTS.TOP_DEFECTS) + `?${params.toString()}`,
          {
            credentials: 'include',
          }
        );

        if (!response.ok) {
          throw new Error('Veri yüklenirken hata oluştu');
        }

        const result: TopDefectsResponse = await response.json();
        setData(result.data);
        setTotalItems(result.total_items);
        setTotalServiceOccurrences(result.total_service_occurrences);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Bilinmeyen hata');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [startDate, endDate, refreshKey, productType, serviceId]);

  const isEmpty = !loading && (!data || data.length === 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Yükleniyor...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-red-500">Hata: {error}</div>
      </div>
    );
  }

  if (isEmpty) {
    return (
      <div className="flex flex-col">
        {/* Filters */}
        <div className="mb-4 grid grid-cols-1 md:grid-cols-2 gap-3">
          {/* Product Type Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Ürün Türü
            </label>
            <div className="relative">
              <select
                value={productType}
                onChange={(e) => {
                  setProductType(e.target.value);
                  setServiceId(''); // Reset service selection when product type changes
                }}
                className="w-full appearance-none border border-gray-300 rounded-lg px-3 py-2 pr-8 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              >
                <option value="">Tümü</option>
                {Object.entries(PRODUCT_TYPE_ENUM).map(([key, value]) => (
                  <option key={key} value={key}>
                    {value}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
          </div>

          {/* Service Name Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Arıza Tipi
            </label>
            <div className="relative">
              <select
                value={serviceId}
                onChange={(e) => setServiceId(e.target.value)}
                disabled={!productType || loadingServices}
                className="w-full appearance-none border border-gray-300 rounded-lg px-3 py-2 pr-8 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm disabled:bg-gray-100 disabled:cursor-not-allowed"
              >
                <option value="">Tümü</option>
                {availableServices.map((service) => (
                  <option key={service.id} value={service.id}>
                    {service.service_name}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
            {!productType && (
              <p className="mt-1 text-xs text-gray-500">
                Önce bir ürün türü seçin
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">Seçilen tarih aralığında veri bulunamadı</div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Filters */}
      <div className="mb-4 grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* Product Type Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Ürün Türü
          </label>
          <div className="relative">
            <select
              value={productType}
              onChange={(e) => {
                setProductType(e.target.value);
                setServiceId(''); // Reset service selection when product type changes
              }}
              className="w-full appearance-none border border-gray-300 rounded-lg px-3 py-2 pr-8 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            >
              <option value="">Tümü</option>
              {Object.entries(PRODUCT_TYPE_ENUM).map(([key, value]) => (
                <option key={key} value={key}>
                  {value}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          </div>
        </div>

        {/* Service Name Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Arıza Tipi
          </label>
          <div className="relative">
            <select
              value={serviceId}
              onChange={(e) => setServiceId(e.target.value)}
              disabled={!productType || loadingServices}
              className="w-full appearance-none border border-gray-300 rounded-lg px-3 py-2 pr-8 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm disabled:bg-gray-100 disabled:cursor-not-allowed"
            >
              <option value="">Tümü</option>
              {availableServices.map((service) => (
                <option key={service.id} value={service.id}>
                  {service.service_name}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          </div>
          {!productType && (
            <p className="mt-1 text-xs text-gray-500">
              Önce bir ürün türü seçin
            </p>
          )}
        </div>
      </div>

      {/* Total Display */}
      <div className="text-center mb-4">
        <p className="text-sm text-gray-600">
          Toplam İade Ürün Adedi: <span className="font-semibold text-gray-900">{totalItems}</span>
          {' · '}
          Toplam Tespit Edilen Arıza: <span className="font-semibold text-gray-900">{totalServiceOccurrences}</span>
        </p>
        {totalServiceOccurrences > totalItems && (
          <p className="text-xs text-gray-400 mt-1">
            Bir üründe birden fazla arıza tespit edilebileceğinden, arıza sayısı ürün adedinden yüksek olabilir.
          </p>
        )}
      </div>
      
      {/* Bar Chart */}
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis 
            dataKey="service_name" 
            angle={-45}
            textAnchor="end"
            height={100}
            interval={0}
            tick={{ fontSize: 11 }}
          />
          <YAxis 
            label={{ value: 'Arıza Adedi', angle: -90, position: 'insideLeft' }}
            allowDecimals={false}
          />
          <Tooltip
            formatter={(value: any, name: any, props: any) => [
              `${value} adet (${props.payload.percentage}%)`,
              'Arıza Adedi'
            ]}
            labelFormatter={(label: string) => `Arıza: ${label}`}
            contentStyle={{
              backgroundColor: 'white',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
            }}
          />
          <Legend 
            wrapperStyle={{ paddingTop: '20px' }}
            formatter={() => 'Arıza Adedi'}
          />
          <Bar dataKey="occurrence_count" fill="#8884d8">
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      {/* Data Table */}
      <div className="mt-6 overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Sıra
              </th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Arıza Tipi
              </th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Ürün Türü
              </th>
              <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Adet
              </th>
              <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Yüzde
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {data.map((item, index) => (
              <tr key={index} className="hover:bg-gray-50">
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                  {index + 1}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                  {item.service_name}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                  {item.product_type}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-gray-900">
                  {item.occurrence_count}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-right font-semibold text-gray-900">
                  {item.percentage}%
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
