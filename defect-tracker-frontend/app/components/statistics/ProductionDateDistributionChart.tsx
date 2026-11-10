'use client';

import { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import { API_ENDPOINTS } from '@/lib/api';
import {
  type DateRangeProps, PRODUCT_TYPE_OPTIONS, SelectFilter, chartNotice, dateRangeQuery, useOptions, useReport,
} from './shared';

interface ProductionDateResponse {
  total_items: number;
  /** One row per production month, product type and model. */
  data: { production_month: string; item_count: number }[];
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D', '#A4DE6C', '#D0ED57', '#FFC658'];

/** Of the units returned in the period, how many were produced in each month. */
export default function ProductionDateDistributionChart({ startDate, endDate, refreshKey }: DateRangeProps) {
  const [productType, setProductType] = useState('');
  const [productModelId, setProductModelId] = useState('');
  const [serviceId, setServiceId] = useState('');

  const ofType = productType ? { type: productType, limit: 1000 } : null;
  const models = useOptions<{ id: number; name: string }>(API_ENDPOINTS.PRODUCTS, 'products', ofType);
  const services = useOptions<{ id: number; service_name: string }>(API_ENDPOINTS.SERVICES, 'services', ofType);

  const range = dateRangeQuery(startDate, endDate);
  const { result, loading, failure } = useReport<ProductionDateResponse>(
    API_ENDPOINTS.REPORTS.PRODUCTION_DATE_DISTRIBUTION,
    range && { ...range, product_type: productType, product_model_id: productModelId, service_id: serviceId },
    refreshKey);

  // Add the rows of each month together, whatever the model.
  const totalItems = result?.total_items ?? 0;
  const perMonth = new Map<string, number>();
  (result?.data ?? []).forEach((row) => {
    perMonth.set(row.production_month, (perMonth.get(row.production_month) ?? 0) + row.item_count);
  });
  const data = Array.from(perMonth.entries())
    .map(([month, count]) => ({
      production_month: month,
      item_count: count,
      percentage: totalItems > 0 ? parseFloat(((count / totalItems) * 100).toFixed(2)) : 0,
    }))
    .sort((a, b) => a.production_month.localeCompare(b.production_month));

  const notice = chartNotice(loading, failure, data.length === 0);
  const pickTypeFirst = productType ? undefined : 'Önce bir ürün türü seçin';

  return (
    <div className="w-full">
      <div className="mb-4 grid grid-cols-1 md:grid-cols-3 gap-3">
        <SelectFilter
          label="Ürün Türü" value={productType} options={PRODUCT_TYPE_OPTIONS}
          onChange={(value) => { setProductType(value); setProductModelId(''); setServiceId(''); }}
        />
        <SelectFilter
          label="Ürün Modeli" value={productModelId} onChange={setProductModelId}
          options={models.options.map((model) => ({ value: model.id, label: model.name }))}
          disabled={!productType || models.loading} hint={pickTypeFirst}
        />
        <SelectFilter
          label="Arıza Tipi" value={serviceId} onChange={setServiceId}
          options={services.options.map((service) => ({ value: service.id, label: service.service_name }))}
          disabled={!productType || services.loading} hint={pickTypeFirst}
        />
      </div>

      {notice ?? (
        <>
      {/* Total Items Display */}
      <div className="text-center mb-4">
        <p className="text-sm text-gray-600">
          Toplam İade Edilen Ürün Adedi: <span className="font-semibold text-gray-900">{totalItems}</span>
        </p>
      </div>
      
      {/* Bar Chart - Scrollable Container */}
      <div className="overflow-x-auto">
        <div style={{ minWidth: `${Math.max(data.length * 80, 800)}px` }}>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 80 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="production_month" 
                angle={-45}
                textAnchor="end"
                height={120}
                interval={0}
                tick={{ fontSize: 12 }}
              />
              <YAxis 
                label={{ value: 'İade Adedi', angle: -90, position: 'insideLeft' }}
                allowDecimals={false}
              />
              <Tooltip
                formatter={(value: any, name: any, props: any) => [
                  `${value} adet (${props.payload.percentage}%)`,
                  'İade Adedi'
                ]}
                labelFormatter={(label: string) => `Üretim Ayı: ${label}`}
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                }}
              />
              <Legend 
                wrapperStyle={{ paddingTop: '20px' }}
                formatter={() => 'İade Adedi'}
              />
              <Bar dataKey="item_count" fill="#8884d8" barSize={60}>
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Data Table - Top 5 */}
      <div className="mt-6 overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Sıra
              </th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Üretim Ayı
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
            {data
              .slice()
              .sort((a, b) => b.item_count - a.item_count)
              .slice(0, 5)
              .map((item, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                    {index + 1}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                    {item.production_month}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-gray-900">
                    {item.item_count}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-right font-semibold text-gray-900">
                    {item.percentage}%
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
        </>
      )}
    </div>
  );
}
