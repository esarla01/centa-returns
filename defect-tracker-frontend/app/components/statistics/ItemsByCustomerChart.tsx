'use client';

import { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import { API_ENDPOINTS } from '@/lib/api';
import {
  type DateRangeProps, CHART_COLORS, PRODUCT_TYPE_OPTIONS, SelectFilter, chartNotice, dateRangeQuery, useOptions, useReport,
} from './shared';

interface CustomerData {
  customer_id: number;
  customer_name: string;
  item_count: number;
  percentage: number;
}

interface CustomerResponse {
  total_items: number;
  data: CustomerData[];
}

const COLORS = CHART_COLORS;

/** The five customers who returned the most units, as bars and as a table. */
export default function ItemsByCustomerChart({ startDate, endDate, refreshKey }: DateRangeProps) {
  const [productType, setProductType] = useState('');
  const [customerId, setCustomerId] = useState('');

  const customers = useOptions<{ id: number; name: string }>(API_ENDPOINTS.CUSTOMERS, 'customers', { limit: 1000 });

  const range = dateRangeQuery(startDate, endDate);
  const { result, loading, failure } = useReport<CustomerResponse>(
    API_ENDPOINTS.REPORTS.ITEMS_BY_CUSTOMER,
    range && { ...range, product_type: productType, customer_id: customerId },
    refreshKey);

  const data = result?.data ?? [];
  const totalItems = result?.total_items ?? 0;
  const notice = chartNotice(loading, failure, data.length === 0);

  return (
    <div className="w-full">
      <div className="mb-4 grid grid-cols-1 md:grid-cols-2 gap-3">
        <SelectFilter label="Ürün Türü" value={productType} onChange={setProductType} options={PRODUCT_TYPE_OPTIONS} />
        <SelectFilter
          label="Müşteri Adı" value={customerId} onChange={setCustomerId}
          options={customers.options.map((customer) => ({ value: customer.id, label: customer.name }))}
          disabled={customers.loading}
        />
      </div>

      {notice ?? (
        <>
      {/* Total Items Display */}
      <div className="text-center mb-4">
        <p className="text-sm text-gray-600">
          Toplam Arıza Sayısı: <span className="font-semibold text-gray-900">{totalItems}</span>
        </p>
      </div>
      
      {/* Bar Chart */}
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis 
            dataKey="customer_name" 
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
            labelFormatter={(label: string) => `Müşteri: ${label}`}
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
          <Bar dataKey="item_count" fill="#0f1e33">
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
                Müşteri Adı
              </th>
              <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Arıza Adedi
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
                  {item.customer_name}
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
