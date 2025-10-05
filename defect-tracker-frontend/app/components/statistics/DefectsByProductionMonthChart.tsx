'use client';

import { useEffect, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LabelList } from "recharts";
import { API_ENDPOINTS, buildApiUrl } from '@/lib/api';
import { ChevronDown } from 'lucide-react';

type Props = {
  startDate: Date | null;
  endDate: Date | null;
  refreshKey?: number; // optional to force re-fetch on Apply
};

type ChartData = {
  month: string;
  defect_count: number;
};

interface ProductModel {
  id: number;
  name: string;
  product_type: string;
}

interface ServiceDefinition {
  id: number;
  service_name: string;
  product_type: string;
}

const PRODUCT_TYPE_ENUM: { [key: string]: string } = {
  'overload': 'Aşırı Yük Sensörü',
  'door_detector': 'Fotosel',
  'control_unit': 'Kontrol Ünitesi'
};

export default function DefectsByProductionMonthChart({ startDate, endDate, refreshKey }: Props) {
  const [data, setData] = useState<ChartData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPlaceholder, setShowPlaceholder] = useState(false);

  // Filter states
  const [productType, setProductType] = useState<string>('');
  const [productModelId, setProductModelId] = useState<string>('');
  const [serviceId, setServiceId] = useState<string>('');
  const [availableProductModels, setAvailableProductModels] = useState<ProductModel[]>([]);
  const [availableServices, setAvailableServices] = useState<ServiceDefinition[]>([]);
  const [loadingProductModels, setLoadingProductModels] = useState(false);
  const [loadingServices, setLoadingServices] = useState(false);

  // Fetch product models based on selected product type
  useEffect(() => {
    if (!productType) {
      setAvailableProductModels([]);
      setProductModelId('');
      return;
    }

    const fetchProductModels = async () => {
      setLoadingProductModels(true);
      try {
        const response = await fetch(
          buildApiUrl(API_ENDPOINTS.PRODUCTS) + `?type=${productType}&limit=1000`,
          {
            credentials: 'include',
          }
        );

        if (!response.ok) {
          throw new Error('Ürün modelleri yüklenirken hata oluştu');
        }

        const result = await response.json();
        setAvailableProductModels(result.products || []);
      } catch (err) {
        console.error('Error fetching product models:', err);
        setAvailableProductModels([]);
      } finally {
        setLoadingProductModels(false);
      }
    };

    fetchProductModels();
  }, [productType]);

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

  const fetchData = async () => {
    if (!startDate || !endDate) return;

    try {
      setLoading(true);
      setError(null);
      setShowPlaceholder(false);

      // Check if date range is less than one month
      if (startDate && endDate) {
        const deltaDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
        if (deltaDays < 30) {
          setShowPlaceholder(true);
          setData([]);
          return;
        }
      }

      const sd = startDate ? startDate.toISOString().split("T")[0] : "";
      const ed = endDate ? endDate.toISOString().split("T")[0] : "";
      
      const params = new URLSearchParams({
        start_date: sd,
        end_date: ed,
      });

      if (productType) {
        params.append('product_type', productType);
      }

      if (productModelId) {
        params.append('product_model_id', productModelId);
      }

      if (serviceId) {
        params.append('service_id', serviceId);
      }

      const res = await fetch(
        buildApiUrl(API_ENDPOINTS.REPORTS.DEFECTS_BY_PRODUCTION_MONTH) + `?${params.toString()}`,
        {
          credentials: 'include',
        }
      );
      
      if (!res.ok) {
        const errorData = await res.json();
        if (errorData.error === "Date range must be at least one month") {
          setShowPlaceholder(true);
          setData([]);
          return;
        }
        throw new Error(errorData.error || 'Server error');
      }
      
      const json = await res.json();
      setData(json.data || []);
    } catch (e: any) {
      setError(e.message || 'Hata');
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startDate?.getTime(), endDate?.getTime(), refreshKey, productType, productModelId, serviceId]);

  const isEmpty = !loading && (!data || data.length === 0) && !showPlaceholder;

  // Format month labels for better display
  const formatMonthLabel = (month: string) => {
    try {
      const [year, monthNum] = month.split('-');
      const monthNames = [
        'Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz',
        'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'
      ];
      return `${monthNames[parseInt(monthNum) - 1]} ${year}`;
    } catch {
      return month;
    }
  };

  if (showPlaceholder) {
    return (
      <div className="flex flex-col">
        {/* Filters */}
        <div className="mb-4 grid grid-cols-1 md:grid-cols-3 gap-3">
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
                setProductModelId(''); // Reset product model selection when product type changes
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

        {/* Product Model Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Ürün Modeli
          </label>
          <div className="relative">
            <select
              value={productModelId}
              onChange={(e) => setProductModelId(e.target.value)}
              disabled={!productType || loadingProductModels}
              className="w-full appearance-none border border-gray-300 rounded-lg px-3 py-2 pr-8 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm disabled:bg-gray-100 disabled:cursor-not-allowed"
            >
              <option value="">Tümü</option>
              {availableProductModels.map((model) => (
                <option key={model.id} value={model.id}>
                  {model.name}
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

        {/* Service Type Filter */}
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

      <div className="text-sm text-gray-500 text-center py-8">
          Seçilen tarih aralığı bir aydan az olduğu için bu grafik gösterilmiyor.
          <br />
          Lütfen en az bir aylık bir tarih aralığı seçin.
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Filters */}
      <div className="mb-4 grid grid-cols-1 md:grid-cols-3 gap-3">
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
                setProductModelId(''); // Reset product model selection when product type changes
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

        {/* Product Model Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Ürün Modeli
          </label>
          <div className="relative">
            <select
              value={productModelId}
              onChange={(e) => setProductModelId(e.target.value)}
              disabled={!productType || loadingProductModels}
              className="w-full appearance-none border border-gray-300 rounded-lg px-3 py-2 pr-8 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm disabled:bg-gray-100 disabled:cursor-not-allowed"
            >
              <option value="">Tümü</option>
              {availableProductModels.map((model) => (
                <option key={model.id} value={model.id}>
                  {model.name}
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

        {/* Service Type Filter */}
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

      {loading && <div className="text-sm text-gray-500">Yükleniyor...</div>}
      {error && <div className="text-sm text-red-600">{error}</div>}
      <div style={{ width: "100%", height: "300px" }} className="relative">
        {isEmpty && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <span className="text-gray-500">Seçilen tarih aralığında veri bulunamadı</span>
          </div>
        )}
        {!isEmpty && (
        <ResponsiveContainer>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="month" 
              tickFormatter={formatMonthLabel}
              angle={-45}
              textAnchor="end"
              height={80}
            />
            <YAxis 
              domain={[0, (dataMax: number) => Math.max(dataMax + 1, 5)]}
            />
            <Tooltip 
              formatter={(value: any, name: any) => [`${value} hata`, 'Hata Sayısı']}
              labelFormatter={(label: string) => `Üretim Tarihi: ${formatMonthLabel(label)}`}
            />
            <Bar dataKey="defect_count" fill="#8884d8" name="Hata Sayısı">
              <LabelList 
                dataKey="defect_count" 
                position="top" 
                style={{ fontSize: '12px', fontWeight: 'bold' }}
                formatter={(value: any) => value > 0 ? value : ''}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
