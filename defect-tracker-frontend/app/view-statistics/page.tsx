'use client';

import Header from '@/app/components/Header';
import ItemsByCustomerChart from '@/app/components/statistics/ItemsByCustomerChart';
import ItemsByProductModelChart from '@/app/components/statistics/ItemsByProductModelChart';
import ReturnsBreakdownBarChart from '@/app/components/statistics/ReturnsBreakdownBarChart';
import { useState } from 'react';
import DefectsByProductionMonthChart from '../components/statistics/DefectsByProductionMonthChart';
import FaultResponsibilityChart from '../components/statistics/FaultResponsibilityChart';
import ServiceTypeChart from '../components/statistics/ServiceTypeChart';
import ResolutionMethodChart from '../components/statistics/ResolutionMethodChart';
import ProductTypeChart from '../components/statistics/ProductTypeChart';

export default function StatisticsPage() {
  const [startDate, setStartDate] = useState<Date | null>(
    new Date(new Date().setDate(new Date().getDate() - 30))
  );
  const [endDate, setEndDate] = useState<Date | null>(new Date());
  const [refreshKey, setRefreshKey] = useState(0);

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-blue-100">
      <Header onLogout={() => {}} />
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        <h1 className="text-2xl font-bold text-gray-800">Raporlar</h1>

        {/* Filters */}
        <div className="flex items-end gap-3 bg-white rounded shadow p-4">
          <div>
            <label className="block text-sm text-gray-600">Başlangıç</label>
            <input
              type="date"
              value={startDate ? startDate.toISOString().split('T')[0] : ''}
              onChange={(e) =>
                setStartDate(e.target.value ? new Date(e.target.value) : null)
              }
              className="h-10 border rounded px-3"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-600">Bitiş</label>
            <input
              type="date"
              value={endDate ? endDate.toISOString().split('T')[0] : ''}
              onChange={(e) =>
                setEndDate(e.target.value ? new Date(e.target.value) : null)
              }
              className="h-10 border rounded px-3"
            />
          </div>
          <button
            onClick={() => setRefreshKey((x) => x + 1)}
            className="h-10 px-4 rounded bg-blue-600 text-white hover:bg-blue-700"
          >
            Uygula
          </button>
        </div>

                {/* Charts */}
        <div className="space-y-6">
          {/* First row: Three charts side by side */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded shadow p-4">
              <h2 className="font-semibold mb-3">Müşteriye Göre İade Adedi</h2>
              <ItemsByCustomerChart
                startDate={startDate}
                endDate={endDate}
                refreshKey={refreshKey}
              />
            </div>
            <div className="bg-white rounded shadow p-4">
              <h2 className="font-semibold mb-3">Hata Sorumluluğuna Göre İade Dağılımı</h2>
              <FaultResponsibilityChart
                startDate={startDate}
                endDate={endDate}
                refreshKey={refreshKey}
              />
            </div>
          </div>

          {/* Second row: Full-width bar chart */}
          <div className="bg-white rounded shadow p-4">
            <div className="mb-3">
              <h2 className="font-semibold mb-1">Periyoda Göre İade Dağılımı</h2>
              <p className="text-sm text-gray-600">(Teslim Alındı Aşamasındaki Ürünler Dahil Edilir)</p>
            </div>
            <ReturnsBreakdownBarChart
              startDate={startDate}
              endDate={endDate}
              refreshKey={refreshKey}
            />
          </div>

          {/* Third row: Full-width production month chart */}
          <div className="bg-white rounded shadow p-4">
            <h2 className="font-semibold mb-3">Üretim Tarihine Göre Hata Dağılımı</h2>
            <DefectsByProductionMonthChart
              startDate={startDate}
              endDate={endDate}
              refreshKey={refreshKey}
            />
          </div>
          
          {/* Fourth row: Three pie charts side by side */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded shadow p-4">
              <h2 className="font-semibold mb-3">Hizmet Türüne Göre İade Dağılımı</h2>
              <ServiceTypeChart
                startDate={startDate}
                endDate={endDate}
                refreshKey={refreshKey}
              />
            </div>
            <div className="bg-white rounded shadow p-4">
              <h2 className="font-semibold mb-3">Çözüm Yöntemine Göre İade Dağılımı</h2>
              <ResolutionMethodChart
                startDate={startDate}
                endDate={endDate}
                refreshKey={refreshKey}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded shadow p-4">
              <h2 className="font-semibold mb-3">Ürün Türüne Göre İade Dağılımı</h2>
              <ProductTypeChart
                startDate={startDate}
                endDate={endDate}
                refreshKey={refreshKey}
              />
            </div>
            <div className="bg-white rounded shadow p-4">
              <h2 className="font-semibold mb-3">Ürün Modeline İade Adedi</h2>
              <ItemsByProductModelChart
                startDate={startDate}
                endDate={endDate}
                refreshKey={refreshKey}
              />
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
