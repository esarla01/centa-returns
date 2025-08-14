'use client';

import React, { useEffect, useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LabelList, ReferenceLine
} from 'recharts';

type ReturnData = {
  period: string; // week or month label
  [key: string]: string | number; // dynamic product/customer values
};

interface ReturnsBreakdownBarChartProps {
  startDate: Date | null;
  endDate: Date | null;
  refreshKey: number;
}

const ReturnsBreakdownBarChart: React.FC<ReturnsBreakdownBarChartProps> = ({
  startDate,
  endDate,
  refreshKey,
}) => {
  const [data, setData] = useState<ReturnData[]>([]);
  const [customers, setCustomers] = useState<string[]>([]);
  const [productModels, setProductModels] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!startDate || !endDate) return;

    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const params = new URLSearchParams({
          start_date: startDate ?  startDate.toISOString().split("T")[0] : "",
          end_date: endDate? endDate.toISOString().split("T")[0] : "",
        });
        const res = await fetch(`http://localhost:5000/reports/returns-breakdown?${params.toString()}`);
        
        if (!res.ok) {
          throw new Error('Veri yüklenirken hata oluştu');
        }
        
        const json = await res.json();

        setData(json.data);
        setCustomers(json.customers);
        setProductModels(json.productModels);
      } catch (error) {
        console.error('Failed to fetch breakdown data', error);
        setError('Veri yüklenirken hata oluştu');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [startDate, endDate, refreshKey]);

  // Professional color palette
  const colors = [
    '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6',
    '#06B6D4', '#84CC16', '#F97316', '#EC4899', '#6366F1'
  ];

  // Custom tooltip component
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-4 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-semibold text-gray-800 mb-2">{`Dönem: ${label}`}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm text-gray-600" style={{ color: entry.color }}>
              {`${entry.name}: ${entry.value} adet`}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  // Custom legend component
  const CustomLegend = ({ payload }: any) => {
    if (!payload || payload.length === 0) return null;
    
    return (
      <div className="flex flex-wrap gap-4 justify-center mt-4">
        {customers.map((customer, index) => (
          <div key={customer} className="flex items-center gap-2">
            <div 
              className="w-4 h-4 rounded-sm shadow-sm"
              style={{ backgroundColor: colors[index % colors.length] }}
            />
            <span className="text-sm font-medium text-gray-700">{customer}</span>
          </div>
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-gray-500">Yükleniyor...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-red-500">{error}</div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-gray-500">Veri bulunamadı</div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
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
            dataKey="period" 
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 12, fill: '#6B7280' }}
            tickMargin={10}
          />
          <YAxis 
            domain={[0, (dataMax: number) => dataMax + 0.1 * dataMax]}
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 12, fill: '#6B7280' }}
            tickMargin={10}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend content={<CustomLegend />} />
          
          {productModels.map((model, modelIndex) =>
            customers.map((customer, customerIndex) => {
              const dataKey = `${model}|${customer}`;
              return (
                <Bar
                  key={dataKey}
                  dataKey={dataKey}
                  stackId={model}
                  fill={colors[customerIndex % colors.length]}
                  radius={[0, 0, 2, 2]}
                >
                  <LabelList 
                    dataKey={dataKey} 
                    position="top" 
                    content={({ value, x, y, width, height }) => {
                      if (typeof x === 'number' && typeof y === 'number' && typeof width === 'number') {
                        // Show label for the last customer of each product (to appear on top of stacked bar)
                        if (customerIndex === customers.length - 1) {
                          return (
                            <text
                              x={x + width / 2}
                              y={y - 8}
                              textAnchor="middle"
                              fill="#374151"
                              fontSize="11"
                              fontWeight="600"
                            >
                              {model}
                            </text>
                          );
                        }
                      }
                      return null;
                    }}
                  />
                  <LabelList 
                    dataKey={dataKey} 
                    position="center" 
                    content={({ value, x, y, width, height }) => {
                      if (typeof x === 'number' && typeof y === 'number' && typeof width === 'number' && typeof height === 'number' && typeof value === 'number' && value > 0) {
                        return (
                          <text
                            x={x + width / 2}
                            y={y + height / 2}
                            textAnchor="middle"
                            fill="white"
                            fontSize="10"
                            fontWeight="600"
                            dominantBaseline="middle"
                          >
                            {customer}
                            {value > 0 && (
                              <tspan x={x + width / 2} dy="12" fontSize="9">
                                ({value})
                              </tspan>
                            )}
                          </text>
                        );
                      }
                      return null;
                    }}
                  />
                </Bar>
              );
            })
          )}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default ReturnsBreakdownBarChart;
