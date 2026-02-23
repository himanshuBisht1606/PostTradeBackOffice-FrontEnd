import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Card } from 'antd';
import { formatAmount } from '@utils/formatters';

interface RevenueDataPoint {
  date: string;
  revenue: number;
}

interface RevenueChartProps {
  data: RevenueDataPoint[];
  loading?: boolean;
}

export function RevenueChart({ data, loading = false }: RevenueChartProps) {
  return (
    <Card title="Revenue Trend" loading={loading} style={{ height: 280 }}>
      <ResponsiveContainer width="100%" height={200}>
        <AreaChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="revGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#1d3557" stopOpacity={0.2} />
              <stop offset="95%" stopColor="#1d3557" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="date" tick={{ fontSize: 11 }} />
          <YAxis tick={{ fontSize: 11 }} tickFormatter={(v: number) => formatAmount(v)} />
          <Tooltip formatter={(v: number) => [formatAmount(v), 'Revenue']} />
          <Area
            type="monotone"
            dataKey="revenue"
            stroke="#1d3557"
            fill="url(#revGradient)"
            strokeWidth={2}
          />
        </AreaChart>
      </ResponsiveContainer>
    </Card>
  );
}
