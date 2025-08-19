import { useEffect, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LabelList } from "recharts";
import { API_ENDPOINTS, buildApiUrl } from '@/lib/api';

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
        buildApiUrl(API_ENDPOINTS.REPORTS.DEFECTS_BY_PRODUCTION_MONTH) + `?start_date=${sd}&end_date=${ed}`
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

  const isEmpty = !loading && (!data || data.length === 0) && !showPlaceholder;

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

  if (showPlaceholder) {
    return (
      <div className="flex flex-col gap-3">
        <div className="text-sm text-gray-500 text-center py-8">
          Seçilen tarih aralığı bir aydan az olduğu için bu grafik gösterilmiyor.
          <br />
          Lütfen en az bir aylık bir tarih aralığı seçin.
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {loading && <div className="text-sm text-gray-500">Yükleniyor...</div>}
      {error && <div className="text-sm text-red-600">{error}</div>}
      <div style={{ width: "100%", height: "300px" }} className="relative">
        {isEmpty && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <span className="text-gray-500">Veri bulunamadı</span>
          </div>
        )}
        <ResponsiveContainer>
          <BarChart data={data}>
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
            <Bar dataKey="defect_count" fill="#8884d8" name="Hata Sayısı">
              <LabelList 
                dataKey="defect_count" 
                position="top" 
                style={{ fontSize: '12px', fontWeight: 'bold' }}
                formatter={(value: any) => value > 0 ? value : ''}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
