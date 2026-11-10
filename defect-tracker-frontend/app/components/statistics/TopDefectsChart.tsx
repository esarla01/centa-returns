'use client';

import { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import { API_ENDPOINTS } from '@/lib/api';
import {
  type DateRangeProps, PRODUCT_TYPE_OPTIONS, SelectFilter, chartNotice, dateRangeQuery, useOptions, useReport,
} from './shared';

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

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

/** The five fault types found most often, as bars and as a table. */
export default function TopDefectsChart({ startDate, endDate, refreshKey }: DateRangeProps) {
  const [productType, setProductType] = useState('');
  const [serviceId, setServiceId] = useState('');

  const services = useOptions<{ id: number; service_name: string }>(
    API_ENDPOINTS.SERVICES, 'services', productType ? { type: productType, limit: 1000 } : null);

  const range = dateRangeQuery(startDate, endDate);
  const { result, loading, failure } = useReport<TopDefectsResponse>(
    API_ENDPOINTS.REPORTS.TOP_DEFECTS,
    range && { ...range, product_type: productType, service_id: serviceId },
    refreshKey);

  const rows = result?.data ?? [];
  // Two product types can have a fault type with the same name; say which is which on the axis.
  const names = rows.map((row) => row.service_name);
  const data = rows.map((row) => ({
    ...row,
    axis_label: names.filter((name) => name === row.service_name).length > 1
      ? `${row.service_name} (${row.product_type})`
      : row.service_name,
  }));
  const totalItems = result?.total_items ?? 0;
  const totalServiceOccurrences = result?.total_service_occurrences ?? 0;

  const notice = chartNotice(loading, failure, data.length === 0);

  return (
    <div className="w-full">
      <div className="mb-4 grid grid-cols-1 md:grid-cols-2 gap-3">
        <SelectFilter
          label="Ürün Türü" value={productType} options={PRODUCT_TYPE_OPTIONS}
          onChange={(value) => { setProductType(value); setServiceId(''); }}
        />
        <SelectFilter
          label="Arıza Tipi" value={serviceId} onChange={setServiceId}
          options={services.options.map((service) => ({ value: service.id, label: service.service_name }))}
          disabled={!productType || services.loading}
          hint={productType ? undefined : 'Önce bir ürün türü seçin'}
        />
      </div>

      {notice ?? (
        <>
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
            dataKey="axis_label" 
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
        </>
      )}
    </div>
  );
}
