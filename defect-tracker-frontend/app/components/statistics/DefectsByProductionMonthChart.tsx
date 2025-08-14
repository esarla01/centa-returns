import { useEffect, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LabelList } from "recharts";

type Props = {
  startDate: Date | null;
  endDate: Date | null;
  refreshKey?: number; // optional to force re-fetch on Apply
};

type ChartData = {
  month: string;
  defect_count: number;
};

export default function DefectsByProductionMonthChart({ startDate, endDate, refreshKey }: Props) {
  const [data, setData] = useState<ChartData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPlaceholder, setShowPlaceholder] = useState(false);

  const fetchData = async () => {
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
      
      const res = await fetch(
        `http://localhost:5000/reports/defects-by-production-month?start_date=${sd}&end_date=${ed}`
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
  }, [startDate?.getTime(), endDate?.getTime(), refreshKey]);

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

  // Custom tooltip component
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-4 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-semibold text-gray-800 mb-2">{`Üretim Tarihi: ${formatMonthLabel(label)}`}</p>
          <p className="text-sm text-gray-600">
            <span style={{ color: '#3B82F6' }}>●</span> Hata Sayısı: {payload[0].value} adet
          </p>
        </div>
      );
    }
    return null;
  };

  if (showPlaceholder) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="text-gray-400 mb-2">
              <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <p className="text-sm text-gray-500">
              Seçilen tarih aralığı bir aydan az olduğu için bu grafik gösterilmiyor.
            </p>
            <p className="text-xs text-gray-400 mt-1">
              Lütfen en az bir aylık bir tarih aralığı seçin.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">Yükleniyor...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-red-500">{error}</div>
        </div>
      </div>
    );
  }

  const isEmpty = !loading && (!data || data.length === 0) && !showPlaceholder;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <div className="relative">
        {isEmpty && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="text-center">
              <div className="text-gray-400 mb-2">
                <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <span className="text-gray-500">Veri bulunamadı</span>
            </div>
          </div>
        )}
        
        <ResponsiveContainer width="100%" height={400}>
          <BarChart 
            data={data}
            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid 
              strokeDasharray="3 3" 
              stroke="#E5E7EB" 
              vertical={false}
            />
            <XAxis 
              dataKey="month" 
              tickFormatter={formatMonthLabel}
              angle={-45}
              textAnchor="end"
              height={80}
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fill: '#6B7280' }}
              tickMargin={10}
            />
            <YAxis 
              domain={[0, (dataMax: number) => Math.max(dataMax + 1, 5)]}
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fill: '#6B7280' }}
              tickMargin={10}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar 
              dataKey="defect_count" 
              fill="#3B82F6" 
              name="Hata Sayısı"
              radius={[2, 2, 0, 0]}
            >
              <LabelList 
                dataKey="defect_count" 
                position="top" 
                style={{ 
                  fontSize: '12px', 
                  fontWeight: '600',
                  fill: '#374151'
                }}
                formatter={(value: any) => value > 0 ? value : ''}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
