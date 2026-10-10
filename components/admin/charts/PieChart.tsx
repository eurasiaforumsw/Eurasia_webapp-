'use client';

import React from 'react';
import {
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend
} from 'recharts';

interface PieChartDataItem {
  name: string;
  value: number;
  color?: string;
}

interface PieChartProps {
  data: PieChartDataItem[];
  title?: string;
  subtitle?: string;
  height?: number;
  colors?: string[];
  showLegend?: boolean;
  innerRadius?: number;
}

const DEFAULT_COLORS = [
  'var(--accent-primary)',
  'var(--accent-success)',
  'var(--accent-warning)',
  'var(--accent-danger)',
  'var(--accent-secondary)',
  '#8B5CF6',
  '#EC4899',
  '#10B981'
];

export default function PieChart({
  data,
  title,
  subtitle,
  height = 300,
  colors = DEFAULT_COLORS,
  showLegend = true,
  innerRadius = 0
}: PieChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="chart-container">
        {(title || subtitle) && (
          <div className="chart-container__header">
            <div>
              {title && <h3 className="chart-container__title">{title}</h3>}
              {subtitle && <p className="chart-container__subtitle">{subtitle}</p>}
            </div>
          </div>
        )}
        <div
          className="chart-container__body"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: height,
            color: 'var(--text-tertiary)',
            fontSize: 'var(--text-sm)'
          }}
        >
          No data available
        </div>
      </div>
    );
  }

  const total = data.reduce((sum, item) => sum + item.value, 0);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const percentage = ((payload[0].value / total) * 100).toFixed(1);
      return (
        <div
          style={{
            backgroundColor: 'var(--surface-3)',
            border: '1px solid var(--border-default)',
            borderRadius: 'var(--radius-md)',
            padding: 'var(--space-3)',
            fontSize: 'var(--text-sm)',
            color: 'var(--text-primary)',
            boxShadow: 'var(--shadow-lg)'
          }}
        >
          <p style={{ fontWeight: 'var(--font-medium)', marginBottom: 'var(--space-1)' }}>
            {payload[0].name}
          </p>
          <p style={{ color: 'var(--text-secondary)' }}>
            {payload[0].value.toLocaleString()} ({percentage}%)
          </p>
        </div>
      );
    }
    return null;
  };

  const CustomLegend = ({ payload }: any) => {
    return (
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 'var(--space-4)',
          justifyContent: 'center',
          paddingTop: 'var(--space-4)',
          fontSize: 'var(--text-sm)'
        }}
      >
        {payload.map((entry: any, index: number) => {
          const percentage = ((entry.value / total) * 100).toFixed(1);
          return (
            <div
              key={`legend-${index}`}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--space-2)'
              }}
            >
              <div
                style={{
                  width: 12,
                  height: 12,
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: entry.color
                }}
              />
              <span style={{ color: 'var(--text-primary)' }}>
                {entry.value}: {percentage}%
              </span>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="chart-container">
      {(title || subtitle) && (
        <div className="chart-container__header">
          <div>
            {title && <h3 className="chart-container__title">{title}</h3>}
            {subtitle && <p className="chart-container__subtitle">{subtitle}</p>}
          </div>
        </div>
      )}

      <div className="chart-container__body" style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <RechartsPieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={innerRadius}
              outerRadius={innerRadius > 0 ? innerRadius + 60 : 80}
              fill="#8884d8"
              dataKey="value"
              label={({ name, percent }) => `${name} ${percent ? (percent * 100).toFixed(0) : 0}%`}
              labelLine={{
                stroke: 'var(--text-tertiary)',
                strokeWidth: 1
              }}
            >
              {data.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={entry.color || colors[index % colors.length]}
                />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            {showLegend && <Legend content={<CustomLegend />} />}
          </RechartsPieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
