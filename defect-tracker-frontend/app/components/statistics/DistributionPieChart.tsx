'use client';

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { type DateRangeProps, chartNotice, dateRangeQuery, useReport } from './shared';

interface Slice {
  name: string;
  item_count: number;
  percentage: number;
}

interface DistributionPieChartProps extends DateRangeProps {
  /** The report to load. Its rows must have `item_count`, `percentage` and... */
  path: string;
  /** ...the name of each slice in this field. */
  nameField: string;
  /** How the tooltip introduces a slice, e.g. "Ürün Türü". */
  tooltipLabel: string;
  colors: string[];
  /** Slices smaller than this percentage are merged into one "Diğer" slice. */
  groupBelowPercent?: number;
}

/** A pie of returned units split by one property, with the shares listed below it. */
export default function DistributionPieChart({
  path, nameField, tooltipLabel, colors, groupBelowPercent, startDate, endDate, refreshKey,
}: DistributionPieChartProps) {
  const { result, loading, failure } = useReport<{ total_items: number; data: Record<string, string | number>[] }>(
    path, dateRangeQuery(startDate, endDate), refreshKey);

  let slices: Slice[] = (result?.data ?? [])
    .map((row) => ({ name: String(row[nameField]), item_count: Number(row.item_count), percentage: Number(row.percentage) }))
    .filter((slice) => slice.item_count > 0);

  if (groupBelowPercent !== undefined) {
    const small = slices.filter((slice) => slice.percentage < groupBelowPercent);
    if (small.length > 0) {
      slices = slices.filter((slice) => slice.percentage >= groupBelowPercent);
      slices.push({
        name: 'Diğer',
        item_count: small.reduce((sum, slice) => sum + slice.item_count, 0),
        percentage: Number(small.reduce((sum, slice) => sum + slice.percentage, 0).toFixed(2)),
      });
    }
  }

  const notice = chartNotice(loading, failure, slices.length === 0);
  if (notice) return notice;

  return (
    <div className="w-full">
      <div className="text-center mb-4">
        <p className="text-sm text-gray-600">
          Toplam İade Ürün Adedi: <span className="font-semibold text-gray-900">{result?.total_items ?? 0}</span>
        </p>
      </div>

      <ResponsiveContainer width="100%" height={280}>
        <PieChart>
          <Pie
            data={slices}
            cx="50%"
            cy="50%"
            dataKey="item_count"
            nameKey="name"
            labelLine={false}
            label={({ item_count }) => `${item_count} adet`}
            outerRadius={70}
            innerRadius={20}
            fill="#0f1e33"
          >
            {slices.map((slice, index) => (
              <Cell key={slice.name} fill={colors[index % colors.length]} />
            ))}
          </Pie>
          <Tooltip
            formatter={(value, name) => [`${value} adet`, `${tooltipLabel}: ${name}`]}
            contentStyle={{
              backgroundColor: 'white',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
            }}
          />
          <Legend verticalAlign="bottom" height={36} wrapperStyle={{ paddingTop: '20px' }} formatter={() => ''} />
        </PieChart>
      </ResponsiveContainer>

      {/* The same slices as a list, with their share */}
      <div className="mt-4 grid grid-cols-1 gap-2">
        {slices.map((slice, index) => (
          <div key={slice.name} className="flex items-center justify-between text-sm">
            <div className="flex items-center">
              <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: colors[index % colors.length] }} />
              <span className="text-gray-700">{slice.name}</span>
            </div>
            <span className="font-semibold text-gray-900">{slice.percentage}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}
