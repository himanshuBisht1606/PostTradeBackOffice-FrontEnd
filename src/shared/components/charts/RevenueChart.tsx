import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { Card } from 'antd';

interface RevenueDataPoint {
  date: string;
  revenue: number;
  brokerage: number;
}

interface RevenueChartProps {
  data: RevenueDataPoint[];
  loading?: boolean;
}

function crFmt(v: number) {
  return `₹${v.toFixed(1)} Cr`;
}

export function RevenueChart({ data, loading = false }: RevenueChartProps) {
  return (
    <Card
      title="Brokerage & Revenue Trend"
      loading={loading}
      style={{ height: 320 }}
      extra={<span style={{ fontSize: 11, color: '#888' }}>Last 10 Trading Days (₹ Cr)</span>}
    >
      <ResponsiveContainer width="100%" height={240}>
        <AreaChart data={data} margin={{ top: 8, right: 16, left: 8, bottom: 0 }}>
          <defs>
            <linearGradient id="revGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#1d3557" stopOpacity={0.25} />
              <stop offset="95%" stopColor="#1d3557" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="brokerageGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#e63946" stopOpacity={0.2} />
              <stop offset="95%" stopColor="#e63946" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="date" tick={{ fontSize: 11 }} />
          <YAxis tick={{ fontSize: 11 }} tickFormatter={(v: number) => `₹${v.toFixed(0)}`} />
          <Tooltip formatter={(v: number) => crFmt(v)} />
          <Legend wrapperStyle={{ fontSize: 11 }} />
          <Area
            type="monotone"
            dataKey="revenue"
            name="Total Revenue"
            stroke="#1d3557"
            fill="url(#revGradient)"
            strokeWidth={2}
            dot={{ r: 3, fill: '#1d3557' }}
          />
          <Area
            type="monotone"
            dataKey="brokerage"
            name="Brokerage"
            stroke="#e63946"
            fill="url(#brokerageGradient)"
            strokeWidth={2}
            dot={{ r: 3, fill: '#e63946' }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </Card>
  );
}
