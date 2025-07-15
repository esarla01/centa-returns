'use client';

import { useEffect, useState } from 'react';
import { BarChart3, TrendingUp, Users, Package, DollarSign, Calendar } from 'lucide-react';
import Header from '@/app/components/Header';

interface StatisticsData {
  monthlyReturns: { month: string; count: number }[];
  companyStats: { company: string; returns: number }[];
  statusDistribution: { status: string; count: number }[];
  totalReturns: number;
  totalCustomers: number;
  totalRevenue: number;
  averageResolutionTime: number;
}

export default function StatisticsPage() {
  const [stats, setStats] = useState<StatisticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [userName, setUserName] = useState<string>('');

  useEffect(() => {
    const name = localStorage.getItem('name') || '';
    const surname = localStorage.getItem('surname') || '';
    setUserName(`${name} ${surname}`);
  }, []);

  useEffect(() => {
    const fetchStatistics = async () => {
      try {
        const response = await fetch('http://localhost:5000/statistics', {
          credentials: 'include',
        });
        if (response.ok) {
          const data = await response.json();
          setStats(data);
        } else {
          // Fallback data for development
          setStats({
            monthlyReturns: [
              { month: 'Ocak', count: 15 },
              { month: 'Şubat', count: 22 },
              { month: 'Mart', count: 18 },
              { month: 'Nisan', count: 25 },
              { month: 'Mayıs', count: 30 },
              { month: 'Haziran', count: 28 },
            ],
            companyStats: [
              { company: 'ABC Şirketi', returns: 12 },
              { company: 'XYZ Ltd.', returns: 8 },
              { company: 'DEF A.Ş.', returns: 15 },
              { company: 'GHI Teknoloji', returns: 6 },
            ],
            statusDistribution: [
              { status: 'Açık', count: 25 },
              { status: 'İşlemde', count: 18 },
              { status: 'Parça Bekliyor', count: 12 },
              { status: 'Tamir Edildi', count: 30 },
              { status: 'Gönderildi', count: 15 },
              { status: 'Kapalı', count: 40 },
            ],
            totalReturns: 140,
            totalCustomers: 45,
            totalRevenue: 125000,
            averageResolutionTime: 7.5,
          });
        }
      } catch (error) {
        console.error('Error fetching statistics:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStatistics();
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-white to-blue-100">
        <Header onLogout={() => {}} />
        <div className="flex items-center justify-center h-64">
          <div className="text-lg text-gray-600">İstatistikler yükleniyor...</div>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-white to-blue-100">
        <Header onLogout={() => {}} />
        <div className="flex items-center justify-center h-64">
          <div className="text-lg text-red-600">İstatistikler yüklenemedi.</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-blue-100">
      <Header onLogout={() => {}} />
      
      <div className="max-w-7xl mx-auto p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Merhaba {userName},
          </h1>
          <p className="text-lg text-gray-600 mt-2">
            İstatistikler ve Raporlar
          </p>
        </div>

        {/* Key Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <div className="flex items-center">
              <Package className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Toplam Vaka</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalReturns}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Toplam Müşteri</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalCustomers}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm">
            <div className="flex items-center">
              <DollarSign className="h-8 w-8 text-yellow-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Toplam Gelir</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalRevenue.toLocaleString()}₺</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm">
            <div className="flex items-center">
              <Calendar className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Ort. Çözüm Süresi</p>
                <p className="text-2xl font-bold text-gray-900">{stats.averageResolutionTime} gün</p>
              </div>
            </div>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Monthly Returns Chart */}
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <BarChart3 className="h-5 w-5 mr-2" />
              Aylık Vaka Sayıları
            </h3>
            <div className="space-y-3">
              {stats.monthlyReturns.map((item, index) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">{item.month}</span>
                  <div className="flex items-center">
                    <div className="w-32 bg-gray-200 rounded-full h-2 mr-3">
                      <div 
                        className="bg-blue-600 h-2 rounded-full" 
                        style={{ width: `${(item.count / Math.max(...stats.monthlyReturns.map(m => m.count))) * 100}%` }}
                      ></div>
                    </div>
                    <span className="text-sm font-medium text-gray-900 w-8">{item.count}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Company Statistics */}
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <TrendingUp className="h-5 w-5 mr-2" />
              Şirket Bazında Vakalar
            </h3>
            <div className="space-y-3">
              {stats.companyStats.map((item, index) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 truncate max-w-32">{item.company}</span>
                  <div className="flex items-center">
                    <div className="w-32 bg-gray-200 rounded-full h-2 mr-3">
                      <div 
                        className="bg-green-600 h-2 rounded-full" 
                        style={{ width: `${(item.returns / Math.max(...stats.companyStats.map(c => c.returns))) * 100}%` }}
                      ></div>
                    </div>
                    <span className="text-sm font-medium text-gray-900 w-8">{item.returns}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Status Distribution */}
        <div className="mt-8 bg-white p-6 rounded-lg shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Durum Dağılımı</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {stats.statusDistribution.map((item, index) => (
              <div key={index} className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-gray-900">{item.count}</div>
                <div className="text-sm text-gray-600">{item.status}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
} 