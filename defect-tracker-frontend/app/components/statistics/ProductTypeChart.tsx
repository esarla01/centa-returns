'use client';

import { API_ENDPOINTS, buildApiUrl } from '@/lib/api';
import { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

interface ProductTypeData {
  product_type: string;
  item_count: number;
  percentage: number;
}

interface ProductTypeResponse {
  total_items: number;
  data: ProductTypeData[];
}

interface ProductTypeChartProps {
  startDate: Date | null;
  endDate: Date | null;
  refreshKey: number;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28'];

export default function ProductTypeChart({
  startDate,
  endDate,
  refreshKey,
}: ProductTypeChartProps) {
  const [data, setData] = useState<ProductTypeData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalItems, setTotalItems] = useState(0);

  useEffect(() => {
    if (!startDate || !endDate) return;

    const fetchData = async () => {
      setLoading(true);
      setError(null);

      try {
        const startDateStr = startDate.toISOString().split('T')[0];
        const endDateStr = endDate.toISOString().split('T')[0];

        const response = await fetch(
          buildApiUrl(API_ENDPOINTS.REPORTS.PRODUCT_TYPE_STATS) + `?start_date=${startDateStr}&end_date=${endDateStr}`,
          {
            credentials: 'include',
          }
        );

        if (!response.ok) {
          throw new Error('Veri yüklenirken hata oluştu');
        }

        const result: ProductTypeResponse = await response.json();
        setData(result.data);
        setTotalItems(result.total_items);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Bilinmeyen hata');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [startDate, endDate, refreshKey]);

  // Update the isEmpty check to also consider items with zero counts
  const isEmpty = !loading && (!data || data.length === 0 || data.every(item => item.item_count === 0));

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
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Seçilen tarih aralığında veri bulunamadı</div>
      </div>
    );
  }

  const chartData = data.filter(item => item.item_count > 0);

  return (
    <div className="w-full">
      {/* Total Items Display */}
      <div className="text-center mb-4">
        <p className="text-sm text-gray-600">
          Toplam İade Ürün Adedi: <span className="font-semibold text-gray-900">{totalItems}</span>
        </p>
      </div>
      
      <ResponsiveContainer width="100%" height={280}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            dataKey="item_count"
            labelLine={false}
            label={({ product_type, item_count, percentage }) => 
              `${item_count} adet`
            }
            outerRadius={70}
            innerRadius={20}
            fill="#8884d8"
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
            formatter={(value: any, name: any) => [
              `${value} adet`,
              'Arıza Adedi'
            ]}
            labelFormatter={(label: string) => `Ürün Türü: ${label}`}
            contentStyle={{
              backgroundColor: 'white',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
            }}
          />
          <Legend 
            verticalAlign="bottom" 
            height={36}
            wrapperStyle={{
              paddingTop: '20px'
            }}
            formatter={(value) => ''}
          />
        </PieChart>
      </ResponsiveContainer>

      {/* Percentage Breakdown */}
      <div className="mt-4 grid grid-cols-1 gap-2">
        {chartData.map((item, index) => (
          <div key={item.product_type} className="flex items-center justify-between text-sm">
            <div className="flex items-center">
              <div
                className="w-3 h-3 rounded-full mr-2"
                style={{ backgroundColor: COLORS[index % COLORS.length] }}
              />
              <span className="text-gray-700">{item.product_type}</span>
            </div>
            <span className="font-semibold text-gray-900">{item.percentage}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}
