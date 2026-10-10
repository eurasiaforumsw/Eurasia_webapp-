'use client';

import React from 'react';
import { LucideIcon } from 'lucide-react';
import { LineChart, Line, ResponsiveContainer } from 'recharts';

interface StatCardProps {
  icon: LucideIcon;
  label: string;
  value: string | number;
  change?: number;
  sparklineData?: Array<{ value: number }>;
  format?: 'number' | 'currency' | 'percent';
}

export default function StatCard({
  icon: Icon,
  label,
  value,
  change,
  sparklineData,
  format = 'number'
}: StatCardProps) {
  const formatValue = (val: string | number): string => {
    if (typeof val === 'string') return val;

    switch (format) {
      case 'currency':
        return new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD',
          minimumFractionDigits: 0,
          maximumFractionDigits: 0
        }).format(val);
      case 'percent':
        return `${val}%`;
      default:
        return new Intl.NumberFormat('en-US').format(val);
    }
  };

  const getTrendColor = (): string => {
    if (change === undefined || change === 0) return 'var(--text-tertiary)';
    return change > 0 ? 'var(--accent-success)' : 'var(--accent-danger)';
  };

  const getTrendClass = (): string => {
    if (change === undefined || change === 0) return 'stat-card__trend--neutral';
    return change > 0 ? 'stat-card__trend--up' : 'stat-card__trend--down';
  };

  return (
    <div className="stat-card">
      <div className="stat-card__header">
        <span className="stat-card__label">{label}</span>
      </div>

      <div className="stat-card__value">{formatValue(value)}</div>

      <div className="stat-card__icon">
        <Icon size={20} strokeWidth={2} />
      </div>

      <div className="stat-card__footer">
        {change !== undefined && (
          <span className={`stat-card__trend ${getTrendClass()}`}>
            {change > 0 && (
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path
                  d="M6 2L6 10M6 2L3 5M6 2L9 5"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            )}
            {change < 0 && (
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path
                  d="M6 10L6 2M6 10L3 7M6 10L9 7"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            )}
            {Math.abs(change)}%
          </span>
        )}

        {sparklineData && sparklineData.length > 0 && (
          <div style={{ width: 60, height: 20, marginLeft: 'auto' }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={sparklineData}>
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke={getTrendColor()}
                  strokeWidth={1.5}
                  dot={false}
                  isAnimationActive={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
}
