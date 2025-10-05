import { API_ENDPOINTS, buildApiUrl } from "@/lib/api";
import { useEffect, useState } from "react";
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts";

type Props = {
  startDate: Date | null;
  endDate: Date | null;
  refreshKey?: number;
};

export default function ItemsByProductModelChart({ startDate, endDate, refreshKey }: Props) {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalItems, setTotalItems] = useState(0);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const sd = startDate ? startDate.toISOString().split("T")[0] : "";
      const ed = endDate ? endDate.toISOString().split("T")[0] : "";
      const res = await fetch(
        buildApiUrl(API_ENDPOINTS.REPORTS.ITEMS_BY_PRODUCT_MODEL) + `?start_date=${sd}&end_date=${ed}`
      );
      const json = await res.json();
      setData(json.data || []);
      setTotalItems(json.total_items || 0);
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

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];
  const isEmpty = !loading && (!data || data.length === 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Yükleniyor...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-red-500">Hata: {error}</div>
      </div>
    );
  }

  if (isEmpty) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Seçilen tarih aralığında veri bulunamadı</div>
      </div>
    );
  }

  // Filter out items with 0 count
  const filteredData = data.filter(item => item.item_count > 0);
  
  // Separate items into those >= 1% and those < 1%
  const significantItems = filteredData.filter(item => parseFloat(item.percentage) >= 3);
  const smallItems = filteredData.filter(item => parseFloat(item.percentage) < 3);
  
  // Group small items into "Other" if there are any
  const chartData = [...significantItems];
  if (smallItems.length > 0) {
    const otherItemCount = smallItems.reduce((sum, item) => sum + item.item_count, 0);
    const otherPercentage = smallItems.reduce((sum, item) => sum + parseFloat(item.percentage), 0);
    
    chartData.push({
      product_model_name: 'Diğer',
      item_count: otherItemCount,
      percentage: otherPercentage.toFixed(2)
    });
  }

  return (
    <div className="w-full">
      {/* Total Items Display */}
      <div className="text-center mb-4">
        <p className="text-sm text-gray-600">
          Toplam Ürün Adedi: <span className="font-semibold text-gray-900">{totalItems}</span>
        </p>
      </div>
      
      <ResponsiveContainer width="100%" height={280}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            dataKey="item_count"
            labelLine={false}
            label={({ product_model_name, item_count }) => 
              `${item_count} adet`
            }
            outerRadius={70}
            innerRadius={20}
            fill="#8884d8"
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
            formatter={(value: any, name: any) => [
              `${value} adet`,
              'Arıza Adedi'
            ]}
            labelFormatter={(label: string) => `Ürün Modeli: ${label}`}
            contentStyle={{
              backgroundColor: 'white',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
            }}
          />
          <Legend 
            verticalAlign="bottom" 
            height={36}
            wrapperStyle={{
              paddingTop: '20px'
            }}
            formatter={(value) => ''}
          />
        </PieChart>
      </ResponsiveContainer>

      {/* Percentage Breakdown */}
      <div className="mt-4 grid grid-cols-1 gap-2">
        {chartData.map((item, index) => (
          <div key={item.product_model_name} className="flex items-center justify-between text-sm">
            <div className="flex items-center">
              <div
                className="w-3 h-3 rounded-full mr-2"
                style={{ backgroundColor: COLORS[index % COLORS.length] }}
              />
              <span className="text-gray-700">{item.product_model_name}</span>
            </div>
            <span className="font-semibold text-gray-900">{item.percentage}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}
