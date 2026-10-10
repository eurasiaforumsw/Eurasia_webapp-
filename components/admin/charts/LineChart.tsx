'use client';

import React from 'react';
import {
  LineChart as RechartsLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';

interface LineChartProps {
  data: Array<Record<string, any>>;
  xAxisKey: string;
  lines: Array<{
    dataKey: string;
    color: string;
    label: string;
  }>;
  title?: string;
  subtitle?: string;
  height?: number;
}

export default function LineChart({
  data,
  xAxisKey,
  lines,
  title,
  subtitle,
  height = 300
}: LineChartProps) {
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
          <RechartsLineChart
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
              cursor={{ stroke: 'var(--border-strong)', strokeWidth: 1 }}
            />
            <Legend
              wrapperStyle={{
                paddingTop: 'var(--space-4)',
                fontSize: 'var(--text-sm)'
              }}
              iconType="line"
              iconSize={12}
            />
            {lines.map((line) => (
              <Line
                key={line.dataKey}
                type="monotone"
                dataKey={line.dataKey}
                stroke={line.color}
                strokeWidth={2}
                name={line.label}
                dot={{
                  fill: line.color,
                  strokeWidth: 2,
                  r: 3,
                  stroke: 'var(--surface-2)'
                }}
                activeDot={{
                  r: 5,
                  fill: line.color,
                  stroke: 'var(--surface-2)',
                  strokeWidth: 2
                }}
              />
            ))}
          </RechartsLineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
