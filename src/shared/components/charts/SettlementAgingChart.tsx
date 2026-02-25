import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Card } from 'antd';

interface AgingDataPoint {
  bucket: string;
  count: number;
}

interface SettlementAgingChartProps {
  data: AgingDataPoint[];
  loading?: boolean;
}

export function SettlementAgingChart({ data, loading = false }: SettlementAgingChartProps) {
  return (
    <Card title="Settlement Aging" loading={loading} style={{ height: 280 }}>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="bucket" tick={{ fontSize: 11 }} />
          <YAxis tick={{ fontSize: 11 }} />
          <Tooltip formatter={(v: number) => [v, 'Batches']} />
          <Bar dataKey="count" fill="#457b9d" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </Card>
  );
}
