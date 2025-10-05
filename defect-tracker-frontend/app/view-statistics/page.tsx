'use client';

import Header from '@/app/components/Header';
import ItemsByCustomerChart from '@/app/components/statistics/ItemsByCustomerChart';
import ItemsByProductModelChart from '@/app/components/statistics/ItemsByProductModelChart';
import { useState } from 'react';
import DefectsByProductionMonthChart from '../components/statistics/DefectsByProductionMonthChart';
import FaultResponsibilityChart from '../components/statistics/FaultResponsibilityChart';
import ResolutionMethodChart from '../components/statistics/ResolutionMethodChart';
import ProductTypeChart from '../components/statistics/ProductTypeChart';
import TopDefectsChart from '../components/statistics/TopDefectsChart';
import { RequirePermission } from '../components/RequirePermission';
import { Calendar, Filter, RefreshCw } from 'lucide-react';

export default function StatisticsPage() {
  const [startDate, setStartDate] = useState<Date | null>(
    new Date(new Date().setDate(new Date().getDate() - 30))
  );
  const [endDate, setEndDate] = useState<Date | null>(new Date());
  const [refreshKey, setRefreshKey] = useState(0);

  return (
    <RequirePermission permission="PAGE_VIEW_STATISTICS">
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
        <Header onLogout={() => {}} />
        <div className="max-w-7xl mx-auto p-6 space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 mb-3">Raporlar</h1>
            <p className="text-gray-600 leading-relaxed">
              Bu sayfada, iade ve arıza verilerinizi görselleştiren detaylı raporlara erişebilirsiniz. 
              Grafikler, arıza dağılımlarını, çözüm yöntemlerini, ürün bazlı analizleri ve müşteri istatistiklerini 
              içerir. Farklı zaman dilimlerinde verilerinizi inceleyerek trend analizi yapabilir ve 
              işletmeniz için stratejik kararlar alabilirsiniz.
            </p>
          </div>

        {/* Filters */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg shadow-md border border-blue-100 p-6">
          <div className="mb-5">
            <div className="flex items-center gap-2 mb-2">
              <Filter className="w-5 h-5 text-blue-600" />
              <h3 className="text-base font-semibold text-gray-800">Tarih Aralığı Filtresi</h3>
            </div>
            <p className="text-sm text-gray-600 leading-relaxed">
              Başlangıç ve bitiş tarihlerini seçerek istediğiniz zaman aralığındaki verileri görüntüleyebilirsiniz. 
              Tarihleri girdikten sonra <span className="font-semibold text-blue-700">"Uygula"</span> butonuna tıkladığınızda, 
              tüm grafikler seçtiğiniz tarih aralığına göre yeniden hesaplanacak ve güncellenecektir.
            </p>
          </div>
          <div className="flex flex-wrap items-end gap-4">
            <div className="flex-1 min-w-[200px]">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-blue-600" />
                  Başlangıç Tarihi
                </div>
              </label>
              <input
                type="date"
                value={startDate ? startDate.toISOString().split('T')[0] : ''}
                onChange={(e) =>
                  setStartDate(e.target.value ? new Date(e.target.value) : null)
                }
                className="w-full h-11 border-2 border-gray-300 rounded-lg px-4 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-white shadow-sm hover:border-gray-400"
              />
            </div>
            <div className="flex-1 min-w-[200px]">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-blue-600" />
                  Bitiş Tarihi
                </div>
              </label>
              <input
                type="date"
                value={endDate ? endDate.toISOString().split('T')[0] : ''}
                onChange={(e) =>
                  setEndDate(e.target.value ? new Date(e.target.value) : null)
                }
                className="w-full h-11 border-2 border-gray-300 rounded-lg px-4 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-white shadow-sm hover:border-gray-400"
              />
            </div>
            <button
              onClick={() => setRefreshKey((x) => x + 1)}
              className="h-11 px-6 rounded-lg bg-gradient-to-r from-blue-600 to-blue-700 text-white font-medium hover:from-blue-700 hover:to-blue-800 transition-all shadow-md hover:shadow-lg flex items-center gap-2 whitespace-nowrap"
            >
              <RefreshCw className="w-4 h-4" />
              Uygula
            </button>
          </div>
        </div>
        {/* Charts */}
        <div className="space-y-6">
           {/* Top 5 Defects/Services Chart */}
           <div className="bg-white rounded shadow p-4">
            <h2 className="font-semibold mb-3">En Sık Görülen Arıza Tipleri (Top 5)</h2>
            <TopDefectsChart
              startDate={startDate}
              endDate={endDate}
              refreshKey={refreshKey}
            />
          </div>

          {/* Full-width production month chart */}
          <div className="bg-white rounded shadow p-4">
            <h2 className="font-semibold mb-3">Üretim Tarihine Göre Hata Dağılımı</h2>
            <DefectsByProductionMonthChart
              startDate={startDate}
              endDate={endDate}
              refreshKey={refreshKey}
            />
          </div>
          
          {/* Fault Responsibility and Resolution Method Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded shadow p-4">
              <h2 className="font-semibold mb-3">Hata Sorumluluğuna Göre Arıza Dağılımı</h2>
              <FaultResponsibilityChart
                startDate={startDate}
                endDate={endDate}
                refreshKey={refreshKey}
              />
            </div>
            <div className="bg-white rounded shadow p-4">
              <h2 className="font-semibold mb-3">Çözüm Yöntemine Göre Arıza Dağılımı</h2>
              <ResolutionMethodChart
                startDate={startDate}
                endDate={endDate}
                refreshKey={refreshKey}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded shadow p-4">
              <h2 className="font-semibold mb-3">Ürün Türüne Göre Arıza Dağılımı</h2>
              <ProductTypeChart
                startDate={startDate}
                endDate={endDate}
                refreshKey={refreshKey}
              />
            </div>
            <div className="bg-white rounded shadow p-4">
              <h2 className="font-semibold mb-3">Ürün Modeline Arıza Adedi</h2>
              <ItemsByProductModelChart
                startDate={startDate}
                endDate={endDate}
                refreshKey={refreshKey}
              />
            </div>
          </div>
           {/* Top 5 Customers by Defects Chart */}
           <div className="bg-white rounded shadow p-4">
            <h2 className="font-semibold mb-3">Müşterilere Göre Arıza Adedi (Top 5)</h2>
            <ItemsByCustomerChart
              startDate={startDate}
              endDate={endDate}
              refreshKey={refreshKey}
            />
          </div>
        </div>

        </div>
      </div>
    </RequirePermission>
  );
}
