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
import ProductionDateDistributionChart from '../components/statistics/ProductionDateDistributionChart';
import { RequirePermission } from '../components/RequirePermission';
import { Calendar, Filter, RefreshCw, ChevronDown } from 'lucide-react';

export default function StatisticsPage() {
  const [startDate, setStartDate] = useState<Date | null>(() => {
    const start = new Date();
    start.setMonth(start.getMonth() - 1);
    return start;
  });
  const [endDate, setEndDate] = useState<Date | null>(new Date());
  const [refreshKey, setRefreshKey] = useState(0);
  const [quickSelect, setQuickSelect] = useState<string>('1'); // Default to last 1 month

  // Handle quick date range selection
  const handleQuickSelect = (value: string) => {
    setQuickSelect(value);
    
    if (value === 'custom') {
      // Don't change dates for custom
      return;
    }
    
    const today = new Date();
    const months = parseInt(value);
    
    // Calculate start date by going back X months
    const start = new Date();
    start.setMonth(start.getMonth() - months);
    
    setStartDate(start);
    setEndDate(today);
  };

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
              Hızlı seçim menüsünden hazır tarih aralıklarını seçebilir veya özel tarih aralığı belirleyebilirsiniz. 
              Tarihleri girdikten sonra <span className="font-semibold text-blue-700">&quot;Uygula&quot;</span> butonuna tıkladığınızda, 
              tüm grafikler seçtiğiniz tarih aralığına göre yeniden hesaplanacak ve güncellenecektir.
            </p>
          </div>
          <div className="flex flex-wrap items-end gap-4">
            <div className="flex-1 min-w-[200px]">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <div className="flex items-center gap-1.5">
                  <Filter className="w-4 h-4 text-blue-600" />
                  Hızlı Seçim
                </div>
              </label>
              <div className="relative">
                <select
                  value={quickSelect}
                  onChange={(e) => handleQuickSelect(e.target.value)}
                  className="w-full h-11 appearance-none border-2 border-gray-300 rounded-lg px-4 pr-10 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-white shadow-sm hover:border-gray-400"
                >
                  <option value="1">Son 1 Ay</option>
                  <option value="3">Son 3 Ay</option>
                  <option value="6">Son 6 Ay</option>
                  <option value="12">Son 12 Ay</option>
                  <option value="24">Son 2 Yıl</option>
                  <option value="custom">Özel Tarih Aralığı</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
              </div>
            </div>
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
                onChange={(e) => {
                  setStartDate(e.target.value ? new Date(e.target.value) : null);
                  setQuickSelect('custom'); // Switch to custom when manually changing dates
                }}
                disabled={quickSelect !== 'custom'}
                className="w-full h-11 border-2 border-gray-300 rounded-lg px-4 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-white shadow-sm hover:border-gray-400 disabled:bg-gray-100 disabled:cursor-not-allowed"
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
                onChange={(e) => {
                  setEndDate(e.target.value ? new Date(e.target.value) : null);
                  setQuickSelect('custom'); // Switch to custom when manually changing dates
                }}
                disabled={quickSelect !== 'custom'}
                className="w-full h-11 border-2 border-gray-300 rounded-lg px-4 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-white shadow-sm hover:border-gray-400 disabled:bg-gray-100 disabled:cursor-not-allowed"
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
            <p className="text-sm text-gray-600 mb-4 leading-relaxed">
              Bu grafik, seçilen tarih aralığında en sık karşılaşılan 5 arıza tipini gösterir. 
              Hangi arızaların tekrar ettiğini görerek, üretim süreçlerinde iyileştirmeler yapabilir 
              ve yaygın problemlere önleyici çözümler geliştirebilirsiniz.
            </p>
            <TopDefectsChart
              startDate={startDate}
              endDate={endDate}
              refreshKey={refreshKey}
            />
          </div>

          {/* Production Date Distribution Chart */}
          <div className="bg-white rounded shadow p-4">
            <h2 className="font-semibold mb-3">Üretim Dönemi Dağılım Analizi</h2>
            <p className="text-sm text-gray-600 mb-4 leading-relaxed">
              Seçilen tarih aralığında iade edilen ürünlerin hangi üretim dönemlerinden geldiğini 
              <span className="font-medium text-gray-800"> yüzdelik dağılım</span> olarak gösterir. 
              Örneğin: &quot;Ocak 2024&apos;te gelen iadelerin %40&apos;ı Haziran 2023 üretiminden, %30&apos;u Temmuz 2023 üretiminden&quot; gibi. 
              Hangi üretim partilerinin daha fazla sorun çıkardığını tespit etmek için kullanılır.
            </p>
            <ProductionDateDistributionChart
              startDate={startDate}
              endDate={endDate}
              refreshKey={refreshKey}
            />
          </div>
          
          {/* Fault Responsibility and Resolution Method Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded shadow p-4">
              <h2 className="font-semibold mb-3">Hata Sorumluluğuna Göre Arıza Dağılımı</h2>
              <p className="text-sm text-gray-600 mb-4 leading-relaxed">
                Arızaların kullanıcı hatası mı yoksa teknik sorun mu olduğunu gösterir. 
                Müşteri eğitimi gerekliliği veya ürün tasarımında iyileştirme ihtiyacı konusunda 
                karar vermenize yardımcı olur.
              </p>
              <FaultResponsibilityChart
                startDate={startDate}
                endDate={endDate}
                refreshKey={refreshKey}
              />
            </div>
            <div className="bg-white rounded shadow p-4">
              <h2 className="font-semibold mb-3">Çözüm Yöntemine Göre Arıza Dağılımı</h2>
              <p className="text-sm text-gray-600 mb-4 leading-relaxed">
                İadelerin nasıl çözüldüğünü (tamir, değişim, vb.) gösterir. Servis maliyetlerini 
                analiz etmenize ve garanti politikalarınızı optimize etmenize yardımcı olur.
              </p>
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
              <p className="text-sm text-gray-600 mb-4 leading-relaxed">
                Hangi ürün kategorilerinin (fotosel, kontrol ünitesi, vb.) daha fazla arıza verdiğini gösterir. 
                Ürün portföyünüzde hangi kategorilere daha fazla odaklanmanız gerektiğini belirlemenize yardımcı olur.
              </p>
              <ProductTypeChart
                startDate={startDate}
                endDate={endDate}
                refreshKey={refreshKey}
              />
            </div>
            <div className="bg-white rounded shadow p-4">
              <h2 className="font-semibold mb-3">Ürün Modeline Arıza Adedi</h2>
              <p className="text-sm text-gray-600 mb-4 leading-relaxed">
                Her ürün modelinin iade sayısını gösterir. Hangi modellerin daha sorunlu olduğunu tespit ederek, 
                tasarım iyileştirmeleri ve kalite kontrol önlemlerine öncelik verebilirsiniz.
              </p>
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
            <p className="text-sm text-gray-600 mb-4 leading-relaxed">
              En çok iade yapan 5 müşteriyi gösterir. Belirli müşterilerde tekrarlayan sorunları tespit ederek, 
              kurulum desteği, eğitim veya özel çözümler sunabilir ve müşteri memnuniyetini artırabilirsiniz.
            </p>
            <ItemsByCustomerChart
              startDate={startDate}
              endDate={endDate}
              refreshKey={refreshKey}
            />
          </div>

          {/* Full-width production month chart with independent time filter - AT THE BOTTOM */}
          <div className="bg-white rounded shadow p-4">
            <h2 className="font-semibold mb-3">Üretim Dönemi Arıza Trend Analizi</h2>
            <p className="text-sm text-gray-600 mb-4 leading-relaxed">
              Üretim aylarına göre arıza sayılarının 
              <span className="font-medium text-gray-800"> zaman içindeki değişimini</span> (trend) gösterir. 
              Her üretim ayı için kaç adet arıza geldiğini takip eder. 
              Arıza sayılarının artış veya azalış trendlerini görerek, kalite iyileştirme çalışmalarınızın 
              etkisini ölçebilir ve hangi dönemlerde üretim kalitesinin düştüğünü tespit edebilirsiniz.
              <br />
              <span className="font-semibold text-amber-700 mt-2 inline-block">
                ⚠️ Bu grafik yukarıdaki genel tarih filtresinden bağımsızdır ve kendi özel tarih aralığına sahiptir.
              </span>
            </p>
            <DefectsByProductionMonthChart />
          </div>
        </div>

        </div>
      </div>
    </RequirePermission>
  );
}
