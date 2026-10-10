'use client';

import React from 'react';
import {
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';

interface BarChartProps {
  data: Array<Record<string, any>>;
  xAxisKey: string;
  bars: Array<{
    dataKey: string;
    color: string;
    label: string;
  }>;
  title?: string;
  subtitle?: string;
  height?: number;
  stacked?: boolean;
}

export default function BarChart({
  data,
  xAxisKey,
  bars,
  title,
  subtitle,
  height = 300,
  stacked = false
}: BarChartProps) {
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
          <RechartsBarChart
            data={data}
            margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="var(--border-subtle)"
              vertical={false}
            />
            <XAxis
              dataKey={xAxisKey}
              stroke="var(--text-tertiary)"
              tick={{ fill: 'var(--text-tertiary)', fontSize: 12 }}
              tickLine={{ stroke: 'var(--border-default)' }}
            />
            <YAxis
              stroke="var(--text-tertiary)"
              tick={{ fill: 'var(--text-tertiary)', fontSize: 12 }}
              tickLine={{ stroke: 'var(--border-default)' }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'var(--surface-3)',
                border: '1px solid var(--border-default)',
                borderRadius: 'var(--radius-md)',
                padding: 'var(--space-3)',
                fontSize: 'var(--text-sm)',
                color: 'var(--text-primary)',
                boxShadow: 'var(--shadow-lg)'
              }}
              labelStyle={{
                color: 'var(--text-secondary)',
                marginBottom: 'var(--space-2)',
                fontWeight: 'var(--font-medium)'
              }}
              cursor={{ fill: 'var(--surface-3)', opacity: 0.3 }}
            />
            <Legend
              wrapperStyle={{
                paddingTop: 'var(--space-4)',
                fontSize: 'var(--text-sm)'
              }}
              iconType="rect"
              iconSize={12}
            />
            {bars.map((bar) => (
              <Bar
                key={bar.dataKey}
                dataKey={bar.dataKey}
                fill={bar.color}
                name={bar.label}
                radius={[4, 4, 0, 0]}
                stackId={stacked ? 'stack' : undefined}
              />
            ))}
          </RechartsBarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
