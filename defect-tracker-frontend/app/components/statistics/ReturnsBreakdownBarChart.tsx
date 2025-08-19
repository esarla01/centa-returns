'use client';

import { API_ENDPOINTS, buildApiUrl } from '@/lib/api';
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

  useEffect(() => {
    if (!startDate || !endDate) return;

    const fetchData = async () => {
      try {
        const params = new URLSearchParams({
          start_date: startDate ?  startDate.toISOString().split("T")[0] : "",
          end_date: endDate? endDate.toISOString().split("T")[0] : "",
        });
        const res = await fetch(buildApiUrl(API_ENDPOINTS.REPORTS.RETURNS_BREAKDOWN) + `?${params.toString()}`);
        const json = await res.json();

        // Expecting API to return:
        // {
        //   data: [{ period: '2025-07', 'Model A|Customer 1': 5, ... }],
        //   customers: ['Customer 1', 'Customer 2', ...],
        //   productModels: ['Model A', 'Model B', ...]
        // }

        setData(json.data);
        setCustomers(json.customers);
        setProductModels(json.productModels);
      } catch (error) {
        console.error('Failed to fetch breakdown data', error);
      }
    };

    fetchData();
  }, [startDate, endDate, refreshKey]);

  // Color palette for customers
  const colors = [
    '#8884d8', '#82ca9d', '#ffc658', '#ff8042', '#00C49F',
    '#0088FE', '#FFBB28', '#FF4444', '#AA66CC', '#99CC00'
  ];

  return (
    <ResponsiveContainer width="100%" height={400}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="period" />
        <YAxis domain={[0, (dataMax: number) => dataMax + 0.1 * dataMax]} />
        <Tooltip />
        <Legend 
          content={({ payload }) => (
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
              {customers.map((customer, index) => (
                <li key={customer} style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <div 
                    style={{ 
                      width: '12px', 
                      height: '12px', 
                      backgroundColor: colors[index % colors.length],
                      borderRadius: '2px'
                    }} 
                  />
                  <span style={{ fontSize: '12px' }}>{customer}</span>
                </li>
              ))}
            </ul>
          )}
        />
        {productModels.map((model, modelIndex) =>
          customers.map((customer, customerIndex) => {
            const dataKey = `${model}|${customer}`;
            return (
              <Bar
                key={dataKey}
                dataKey={dataKey}
                stackId={model}
                fill={colors[customerIndex % colors.length]}
                
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
                            y={y - 5}
                            textAnchor="middle"
                            fill="#666"
                            fontSize="12"
                            fontWeight="500"
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
  );
};

export default ReturnsBreakdownBarChart;
