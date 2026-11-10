'use client';

import { useState } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LabelList } from "recharts";
import { API_ENDPOINTS } from '@/lib/api';
import { ChevronDown, Calendar, RefreshCw } from 'lucide-react';
import {
  PRODUCT_TYPE_OPTIONS, SelectFilter, dateRangeQuery, fromDateInput, monthsBefore, toDateParam, today,
  useOptions, useReport,
} from './shared';

type ChartData = {
  month: string;
  defect_count: number;
};

const MONTH_NAMES = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'];

/** "2024-03" -> "Mar 2024" */
const formatMonthLabel = (month: string) => {
  const [year, monthNumber] = month.split('-');
  const name = MONTH_NAMES[parseInt(monthNumber) - 1];
  return name ? `${name} ${year}` : month;
};

/** How many months are shown at once when not showing everything. */
const WINDOW = 12;

/**
 * Returned units by the month they were PRODUCED in, for every production
 * month in the chosen range. Has its own date range, independent of the
 * rest of the statistics page.
 */
export default function DefectsByProductionMonthChart() {
  const [startDate, setStartDate] = useState<Date | null>(() => monthsBefore(today(), 12));
  const [endDate, setEndDate] = useState<Date | null>(today);
  const [refreshKey, setRefreshKey] = useState(0);
  const [quickSelect, setQuickSelect] = useState<string>('1'); // years

  const [productType, setProductType] = useState('');
  const [productModelId, setProductModelId] = useState('');
  const [serviceId, setServiceId] = useState('');

  // Which months are on screen: all of them, or a 12-month window that can be moved.
  const [showAll, setShowAll] = useState(true);
  const [windowStart, setWindowStart] = useState(0);

  const handleQuickSelect = (value: string) => {
    setQuickSelect(value);
    if (value === 'custom') return;
    setStartDate(monthsBefore(today(), 12 * parseInt(value)));
    setEndDate(today());
  };

  const ofType = productType ? { type: productType, limit: 1000 } : null;
  const models = useOptions<{ id: number; name: string }>(API_ENDPOINTS.PRODUCTS, 'products', ofType);
  const services = useOptions<{ id: number; service_name: string }>(API_ENDPOINTS.SERVICES, 'services', ofType);

  // A trend needs at least a month; shorter ranges get an explanation instead of a chart.
  const range = dateRangeQuery(startDate, endDate);
  const tooShort = !!startDate && !!endDate && (endDate.getTime() - startDate.getTime()) / 86_400_000 < 30;
  const { result, loading, failure } = useReport<{ data: ChartData[] }>(
    API_ENDPOINTS.REPORTS.DEFECTS_BY_PRODUCTION_MONTH,
    range && !tooShort
      ? { ...range, product_type: productType, product_model_id: productModelId, service_id: serviceId }
      : null,
    refreshKey);

  const data = result?.data ?? [];
  const error = failure ? 'Veri yüklenirken hata oluştu' : null;
  const isEmpty = !loading && data.length === 0;

  const lastStart = Math.max(0, data.length - WINDOW);
  const start = Math.min(windowStart, lastStart);
  const visibleData = showAll ? data : data.slice(start, start + WINDOW);
  const pickTypeFirst = productType ? undefined : 'Önce bir ürün türü seçin';

  return (
    <div className="flex flex-col gap-3">
      {/* Time Filter Section */}
      <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-lg shadow-sm border border-amber-100 p-4 mb-4">
        <div className="mb-3">
          <div className="flex items-center gap-2 mb-1">
            <Calendar className="w-4 h-4 text-amber-600" />
            <h4 className="text-sm font-semibold text-gray-800">Bu Grafik İçin Özel Tarih Aralığı</h4>
          </div>
          <p className="text-xs text-gray-600 leading-relaxed">
            Bu grafik kendi bağımsız tarih filtresine sahiptir. Uzun dönem trend analizi için 1-10 yıl arası seçenekler mevcuttur.
          </p>
        </div>
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex-1 min-w-[180px]">
            <label className="block text-xs font-medium text-gray-700 mb-1.5">
              Hızlı Seçim
            </label>
            <div className="relative">
              <select
                value={quickSelect}
                onChange={(e) => handleQuickSelect(e.target.value)}
                className="w-full h-10 appearance-none border-2 border-gray-300 rounded-lg px-3 pr-8 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all bg-white shadow-sm hover:border-gray-400 text-sm"
              >
                <option value="1">Son 1 Yıl</option>
                <option value="2">Son 2 Yıl</option>
                <option value="5">Son 5 Yıl</option>
                <option value="10">Son 10 Yıl</option>
                <option value="custom">Özel Tarih Aralığı</option>
              </select>
              <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
          </div>
          <div className="flex-1 min-w-[180px]">
            <label className="block text-xs font-medium text-gray-700 mb-1.5">
              Başlangıç Tarihi
            </label>
            <input
              type="date"
              value={toDateParam(startDate)}
              onChange={(e) => {
                setStartDate(fromDateInput(e.target.value));
                setQuickSelect('custom');
              }}
              disabled={quickSelect !== 'custom'}
              className="w-full h-10 border-2 border-gray-300 rounded-lg px-3 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all bg-white shadow-sm hover:border-gray-400 disabled:bg-gray-100 disabled:cursor-not-allowed text-sm"
            />
          </div>
          <div className="flex-1 min-w-[180px]">
            <label className="block text-xs font-medium text-gray-700 mb-1.5">
              Bitiş Tarihi
            </label>
            <input
              type="date"
              value={toDateParam(endDate)}
              onChange={(e) => {
                setEndDate(fromDateInput(e.target.value));
                setQuickSelect('custom');
              }}
              disabled={quickSelect !== 'custom'}
              className="w-full h-10 border-2 border-gray-300 rounded-lg px-3 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all bg-white shadow-sm hover:border-gray-400 disabled:bg-gray-100 disabled:cursor-not-allowed text-sm"
            />
          </div>
          <button
            onClick={() => setRefreshKey((x) => x + 1)}
            className="h-10 px-5 rounded-lg bg-gradient-to-r from-amber-600 to-amber-700 text-white font-medium hover:from-amber-700 hover:to-amber-800 transition-all shadow-md hover:shadow-lg flex items-center gap-2 whitespace-nowrap text-sm"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Uygula
          </button>
        </div>
      </div>

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

      {tooShort ? (
        <div className="text-sm text-gray-500 text-center py-8">
          Seçilen tarih aralığı bir aydan az olduğu için bu grafik gösterilmiyor.
          <br />
          Lütfen en az bir aylık bir tarih aralığı seçin.
        </div>
      ) : (
        <>
      {error && <div className="text-sm text-red-600">{error}</div>}

      {/* Chart with increased height */}
      <div style={{ width: "100%", height: "400px" }} className="relative">
        {isEmpty && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <span className="text-gray-500">Seçilen tarih aralığında veri bulunamadı</span>
          </div>
        )}
        {!isEmpty && (
        <ResponsiveContainer>
          <BarChart data={visibleData}>
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
            <Bar dataKey="defect_count" fill="#f59e0b" name="Hata Sayısı">
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

      {/* Choose which months are on screen when there are many */}
      {!isEmpty && data.length > WINDOW && (
        <div className="mt-6 px-2">
          <div className="mb-2 flex items-center justify-between">
            <label className="text-sm font-medium text-gray-700">
              Görünüm Aralığı ({visibleData.length} / {data.length} ay)
            </label>
            <button
              onClick={() => setShowAll(!showAll)}
              className="text-xs text-amber-600 hover:text-amber-700 font-medium"
            >
              {showAll ? `${WINDOW} Ay Göster` : 'Tümünü Göster'}
            </button>
          </div>
          {!showAll && (
            <>
              <div className="flex items-center gap-3">
                <span className="text-xs text-gray-600 whitespace-nowrap">{formatMonthLabel(visibleData[0]?.month || '')}</span>
                <div className="flex-1">
                  <input
                    type="range"
                    aria-label="Görünüm aralığını kaydır"
                    min={0}
                    max={lastStart}
                    value={start}
                    onChange={(e) => setWindowStart(parseInt(e.target.value))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-amber-600"
                  />
                </div>
                <span className="text-xs text-gray-600 whitespace-nowrap">
                  {formatMonthLabel(visibleData[visibleData.length - 1]?.month || '')}
                </span>
              </div>
              <div className="mt-2 flex justify-center gap-2">
                <button
                  onClick={() => setWindowStart(Math.max(0, start - 3))}
                  disabled={start === 0}
                  className="px-3 py-1 text-xs bg-gray-200 hover:bg-gray-300 rounded-md transition-colors disabled:opacity-50"
                >
                  ← Önceki
                </button>
                <button
                  onClick={() => setWindowStart(Math.min(lastStart, start + 3))}
                  disabled={start === lastStart}
                  className="px-3 py-1 text-xs bg-gray-200 hover:bg-gray-300 rounded-md transition-colors disabled:opacity-50"
                >
                  Sonraki →
                </button>
              </div>
            </>
          )}
        </div>
      )}
        </>
      )}
    </div>
  );
}
